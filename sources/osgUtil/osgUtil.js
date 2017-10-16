import ComposerPostProcess from 'osgUtil/ComposerPostProcess';
import debug from 'osgUtil/debug';
import DelayInterpolator from 'osgUtil/DelayInterpolator';
import DisplayNormalVisitor from 'osgUtil/DisplayNormalVisitor';
import DisplayGeometryVisitor from 'osgUtil/DisplayGeometryVisitor';
import DisplayGraph from 'osgUtil/DisplayGraph';
import IntersectFunctor from 'osgUtil/IntersectFunctor';
import Intersector from 'osgUtil/Intersector';
import IntersectionVisitor from 'osgUtil/IntersectionVisitor';
import LineSegmentIntersector from 'osgUtil/LineSegmentIntersector';
import LineSegmentIntersectFunctor from 'osgUtil/LineSegmentIntersectFunctor';
import utils from 'osg/utils';
import NodeGizmo from 'osgUtil/NodeGizmo';
import GizmoGeometry from 'osgUtil/gizmoGeometry';
import PolytopeIntersector from 'osgUtil/PolytopeIntersector';
import PolytopeIntersectFunctor from 'osgUtil/PolytopeIntersectFunctor';
import SphereIntersector from 'osgUtil/SphereIntersector';
import TangentSpaceGenerator from 'osgUtil/TangentSpaceGenerator';
import WebVRCustom from 'osgUtil/WebVRCustom';
import WebVR from 'osgUtil/WebVR';
import intersectionEnums from 'osgUtil/intersectionEnums';

var osgUtil = {};

osgUtil.ComposerPostProcess = ComposerPostProcess;
utils.objectMix(osgUtil, debug);
osgUtil.DelayInterpolator = DelayInterpolator;
osgUtil.DisplayNormalVisitor = DisplayNormalVisitor;
osgUtil.DisplayGeometryVisitor = DisplayGeometryVisitor;
osgUtil.DisplayGraph = DisplayGraph;
osgUtil.IntersectFunctor = IntersectFunctor;
osgUtil.Intersector = Intersector;
osgUtil.IntersectionVisitor = IntersectionVisitor;
osgUtil.LineSegmentIntersector = LineSegmentIntersector;
osgUtil.LineSegmentIntersectFunctor = LineSegmentIntersectFunctor;
osgUtil.NodeGizmo = NodeGizmo;
osgUtil.GizmoGeometry = GizmoGeometry;
osgUtil.WebVRCustom = WebVRCustom;
osgUtil.PolytopeIntersector = PolytopeIntersector;
osgUtil.PolytopeIntersectFunctor = PolytopeIntersectFunctor;
osgUtil.SphereIntersector = SphereIntersector;
osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
osgUtil.WebVR = WebVR;

osgUtil.NO_LIMIT = intersectionEnums.NO_LIMIT;
osgUtil.LIMIT_ONE_PER_DRAWABLE = intersectionEnums.LIMIT_ONE_PER_DRAWABLE;
osgUtil.LIMIT_ONE = intersectionEnums.LIMIT_ONE;

osgUtil.POINT_PRIMITIVES = intersectionEnums.POINT_PRIMITIVES;
osgUtil.LINE_PRIMITIVES = intersectionEnums.LINE_PRIMITIVES;
osgUtil.TRIANGLE_PRIMITIVES = intersectionEnums.TRIANGLE_PRIMITIVES;
osgUtil.ALL_PRIMITIVES = intersectionEnums.ALL_PRIMITIVES;

export default osgUtil;
