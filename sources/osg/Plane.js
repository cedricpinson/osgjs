define( [
    'osg/Matrix',
    'osg/Utils',
    'osg/Vec4',
    'osg/Vec3',
], function ( Matrix, MACROUTILS, Vec4, Vec3 ) {

    'use strict';

    /** @class Plane Operations */
    var Plane = MACROUTILS.objectInehrit( Vec4, {
        // Many case (frustum, convexity)
        // needs to know where from a plane it stands,
        // not just boolean intersection
        INSIDE: 1,
        INTERSECT: 2,
        OUTSIDE: 3,
        /* Transform the plane */
        transformProvidingInverse: function () {
            var iplane = Plane.create();
            return function ( plane, matrix ) {
                Matrix.transformVec4PostMult( matrix, plane, iplane );
                Plane.normalizeEquation( iplane );
                Plane.copy( iplane, plane );
                return plane;
            };
        },

        normalizeEquation: function ( plane ) {
            // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
            var inv = 1.0 / Math.sqrt( plane[ 0 ] * plane[ 0 ] + plane[ 1 ] * plane[ 1 ] + plane[ 2 ] * plane[ 2 ] );
            plane[ 0 ] *= inv;
            plane[ 1 ] *= inv;
            plane[ 2 ] *= inv;
            plane[ 3 ] *= inv;
        },
        /*only the normal Component*/
        getNormal: function ( plane, result ) {
            result[ 0 ] = plane[ 0 ];
            result[ 1 ] = plane[ 1 ];
            result[ 2 ] = plane[ 2 ];
            return result;
        },
        setNormal: function ( plane, normal ) {
            plane[ 0 ] = normal[ 0 ];
            plane[ 1 ] = normal[ 1 ];
            plane[ 2 ] = normal[ 2 ];
        },
        /* only the distance getter*/
        getDistance: function ( plane ) {
            return plane[ 3 ];
        },
        setDistance: function ( plane, distance ) {
            plane[ 3 ] = distance;
        },

        /* using the plane equation, compute distance to plane of a point*/
        distanceToPlane: function ( plane, position ) {
            return plane[ 0 ] * position[ 0 ] + plane[ 1 ] * position[ 1 ] + plane[ 2 ] * position[ 2 ] + plane[ 3 ];
        },


        intersectsOrContainsBoundingSphere: function ( plane, bSphere ) {
            if ( !bSphere.valid() ) return Plane.OUTSIDE;
            var position = bSphere.center();
            var radius = bSphere.radius();
            var d = this.distanceToPlane( plane, position );
            if ( d < -radius ) {
                return Plane.OUTSIDE;
            } else if ( d <= radius ) {
                return Plane.INTERSECT;
            }
            return Plane.INSIDE;
        },

        instersectsBoundingSphere: function ( plane, bSphere ) {
            return this.intersectsOrContainsBoundingSphere( plane, bSphere ) === Plane.INTERSECT;
        },

        // absPlane optional paramter is an optimisation for the
        // DOD case: on plane, many bounding boxes
        intersectsOrContainsBoundingBox: function () {
            var center = Vec3.create();
            var extent = Vec3.create();
            var absTemp = Vec3.create();
            return function ( plane, bbox, absPlane ) {
                Vec3.add( bbox.getMax(), bbox.getMin(), center );
                Vec3.mult( center, 0.5, center );

                Vec3.sub( bbox.getMax(), bbox.getMin(), center );
                Vec3.mult( extent, 0.5, extent );

                var d = Vec3.dot( center, plane );
                if ( !absPlane ) {
                    absPlane = absTemp;
                    absPlane[ 0 ] = Math.abs( plane[ 0 ] );
                    absPlane[ 1 ] = Math.abs( plane[ 1 ] );
                    absPlane[ 2 ] = Math.abs( plane[ 2 ] );
                }
                var r = Vec3.dot( extent, absPlane );
                if ( d + r > 0 ) return Plane.INTERSECT; // partially inside
                if ( d - r >= 0 ) return Plane.INSIDE; // fully inside
                return Plane.OUTSIDE;
            };
        },

        intersectsBoundingBox: function ( plane, bbox, absPlane ) {
            return this.intersectsOrContainsBoundingBox( plane, bbox, absPlane ) === Plane.INTERSECT;
        },

        intersectOrContainsVertices: function ( plane, vertices ) {
            var side = -1;
            // all points must be on one side only
            for ( var i = 0; i < vertices.length; i++ ) {
                var d = this.distanceToPlane( plane, vertices[ i ] );
                if ( d < 0.0 ) {
                    if ( side === 1 ) return Plane.INTERSECT;
                    side = 2;
                } else if ( d > 0.0 ) {
                    if ( side === 2 ) return Plane.INTERSECT;
                    side = 1;
                } else { //if ( d === 0.0 )
                    return Plane.INTERSECT;
                }
            }
            return ( side > 0 ) ? Plane.INSIDE : Plane.OUTSIDE;

        },
        intersectVertices: function ( plane, vertices ) {
            return this.intersectOrContainsVertices( plane, vertices ) === Plane.INTERSECT;
        }


    } );

    return Plane;
} );
