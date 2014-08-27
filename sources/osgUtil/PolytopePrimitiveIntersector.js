/**
 * @author Jordi Torres
 */

define( [
    'osg/Vec3',
    'osg/PrimitiveSet'
], function( Vec3, PrimitiveSet ) {

    var PolytopeIntersection = function( index, candidates, referencePlane, nodePath ) {
        this._index = index -1;         ///< primitive index
        this._distance = 0;    ///< distance from reference plane
        this._maxDistance = -1;    ///< maximum distance of intersection points from reference plane
        this._numPoints = 0;
        this._points = [];
        var center = Vec3.create();
        for ( var i = 0, j = candidates.length; i < j; i++ )
        {
            this._points[ this._numPoints++ ] = candidates[ i ];
            Vec3.add ( center ,candidates[ i ], center );
            var distance = referencePlane[ 0 ] * candidates[ i ][ 0 ] + referencePlane[ 1 ] * candidates[ i ][ 1 ]+ referencePlane[ 2 ] * candidates[ i ][ 2 ] + referencePlane[ 3 ];
            if (distance > this._maxDistance) this._maxDistance = distance;
            //if ( _numPoints==MaxNumIntesections) break;
            }
        Vec3.div ( center, this._numPoints, center);
        this._distance = referencePlane[ 0 ] * center[ 0 ] + referencePlane[ 1 ] * center[ 1 ]+ referencePlane[ 2 ] * center[ 2 ] + referencePlane[ 3 ];
        this.nodePath = nodePath;
    };

    var PolytopePrimitiveIntersector = function() {
        this._intersections = [];
        this._nodePath = [];
        this._index = 0;
        this._referencePlane = [];
        this._planes = [];                   ///< active planes extracted from polytope
        this._lines = [];                    ///< all intersection lines of two polytope planes
//      PlaneMask _plane_mask;               ///< mask for all planes of the polytope
        this._candidates = [];
    };

    PolytopePrimitiveIntersector.prototype = {

        setNodePath: function( np ) {
            this._nodePath = np;
        },

        set: function( polytope, referencePlane ) {
            this._planes = polytope;
            this._referencePlane = referencePlane;
        },

        apply: function( node ) {
            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var vertices = node.getAttributes().Vertex.getElements();
            // Detect which kind of primitive is it
            var nbPrimitives = node.primitives.length;
            for ( var i = 0; i < nbPrimitives; i++ )
            {
                var primitive = node.primitives[ i ];
                switch ( primitive.getMode() )
                {
                    case PrimitiveSet.POINTS:
                        var v = Vec3.create();
                        for ( var j = 0; j < vertices.length; j = j+3 )
                        {
                            v[ 0 ] = vertices [ j ];
                            v[ 1 ] = vertices [ j + 1 ];
                            v[ 2 ] = vertices [ j + 2 ];
                            this.intersectPoint( v );
                        }
                        break;
                }
            }
        },

        intersectPoint : function ( v ) {
            // Use _limitOneIntersection?
            //if (_limitOneIntersection && !intersections.empty()) return;
            this._index++;
            var d ;
            for ( var i = 0, j = this._planes.length; i < j; i++ )
            {
                d = this._planes[ i ][ 0 ] * v[ 0 ] + this._planes[ i ][ 1 ] * v[ 1 ]+ this._planes[ i ][ 2 ] * v[ 2 ] + this._planes[ i ][ 3 ];
                if ( d < 0.0 ){
                    // point is outside the polytope
                    return;
                }
            }
            // Intersection found: Copy the value and push it
            var hit = Vec3.create();
            Vec3.copy( v,hit );
            this._candidates.push( hit );
            this._intersections.push( new PolytopeIntersection ( this._index, this._candidates, this._referencePlane, this._nodePath.slice( 0 ) ));
        },

        intersectLine : function () {

        },
        intersectTriangle : function () {

        },


    };


    return PolytopePrimitiveIntersector;
} );