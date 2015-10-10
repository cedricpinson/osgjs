define( [
    'tests/osg/ComputeBoundsVisitorPerformance',
    'tests/osg/ComputeMatrixFromNodePathPerformance',
    'tests/osg/CullVisitorPerformance',
    'tests/osg/MatrixPerformance',
    'tests/osg/MatrixTransformPerformance',
    'tests/osg/NodePerformance',
    'tests/osg/NodeVisitorPerformance',
    'tests/osg/UniformPerformance',
], function ( ComputeBoundsVisitor, ComputeMatrixFromNodePath, CullVisitor, Matrix, MatrixTransform, Node, NodeVisitor, Uniform ) {

    'use strict';

    return function () {

        ComputeBoundsVisitor();
        ComputeMatrixFromNodePath();
        CullVisitor();
        Matrix();
        MatrixTransform();
        Node();
        NodeVisitor();
        Uniform();

    };
} );
