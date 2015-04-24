/**
 * @author Jordi Torres
 */


define( [
    'osg/Vec3',
    'osg/Matrix',
    'osgUtil/TriangleIntersector'
], function ( Vec3, Matrix, TriangleIntersector ) {

    'use strict';

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
            Vec3.copy( end, this._end );
        },
        setStart: function ( start ) {
            Vec3.copy( start, this._start );
        },
        setEnd: function ( end ) {
            Vec3.copy( end, this._end );
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
                if ( c < 0.0 ) {
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

                if ( r1 >= 1.0 && r2 >= 1.0 ) {
                    return false;
                }
                return true;
            };
        } )(),

        intersect: function ( iv, node ) {
            var kdtree = node.getShape();
            if ( kdtree ) {
                // Use KDTREES
                return kdtree.intersectRay( this._iStart, this._iEnd, this._intersections, iv.nodePath );
            } else {
                // Use the TriangleIntersector
                var ti = new TriangleIntersector();
                ti.setNodePath( iv.nodePath );
                ti.set( this._iStart, this._iEnd );
                ti.apply( node );
                var l = ti._intersections.length;
                if ( l > 0 ) {
                    // Intersection/s exists
                    for ( var i = 0; i < l; i++ ) {
                        this._intersections.push( ti._intersections[ i ] );
                    }
                    return true;
                }
                // No intersection found
                return false;
            }
            return false;
        },
        getIntersections: function () {
            return this._intersections;
        },
        setCurrentTransformation: function ( matrix ) {
            Matrix.inverse( matrix, matrix );
            Matrix.transformVec3( matrix, this._start, this._iStart );
            Matrix.transformVec3( matrix, this._end, this._iEnd );
        }
    };

    return LineSegmentIntersector;
} );
