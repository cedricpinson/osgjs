define( [
    'osg/Camera',
    'osg/Matrix'
], function ( Camera, Matrix ) {

    return function () {

        module( 'Camera' );

        test( 'Test Camera', function () {

            ( function () {
                var matrix = Matrix.makeOrtho( -1, 1, -1, 1, -2, 2 );
                var camera = new Camera();
                camera.setProjectionMatrixAsOrtho( -1, 1, -1, 1, -2, 2 );
                ok( check_near( matrix, camera.getProjectionMatrix() ), 'check Camera.setProjectionMatrixAsOrtho' );
            } )();
        } );
    };
} );