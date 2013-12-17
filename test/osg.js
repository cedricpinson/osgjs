define( [
    'test/osg/BlendColor',
    'test/osg/BoundingBox',
    'test/osg/BoundingSphere',
    'test/osg/BufferArray',
    'test/osg/Camera',
    'test/osg/ComputeMatrixFromNodePath',
    'test/osg/CullFace',
    'test/osg/CullVisitor',
    'test/osg/Depth',
    'test/osg/Light',
    'test/osg/Matrix',
    'test/osg/MatrixTransform',
    'test/osg/Node',
    'test/osg/NodeVisitor',
    'test/osg/Quat',
    'test/osg/ShaderGenerator',
    'test/osg/State',
    'test/osg/StateSet',
    'test/osg/Texture',
    'test/osg/TextureCubeMap',
    'test/osg/UpdateVisitor',
    'test/osg/Vec2'
], function ( BlendColor, BoundingBox, BoundingSphere, BufferArray, Camera, ComputeMatrixFromNodePath, CullFace, CullVisitor, Depth, Light, Matrix, MatrixTransform, Node, NodeVisitor, Quat, ShaderGenerator, State, StateSet, Texture, TextureCubeMap, UpdateVisitor, Vec2 ) {

    return function () {
        BlendColor();
        BoundingBox();
        BoundingSphere();
        BufferArray();
        Camera();
        ComputeMatrixFromNodePath();
        CullVisitor();
        CullFace();
        Depth();
        Light();
        Matrix();
        MatrixTransform();
        Node();
        NodeVisitor();
        Quat();
        ShaderGenerator();
        State();
        StateSet();
        Texture();
        TextureCubeMap();
        UpdateVisitor();
        Vec2();
    };
} );