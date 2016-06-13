'use strict';
var assert = require( 'chai' ).assert;
var Vec2 = require( 'osg/Vec2' );


module.exports = function () {

    test( 'Vec2', function () {

        ( function () {
            var a = [ 2, 3 ];
            var b = [];
            assert.equalVector( Vec2.copy( a, b ), a, 'test copy operation' );
        } )();

        ( function () {
            assert.isOk( Vec2.valid( [ 0 / 0, 0 ] ) === false, 'is invalid' );
            assert.isOk( Vec2.valid( [ 0, 0 / 0 ] ) === false, 'is invalid' );
            assert.isOk( Vec2.valid( [ 0, 2 ] ) === true, 'is invalid' );
        } )();

        ( function () {
            assert.equalVector( Vec2.set( 2, 4, [ 0, 0 ] ), [ 2, 4 ], 'test set' );
        } )();

        ( function () {
            assert.equalVector( Vec2.mult( [ 2, 4 ], 2.0, [ 0, 0 ] ), [ 4, 8 ], 'test mult' );
        } )();

        ( function () {
            assert.equalVector( Vec2.length2( [ 2, 4 ] ), 20, 'test length2' );
        } )();

        ( function () {
            assert.equalVector( Vec2.length( [ 2, 4 ] ), Math.sqrt( 20 ), 'test length' );
        } )();

        ( function () {
            assert.equalVector( Vec2.normalize( [ 2, 4 ], [ 0, 0 ] ), [ 0.4472135954999579, 0.8944271909999159 ], 'test normalize' );
            assert.equalVector( Vec2.normalize( [ 0, 0 ], [ 0, 0 ] ), [ 0.0, 0.0 ], 'test normalize' );
        } )();

        ( function () {
            assert.equalVector( Vec2.dot( [ 2, 4 ], [ 2, 4 ] ), 20, 'test dot product' );
        } )();

        ( function () {
            assert.equalVector( Vec2.sub( [ 2, 4 ], [ 2, 4 ], [ 0, 0 ] ), [ 0, 0 ], 'test sub' );
        } )();

        ( function () {
            assert.equalVector( Vec2.add( [ -2, -4 ], [ 2, 4 ], [ 0, 0 ] ), [ 0, 0 ], 'test add' );
        } )();

        ( function () {
            assert.equalVector( Vec2.neg( [ -2, -4 ], [ 0, 0 ] ), [ 2, 4 ], 'test neg' );
        } )();
    } );
};
