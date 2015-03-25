define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/ComputeMatrixFromNodePath',
    'osg/NodeVisitor',
    'osg/Utils',
    'osg/MatrixTransform',
    'osg/Matrix',
    'osg/Camera',
    'osg/Vec3',
    'osg/TransformEnums'
], function ( QUnit, mockup, ComputeMatrixFromNodePath, NodeVisitor, MACROUTILS, MatrixTransform, Matrix, Camera, Vec3, TransformEnums ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'ComputeMatrixFromNodePath', function () {

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
                mockup.near( trans, [ 0, -10, 10 ], 'Check translation of matrix' );
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
                mockup.near( result, [ 0, -10, 10 ], 'Check we dont use the camera on top' );
            } )();

        } );


    };
} );
