'use strict';
var PolytopePrimitiveIntersector = require( 'osgUtil/PolytopePrimitiveIntersector' );
var vec4 = require( 'osg/glMatrix' ).vec4;
var vec3 = require( 'osg/glMatrix' ).vec3;
var Plane = require( 'osg/Plane' );

/** Concrete class for implementing polytope intersections with the scene graph.
 * To be used in conjunction with IntersectionVisitor. */
var PolytopeIntersector = function () {
    this._intersections = [];
    this._index = 0;
    this._polytope = [];
    this._iPolytope = [];
    this._referencePlane = vec4.create();
    this._iReferencePlane = vec4.create();
    this._intersectionLimit = PolytopeIntersector.NO_LIMIT;
    this._dimensionMask = PolytopeIntersector.AllDims;
};


PolytopeIntersector.NO_LIMIT = 0;
PolytopeIntersector.LIMIT_ONE_PER_DRAWABLE = 1;
PolytopeIntersector.LIMIT_ONE = 2;


PolytopeIntersector.DimZero = ( 1 << 0 );
PolytopeIntersector.DimOne = ( 1 << 1 );
PolytopeIntersector.DimTwo = ( 1 << 2 );
PolytopeIntersector.AllDims = ( PolytopeIntersector.DimZero | PolytopeIntersector.DimOne | PolytopeIntersector.DimTwo );


var transformVec4PostMult = function ( out, p, m ) {
    var x = p[ 0 ];
    var y = p[ 1 ];
    var z = p[ 2 ];
    var w = p[ 3 ];

    out[ 0 ] = m[ 0 ] * x + m[ 1 ] * y + m[ 2 ] * z + m[ 3 ] * w;
    out[ 1 ] = m[ 4 ] * x + m[ 5 ] * y + m[ 6 ] * z + m[ 7 ] * w;
    out[ 2 ] = m[ 8 ] * x + m[ 9 ] * y + m[ 10 ] * z + m[ 11 ] * w;
    out[ 3 ] = m[ 12 ] * x + m[ 13 ] * y + m[ 14 ] * z + m[ 15 ] * w;
};

PolytopeIntersector.prototype = {

    setPolytope: function ( polytope ) {
        var nbPlanes = polytope.length;
        this._polytope.length = polytope.length = nbPlanes;
        for ( var i = 0; i < nbPlanes; ++i ) {
            var plane = polytope[ i ];
            this._polytope[ i ] = vec4.copy( this._polytope[ i ] || Plane.create(), plane );
            this._iPolytope[ i ] = vec4.copy( this._iPolytope[ i ] || Plane.create(), plane );
        }

        vec4.copy( this._referencePlane, polytope[ nbPlanes - 1 ] );
        vec4.copy( this._iReferencePlane, this._referencePlane );
    },

    setPolytopeFromWindowCoordinates: function ( xMin, yMin, xMax, yMax ) {
        // Note: last polytope value depends on the Coordinate frame
        // Now we are only supporting WINDOW coordinate frame, so must change this if we decide to support
        // other types of Coordinate Frame
        this.setPolytope( [
            vec4.fromValues( 1.0, 0.0, 0.0, -xMin ),
            vec4.fromValues( -1.0, 0.0, 0.0, xMax ),
            vec4.fromValues( 0.0, 1.0, 0.0, -yMin ),
            vec4.fromValues( 0.0, -1.0, 0.0, yMax ),
            vec4.fromValues( 0.0, 0.0, 1.0, 0.0 )
        ] );
    },

    /** Set the dimension mask.
     * As polytope-triangle and polytope-quad intersections are expensive to compute
     * it is possible to turn them off by calling setDimensionMask( DimZero | DimOne )
     */
    setDimensionMask: function ( mask ) {
        this._dimensionMask = mask;
    },

    reset: function () {
        // Clear the intersections vector
        this._intersections.length = 0;
    },

    enter: function ( node ) {
        if ( this.reachedLimit() ) return false;
        return !node.isCullingActive() || this.intersects( node.getBound() );
    },

    reachedLimit: function () {
        return this._intersectionLimit === PolytopeIntersector.LIMIT_ONE && this._intersections.length > 0;
    },

    // Intersection Polytope/Sphere
    intersects: function ( bsphere ) {
        if ( !bsphere.valid() ) return false;

        var pos = bsphere.center();
        var radius = -bsphere.radius();
        for ( var i = 0, j = this._iPolytope.length; i < j; i++ ) {
            if ( Plane.distanceToPlane( this._iPolytope, pos ) <= radius ) {
                return false;
            }
        }
        return true;
    },

    // Intersection Polytope/Geometry
    intersect: function ( iv, node ) {
        if ( this.reachedLimit() ) return false;
        var ppi = new PolytopePrimitiveIntersector();
        ppi.setNodePath( iv.nodePath );
        ppi.set( this._iPolytope, this._iReferencePlane );
        ppi.setLimitOneIntersection( this._intersectionLimit === PolytopeIntersector.LIMIT_ONE_PER_DRAWABLE || this._intersectionLimit === PolytopeIntersector.LIMIT_ONE );
        ppi.setDimensionMask( this._dimensionMask );
        ppi.apply( node );
        var l = ppi._intersections.length;
        if ( l > 0 ) {
            // Intersection/s exists
            for ( var i = 0; i < l; i++ ) {
                this._intersections.push( ppi._intersections[ i ] );
            }
            return true;
        }
        // No intersection found
        return false;
    },

    getIntersections: function () {
        return this._intersections;
    },

    setIntersectionLimit: function ( limit ) {
        this._intersectionLimit = limit;
    },

    setCurrentTransformation: function ( matrix ) {
        // Transform the polytope and the referencePlane to the current Model local coordinate frame
        for ( var i = 0, j = this._polytope.length; i < j; i++ ) {
            var iplane = this._iPolytope[ i ] = this._iPolytope[ i ] || vec4.create();
            // PostMult
            transformVec4PostMult( iplane, this._polytope[ i ], matrix );
            // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
            vec4.scale( iplane, iplane, 1.0 / vec3.len( iplane ) );
        }

        //Post Mult
        transformVec4PostMult( this._iReferencePlane, this._referencePlane, matrix );

        // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
        vec4.scale( this._iReferencePlane, this._iReferencePlane, 1.0 / vec3.len( this._iReferencePlane ) );
    }
};

module.exports = PolytopeIntersector;
