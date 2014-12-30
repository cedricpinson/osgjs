/**
 * @author Jordi Torres
 */


define( [
    'Q',
    'osg/Utils'
], function ( Q, MACROUTILS ) {
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
        this._downloadingRequestsNumber = 0;
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

    DatabasePager.prototype = MACROUTILS.objectLibraryClass( {

        addNodeToQueue : function ( dbrequest ) {
            // We don't need to determine if the dbrequest is in the queue
            // That is already done in the PagedLOD
            this._pendingNodes.push( dbrequest );
        },


        updateSceneGraph : function( frameStamp ) {
            // Progress callback
            if ( this._progressCallback !== undefined )
            {
                // Maybe we should encapsulate this in a promise. 
                
                if ( this._pendingRequests.length > 0 || this._pendingNodes.length > 0 )
                {
                    this._progressCallback( this._pendingRequests.length + this._downloadingRequestsNumber, this._pendingNodes.length );
                    this._lastCB = false;
                }
                else
                {
                    if ( !this._lastCB )
                    {
                        this._progressCallback( this._pendingRequests.length + this._downloadingRequestsNumber, this._pendingNodes.length );
                        this._lastCB = true;
                    }
                }
            }
            // TODO: Remove unused nodes
            //this.removeExpiredSubgraphs( frameStamp );
            
            if (!this._loading )
            {
                this.takeRequests ( 1 );
            }
            this.addLoadedDataToSceneGraph( frameStamp );
        },

        removeExpiredSubgraphs : function (/* frameStamp */) {
         //   console.log( 'frameStamp:' , frameStamp.getFrameNumber( ) );
        },

        setProgressCallback: function ( cb ) {
            this._progressCallback = cb;
        },

        addLoadedDataToSceneGraph : function ( /*frameStamp*/) {
            // Prune the list of database requests.
            // TODO: control the time using frameStamp to not use too much time
            if ( this._pendingNodes.length ) {
                // Take the first element of the array. We are adding the nodes LIFO
                // Could it be better to add the nodes FIFO?
                var request = this._pendingNodes.shift( );
                request._group.addChildNode( request._loadedModel );
            }
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

        takeRequests: function ( number )
        {

            if ( this._pendingRequests.length )
            {
                // Sort requests depending on timestamp
                this._pendingRequests.sort(function (r1, r2) { return r1.timestamp - r2.timestamp; } );
                // TODO: Purge old requests depending on timestamp or if we have more than a specific number
                if( this._pendingRequests.length < number )
                    number = this._pendingRequests.length;
                for ( var i =0; i < number ; i++)
                {
                    this.processRequest ( this._pendingRequests.shift() );
                    this._downloadingRequestsNumber ++;
                }
            }
        },

        processRequest: function ( dbrequest ) {

            var that = this;
            // Load from function
            if ( dbrequest._function !== undefined ){
                Q.when( this.loadNodeFromFunction( dbrequest._function, dbrequest._group ) ).then( function( child ) {
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            } else { // Load from URL
                Q.when( this.loadURL( dbrequest._url ) ).then( function( child ) {
                    // All the results from Q.all are on the argument as an array
                    // Now insert children in the right order
                    that._downloadingRequestsNumber--;
                    dbrequest._loadedModel = child;
                    that._pendingNodes.push( dbrequest );
                    that._loading = false;
                } );
            }

        },

        loadNodeFromFunction: function ( func, plod ) {
            // Need to call with this paged lod as parent
            var defer = Q.defer();
            Q.when( ( func )( plod ) ).then( function ( child ) {
                defer.resolve( child );
            } );
            return defer.promise;
        },

        loadURL: function ( url ) {
            var ReaderParser = require( 'osgDB/ReaderParser' );
            var defer = Q.defer();
            // Call to ReaderParser just in case there is a custom readNodeURL Callback
            // See osgDB/Options.js and/or osgDB/Input.js
            Q.when ( ReaderParser.readNodeURL( url ) ).then( function ( child ) {
                defer.resolve( child );
            } );
            return defer.promise;
        },
    }, 'osgDB', 'DatabasePager' );

    return DatabasePager;
} );

