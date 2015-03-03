define( [
    'osgUtil/PolytopePrimitiveIntersector',
    'osg/Matrix',
    'osg/Vec4',
    'osg/Vec3'
], function ( PolytopePrimitiveIntersector, Matrix, Vec4, Vec3 ) {

    'use strict';
    /** Concrete class for implementing polytope intersections with the scene graph.
     * To be used in conjunction with IntersectionVisitor. */
    var PolytopeIntersector = function () {
        this._intersections = [];
        this._index = 0;
        this._polytope = [];
        this._iPolytope = [];
        this._referencePlane = Vec4.create();
        this._iReferencePlane = Vec4.create();
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


    PolytopeIntersector.prototype = {

        setPolytope: function ( polytope ) {
            this._polytope = polytope;
            this._referencePlane[ 0 ] = polytope[ polytope.length - 1 ][ 0 ];
            this._referencePlane[ 1 ] = polytope[ polytope.length - 1 ][ 1 ];
            this._referencePlane[ 2 ] = polytope[ polytope.length - 1 ][ 2 ];
            this._referencePlane[ 3 ] = polytope[ polytope.length - 1 ][ 3 ];
        },

        setPolytopeFromWindowCoordinates: function ( xMin, yMin, xMax, yMax ) {
            // Note: last polytope value depends on the Coordinate frame
            // Now we are only supporting WINDOW coordinate frame, so must change this if we decide to support
            // other types of Coordinate Frame
            this.setPolytope( [
                [ 1.0, 0.0, 0.0, -xMin ],
                [ -1.0, 0.0, 0.0, xMax ],
                [ 0.0, 1.0, 0.0, -yMin ],
                [ 0.0, -1.0, 0.0, yMax ],
                [ 0.0, 0.0, 1.0, 0.0 ]
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
            return ( this.intersects( node.getBound() ) );
        },

        reachedLimit: function () {
            return this._intersectionLimit === PolytopeIntersector.LIMIT_ONE && this._intersections.length > 0;
        },

        // Intersection Polytope/Sphere
        intersects: ( function () {
            var position = Vec3.create();
            return function ( bsphere ) {
                if ( !bsphere.valid() ) return false;
                var pos = bsphere.center();
                var d;
                Vec3.copy( pos, position );
                var radius = -bsphere.radius();
                for ( var i = 0, j = this._iPolytope.length; i < j; i++ ) {
                    d = this._iPolytope[ i ][ 0 ] * position[ 0 ] + this._iPolytope[ i ][ 1 ] * position[ 1 ] + this._iPolytope[ i ][ 2 ] * position[ 2 ] + this._iPolytope[ i ][ 3 ];
                    if ( d <= radius ) {
                        return false;
                    }
                }
                return true;
            };
        } )(),

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
            var inv;
            var iplane = Vec4.create();
            for ( var i = 0, j = this._polytope.length; i < j; i++ ) {
                var plane = this._polytope[ i ];
                // PostMult
                Matrix.transformVec4PostMult( matrix, plane, iplane );
                // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
                inv = 1.0 / Math.sqrt( iplane[ 0 ] * iplane[ 0 ] + iplane[ 1 ] * iplane[ 1 ] + iplane[ 2 ] * iplane[ 2 ] );
                iplane[ 0 ] *= inv;
                iplane[ 1 ] *= inv;
                iplane[ 2 ] *= inv;
                iplane[ 3 ] *= inv;
                this._iPolytope[ i ] = Vec4.copy( iplane, Vec4.create() );
            }
            //Post Mult
            Matrix.transformVec4PostMult( matrix, this._referencePlane, this._iReferencePlane );
            // multiply the coefficients of the plane equation with a constant factor so that the equation a^2+b^2+c^2 = 1 holds.
            inv = 1.0 / Math.sqrt( this._iReferencePlane[ 0 ] * this._iReferencePlane[ 0 ] + this._iReferencePlane[ 1 ] * this._iReferencePlane[ 1 ] + this._iReferencePlane[ 2 ] * this._iReferencePlane[ 2 ] );
            this._iReferencePlane[ 0 ] *= inv;
            this._iReferencePlane[ 1 ] *= inv;
            this._iReferencePlane[ 2 ] *= inv;
            this._iReferencePlane[ 3 ] *= inv;
        }
    };

    return PolytopeIntersector;
} );
