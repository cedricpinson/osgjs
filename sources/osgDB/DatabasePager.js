/**
 * @author Jordi Torres
 */


define( [
    'q',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/PagedLOD',
    'osg/Timer',
    'osg/Notify',
    'osg/Camera'
], function ( q, MACROUTILS, NodeVisitor, PagedLOD, Timer, Notify, Camera ) {

    'use strict';
    /**
     * Database paging class which manages the loading of files
     * and synchronizing of loaded models with the main scene graph.
     *  @class DatabasePager
     */
    var DatabasePager = function () {
        this._pendingRequests = [];
        this._pendingNodes = [];
        this._loading = false;
        this._progressCallback = undefined;
        this._lastCB = true;
        this._activePagedLODList = new Set();
        this._childrenToRemoveList = new Set();
        this._downloadingRequestsNumber = 0;
        // In OSG the targetMaximumNumberOfPagedLOD is 300 by default
        // here we set 50 as we need to be more strict wiith memory in a browser  
        this._targetMaximumNumberOfPagedLOD = 50;
    };

    var DatabaseRequest = function () {
        this._loadedModel = undefined;
        this._group = undefined;
        this._url = undefined;
        this._function = undefined;
        this._timeStamp = 0.0;
        this._groupExpired = false;
        //  this.frameNumber = 0;
        //  this.frameNumberOfLastTraversal = 0;
    };

    var ParentVisitor = function () {
        this.nodePaths = [];
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
    };
    ParentVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            this.nodePaths.unshift( node );
            this.traverse( node );
        }
    } );

    var FindPagedLODsVisitor = function ( pagedLODList, frameNumber ) {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._activePagedLODList = pagedLODList;
        this._frameNumber = frameNumber;
    };
    FindPagedLODsVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.getTypeID() === PagedLOD.getTypeID() ) {
                node.setFrameNumberOfLastTraversal( this._frameNumber );
                this._activePagedLODList.add( node );
            }
            this.traverse( node );
        }
    } );

    var ReleaseVisitor = function ( gl ) {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this.gl = gl;
    };
    ReleaseVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            node.releaseGLObjects( this.gl );
            this.traverse( node );
        }
    } );

    var ExpirePagedLODVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._childrenList = [];
    };
    ExpirePagedLODVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.getTypeID() === PagedLOD.getTypeID() ) {
                this._childrenList.push( node );
                this._markRequestsExpired( node );
            }
            this.traverse( node );
        },
        removeExpiredChildrenAndFindPagedLODs: function ( plod, expiryTime, expiryFrame, removedChildren ) {
            var sizeBefore = removedChildren.length;
            if ( plod.getChildren().length > 0 )
                plod.removeExpiredChildren( expiryTime, expiryFrame, removedChildren );
            else {
                console.log( 'trying to remove plod with no childs' );
                removedChildren.push( plod );
            }
            for ( var i = sizeBefore; i < removedChildren.length; i++ ) {
                removedChildren[ i ].accept( this );
            }
            return sizeBefore !== removedChildren.length;
        },
        _markRequestsExpired: function ( plod ) {
            var numChildren = plod.children.length;
            var request;
            for ( var i = 0; i < numChildren; i++ ) {
                request = plod.getDatabaseRequest( i );
                if ( request !== undefined ) {
                    request._groupExpired = true;
                    request._loadedModel = null;
                    //request._group = null;
                }
            }
        }
    } );

    DatabasePager.prototype = MACROUTILS.objectLibraryClass( {

        setTargetMaximumNumberOfPageLOD: function ( target ) {
            this._targetMaximumNumberOfPagedLOD = target;
        },

        getTargetMaximumNumberOfPageLOD: function () {
            return this._targetMaximumNumberOfPagedLOD;
        },

        addNodeToQueue: function ( dbrequest ) {
            // We don't need to determine if the dbrequest is in the queue
            // That is already done in the PagedLOD
            this._pendingNodes.push( dbrequest );
        },

        updateSceneGraph: function ( frameStamp ) {
            // Progress callback
            if ( this._progressCallback !== undefined ) {
                // Maybe we should encapsulate this in a promise.
                if ( this._pendingRequests.length > 0 || this._pendingNodes.length > 0 ) {
                    this._progressCallback( this._pendingRequests.length + this._downloadingRequestsNumber, this._pendingNodes.length );
                    this._lastCB = false;
                } else {
                    if ( !this._lastCB ) {
                        this._progressCallback( this._pendingRequests.length + this._downloadingRequestsNumber, this._pendingNodes.length );
                        this._lastCB = true;
                    }
                }
            }
            // Remove expired nodes
            this.removeExpiredSubgraphs( frameStamp );

            if ( !this._loading ) {
                // Now taking one request per frame. It could be changed.
                this.takeRequests( 1 );
            }
            this.addLoadedDataToSceneGraph( frameStamp );
        },

        getRequestListSize: function () {
            return this._pendingRequests.length + this._downloadingRequestsNumber;
        },

        setProgressCallback: function ( cb ) {
            this._progressCallback = cb;
        },

        addLoadedDataToSceneGraph: function ( frameStamp ) {
            // Prune the list of database requests.
            if ( this._pendingNodes.length ) {
                var request = this._pendingNodes.shift();
                var frameNumber = frameStamp.getFrameNumber();
                var timeStamp = frameStamp.getSimulationTime();
                // Let's see the pagedLOD is conected to the scenegraph
                var parentVisitor = new ParentVisitor();
                request._group.accept( parentVisitor );
                // If it is not, return.
                if ( parentVisitor.nodePaths[ 0 ].getTypeID() !== Camera.getTypeID() ) {
                    Notify.log( 'DatabasePager::addLoadedDataToSceneGraph() node in parental chain deleted, discarding subgraph.' );
                    // Clean the request
                    request._loadedModel = undefined;
                    request = undefined;
                    return;
                }
                // If the request is not expired, then add/register new childs
                if ( request._groupExpired === false ) {
                    var plod = request._group;
                    plod.setTimeStamp( plod.children.length, timeStamp );
                    plod.setFrameNumber( plod.children.length, frameNumber );
                    plod._perRangeDataList[ plod.children.length - 1 ].dbrequest = undefined;
                    plod.addChildNode( request._loadedModel );
                    // Register PagedLODs.
                    if ( !this._activePagedLODList.has( plod ) ) {
                        this.registerPagedLODs( plod, frameNumber );
                    } else {
                        this.registerPagedLODs( request._loadedModel, frameNumber );
                    }
                }
            }
        },

        isLoading: function () {
            return this._loading;
        },

        registerPagedLODs: function ( subgraph, frameNumber ) {
            if ( !subgraph ) return;
            subgraph.accept( new FindPagedLODsVisitor( this._activePagedLODList, frameNumber ) );
        },

        requestNodeFile: function ( func, url, node, timestamp ) {
            if ( node.getParents().length === 0 ) return;
            var dbrequest = new DatabaseRequest();
            dbrequest._group = node;
            dbrequest._function = func;
            dbrequest._url = url;
            dbrequest._timeStamp = timestamp;
            this._pendingRequests.push( dbrequest );
            return dbrequest;
        },

        takeRequests: function ( number ) {
            if ( this._pendingRequests.length ) {
                // Sort requests depending on timestamp
                this._pendingRequests.sort( function ( r1, r2 ) {
                    return r1.timestamp - r2.timestamp;
                } );
                if ( this._pendingRequests.length < number )
                    number = this._pendingRequests.length;
                for ( var i = 0; i < number; i++ ) {
                    this._downloadingRequestsNumber++;
                    this.processRequest( this._pendingRequests.shift() );
                }
            }
        },

        processRequest: function ( dbrequest ) {
            this._loading = true;
            var that = this;
            // Load from function
            if ( dbrequest._function !== undefined ) {
                q.when( this.loadNodeFromFunction( dbrequest._function, dbrequest._group ) ).then( function ( child ) {
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            } else if ( dbrequest._url !== '' ) { // Load from URL
                q.when( this.loadNodeFromURL( dbrequest._url ) ).then( function ( child ) {
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            }
        },

        loadNodeFromFunction: function ( func, plod ) {
            // Need to call with pagedLOD as parent, to be able to have multiresolution structures.
            var defer = q.defer();
            q.when( ( func )( plod ) ).then( function ( child ) {
                defer.resolve( child );
            } );
            return defer.promise;
        },

        loadNodeFromURL: function ( url ) {
            var ReaderParser = require( 'osgDB/ReaderParser' );
            var defer = q.defer();
            // Call to ReaderParser just in case there is a custom readNodeURL Callback
            // See osgDB/Options.js and/or osgDB/Input.js
            q.when( ReaderParser.readNodeURL( url ) ).then( function ( child ) {
                defer.resolve( child );
            } );
            return defer.promise;
        },

        releaseGLExpiredSubgraphs: function ( gl, availableTime ) {
            if ( availableTime <= 0.0 ) return;
            // We need to test if we have time to flush
            var elapsedTime = 0.0;
            var beginTime = Timer.instance().tick();
            var that = this;
            this._childrenToRemoveList.forEach( function ( node ) {
                if ( elapsedTime > availableTime ) return;
                that._childrenToRemoveList.delete( node );
                node.accept( new ReleaseVisitor( gl ) );
                node.removeChildren();
                node = null;
                elapsedTime = Timer.instance().deltaS( beginTime, Timer.instance().tick() );
            } );
            availableTime -= elapsedTime;
        },

        removeExpiredSubgraphs: function ( frameStamp ) {
            if ( frameStamp.getFrameNumber() === 0 ) return;
            var numToPrune = this._activePagedLODList.size - this._targetMaximumNumberOfPagedLOD;
            var expiryTime = frameStamp.getSimulationTime() - 0.1;
            var expiryFrame = frameStamp.getFrameNumber() - 1;
            // First traverse and remove inactive PagedLODs, as their children will
            // certainly have expired.
            // TODO: Then traverse active nodes if we still need to prune.
            if ( numToPrune > 0 ) {
                this.removeExpiredChildren( numToPrune, expiryTime, expiryFrame );
            }
        },

        removeExpiredChildren: function ( numToPrune, expiryTime, expiryFrame ) {
            // Iterate over the activePagedLODList to remove expired children
            var that = this;
            var removedChildren = [];
            var expiredPagedLODVisitor = new ExpirePagedLODVisitor();
            this._activePagedLODList.forEach( function ( plod ) {
                if ( numToPrune > 0 ) {
                    // See if plod is still active, so we don't have to prune
                    if ( expiryFrame < plod.getFrameNumberOfLastTraversal() ) return;
                    expiredPagedLODVisitor.removeExpiredChildrenAndFindPagedLODs( plod, expiryTime, expiryFrame, removedChildren );
                    for ( var i = 0; i < expiredPagedLODVisitor._childrenList.length; i++ ) {
                        that._activePagedLODList.delete( expiredPagedLODVisitor._childrenList[ i ] );
                        numToPrune--;
                    }
                    // Add to the remove list all the childs deleted
                    for ( i = 0; i < removedChildren.length; i++ )
                        that._childrenToRemoveList.add( removedChildren[ i ] );
                    expiredPagedLODVisitor._childrenList.length = 0;
                    removedChildren.length = 0;
                }
            } );
        },
    }, 'osgDB', 'DatabasePager' );

    return DatabasePager;
} );
