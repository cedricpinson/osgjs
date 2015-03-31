define( [
    'qunit',
    'osg/BoundingBox',
    'osg/Light',
    'osg/LightSource',
    'osg/Matrix',
    'osg/Vec3',
    'osgShadow/ShadowMap'
], function ( QUnit, BoundingBox, Light, LightSource, Matrix, Vec3, ShadowMap ) {

    'use strict';

    return function () {
        QUnit.module( 'osgShadow' );

        var matrixCompare = function ( matrix1, matrix2 ) {
            for ( var i = 0; i < 16; i++ ) {
                if ( matrix1[ i ] !== matrix2[ i ] ) {
                    return false;
                }
            }
            return true;
        };

        QUnit.test( 'ShadowedMap', function () {

            var shadowMap = new ShadowMap();
            var frustumBound = new BoundingBox();
            var resultView, resultProj, resultNearFar;


            /// TEST SPOT


            //SPOT INSIDE BOUNDINGBOX
            frustumBound.expandByVec3( [ 8.9969263076782231, 6.6672196388244632, 10.771773338317871 ] );
            frustumBound.expandByVec3( [ -7.3858900070190431, -9.332790374755862, -0.39151200652122503 ] );

            shadowMap._viewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
            shadowMap._projectionMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];

            shadowMap.makePerspectiveFromBoundingBox( frustumBound,
                36, // spot cutoff
                [ 0, 0, 0, 0 ], //lightpos
                [ 0.11092425336790919, -0.8030704746216726, -0.5854687206040078, 1 ], // worldlightDir
                shadowMap._viewMatrix,
                shadowMap._projectionMatrix );

            resultView = [ -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0, 0, 0.8106949964038919, 0.5854687206040078, 0, 0, 0, 0, 1 ];
            resultProj = [ 1.3763819204711736, 0, 0, 0, 0, 1.3763819204711736, 0, 0, 0, 0, -1, -1, 0, 0, -0.1461688261717007, 0 ];
            resultNearFar = [ 0.07308441308585036, 14.61688261717007 ];


            console.log( shadowMap._viewMatrix, shadowMap._projectionMatrix, shadowMap._depthRange );


            ok( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for spot light  inside scene Bbox' );
            ok( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for spot light inside scene Bbox' );
            ok( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ], 'correct near shadow  for spot light  inside scene Bbox' );
            ok( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ], 'correct near/far shadow  for spot light inside scene Bbox' );

            //SPOT OUTSIDE BOUNDINGBOX


            frustumBound.expandByVec3( [ 8.9969263076782231, 6.6672196388244632, 10.771773338317871 ] );
            frustumBound.expandByVec3( [ -7.3858900070190431, -9.332790374755862, -0.391512006521225 ] );

            shadowMap._viewMatrix = [ -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0, 0, 0.8106949964038919, 0.5854687206040078, 0, 2.482286486135774, -0.6856442836475978, -23.687648846577943, 1 ];
            shadowMap._projectionMatrix = [ 1.0071318580002284, 0, 0, 0, 0, 1.0071318580002284, 0, 0, 0, 0, -1, -1, 0, 0, -25.65748079205765, 0 ];

            shadowMap.makePerspectiveFromBoundingBox( frustumBound, 52, [ 17, 15, 32, 0 ], //lightpos
                [ 0.11092425336790919, -0.8030704746216726, -0.5854687206040078, 1 ], // worldlightDir
                shadowMap._viewMatrix,
                shadowMap._projectionMatrix );

            resultView = [ -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0, 0, 0.8106949964038919, 0.5854687206040078, 0, 18.892508202254326, -18.604629434131823, -28.89534387139888, 1 ];
            resultProj = [ 1.4159666620679765, 0, 0, 0, 0, 1.4159666620679765, 0, 0, 0, 0, -1, -1, 0, 0, -36.07287084169951, 0 ];
            resultNearFar = [ 18.036435420849756, 43.51222648856895 ];


            ok( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for spot light outside scene Bbox' );
            ok( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for spot light outside scene Bbox' );
            ok( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ], 'correct near shadow  for spot light outside scene Bbox' );
            ok( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ], 'correct near/far shadow  for spot light outside scene Bbox' );

            ///////////////////////////////////////////////////////////
            /// TEST Directional




            // DIRECTIONAL LOOKING DOWN
            frustumBound.expandByVec3( [ 8.996926307678223, 6.667219638824462, 10.77177333831787 ] );
            frustumBound.expandByVec3( [ -7.385890007019043, -9.332790374755858, -0.3915120065212249 ] );

            shadowMap._viewMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
            shadowMap._projectionMatrix = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];

            shadowMap.makeOrthoFromBoundingBox( frustumBound,
                36, // spot cutoff
                [ -0.10643338689534251, -0.5669665032376362, -0.816835918872618, 0 ], //lightdir
                shadowMap._viewMatrix,
                shadowMap._projectionMatrix );

            resultView = [ 0.07850590369043473, 0, 0, 0, 0, 0.07850590369043473, 0, 0, 0, 0, -0.07850559553279862, 0, -0, -0, -1.9999960747202232, 1 ];
            resultProj = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
            resultNearFar = [ 12.737895533859595, 38.21378660157878 ];


            ok( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for directional light looking down' );
            ok( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for directional light case 1' );
            ok( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ], 'correct near shadow  for directional light case looking down' );
            ok( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ], 'correct near/far shadow  for directional light looking down' );

            // DIRECTIONAL LOOKING UP


            frustumBound.expandByVec3( [ 8.9969263076782261, 6.6672196388244632, 10.771773338317875 ] );
            frustumBound.expandByVec3( [ -7.3858900070190481, -9.332790374755862, -0.39151200652122586 ] );

            shadowMap._viewMatrix = [ 0.5812106861252584, 0.6021354245658719, 0.547382013603556, 0, 0.8137531187859167, -0.4300659932024471, -0.39095920907044307, 0, -0, 0.6726634908880293, -0.7399485306602954, 0, 0.6163824930149122, -4.549428088332258, -22.59735236799494, 1 ];

            shadowMap._projectionMatrix = [ 0.07850590369043473, 0, 0, 0, 0, 0.07850590369043473, 0, 0, 0, 0, -0.07850559553279862, 0, -0, -0, -1.9999960747202232, 1 ];

            shadowMap.makeOrthoFromBoundingBox( frustumBound, [ -0.10643338689534251, -0.5669665032376362, -0.816835918872618, 0 ], //lightdir
                shadowMap._viewMatrix,
                shadowMap._projectionMatrix );

            resultView = [ -0.9828322343871124, -0.15070744242943934, 0.10643338689534251, 0, 0.1845014879333943, -0.802812671273225, 0.5669665032376362, 0, 0, 0.5768700734476752, 0.816835918872618, 0, 1.0375900870133319, -3.942610459663543, -29.045365584570664, 1 ];
            resultProj = [ 0.07850590369043471, 0, 0, 0, 0, 0.07850590369043471, 0, 0, 0, 0, -0.07850559553279861, 0, -0, -0, -1.9999960747202234, 1 ];
            resultNearFar = [ 12.737895533859596, 38.21378660157879 ];

            ok( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for directional light  looking up' );
            ok( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for directional light looking up' );
            ok( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ], 'correct near shadow  for directional light  looking up' );
            ok( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ], 'correct near/far shadow  for directional light looking up' );



        } );


        return;
    };
} );
