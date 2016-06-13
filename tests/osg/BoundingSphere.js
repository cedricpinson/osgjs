'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var BoundingSphere = require( 'osg/BoundingSphere' );
var BoundingBox = require( 'osg/BoundingBox' );
var Node = require( 'osg/Node' );
var Camera = require( 'osg/Camera' );
var TransformEnums = require( 'osg/TransformEnums' );
var Shape = require( 'osg/Shape' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var Vec3 = require( 'osg/Vec3' );
var Matrix = require( 'osg/Matrix' );


module.exports = function () {

    test( 'BoundingSphere', function () {

        var simpleBoundingSphere = new BoundingSphere();
        assert.isOk( simpleBoundingSphere.valid() !== 1, 'BoundingSphere is invalid' );

        var bs0 = new BoundingSphere();
        bs0.expandByVec3( Vec3.createAndSet( 1.0, 4.0, 0.0 ) );
        bs0.expandByVec3( Vec3.createAndSet( 2.0, 3.0, 0.0 ) );
        bs0.expandByVec3( Vec3.createAndSet( 3.0, 2.0, 0.0 ) );
        bs0.expandByVec3( Vec3.createAndSet( 4.0, 1.0, 0.0 ) );

        var cbs0 = Vec3.createAndSet( 2.5, 2.5, 0 );
        var rbs0 = 2.12132;
        var centerisequalbs0 = mockup.checkNear( cbs0, bs0._center, 0.0001 ) & mockup.checkNear( rbs0, bs0._radius, 0.0001 );
        assert.isOk( centerisequalbs0, 'Expanding by vec3 -> bounding sphere test 1' );
        var bs1 = new BoundingSphere();
        bs1.expandByVec3( Vec3.createAndSet( -1.0, 0.0, 0.0 ) );
        bs1.expandByVec3( Vec3.createAndSet( 2.0, -3.0, 2.0 ) );
        bs1.expandByVec3( Vec3.createAndSet( 3.0, 3.0, 1.0 ) );
        bs1.expandByVec3( Vec3.createAndSet( 5.0, 5.0, 0.0 ) );

        var cbs1 = Vec3.createAndSet( 2.00438, 0.862774, 0.784302 );
        var rbs1 = 5.16774;
        var centerisequalbs1 = mockup.checkNear( cbs1, bs1._center, 0.0001 ) & mockup.checkNear( rbs1, bs1._radius, 0.0001 );

        assert.isOk( centerisequalbs1, 'Expanding by vec3 ->  bounding sphere test 2' );

        var bs01 = new BoundingSphere();
        bs01.expandByBoundingSphere( bs0 );

        var cbs010 = Vec3.createAndSet( 2.5, 2.5, 0 );
        var rbs010 = 2.12132;
        var centerisequalbs010 = mockup.checkNear( cbs010, bs01._center, 0.0001 ) & mockup.checkNear( rbs010, bs01._radius, 0.0001 );
        assert.isOk( centerisequalbs010, 'Expanding by BoundingSphere ->  bounding sphere test 1' );

        bs01.expandByBoundingSphere( bs1 );
        var cbs011 = Vec3.createAndSet( 2.00438, 0.862774, 0.784302 );
        var rbs011 = 5.16774;
        var centerisequalbs011 = mockup.checkNear( cbs011, bs01._center, 0.0001 ) & mockup.checkNear( rbs011, bs01._radius, 0.0001 );
        assert.isOk( centerisequalbs011, 'Expanding by BoundingSphere ->  bounding sphere test 2' );

        // test case with camera and absolute transform
        var main = new Node();
        var cam = new Camera();
        cam.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
        var q = Shape.createTexturedQuadGeometry( -25, -25, 0, 50, 0, 0, 0, 50, 0 );
        main.addChild( q );
        var q2 = Shape.createTexturedQuadGeometry( -250, 0, 0, 50, 0, 0, 0, 50, 0 );
        cam.addChild( q2 );
        main.addChild( cam );
        var bscam = main.getBound();
        assert.equalVector( bscam.center(), Vec3.create(), 'check camera bounding sphere in absolute mode' );


        // test case with invalid bounding sphere
        var main2 = new Node();
        var q3 = Shape.createTexturedQuadGeometry( -25, -25, 0, 50, 0, 0, 0, 50, 0 );
        var mt3 = new MatrixTransform();
        Matrix.makeTranslate( -1000, 0, 0, mt3.getMatrix() );
        main2.addChild( q3 );
        main2.addChild( mt3 );
        assert.equalVector( main2.getBound().center(), Vec3.create(), 'check computing bounding sphere with invalid bouding sphere' );
    } );

    test( 'BoundingSphere - expand with box', function () {
        // test expand by bounding box
        var bbox = new BoundingBox();
        Vec3.set( -2.0, -2.0, -2.0, bbox.getMin() );
        Vec3.set( 2.0, 2.0, 2.0, bbox.getMax() );

        var bs = new BoundingSphere();
        bs.expandByBoundingBox( bbox );

        assert.equalVector( bs.radius(), 3.4641, 1e-2, 'Expands with box - check radius' );
        assert.equalVector( bs.center(), Vec3.create(), 1e-2, 'Expands with box - check center' );

        Vec3.set( 2.0, 2.0, 2.0, bbox.getMin() );
        Vec3.set( 4.0, 4.0, 4.0, bbox.getMax() );
        bs.expandByBoundingBox( bbox );

        assert.equalVector( bs.radius(), 5.9135, 1e-2, 'Expands with box - check radius' );
        assert.equalVector( bs.center(), Vec3.createAndSet( 0.5857, 0.5857, 0.5857 ), 1e-2, 'Expands with box - check center' );
    } );
};
