define( [
    'tests/mockup/mockup',
    'osg/BoundingBox',
    'osgDB/ReaderParser'
], function ( mockup, BoundingBox, ReaderParser ) {

    return function () {

        module( 'osg' );

        test( 'BoundingBox', function () {

            ( function () {
                var bb = new BoundingBox();
                var bb0 = [ -0.5, 0, -2 ];
                var bb1 = [ 1, 0, -1 ];
                var bb2 = [ 0, 1, -0.5 ];
                var bb3 = [ 1, 2, -0.8 ];
                bb.expandByVec3( bb0 );
                bb.expandByVec3( bb1 );
                bb.expandByVec3( bb2 );
                bb.expandByVec3( bb3 );

                var bb_test_ok = ( bb._max[ 0 ] === 1 && bb._max[ 1 ] === 2 && bb._max[ 2 ] === -0.5 && bb._min[ 0 ] === -0.5 && bb._min[ 1 ] === 0 && bb._min[ 2 ] === -2 );
                ok( bb_test_ok, 'Expanding by BoundingBox ->  bounding box test' );


                var o = ReaderParser.parseSceneGraph( mockup.getBoxScene() );
                o.getBound();
                var bb_test_scene_graph_test = ( mockup.check_near( o.boundingSphere.radius(), 2.41421, 0.00001 ) );
                ok( bb_test_scene_graph_test, 'Box.js tested  ->  bounding sphere scene graph test' );
            } )();

            ( function () {
                var bb = new BoundingBox();
                bb._min = [ 1, 2, 3 ];
                bb._max = [ 4, 5, 6 ];

                ok( mockup.check_near( bb.corner( 0 ), [ 1, 2, 3 ] ), 'Box corner 0' );
                ok( mockup.check_near( bb.corner( 7 ), [ 4, 5, 6 ] ), 'Box corner 0' );
            } )();
        } );
    };
} );
