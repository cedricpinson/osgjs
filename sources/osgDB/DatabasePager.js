/**
 * @author Jordi Torres
 */


define( [
    'Q',
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/PagedLOD',
    'osg/Timer'
], function ( Q, MACROUTILS, NodeVisitor, PagedLOD, Timer ) {

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

        //  this.frameNumber = 0;
        //  this.frameNumberOfLastTraversal = 0;
    };

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

    DatabasePager.prototype = MACROUTILS.objectLibraryClass( {

        setTargetMaximumNumberOfPageLOD: function ( target ) {
            this._targetMaximumNumberOfPagedLOD = target;
        },

        getTargetMaximumNumberOfPageLOD: function () {
            return this._targetMaximumNumberOfPagedLOD;
        }

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

        setProgressCallback: function ( cb ) {
            this._progressCallback = cb;
        },

        addLoadedDataToSceneGraph: function ( frameStamp ) {
            // Prune the list of database requests.
            if ( this._pendingNodes.length ) {
                var request = this._pendingNodes.shift();
                request._group.addChildNode( request._loadedModel );
                var frameNumber = frameStamp.getFrameNumber();
                // Register PagedLODs.
                if ( !this._activePagedLODList.has( request._group ) ) {
                    this.registerPagedLODs( request._group, frameNumber );
                } else {
                    this.registerPagedLODs( request._loadedModel, frameNumber );
                }
            }
        },

        registerPagedLODs: function ( subgraph, frameNumber ) {
            if ( !subgraph ) return;
            subgraph.accept( new FindPagedLODsVisitor( this._activePagedLODList, frameNumber ) );
        },

        requestNodeFile: function ( func, url, node, timestamp ) {
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
                    this.processRequest( this._pendingRequests.shift() );
                    this._downloadingRequestsNumber++;
                }
            }
        },

        processRequest: function ( dbrequest ) {

            var that = this;
            // Load from function
            if ( dbrequest._function !== undefined ) {
                Q.when( this.loadNodeFromFunction( dbrequest._function, dbrequest._group ) ).then( function ( child ) {
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            } else { // Load from URL
                Q.when( this.loadNodeFromURL( dbrequest._url ) ).then( function ( child ) {
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            }

        },

        loadNodeFromFunction: function ( func, plod ) {
            // Need to call with pagedLOD as parent, to be able to have multiresolution structures.
            var defer = Q.defer();
            Q.when( ( func )( plod ) ).then( function ( child ) {
                defer.resolve( child );
            } );
            return defer.promise;
        },

        loadNodeFromURL: function ( url ) {
            var ReaderParser = require( 'osgDB/ReaderParser' );
            var defer = Q.defer();
            // Call to ReaderParser just in case there is a custom readNodeURL Callback
            // See osgDB/Options.js and/or osgDB/Input.js
            Q.when( ReaderParser.readNodeURL( url ) ).then( function ( child ) {
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
            this._childrenToRemoveList.forEach( function ( plod ) {
                if ( elapsedTime > availableTime ) return;
                plod.accept( new ReleaseVisitor( gl ) );
                that._childrenToRemoveList.delete( plod );
                plod.removeChildren();
                plod = null;
                elapsedTime = Timer.instance().deltaS( beginTime, Timer.instance().tick() );
            } );
            availableTime -= elapsedTime;
        },

        removeExpiredSubgraphs: function ( frameStamp ) {
            if ( frameStamp.getFrameNumber() === 0 ) return;
            var numToPrune = this._activePagedLODList.size - this._targetMaximumNumberOfPagedLOD;
            var expiryTime = frameStamp.getSimulationTime() - 0.1;

            // First traverse and remove inactive PagedLODs, as their children will
            // certainly have expired.
            // TODO: Then traverse active nodes if we still
            // need to prune.
            if ( numToPrune > 0 ) {
                this.removeExpiredChildren( numToPrune, expiryTime );
            }
        },

        removeExpiredChildren: function ( numToPrune, expiryTime ) {
            // Iterate over the activePagedLODList to remove children
            var that = this;
            var sizeBefore = this._childrenToRemoveList.size;
            this._activePagedLODList.forEach( function ( plod ) {
                if ( numToPrune > 0 ) {
                    plod.removeExpiredChildren( expiryTime, that._childrenToRemoveList );
                    if ( sizeBefore !== that._childrenToRemoveList.size ) {
                        if ( that._activePagedLODList.delete( plod ) ) {
                            plod = null;
                            numToPrune--;
                        }
                    }
                } else {
                    return;
                }
            } );
        },
    }, 'osgDB', 'DatabasePager' );

    return DatabasePager;
} );
