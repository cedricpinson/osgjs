'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Node = require( 'osg/Node' );
var Lod = require( 'osg/Lod' );
var PagedLOD = require( 'osg/PagedLOD' );
var Shape = require( 'osg/Shape' );


module.exports = function () {
    test( 'PagedLOD', function () {

        var plod = new PagedLOD();
        assert.isOk( plod.children.length === 0, 'number of children must be 0' );
        assert.isOk( plod.parents.length === 0, 'number of parents must be 0' );
        var n = new Node();
        plod.addChild( n, 0, 200 );
        assert.isOk( plod.children.length === 1, 'number of children must be 1' );
        assert.isOk( plod._range[ 0 ][ 0 ] === 0, 'range min should be 0' );
        assert.isOk( plod._range[ 0 ][ 1 ] === 200, ' range max should be 200' );
    } );

    test( 'PagedLOD.UserDefinedBound', function () {

        var plod = new PagedLOD();
        // Create a quad of 2x2 with center in 0,0,0

        var n = Shape.createTexturedQuadGeometry( -1, -1, 0, 2, 0, 0, 0, 2, 0 );
        plod.setRange( 0, 0, 200 );
        plod.addChildNode( n );
        console.log( plod.getBound().radius() );
        assert.equalVector( plod.getBound().radius(), 1.4142135623730951, 0.0000001 );
        // Set a USER_DEFINED_CENTER/radius and try again
        plod.setCenter( [ 0, 0, 0 ] );
        plod.setRadius( 10.0 );
        plod.dirtyBound();
        assert.equalVector( plod.getBound().radius(), 10.0, 0.0000001 );
        // Now test UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED
        plod.setCenterMode( Lod.UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED );
        // move the center, so the user defined bs does not contain the default bs
        plod.setCenter( [ 10, 10, 10 ] );
        plod.dirtyBound();
        assert.equalVector( plod.getBound().radius(), 14.367360819, 0.0000001 );
    } );
};
