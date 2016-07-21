'use strict';
var Vec3 = require( 'osg/Vec3' );
var Matrix = require( 'osg/Matrix' );
var TriangleIntersector = require( 'osgUtil/TriangleIntersector' );


var LineSegmentIntersector = function () {
    this._start = Vec3.create();
    this._end = Vec3.create();
    this._iStart = Vec3.create();
    this._iEnd = Vec3.create();
    this._intersections = [];
};

LineSegmentIntersector.prototype = {
    set: function ( start, end ) {
        Vec3.copy( start, this._start );
        Vec3.copy( start, this._iStart );
        Vec3.copy( end, this._end );
        Vec3.copy( end, this._iEnd );
    },
    setStart: function ( start ) {
        Vec3.copy( start, this._start );
        Vec3.copy( start, this._iStart );
    },
    setEnd: function ( end ) {
        Vec3.copy( end, this._end );
        Vec3.copy( end, this._iEnd );
    },
    reset: function () {
        // Clear the intersections vector
        this._intersections.length = 0;
    },
    enter: function ( node ) {
        // Not working if culling disabled ??
        return !node.isCullingActive() || this.intersects( node.getBound() );
    },
    // Intersection Segment/Sphere
    intersects: ( function () {
        var sm = Vec3.create();
        var se = Vec3.create();
        return function ( bsphere ) {
            // test for _start inside the bounding sphere
            if ( !bsphere.valid() ) return false;
            Vec3.sub( this._iStart, bsphere.center(), sm );
            var c = Vec3.length2( sm ) - bsphere.radius2();
            if ( c <= 0.0 ) {
                return true;
            }
            // solve quadratic equation
            Vec3.sub( this._iEnd, this._iStart, se );
            var a = Vec3.length2( se );
            var b = Vec3.dot( sm, se ) * 2.0;
            var d = b * b - 4.0 * a * c;
            // no intersections if d<0
            if ( d < 0.0 ) {
                return false;
            }
            // compute two solutions of quadratic equation
            d = Math.sqrt( d );
            var div = 0.5 / a;
            var r1 = ( -b - d ) * div;
            var r2 = ( -b + d ) * div;

            // return false if both intersections are before the ray start
            if ( r1 <= 0.0 && r2 <= 0.0 ) {
                return false;
            }

            if ( r1 > 1.0 && r2 > 1.0 ) {
                return false;
            }
            return true;
        };
    } )(),

    intersect: ( function () {

        var ti = new TriangleIntersector();

        return function ( iv, node ) {

            var kdtree = node.getShape();
            if ( kdtree )
                return kdtree.intersectRay( this._iStart, this._iEnd, this._intersections, iv.nodePath );

            ti.reset();
            ti.setNodePath( iv.nodePath );
            ti.set( this._iStart, this._iEnd );

            // handle rig transformed vertices
            if ( node.computeTransformedVertices ) {
                var vList = node.getVertexAttributeList();
                var originVerts = vList.Vertex.getElements();

                // temporarily hook vertex buffer for the tri intersections
                // don't call setElements as it dirty some stuffs because of gl buffer
                vList.Vertex._elements = node.computeTransformedVertices();
                ti.apply( node );
                vList.Vertex._elements = originVerts;
            } else {
                ti.apply( node );
            }

            var trianglesIntersections = ti._intersections;
            var intersections = this._intersections;
            var l = trianglesIntersections.length;
            for ( var i = 0; i < l; i++ ) {
                intersections.push( trianglesIntersections[ i ] );
            }

            return l > 0;
        };
    } )(),

    getIntersections: function () {
        return this._intersections;
    },
    setCurrentTransformation: function ( matrix ) {
        Matrix.inverse( matrix, matrix );
        Matrix.transformVec3( matrix, this._start, this._iStart );
        Matrix.transformVec3( matrix, this._end, this._iEnd );
    }
};

module.exports = LineSegmentIntersector;
