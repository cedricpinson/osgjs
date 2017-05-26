'use strict';
var vec3 = require( 'osg/glMatrix' ).vec3;
var mat4 = require( 'osg/glMatrix' ).mat4;
var LineSegmentIntersectFunctor = require( 'osgUtil/LineSegmentIntersectFunctor' );
var intersectionEnums = require( 'osgUtil/intersectionEnums' );

var Settings = function () {
    this._lineSegIntersector = undefined;
    this._intersectionVisitor = undefined;
    this._geometry = undefined;
    this._vertices = [];
    this._limitOneIntersection = false;
};

var LineSegmentIntersector = function () {
    this._start = vec3.create();
    this._end = vec3.create();
    this._iStart = vec3.create();
    this._iEnd = vec3.create();
    this._intersections = [];
    this._intersectionLimit = intersectionEnums.NO_LIMIT;
};


LineSegmentIntersector.prototype = {
    set: function ( start, end ) {
        vec3.copy( this._start, start );
        vec3.copy( this._iStart, start );
        vec3.copy( this._end, end );
        vec3.copy( this._iEnd, end );
    },
    setStart: function ( start ) {
        vec3.copy( this._start, start );
        vec3.copy( this._iStart, start );
    },
    setEnd: function ( end ) {
        vec3.copy( this._end, end );
        vec3.copy( this._iEnd, end );
    },
    reset: function () {
        // Clear the intersections vector
        this._intersections = [];
    },
    enter: function ( node ) {
        // Not working if culling disabled ??
        return !node.isCullingActive() || this.intersects( node.getBound() );
    },

    setIntersectionLimit: function ( limit ) {
        this._intersectionLimit = limit;
    },

    getIntersectionLimit: function () {
        return this._intersectionLimit;
    },

    leave: function () {
        //Do nothing
    },
    // Intersection Segment/Sphere
    intersects: ( function () {
        var sm = vec3.create();
        var se = vec3.create();
        return function ( bsphere ) {
            // test for _start inside the bounding sphere
            if ( !bsphere.valid() ) return false;
            vec3.sub( sm, this._iStart, bsphere.center() );
            var c = vec3.sqrLen( sm ) - bsphere.radius2();
            if ( c <= 0.0 ) {
                return true;
            }
            // solve quadratic equation
            vec3.sub( se, this._iEnd, this._iStart );
            var a = vec3.sqrLen( se );
            var b = vec3.dot( sm, se ) * 2.0;
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
        var settings = new Settings();
        var lsf = new LineSegmentIntersectFunctor();
        return function ( iv, node ) {
            settings._lineSegIntersector = this;
            settings._intersectionVisitor = iv;

            // It's a leaf
            if ( node.getPrimitives ) {
                settings._geometry = node;
                settings._vertices = node.getVertexAttributeList();
            }
            settings._limitOneIntersection = ( this._intersectionLimit === intersectionEnums.LIMIT_ONE_PER_DRAWABLE || this._intersectionLimit === intersectionEnums.LIMIT_ONE );
            lsf.reset();
            lsf.set( this._iStart, this._iEnd, settings );
            var kdtree = node.getShape();

            if ( kdtree ) {
                return kdtree.intersect( lsf, kdtree.getNodes()[ 0 ] );
            }
            // handle rig transformed vertices
            if ( node.computeTransformedVertices ) {
                var vList = node.getVertexAttributeList();
                var originVerts = vList.Vertex.getElements();

                // temporarily hook vertex buffer for the tri intersections
                // don't call setElements as it dirties some stuffs because of gl buffer
                vList.Vertex._elements = node.computeTransformedVertices();
                lsf.apply( node );
                vList.Vertex._elements = originVerts;
            } else {
                lsf.apply( node );
            }
            return this._intersections > 0;
        };
    } )(),

    getIntersections: function () {
        return this._intersections;
    },
    setCurrentTransformation: function ( matrix ) {
        mat4.invert( matrix, matrix );
        vec3.transformMat4( this._iStart, this._start, matrix );
        vec3.transformMat4( this._iEnd, this._end, matrix );
    }
};

module.exports = LineSegmentIntersector;
