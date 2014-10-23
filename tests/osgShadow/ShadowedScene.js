define( [
    'tests/mockup/mockup',
    'osg/Node',
    'osg/Shape',
    'osgUtil/IntersectionVisitor',
    'osg/Camera',
    'osg/Viewport',
    'osg/Matrix',
    'osgShadow/ShadowedScene'
], function ( mockup, Node, Shape, IntersectionVisitor, Camera, Viewport, Matrix, ShadowedScene ) {

    return function () {
        module( 'osg' );

        test( 'ShadowedScene', function () {

            var pShadow = new ShadowedScene();
            ok( pShadow.children.length === 0, 'number of children must be 0' );
            ok( pShadow.parents.length === 0, 'number of parents must be 0' );
            var n = new Node();
            pShadow.addChild( n, 0, 200 );
            ok( pShadow.children.length === 1, 'number of children must be 1' );
        } );

        var DummyIntersector = function () {
            this.point = [ 0.5, 0.5, 0.5 ];
            this.stackTransforms = [];
        };

        DummyIntersector.prototype = {
            enter: function () {
                return true;
            },
            setCurrentTransformation: function ( matrix ) {
                Matrix.inverse( matrix, matrix );
                this.stackTransforms.push( Matrix.transformVec3( matrix, this.point, [ 0.0, 0.0, 0.0 ] ) );
            },
            intersect: function () {
                return true;
            }
        };

        test( 'IntersectionVisitor with 1 camera', function () {

            var camera = new Camera();
            camera.setViewport( new Viewport() );
            camera.setViewMatrix( Matrix.makeLookAt( [ 0, 0, -10 ], [ 0, 0, 0 ], [ 0, 1, 0 ], [] ) );
            camera.setProjectionMatrix( Matrix.makePerspective( 60, 800 / 600, 0.1, 100.0, [] ) );
            camera.addChild( Shape.createTexturedQuadGeometry( -0.5, -0.5, 0, 1, 0, 0, 0, 1, 0, 1, 1 ) );

            var pShadow = new ShadowedScene();
            var child = new Node();
            pShadow.addChild( child );
            pShadow.addChild( child );
            pShadow.addChild( child );
            var di = new DummyIntersector();
            var iv = new IntersectionVisitor();
            iv.setIntersector( di );
            camera.accept( iv );

            ok( mockup[ 'check_near' ]( di.stackTransforms[ 0 ], [ 0.1536, -0.1152, -9.8002 ], 0.001 ), 'check end transform point' );
        } );
    };
} );