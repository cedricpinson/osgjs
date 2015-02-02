define( [
    'osg/BoundingBox',
    'osg/Matrix',
    'osg/Vec3',
    'osgShadow/ShadowMap',
    'tests/mockup/mockup'
], function ( BoundingBox, Matrix, Vec3, ShadowMap, mockup ) {

    return function () {
        module( 'osgShadow' );
        return;
        test( 'trimProjection', function () {

            var view = Matrix.create();

            var shadowMap = new ShadowMap();

            var eyeDir = Vec3.create();
            Vec3.set( 0, -1.0, 0, eyeDir );

            var sceneBbox = new BoundingBox();
            sceneBbox.expandByVec3( [ 10.0, 10.0, 10.0 ] );
            sceneBbox.expandByVec3( [ -10.0, -10.0, -10.0 ] );

            var projectionBasis = Matrix.create();
            shadowMap.makeOrthoFromBoundingBox( sceneBbox, eyeDir, projectionBasis, view );

            var sceneSmallerBbox = new BoundingBox();
            sceneSmallerBbox.expandByVec3( [ 1.0, 1.0, 1.0 ] );
            sceneSmallerBbox.expandByVec3( [ -1.0, -1.0, -1.0 ] );
            var projectionSmaller = Matrix.create();

            shadowMap.makeOrthoFromBoundingBox( sceneBbox, eyeDir, projectionSmaller, view );


            console.log( projectionBasis );
            shadowMap.trimProjection( view, projectionBasis, sceneSmallerBbox, ( 1 | 2 | 4 | 8 | 16 | 32 ), true );

            console.log( projectionBasis );
            console.log( projectionSmaller );

            mockup.near( projectionBasis, projectionSmaller );


            sceneSmallerBbox = new BoundingBox();
            sceneSmallerBbox.expandByVec3( [ 1.0, 1.0, 1.0 ] );
            sceneSmallerBbox.expandByVec3( [ -1.0, -1.0, -1.0 ] );

            shadowMap.makeOrthoFromBoundingBox( sceneBbox, eyePos, projectionSmaller, view );

            shadowMap.trimProjection2( view, projectionBasis, sceneSmallerBbox, ( 1 | 2 | 4 | 8 | 16 | 32 ), true );

            console.log( projectionBasis );
            console.log( projectionSmaller );

            mockup.near( projectionBasis, projectionSmaller );

        } );
    };
} );