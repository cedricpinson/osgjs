'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var BoundingBox = require( 'osg/BoundingBox' );
var Light = require( 'osg/Light' );
var ShadowMap = require( 'osgShadow/ShadowMap' );
var ShadowSettings = require( 'osgShadow/ShadowSettings' );
var Vec2 = require( 'osg/Vec2' );
var Vec3 = require( 'osg/Vec3' );
var Vec4 = require( 'osg/Vec4' );
var Matrix = require( 'osg/Matrix' );


module.exports = function () {

    var matrixCompare = function ( matrix1, matrix2 ) {
        for ( var i = 0; i < 16; i++ ) {
            if ( Math.abs( matrix1[ i ] - matrix2[ i ] ) > 1e-5 ) {
                return false;
            }
        }
        return true;
    };

    test( 'ShadowedMap', function () {

        var shadowSettings = new ShadowSettings();
        shadowSettings.light = new Light();

        var shadowMap = new ShadowMap( shadowSettings );
        var frustumBound = new BoundingBox();
        var resultView, resultProj, resultNearFar;


        /// TEST SPOT


        //SPOT INSIDE BOUNDINGBOX
        frustumBound.expandByVec3( Vec3.createAndSet( 8.9969263076782231, 6.6672196388244632, 10.771773338317871 ) );
        frustumBound.expandByVec3( Vec3.createAndSet( -7.3858900070190431, -9.332790374755862, -0.39151200652122503 ) );

        shadowMap._viewMatrix = Matrix.create();
        shadowMap._projectionMatrix = Matrix.create();

        shadowMap.makePerspectiveFromBoundingBox( frustumBound,
            36.0, // spot cutoff
            Vec4.create(), //lightpos
            Vec4.createAndSet( 0.11092425336790919, -0.8030704746216726, -0.5854687206040078, 1.0 ), // worldlightDir
            shadowMap._viewMatrix,
            shadowMap._projectionMatrix );

        resultView = Matrix.createAndSet( -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0.0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0.0, 0.0, 0.8106949964038919, 0.5854687206040078, 0.0, 0.0, 0.0, 0.0, 1.0 );
        resultProj = Matrix.createAndSet( 1.3763819204711736, 0.0, 0.0, 0.0, 0.0, 1.3763819204711736, 0.0, 0.0, 0.0, 0.0, -1, -1, 0.0, 0.0, -0.1461688261717007, 0.0 );
        resultNearFar = Vec2.createAndSet( 0.07308441308585036, 14.61688261717007 );

        console.log( shadowMap._viewMatrix, shadowMap._projectionMatrix, shadowMap._depthRange );

        assert.isOk( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for spot light  inside scene Bbox' );
        assert.isOk( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for spot light inside scene Bbox' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ] ), 'correct near shadow  for spot light  inside scene Bbox' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ] ), 'correct near/far shadow  for spot light inside scene Bbox' );

        //SPOT OUTSIDE BOUNDINGBOX


        frustumBound.expandByVec3( Vec3.createAndSet( 8.9969263076782231, 6.6672196388244632, 10.771773338317871 ) );
        frustumBound.expandByVec3( Vec3.createAndSet( -7.3858900070190431, -9.332790374755862, -0.391512006521225 ) );

        shadowMap._viewMatrix = Matrix.createAndSet( -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0.0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0.0, 0.0, 0.8106949964038919, 0.5854687206040078, 0.0, 2.482286486135774, -0.6856442836475978, -23.687648846577943, 1.0 );
        shadowMap._projectionMatrix = Matrix.createAndSet( 1.0071318580002284, 0.0, 0.0, 0.0, 0.0, 1.0071318580002284, 0.0, 0.0, 0.0, 0.0, -1, -1, 0.0, 0.0, -25.65748079205765, 0.0 );

        shadowMap.makePerspectiveFromBoundingBox( frustumBound, 52, Vec4.createAndSet( 17.0, 15.0, 32.0, 0.0 ), //lightpos
            Vec4.createAndSet( 0.11092425336790919, -0.8030704746216726, -0.5854687206040078, 1.0 ), // worldlightDir
            shadowMap._viewMatrix,
            shadowMap._projectionMatrix );

        resultView = Matrix.createAndSet( -0.990595079757442, 0.08010741523179432, -0.11092425336790919, 0.0, -0.13682612309185416, -0.5799624339822145, 0.8030704746216726, 0.0, 0.0, 0.8106949964038919, 0.5854687206040078, 0.0, 18.892508202254326, -18.604629434131823, -28.89534387139888, 1.0 );
        resultProj = Matrix.createAndSet( 1.4159666620679765, 0.0, 0.0, 0.0, 0.0, 1.4159666620679765, 0.0, 0.0, 0.0, 0.0, -1, -1, 0.0, 0.0, -36.07287084169951, 0.0 );
        resultNearFar = Vec2.createAndSet( 18.036435420849756, 43.51222648856895 );


        assert.isOk( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for spot light outside scene Bbox' );
        assert.isOk( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for spot light outside scene Bbox' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ] ), 'correct near shadow  for spot light outside scene Bbox' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ] ), 'correct near/far shadow  for spot light outside scene Bbox' );

        ///////////////////////////////////////////////////////////
        /// TEST Directional




        // DIRECTIONAL LOOKING DOWN
        frustumBound.expandByVec3( Vec3.createAndSet( 8.996926307678223, 6.667219638824462, 10.77177333831787 ) );
        frustumBound.expandByVec3( Vec3.createAndSet( -7.385890007019043, -9.332790374755858, -0.3915120065212249 ) );

        shadowMap._viewMatrix = Matrix.create();
        shadowMap._projectionMatrix = Matrix.create();

        shadowMap.makeOrthoFromBoundingBox( frustumBound,
            36, // spot cutoff
            [ -0.10643338689534251, -0.5669665032376362, -0.816835918872618, 0 ], //lightdir
            shadowMap._viewMatrix,
            shadowMap._projectionMatrix );

        resultView = Matrix.createAndSet( 0.07850590369043473, 0.0, 0.0, 0.0, 0.0, 0.07850590369043473, 0.0, 0.0, 0.0, 0.0, -0.07850559553279862, 0.0, -0, -0, -1.9999960747202232, 1.0 );
        resultProj = Matrix.createAndSet( 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 );
        resultNearFar = Vec2.createAndSet( 12.737895533859595, 38.21378660157878 );


        assert.isOk( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for directional light looking down' );
        assert.isOk( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for directional light case 1' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ] ), 'correct near shadow  for directional light case looking down' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ] ), 'correct near/far shadow  for directional light looking down' );

        // DIRECTIONAL LOOKING UP


        frustumBound.expandByVec3( Vec3.createAndSet( 8.9969263076782261, 6.6672196388244632, 10.771773338317875 ) );
        frustumBound.expandByVec3( Vec3.createAndSet( -7.3858900070190481, -9.332790374755862, -0.39151200652122586 ) );

        shadowMap._viewMatrix = Matrix.createAndSet( 0.5812106861252584, 0.6021354245658719, 0.547382013603556, 0.0, 0.8137531187859167, -0.4300659932024471, -0.39095920907044307, 0.0, -0, 0.6726634908880293, -0.7399485306602954, 0.0, 0.6163824930149122, -4.549428088332258, -22.59735236799494, 1.0 );

        shadowMap._projectionMatrix = Matrix.createAndSet( 0.07850590369043473, 0.0, 0.0, 0.0, 0.0, 0.07850590369043473, 0.0, 0.0, 0.0, 0.0, -0.07850559553279862, 0.0, -0, -0, -1.9999960747202232, 1.0 );

        shadowMap.makeOrthoFromBoundingBox( frustumBound, Vec4.createAndSet( -0.10643338689534251, -0.5669665032376362, -0.816835918872618, 0.0 ), //lightdir
            shadowMap._viewMatrix,
            shadowMap._projectionMatrix );

        resultView = Matrix.createAndSet( -0.9828322343871124, -0.15070744242943934, 0.10643338689534251, 0.0, 0.1845014879333943, -0.802812671273225, 0.5669665032376362, 0.0, 0.0, 0.5768700734476752, 0.816835918872618, 0.0, 1.0375900870133319, -3.942610459663543, -29.045365584570664, 1.0 );
        resultProj = Matrix.createAndSet( 0.07850590369043471, 0.0, 0.0, 0.0, 0.0, 0.07850590369043471, 0.0, 0.0, 0.0, 0.0, -0.07850559553279861, 0.0, -0, -0, -1.9999960747202234, 1.0 );
        resultNearFar = Vec2.createAndSet( 12.737895533859596, 38.21378660157879 );

        assert.isOk( matrixCompare( shadowMap._viewMatrix, resultView ), 'correct view shadow matrix for directional light  looking up' );
        assert.isOk( matrixCompare( shadowMap._projectionMatrix, resultProj ), 'correct projection shadow matrix for directional light looking up' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 0 ] === resultNearFar[ 0 ] ), 'correct near shadow  for directional light  looking up' );
        assert.isOk( mockup.checkNear( shadowMap._depthRange[ 1 ] === resultNearFar[ 1 ] ), 'correct near/far shadow  for directional light looking up' );

    } );

};
