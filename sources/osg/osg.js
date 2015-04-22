define( [
    'osg/BlendColor',
    'osg/BlendFunc',
    'osg/BoundingBox',
    'osg/BoundingSphere',
    'osg/BufferArray',
    'osg/Camera',
    'osg/ColorMask',
    'osg/ComputeBoundsVisitor',
    'osg/ComputeMatrixFromNodePath',
    'osg/CullFace',
    'osg/CullingSet',
    'osg/CullSettings',
    'osg/CullStack',
    'osg/CullVisitor',
    'osg/Depth',
    'osg/DrawArrayLengths',
    'osg/DrawArrays',
    'osg/DrawElements',
    'osg/EllipsoidModel',
    'osg/FrameBufferObject',
    'osg/FrameStamp',
    'osg/Geometry',
    'osg/GLObject',
    'osg/Image',
    'osg/ImageStream',
    'osg/KdTree',
    'osg/KdTreeBuilder',
    'osg/Light',
    'osg/LightSource',
    'osg/LineWidth',
    'osg/Lod',
    'osg/Map',
    'osg/Material',
    'osg/Math',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Object',
    'osg/PagedLOD',
    'osg/Polytope',
    'osg/Plane',
    'osg/PrimitiveFunctor',
    'osg/PrimitiveSet',
    'osg/Program',
    'osg/Projection',
    'osg/Quat',
    'osg/RenderBin',
    'osg/RenderLeaf',
    'osg/RenderStage',
    'osg/Shader',
    'osg/Shape',
    'osg/Stack',
    'osg/State',
    'osg/StateAttribute',
    'osg/StateGraph',
    'osg/StateSet',
    'osg/Texture',
    'osg/TextureCubeMap',
    'osg/Transform',
    'osg/TriangleIndexFunctor',
    'osg/Uniform',
    'osg/UpdateVisitor',
    'osg/Utils',
    'osg/Vec2',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Viewport',
    'osgUtil/osgPool',
    'osg/TransformEnums',
    'osg/WebGLCaps'

], function (
    BlendColor,
    BlendFunc,
    BoundingBox,
    BoundingSphere,
    BufferArray,
    Camera,
    ColorMask,
    ComputeBoundsVisitor,
    ComputeMatrixFromNodePath,
    CullFace,
    CullingSet,
    CullSettings,
    CullStack,
    CullVisitor,
    Depth,
    DrawArrayLengths,
    DrawArrays,
    DrawElements,
    EllipsoidModel,
    FrameBufferObject,
    FrameStamp,
    Geometry,
    GLObject,
    Image,
    ImageStream,
    KdTree,
    KdTreeBuilder,
    Light,
    LightSource,
    LineWidth,
    Lod,
    Map,
    Material,
    Math,
    Matrix,
    MatrixTransform,
    Node,
    NodeVisitor,
    Notify,
    Object,
    PagedLOD,
    Polytope,
    Plane,
    PrimitiveFunctor,
    PrimitiveSet,
    Program,
    Projection,
    Quat,
    RenderBin,
    RenderLeaf,
    RenderStage,
    Shader,
    Shape,
    Stack,
    State,
    StateAttribute,
    StateGraph,
    StateSet,
    Texture,
    TextureCubeMap,
    Transform,
    TriangleIndexFunctor,
    Uniform,
    UpdateVisitor,
    MACROUTILS,
    Vec2,
    Vec3,
    Vec4,
    Viewport,
    osgPool,
    TransformEnums,
    WebGLCaps ) {

    'use strict';

    var osg = {};

    osg.BlendColor = BlendColor;
    osg.BlendFunc = BlendFunc;
    osg.BoundingBox = BoundingBox;
    osg.BoundingSphere = BoundingSphere;
    osg.BufferArray = BufferArray;
    osg.ColorMask = ColorMask;
    osg.Camera = Camera;
    osg.ColorMask = ColorMask;
    osg.ComputeBoundsVisitor = ComputeBoundsVisitor;
    MACROUTILS.objectMix( osg, ComputeMatrixFromNodePath );
    osg.CullFace = CullFace;
    osg.CullingSet = CullingSet;
    osg.CullSettings = CullSettings;
    osg.CullStack = CullStack;
    osg.CullVisitor = CullVisitor;
    osg.Depth = Depth;
    osg.DrawArrayLengths = DrawArrayLengths;
    osg.DrawArrays = DrawArrays;
    osg.DrawElements = DrawElements;
    osg.EllipsoidModel = EllipsoidModel;
    osg.WGS_84_RADIUS_EQUATOR = EllipsoidModel.WGS_84_RADIUS_EQUATOR;
    osg.WGS_84_RADIUS_POLAR = EllipsoidModel.WGS_84_RADIUS_POLAR;
    osg.FrameBufferObject = FrameBufferObject;
    osg.FrameStamp = FrameStamp;
    osg.Geometry = Geometry;
    osg.GLObject = GLObject;
    osg.Image = Image;
    osg.ImageStream = ImageStream;
    osg.KdTree = KdTree;
    osg.KdTreeBuilder = KdTreeBuilder;
    osg.Light = Light;
    osg.LightSource = LightSource;
    osg.LineWidth = LineWidth;
    osg.Lod = Lod;
    osg.Map = Map;
    osg.Material = Material;
    MACROUTILS.objectMix( osg, Math );
    osg.Matrix = Matrix;
    osg.MatrixTransform = MatrixTransform;
    osg.Node = Node;
    osg.NodeVisitor = NodeVisitor;
    MACROUTILS.objectMix( osg, Notify );
    osg.Object = Object;
    osg.PagedLOD = PagedLOD;
    osg.Plane = Plane;
    osg.Polytope = Polytope;
    osg.PrimitiveSet = PrimitiveSet;
    osg.PrimitiveFunctor = PrimitiveFunctor;
    osg.Program = Program;
    osg.Projection = Projection;
    osg.Quat = Quat;
    osg.RenderBin = RenderBin;
    osg.RenderLeaf = RenderLeaf;
    osg.RenderStage = RenderStage;
    osg.Shader = Shader;
    MACROUTILS.objectMix( osg, Shape );
    osg.Stack = Stack;
    osg.State = State;
    osg.StateAttribute = StateAttribute;
    osg.StateGraph = StateGraph;
    osg.StateSet = StateSet;
    osg.Texture = Texture;
    osg.TextureCubeMap = TextureCubeMap;
    osg.Transform = Transform;
    osg.TriangleIndexFunctor = TriangleIndexFunctor;
    osg.Uniform = Uniform;
    osg.UpdateVisitor = UpdateVisitor;
    MACROUTILS.objectMix( osg, MACROUTILS );
    osg.Vec2 = Vec2;
    osg.Vec3 = Vec3;
    osg.Vec4 = Vec4;
    osg.Viewport = Viewport;

    osg.memoryPools = osgPool.memoryPools;

    osg.Transform.RELATIVE_RF = TransformEnums.RELATIVE_RF;
    osg.Transform.ABSOLUTE_RF = TransformEnums.ABSOLUTE_RF;

    osg.WebGLCaps = WebGLCaps;

    return osg;
} );
