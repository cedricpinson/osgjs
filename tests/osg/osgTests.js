define( [
    'tests/osg/Image',
    'tests/osg/BlendColor',
    'tests/osg/BoundingBox',
    'tests/osg/BoundingSphere',
    'tests/osg/BufferArray',
    'tests/osg/Camera',
    'tests/osg/ComputeBoundsVisitor',
    'tests/osg/ComputeMatrixFromNodePath',
    'tests/osg/CullFace',
    'tests/osg/CullVisitor',
    'tests/osg/Depth',
    'tests/osg/KdTree',
    'tests/osg/Light',
    'tests/osg/Matrix',
    'tests/osg/MatrixTransform',
    'tests/osg/Node',
    'tests/osg/NodeVisitor',
    'tests/osg/PagedLOD',
    'tests/osg/Plane',
    'tests/osg/Quat',
    'tests/osg/State',
    'tests/osg/StateSet',
    'tests/osg/Texture',
    'tests/osg/TextureCubeMap',
    'tests/osg/TextureManager',
    'tests/osg/UpdateVisitor',
    'tests/osg/Uniform',
    'tests/osg/Vec2',
    'tests/osg/PrimitiveFunctor'
], function ( Image, BlendColor, BoundingBox, BoundingSphere, BufferArray, Camera, ComputeBoundsVisitor, ComputeMatrixFromNodePath, CullFace, CullVisitor, Depth, KdTree, Light, Matrix, MatrixTransform, Node, NodeVisitor, PagedLOD, Plane, Quat, State, StateSet, Texture, TextureCubeMap, TextureManager, UpdateVisitor, Uniform, Vec2, PrimitiveFunctor ) {

    'use strict';

    return function () {
        Image();
        BlendColor();
        BoundingBox();
        BoundingSphere();
        BufferArray();
        Camera();
        ComputeBoundsVisitor();
        ComputeMatrixFromNodePath();
        CullVisitor();
        CullFace();
        Depth();
        KdTree();
        Light();
        Matrix();
        MatrixTransform();
        Node();
        NodeVisitor();
        Plane();
        PagedLOD();
        Quat();
        State();
        StateSet();
        Texture();
        TextureCubeMap();
        TextureManager();
        UpdateVisitor();
        Uniform();
        Vec2();
        PrimitiveFunctor();
    };
} );
