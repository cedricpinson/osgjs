'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var ComputeBoundsVisitor = require( 'osg/ComputeBoundsVisitor' );
var Matrix = require( 'osg/Matrix' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var Shape = require( 'osg/Shape' );

module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'ComputeBoundsVisitor translate', function () {

        var root = new MatrixTransform();

        var child1 = new MatrixTransform();
        Matrix.makeTranslate( 10, 0, 0, child1.getMatrix() );

        var child2 = new MatrixTransform();
        Matrix.makeTranslate( -10, 0, 0, child2.getMatrix() );

        root.addChild( child1 );
        root.addChild( child2 );

        var shape = Shape.createTexturedBoxGeometry( 0, 0, 0, 5, 5, 5 );

        child1.addChild( shape );
        child2.addChild( shape );

        child2.setNodeMask( 0 );

        var bs = root.getBound();

        mockup.near( bs.radius(), 14.330127018922195, 'Check radius of the scene' );

        var visitor = new ComputeBoundsVisitor();
        root.accept( visitor );

        mockup.near( visitor.getBoundingBox().corner( 0 ), [ 7.5, -2.5, -2.5 ], 'Check Min of bounding box' );
        mockup.near( visitor.getBoundingBox().corner( 7 ), [ 12.5, 2.5, 2.5 ], 'Check Max of bounding box' );

    } );


    QUnit.test( 'ComputeBoundsVisitor translate and rotate', function () {

        var root = new MatrixTransform();
        var tra = Matrix.create();

        var child1 = new MatrixTransform();
        Matrix.makeRotate( -Math.PI * 0.5, 0, 1, 0, child1.getMatrix() );
        Matrix.postMult( Matrix.makeTranslate( -10, 0, 0, tra ), child1.getMatrix() );

        root.addChild( child1 );

        var child2 = new MatrixTransform();
        Matrix.makeRotate( Math.PI, 0, 1, 0, child2.getMatrix() );
        Matrix.postMult( Matrix.makeTranslate( 0, 0, 10, tra ), child2.getMatrix() );

        child1.addChild( child2 );
        var shape = Shape.createTexturedBoxGeometry( 0, 0, 0, 5, 5, 5 );
        child2.addChild( shape );

        var bs = root.getBound();

        mockup.near( bs.radius(), 4.330127018922194, 'Check radius of the scene' );

        var visitor = new ComputeBoundsVisitor();
        root.accept( visitor );

        mockup.near( visitor.getBoundingBox().corner( 0 ), [ -22.5, -2.5, -2.5 ], 'Check Min of bounding box' );
        mockup.near( visitor.getBoundingBox().corner( 7 ), [ -17.5, 2.5, 2.5 ], 'Check Max of bounding box' );

    } );

};
