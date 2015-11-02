'use strict';
var QUnit = require( 'qunit' );
var BoundingSphere = require( 'osg/BoundingSphere' );
var Plane = require( 'osg/Plane' );
require( 'osg/Vec3' );


module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'Plane', function () {

        var p = Plane.create();
        Plane.setNormal( p, [ 2, 0, 0 ] );
        Plane.setDistance( p, -2 );
        Plane.normalizeEquation( p );

        ok( Plane.distanceToPlane( p, [ 4, 0, 0 ] ) === 3 );
        ok( Plane.distanceToPlane( p, [ -4, 0, 0 ] ) === -5 );
        ok( Plane.distanceToPlane( p, [ 1, 0, 0 ] ) === 0 );

        var bSphere = new BoundingSphere();
        bSphere.set( [ -40, 0, 0 ], 0.1 );
        bSphere.expandByVec3( [ -0.1, -0.1, 0.0 ] );

        ok( Plane.intersectsOrContainsBoundingSphere( p, bSphere ) === Plane.OUTSIDE );
        bSphere.expandByVec3( [ 1.0, 4.0, 0.0 ] );
        bSphere.expandByVec3( [ 2.0, 3.0, 0.0 ] );

        ok( Plane.intersectsOrContainsBoundingSphere( p, bSphere ) === Plane.INTERSECT );
        bSphere.set( [ 40, 0, 0 ], 1.0 );
        ok( Plane.intersectsOrContainsBoundingSphere( p, bSphere ) === Plane.INSIDE );

    } );
};
