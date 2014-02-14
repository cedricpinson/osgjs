define( [
    'osg/BlendColor',
    'osg/BlendFunc',
    'osg/BoundingBox',
    'osg/BoundingSphere',
    'osg/BufferArray',
    'osg/Camera',
    'osg/ComputeMatrixFromNodePath',
    'osg/CullFace',
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
    'osg/Image',
    'osg/KdTree',
    'osg/KdTreeBuilder',
    'osg/Light',
    'osg/LightSource',
    'osg/LineWidth',
    'osg/Lod',
    'osg/Material',
    'osg/Math',
    'osg/Matrix',
    'osg/MatrixTransform',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Object',
    'osg/PrimitiveSet',
    'osg/Program',
    'osg/Projection',
    'osg/Quat',
    'osg/RenderBin',
    'osg/RenderStage',
    'osg/Shader',
    'osg/ShaderGenerator',
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
    'osg/TransformEnums'
], function( BlendColor, BlendFunc, BoundingBox, BoundingSphere, BufferArray, Camera, ComputeMatrixFromNodePath, CullFace, CullSettings, CullStack, CullVisitor, Depth, DrawArrayLengths, DrawArrays, DrawElements, EllipsoidModel, FrameBufferObject, FrameStamp, Geometry, Image, KdTree, KdTreeBuilder, Light, LightSource, LineWidth, Lod, Material, Math, Matrix, MatrixTransform, Node, NodeVisitor, Notify, Object, PrimitiveSet, Program, Projection, Quat, RenderBin, RenderStage, Shader, ShaderGenerator, Shape, Stack, State, StateAttribute, StateGraph, StateSet, Texture, TextureCubeMap, Transform, TriangleIndexFunctor, Uniform, UpdateVisitor, MACROUTILS, Vec2, Vec3, Vec4, Viewport, osgPool, TransformEnums ) {

    var osg = {};

    osg.BlendColor = BlendColor;
    osg.BlendFunc = BlendFunc;
    osg.BoundingBox = BoundingBox;
    osg.BoundingSphere = BoundingSphere;
    osg.BufferArray = BufferArray;
    osg.Camera = Camera;
    MACROUTILS.objectMix( osg, ComputeMatrixFromNodePath );
    osg.CullFace = CullFace;
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
    osg.Image = Image;
    osg.KdTree = KdTree;
    osg.KdTreeBuilder = KdTreeBuilder;
    osg.Light = Light;
    osg.LightSource = LightSource;
    osg.LineWidth = LineWidth;
    osg.Lod = Lod;
    osg.Material = Material;
    MACROUTILS.objectMix( osg, Math );
    osg.Matrix = Matrix;
    osg.MatrixTransform = MatrixTransform;
    osg.Node = Node;
    osg.NodeVisitor = NodeVisitor;
    MACROUTILS.objectMix( osg, Notify );
    osg.Object = Object;
    osg.PrimitiveSet = PrimitiveSet;
    osg.Program = Program;
    osg.Projection = Projection;
    osg.Quat = Quat;
    osg.RenderBin = RenderBin;
    osg.RenderStage = RenderStage;
    osg.Shader = Shader;
    osg.ShaderGenerator = ShaderGenerator;
    osg.ShaderGeneratorType = ShaderGenerator.Type;
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

    return osg;
} );
