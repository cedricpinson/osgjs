'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var ComputeMatrixFromNodePath = require( 'osg/ComputeMatrixFromNodePath' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var MACROUTILS = require( 'osg/Utils' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var Matrix = require( 'osg/Matrix' );
var Camera = require( 'osg/Camera' );
var Vec3 = require( 'osg/Vec3' );
var TransformEnums = require( 'osg/TransformEnums' );


module.exports = function () {

    !test( 'ComputeMatrixFromNodePath', function () {

        ( function () {
            // test visit parents
            var GetRootItem = function () {
                NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
                this.node = undefined;
            };
            GetRootItem.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
                apply: function ( node ) {
                    this.node = node;
                    this.traverse( node );
                }
            } );

            var root = new MatrixTransform();
            root.setName( 'root' );
            Matrix.makeTranslate( 10, 0, 0, root.getMatrix() );

            var child0 = new Camera();
            child0.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
            Matrix.makeTranslate( 0, 5, 0, child0.getViewMatrix() );

            var child1 = new MatrixTransform();
            Matrix.makeTranslate( 0, -10, 0, child1.getMatrix() );

            var child2 = new MatrixTransform();
            Matrix.makeTranslate( 0, 0, 10, child2.getMatrix() );

            root.addChild( child0 );
            child0.addChild( child1 );
            child1.addChild( child2 );

            var path = [ root, child0, child1, child2 ];
            var matrix = ComputeMatrixFromNodePath.computeLocalToWorld( path );
            var trans = Matrix.getTrans( matrix, [ 0, 0, 0 ] );
            assert.equalVector( trans, [ 0, -10, 10 ], 'Check translation of matrix' );
        } )();


        ( function () {
            var root = new Camera();
            root.setName( 'root' );
            root.setViewMatrix( Matrix.makeTranslate( 0, 0, 1000, Matrix.create() ) );

            var child1 = new MatrixTransform();
            Matrix.makeTranslate( 0, -10, 0, child1.getMatrix() );

            var child2 = new MatrixTransform();
            Matrix.makeTranslate( 0, 0, 10, child2.getMatrix() );

            var path = [ root, child1, child2 ];
            var matrix = ComputeMatrixFromNodePath.computeLocalToWorld( path );
            var result = Vec3.create();
            Matrix.getTrans( matrix, result );
            assert.equalVector( result, [ 0, -10, 10 ], 'Check we dont use the camera on top' );
        } )();

    } );


};
