define( [
    'osg/Vec3',
    'osg/Matrix',
    'osgUtil/TriangleSphereIntersector'
], function ( Vec3, Matrix, TriangleSphereIntersector ) {

    'use strict';

    var SphereIntersector = function () {
        this._center = Vec3.create();
        this._iCenter = Vec3.create();
        this._radius = 1.0;
        this._intersections = [];
    };

    SphereIntersector.prototype = {
        set: function ( center, radius ) {
            Vec3.copy( center, this._center );
            this._radius = radius;
        },
        setCenter: function ( center ) {
            Vec3.copy( center, this._center );
        },
        setRadius: function ( radius ) {
            this._radius = radius;
        },
        reset: function () {
            // Clear the intersections vector
            this._intersections.length = 0;
        },
        enter: function ( node ) {
            // Not working if culling disabled ??
            return !node.isCullingActive() || this.intersects( node.getBound() );
        },
        // Intersection Sphere/Sphere 
        intersects: function ( bsphere ) {
            if ( !bsphere.valid() ) return false;
            var r = this._radius + bsphere.radius();
            return Vec3.distance2( this._iCenter, bsphere.center() ) <= r * r;
        },

        intersect: function ( iv, node ) {
            var kdtree = node.getShape();
            if ( kdtree ) {
                // Use KDTREES
                return kdtree.intersectSphere( this._iCenter, this._radius, this._intersections, iv.nodePath );
            } else {
                var ti = new TriangleSphereIntersector();
                ti.setNodePath( iv.nodePath );
                ti.set( this._iCenter, this._radius );
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
            Matrix.transformVec3( matrix, this._center, this._iCenter );
        }
    };

    return SphereIntersector;
} );
