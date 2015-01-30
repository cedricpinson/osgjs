define( [
    'osgDB/DatabasePager',
    'vendors/q',
    'osg/PagedLOD',
    'osg/Node',
    'osg/FrameStamp',
    'osg/Notify'
], function ( DatabasePager, Q, PagedLOD, Node, FrameStamp, Notify ) {

    return function () {


        module( 'osgDB' );
        var dbpager = new DatabasePager();
        // Modify the processRequest Method to add a defer variable to test it easily.
        dbpager.processRequest= function ( dbrequest ) {
                this._loading = true;
                var that = this;
                // This defer variable is here only to be able to do unitary testing
                var defer = Q.defer();
                // Check if the request is valid;
                if ( dbrequest._groupExpired ) {
                    //Notify.log( 'DatabasePager::processRequest() Request expired.' );
                    that._downloadingRequestsNumber--;
                    this._loading = false;
                    return;
                }

                // Load from function
                if ( dbrequest._function !== undefined ) {
                    Q.when( this.loadNodeFromFunction( dbrequest._function, dbrequest._group ) ).then( function ( child ) {
                        that._downloadingRequestsNumber--;
                        dbrequest._loadedModel = child;
                        that._pendingNodes.push( dbrequest );
                        that._loading = false;
                        defer.resolve();
                    } );
                } else if ( dbrequest._url !== '' ) { // Load from URL
                    Q.when( this.loadNodeFromURL( dbrequest._url ) ).then( function ( child ) {
                        that._downloadingRequestsNumber--;
                        dbrequest._loadedModel = child;
                        that._pendingNodes.push( dbrequest );
                        that._loading = false;
                        defer.resolve();
                    } );
                }
                return defer.promise;
        };

        asyncTest( 'DatabasePager.requestNodeFile', function () {
            dbpager.reset();
            var fn = function createNode( parent ) {
                var n = new Node();
                return n;
            }
            var plod = new PagedLOD();
            plod.setFunction( 0, fn );
            plod.setRange( 0, 0, 200 );
            var request = dbpager.requestNodeFile( fn, '', plod, 1 );
            ok( dbpager._pendingRequests.length === 1, 'Node requested' );
            Q.when( dbpager.processRequest( request ) ).then( function ( ) {
                start();
                ok( dbpager._pendingNodes.length === 1, 'Request processed' );
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );

        asyncTest( 'DatabasePager.addLoadedDataToSceneGraph', function () {
            dbpager.reset();
            var fn = function createNode( parent ) {
                var n = new PagedLOD();
                return n;
            }
            var plod = new PagedLOD();
            plod.setFunction( 0, fn );
            plod.setRange( 0, 0, 200 );
            var request = dbpager.requestNodeFile( fn, '', plod, 1 );

            ok( dbpager._pendingRequests.length === 1, 'Node requested' );
            Q.when( dbpager.processRequest( request ) ).then( function ( ) {
                start();
                dbpager.addLoadedDataToSceneGraph(new FrameStamp(), 0.005 );
                ok( dbpager._activePagedLODList.size === 2, 'we should have two plods active' );
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );

        asyncTest( 'DatabasePager.removeExpiredChildren', function () {
            dbpager.reset();
            dbpager.setTargetMaximumNumberOfPageLOD( 1 );
            var fn = function createNode( parent ) {
                var n = new PagedLOD();
                return n;
            }
            var plod = new PagedLOD();
            plod.setFunction( 0, fn );
            plod.setRange( 0, 0, 200 );
            var request = dbpager.requestNodeFile( fn, '', plod, 1 );
            var frameStamp = new FrameStamp()
            ok( dbpager._pendingRequests.length === 1, 'Node requested' );
            Q.when( dbpager.processRequest( request ) ).then( function ( ) {
                start();
                dbpager.addLoadedDataToSceneGraph( frameStamp );
                frameStamp.setSimulationTime ( 10 );
                frameStamp.setFrameNumber( 10 );
                dbpager.removeExpiredSubgraphs( frameStamp );
                ok( dbpager._activePagedLODList.size === 1, 'we should have the root plod active' );
                ok( dbpager._childrenToRemoveList.size === 1, 'we should have the child plod marked to be deleted' );
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );


    };
} );