define( [
    'tests/mockup/mockup',
    'osg/Camera',
    'osg/Matrix',
    'osg/TransformEnums'
], function ( mockup, Camera, Matrix, TransformEnums ) {

    return function () {

        module( 'osg' );

        test( 'Camera', function () {

            var matrix = Matrix.makeOrtho( -1, 1, -1, 1, -2, 2, Matrix.create() );
            var camera = new Camera();
            camera.setProjectionMatrixAsOrtho( -1, 1, -1, 1, -2, 2 );
            ok( mockup.check_near( matrix, camera.getProjectionMatrix() ), 'check Camera.setProjectionMatrixAsOrtho' );
        } );

        test( 'Camera absolute vs relative', function () {
            var mat = Matrix.makeRotate( Math.PI * 0.5, 1.0, 0.0, 0.0, Matrix.create() );
            var inv = Matrix.create();
            Matrix.inverse( mat, inv );

            var n = new Camera();
            Matrix.copy( mat, n.getViewMatrix() );
            var test = Matrix.create();

            var checkMatrices = function ( node ) {
                mockup.near( node.getWorldMatrices()[ 0 ], mat );

                node.computeLocalToWorldMatrix( Matrix.makeIdentity( Matrix.makeIdentity( test ) ) );
                mockup.near( test, mat );

                node.computeWorldToLocalMatrix( Matrix.makeIdentity( Matrix.makeIdentity( test ) ) );
                mockup.near( test, inv );
            };

            checkMatrices( n );
            n.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
            checkMatrices( n );

        } );
    };
} );
