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
        // Optimized Intersection Segment/Sphere 
        // From Real-Time Rendering, by Tomas Akenine-Möller, Eric Haines, and Naty Hoffman. Pages 738-741
        intersects: ( function () {
            var l = Vec3.create();
            return function ( bsphere ) {
                if ( !bsphere.valid() ) return false;
                Vec3.sub( bsphere.center(), this._iStart, l );
                var s = Vec3.dot( l, this._iEnd );
                var l2 = Vec3.length2( l );
                if ( s < 0 && l2 > bsphere.radius2() ) return false;
                var m2 = l2 - ( s * s );
                if ( m2 > bsphere.radius2() ) return false;
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
