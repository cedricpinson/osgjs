import LineSegmentIntersector from 'tests/osgUtil/LineSegmentIntersector';
import LineSegmentIntersectFunctor from 'tests/osgUtil/LineSegmentIntersectFunctor';
import PolytopeIntersector from 'tests/osgUtil/PolytopeIntersector';
import IntersectionVisitor from 'tests/osgUtil/IntersectionVisitor';
import SphereIntersector from 'tests/osgUtil/SphereIntersector';

export default function() {
    LineSegmentIntersector();
    LineSegmentIntersectFunctor();
    PolytopeIntersector();
    IntersectionVisitor();
    SphereIntersector();
}
