define( [
    'tests/mockup/mockup',
    'osg/ComputeMatrixFromNodePath',
    'osg/NodeVisitor',
    'osg/Utils',
    'osg/MatrixTransform',
    'osg/Matrix',
    'osg/Camera',
    'osg/TransformEnums'
], function ( mockup, ComputeMatrixFromNodePath, NodeVisitor, MACROUTILS, MatrixTransform, Matrix, Camera, TransformEnums ) {

    return function () {

        module( 'osg' );

        test( 'ComputeMatrixFromNodePath', function () {

            ( function () {
                // test visit parents
                var GetRootItem = function () {
                    NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
                    this.node = undefined;
                };
                GetRootItem.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                    apply: function ( node ) {
                        this.node = node;
                        this.traverse( node );
                    }
                } );

                var root = new MatrixTransform();
                root.setName( 'root' );
                root.setMatrix( Matrix.makeTranslate( 10, 0, 0, [] ) );

                var child0 = new Camera();
                child0.setReferenceFrame( TransformEnums.ABSOLUTE_RF );
                child0.setViewMatrix( Matrix.makeTranslate( 0, 10, 0, [] ) );

                var child1 = new MatrixTransform();
                child1.setMatrix( Matrix.makeTranslate( 0, -10, 0, [] ) );

                var child2 = new MatrixTransform();
                child2.setMatrix( Matrix.makeTranslate( 0, 0, 10, [] ) );

                root.addChild( child0 );
                child0.addChild( child1 );
                child1.addChild( child2 );

                path = [ root, child0, child1, child2 ];
                var matrix = ComputeMatrixFromNodePath.computeLocalToWorld( path );
                var trans = Matrix.getTrans( matrix, [] );
                var result = [ 0, -10, 10 ];
                ok( mockup.check_near( trans, result ), 'Translation of matrix should be ' + result );
            } )();
        } );
    };
} );
