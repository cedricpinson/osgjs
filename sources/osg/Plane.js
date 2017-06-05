'use strict';
var MACROUTILS = require( 'osg/Utils' );
var vec4 = require( 'osg/glMatrix' ).vec4;
var vec3 = require( 'osg/glMatrix' ).vec3;


/** @class Plane Operations */
var Plane = MACROUTILS.objectInherit( vec4, {
    // Many case (frustum, convexity)
    // needs to know where from a plane it stands,
    // not just boolean intersection
    INSIDE: 1,
    INTERSECT: 2,
    OUTSIDE: 3,
    /* Transform the plane */
    transformProvidingInverse: function () {
        var iplane = Plane.create();
        return function ( p, m ) {
            //Matrix.transformVec4PostMult( matrix, plane, iplane );
            var x = p[ 0 ];
            var y = p[ 1 ];
            var z = p[ 2 ];
            var w = p[ 3 ];

            iplane[ 0 ] = m[ 0 ] * x + m[ 1 ] * y + m[ 2 ] * z + m[ 3 ] * w;
            iplane[ 1 ] = m[ 4 ] * x + m[ 5 ] * y + m[ 6 ] * z + m[ 7 ] * w;
            iplane[ 2 ] = m[ 8 ] * x + m[ 9 ] * y + m[ 10 ] * z + m[ 11 ] * w;
            iplane[ 3 ] = m[ 12 ] * x + m[ 13 ] * y + m[ 14 ] * z + m[ 15 ] * w;

            Plane.normalizeEquation( iplane );
            Plane.copy( iplane, p );
            return p;
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


    intersectsOrContainsBoundingBox: ( function () {
        var retCorner = vec3.create();
        return function ( plane, bbox ) {
            var upperBBCorner = ( plane[ 0 ] >= 0.0 ? 1 : 0 ) | ( plane[ 1 ] >= 0.0 ? 2 : 0 ) | ( plane[ 2 ] >= 0.0 ? 4 : 0 );
            var lowerBBCorner = ( ~upperBBCorner ) & 7;


            if ( this.distanceToPlane( plane, bbox.corner( lowerBBCorner, retCorner ) ) > 0.0 ) return Plane.INSIDE;
            if ( this.distanceToPlane( plane, bbox.corner( upperBBCorner, retCorner ) ) < 0.0 ) return Plane.OUTSIDE;
            return Plane.INTERSECT; // partially inside
        };
    } )(),

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

module.exports = Plane;
