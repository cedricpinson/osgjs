/**
 * @author Jordi Torres
 */

define( [
    'osg/Vec3',
    'osg/PrimitiveFunctor'
], function( Vec3, PrimitiveFunctor ) {

    var PolytopeIntersection = function( index, candidates, candidatesMasks, referencePlane, nodePath ) {
        this._index = index -1;         ///< primitive index
        this._distance = 0;    ///< distance from reference plane
        this._maxDistance = -1;    ///< maximum distance of intersection points from reference plane
        this._numPoints = 0;
        this._points = [];
        this._maxNumIntersections = 6;
        this._center = Vec3.create();
        for ( var i = 0, j = candidates.length; i < j; i++ )
        {
            if ( candidatesMasks[ i ] === 0 ) continue;
            this._points[ this._numPoints++ ] = candidates[ i ];
            Vec3.add ( this._center ,candidates[ i ], this._center );
            var distance = referencePlane[ 0 ] * candidates[ i ][ 0 ] + referencePlane[ 1 ] * candidates[ i ][ 1 ] + referencePlane[ 2 ] * candidates[ i ][ 2 ] + referencePlane[ 3 ];
            if ( distance > this._maxDistance ) this._maxDistance = distance;
            if ( this._numPoints === this._maxNumIntesections) break;
            }
        Vec3.div ( this._center, this._numPoints, this._center);
        this._distance = referencePlane[ 0 ] * this._center[ 0 ] + referencePlane[ 1 ] * this._center[ 1 ] + referencePlane[ 2 ] * this._center[ 2 ] + referencePlane[ 3 ];
        this.nodePath = nodePath;
    };

    var PolytopePrimitiveIntersector = function() {
        this._intersections = [];
        this._nodePath = [];
        this._index = 0;
        this._referencePlane = [];
        this._planes = [];                   ///< active planes extracted from polytope
        this._lines = [];                    ///< all intersection lines of two polytope planes
        this._candidates = [];
        this._candidatesMasks = [];
        this._planesMask = 0;
    };

    PolytopePrimitiveIntersector.prototype = {

        setNodePath: function( np ) {
            this._nodePath = np;
        },

        set: function( polytope, referencePlane ) {
            this._planes = polytope;
            this._referencePlane = referencePlane;
            this._planesMask = 0;
            for( var i = 0; i < this._planes.length; i++ )
            {
                this._planesMask = ( this._planesMask << 1 ) | 1;
                //_plane_mask <<= 1;
                //_plane_mask |= 0x1;
            }
        },

        apply: function( node ) {
            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var vertices = node.getAttributes().Vertex.getElements();
            var self = this;
            // The callback must be defined as a closure
            var cb = function(  ) {
                    return {
                        point : function ( v ) {
                            self.intersectPoint( v );
                        },
                        line : function ( v1, v2 ) {
                            self.intersectLine( v1, v2);
                        },
                        triangle : function ( v1, v2, v3 ) {
                            self.intersectTriangle( v1, v2, v3 );
                        }
                    }
            };
            var pf = new PrimitiveFunctor( node, cb , vertices );
            pf.apply();
        },

        checkCandidatePoints : function ( insideMask ) {
            var selectorMask = 0x1;
            var numCands = this._candidates.length;
            for ( var i = 0, j = this._planes.length; i < j && numCands > 0; i++, selectorMask <<= 1 )
            {
                if ( insideMask & selectorMask ) continue;
                for ( var c = 0; c < this._candidates.length; c++)
                {
                    if ( this._candidatesMasks[ c ] === 0 ) continue;
                    if ( selectorMask & this._candidatesMasks[ c ] ) continue;
                    if ( this.distance( this._planes[ i ], this._candidates[ c ] ) < 0.0 )
                    {
                        this._candidatesMasks[ c ] = 0;
                        --numCands;
                        if ( numCands === 0 ) return 0;
                    }
                }
            }
            return numCands;
        },

        intersectPoint : function ( v ) {
            // Use _limitOneIntersection?
            //if (_limitOneIntersection && !intersections.empty()) return;
            this._index++;
            var d ;
            for ( var i = 0, j = this._planes.length; i < j; i++ )
            {
                d = this.distance( this._planes[ i ], v );
                //d = this._planes[ i ][ 0 ] * v[ 0 ] + this._planes[ i ][ 1 ] * v[ 1 ]+ this._planes[ i ][ 2 ] * v[ 2 ] + this._planes[ i ][ 3 ];
                if ( d < 0.0 ){
                    // point is outside the polytope
                    return;
                }
            }
            // Intersection found: Copy the value and push it
            var hit = Vec3.create();
            Vec3.copy( v,hit );
            this._candidates.push( hit );
            this._candidatesMasks.push( this._planesMask );
            this._intersections.push( new PolytopeIntersection ( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ));
        },

        intersectLine : function ( v1, v2 ) {

            this._index++;
            var v1Inside = true;
            var v2Inside = true;
            var selectorMask = 0x1;
            var insideMask = 0x0;
            this._candidates = [];
            this._candidatesMasks = [];
            var d1, d2, d1IsNegative, d2IsNegative;
            for ( var i = 0, j = this._planes.length; i < j; i++, selectorMask <<= 1 )
            {
                d1 = this.distance( this._planes[ i ], v1 );
                d2 = this.distance( this._planes[ i ], v2 );
                d1IsNegative = (d1 <= 0.0);
                d2IsNegative = (d2 <= 0.0);
                var hit = Vec3.create();
                if ( d1IsNegative && d2IsNegative ) return; // line outside
                if ( !d1IsNegative && !d2IsNegative )
                {
                    // completly inside this plane
                    insideMask |= selectorMask;
                    continue;
                }
                if ( d1IsNegative ) v1Inside = false;
                if ( d2IsNegative ) v2Inside = false;
                if ( d1 === 0.0 ) {
                    Vec3.copy( v1, hit );
                    this._candidates.push( hit );
                    this._candidatesMasks.push( selectorMask );
                }
                else if ( d2 === 0.0 )
                {
                    Vec3.copy( v2, hit );
                    this._candidates.push( hit );
                    this._candidatesMasks.push ( selectorMask );
                }
                else if ( d1IsNegative && !d2IsNegative )
                {
                    //v1-(v2-v1)*(d1/(-d1+d2))) )
                    Vec3.sub( v2, v1, hit );
                    Vec3.mult( hit, d1 / ( -d1 + d2 ) , hit );
                    Vec3.sub( v1, hit, hit );
                    this._candidates.push( hit );
                    this._candidatesMasks.push( selectorMask );
                }
                else if ( !d1IsNegative && d2IsNegative )
                {
                    //(v1+(v2-v1)*(d1/(d1-d2)))
                    Vec3.sub( v2, v1, hit );
                    Vec3.mult( hit, d1 / ( d1 - d2 ) , hit );
                    Vec3.add( v1, hit, hit );
                    this._candidates.push( hit );
                    this._candidatesMasks.push( selectorMask );
                }
            }

            if ( insideMask === this._planesMask )
            {
                this._candidates.push( v1 );
                this._candidatesMasks.push( this._planesMask );
                this._candidates.push( v2 );
                this._candidatesMasks.push( this._planesMask );
                this._intersections.push( new PolytopeIntersection ( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ));
                return;
            }

            var numCands = this.checkCandidatePoints( insideMask );
            if ( numCands > 0 )
            {
                if ( v1Inside )
                {
                    this._candidatesMasks.push( this._planesMask );
                    this._candidates.push( Vec3.copy( v1, Vec3.create() ) );
                }
                if ( v2Inside )
                {
                    this._candidatesMasks.push( this._planesMask );
                    this._candidates.push( Vec3.copy( v2, Vec3.create() ) );
                }
                this._intersections.push( new PolytopeIntersection ( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ));
            }

        },
        intersectTriangle : function () {

        },
        distance: function ( plane, v )
        {
            var d = plane[ 0 ] * v[ 0 ] + plane[ 1 ] * v[ 1 ] + plane[ 2 ] * v[ 2 ] + plane[ 3 ];
            return d;
        }

    };


    return PolytopePrimitiveIntersector;
} );