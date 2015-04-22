/**
 * @author Jordi Torres
 */

define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/PrimitiveFunctor'
], function ( MACROUTILS, Vec3, PrimitiveFunctor ) {

    var PolytopeIntersection = function ( index, candidates, candidatesMasks, referencePlane, nodePath ) {
        this._index = index - 1; ///< primitive index
        this._distance = 0; ///< distance from reference plane
        this._maxDistance = -1; ///< maximum distance of intersection points from reference plane
        this._numPoints = 0;
        this._points = [];
        this._maxNumIntersections = 6;
        this._center = Vec3.create();
        for ( var i = 0, j = candidates.length; i < j; i++ ) {
            if ( candidatesMasks[ i ] === 0 ) continue;
            this._points[ this._numPoints++ ] = Vec3.copy( candidates[ i ], Vec3.create() );
            Vec3.add( this._center, candidates[ i ], this._center );
            var distance = referencePlane[ 0 ] * candidates[ i ][ 0 ] + referencePlane[ 1 ] * candidates[ i ][ 1 ] + referencePlane[ 2 ] * candidates[ i ][ 2 ] + referencePlane[ 3 ];
            if ( distance > this._maxDistance ) this._maxDistance = distance;
            if ( this._numPoints === this._maxNumIntesections ) break;
        }
        Vec3.mult( this._center, 1 / this._numPoints, this._center );
        this._distance = referencePlane[ 0 ] * this._center[ 0 ] + referencePlane[ 1 ] * this._center[ 1 ] + referencePlane[ 2 ] * this._center[ 2 ] + referencePlane[ 3 ];
        this.nodePath = nodePath;
    };

    var PlanesLine = function ( planeMask, pos, dir ) {
        this._planeMask = planeMask;
        this._pos = pos;
        this._dir = dir;
    };
    var PolytopePrimitiveIntersector = function () {
        this._intersections = [];
        this._nodePath = [];
        this._index = 0;
        this._referencePlane = [];
        this._planes = []; ///< active planes extracted from polytope
        this._lines = []; ///< all intersection lines of two polytope planes
        this._candidates = [];
        this._candidatesMasks = [];
        this._lines = [];
        this._planesMask = 0;
        this._limitOneIntersection = false;
        this._dimensionMask = undefined;
    };

    PolytopePrimitiveIntersector.prototype = {

        setNodePath: function ( np ) {
            this._nodePath = np;
        },

        set: function ( polytope, referencePlane ) {
            this._planes = polytope;
            this._referencePlane = referencePlane;
            this._planesMask = 0;
            this._lines.length = 0;
            for ( var i = 0; i < this._planes.length; i++ ) {
                this._planesMask = ( this._planesMask << 1 ) | 1;
            }
        },

        setDimensionMask: function ( mask ) {
            this._dimensionMask = mask;
        },

        apply: function ( node ) {
            if ( !node.getAttributes().Vertex ) {
                return;
            }
            var vertices = node.getAttributes().Vertex.getElements();
            var self = this;
            // The callback must be defined as a closure
            /* jshint asi: true */
            var cb = function () {
                return {
                    operatorPoint: function ( v ) {
                        self.intersectPoint( v );
                    },
                    operatorLine: function ( v1, v2 ) {
                        self.intersectLine( v1, v2 );
                    },
                    operatorTriangle: function ( v1, v2, v3 ) {
                        self.intersectTriangle( v1, v2, v3 );
                    }
                }
            };
            var pf = new PrimitiveFunctor( node, cb, vertices );
            pf.apply();
        },


        checkCandidatePoints: function ( insideMask ) {
            var selectorMask = 0x1;
            var numCands = this._candidates.length;
            for ( var i = 0, j = this._planes.length; i < j && numCands > 0; ++i, selectorMask <<= 1 ) {
                if ( insideMask & selectorMask ) continue;
                for ( var c = 0; c < this._candidates.length; ++c ) {
                    if ( this._candidatesMasks[ c ] === 0 ) continue;
                    if ( selectorMask & this._candidatesMasks[ c ] ) continue;
                    if ( this.distance( this._planes[ i ], this._candidates[ c ] ) < 0.0 ) {
                        this._candidatesMasks[ c ] = 0;
                        --numCands;
                        if ( numCands === 0 ) return 0;
                    }
                }
            }
            return numCands;
        },

        intersectPoint: ( function () {
            var hit = Vec3.create();
            return function ( v ) {
                this._index++;
                if ( ( this._dimensionMask & ( 1 << 0 ) ) === 0 ) return;
                if ( this._limitOneIntersection && this._intersections.length > 0 ) return;
                var d;

                for ( var i = 0, j = this._planes.length; i < j; ++i ) {
                    d = this.distance( this._planes[ i ], v );
                    if ( d < 0.0 ) {
                        // point is outside the polytope
                        return;
                    }
                }
                this._candidates = [];
                this._candidatesMasks = [];
                // Intersection found: Copy the value and push it
                Vec3.copy( v, hit );
                this._candidates.push( hit );
                this._candidatesMasks.push( this._planesMask );
                this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
            };
        } )(),


        intersectLine: ( function () {

            var hit = Vec3.create();
            return function ( v1, v2 ) {
                this._index++;
                if ( ( this._dimensionMask & ( 1 << 1 ) ) === 0 ) return;
                if ( this._limitOneIntersection && this._intersections.length > 0 ) return;
                var v1Inside = true;
                var v2Inside = true;
                var selectorMask = 0x1;
                var insideMask = 0x0;
                this._candidates = [];
                this._candidatesMasks = [];
                var d1, d2, d1IsNegative, d2IsNegative;
                for ( var i = 0, j = this._planes.length; i < j; ++i, selectorMask <<= 1 ) {
                    d1 = this.distance( this._planes[ i ], v1 );
                    d2 = this.distance( this._planes[ i ], v2 );
                    d1IsNegative = ( d1 < 0.0 );
                    d2IsNegative = ( d2 < 0.0 );
                    if ( d1IsNegative && d2IsNegative ) return; // line outside
                    if ( !d1IsNegative && !d2IsNegative ) {
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
                    } else if ( d2 === 0.0 ) {
                        Vec3.copy( v2, hit );
                        this._candidates.push( hit );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( d1IsNegative && !d2IsNegative ) {
                        //v1-(v2-v1)*(d1/(-d1+d2))) )
                        Vec3.sub( v2, v1, hit );
                        Vec3.mult( hit, d1 / ( -d1 + d2 ), hit );
                        Vec3.sub( v1, hit, hit );
                        this._candidates.push( hit );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( !d1IsNegative && d2IsNegative ) {
                        //(v1+(v2-v1)*(d1/(d1-d2)))
                        Vec3.sub( v2, v1, hit );
                        Vec3.mult( hit, d1 / ( d1 - d2 ), hit );
                        Vec3.add( v1, hit, hit );
                        this._candidates.push( hit );
                        this._candidatesMasks.push( selectorMask );
                    }
                }

                if ( insideMask === this._planesMask ) {
                    this._candidates.push( Vec3.copy( v1, Vec3.create() ) );
                    this._candidatesMasks.push( this._planesMask );
                    this._candidates.push( Vec3.copy( v2, Vec3.create() ) );
                    this._candidatesMasks.push( this._planesMask );
                    this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
                    return;
                }

                var numCands = this.checkCandidatePoints( insideMask );
                if ( numCands > 0 ) {
                    if ( v1Inside ) {
                        this._candidatesMasks.push( this._planesMask );
                        this._candidates.push( Vec3.copy( v1, Vec3.create() ) );
                    }
                    if ( v2Inside ) {
                        this._candidatesMasks.push( this._planesMask );
                        this._candidates.push( Vec3.copy( v2, Vec3.create() ) );
                    }
                    this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
                }
            };
        } )(),

        intersectTriangle: ( function () {

            var tmpHit = Vec3.create();
            // Only needed for special case, should we move it to a new function?
            var e1 = Vec3.create();
            var e2 = Vec3.create();
            var point = Vec3.create();
            var p = Vec3.create();
            var s = Vec3.create();
            var q = Vec3.create();
            return function ( v1, v2, v3 ) {
                this._index++;
                if ( ( this._dimensionMask & ( 1 << 2 ) ) === 0 ) return;
                if ( this._limitOneIntersection && this._intersections.length > 0 ) return;
                var selectorMask = 0x1;
                var insideMask = 0x0;
                this._candidates = [];
                this._candidatesMasks = [];
                var d1, d2, d3, d1IsNegative, d2IsNegative, d3IsNegative;
                for ( var i = 0, j = this._planes.length; i < j; ++i, selectorMask <<= 1 ) {
                    d1 = this.distance( this._planes[ i ], v1 );
                    d2 = this.distance( this._planes[ i ], v2 );
                    d3 = this.distance( this._planes[ i ], v3 );
                    d1IsNegative = ( d1 < 0.0 );
                    d2IsNegative = ( d2 < 0.0 );
                    d3IsNegative = ( d3 < 0.0 );

                    if ( d1IsNegative && d2IsNegative && d3IsNegative ) return; // Triangle outside
                    if ( !d1IsNegative && !d2IsNegative && !d3IsNegative ) {
                        // completly inside this plane
                        insideMask |= selectorMask;
                        continue;
                    }
                    // edge v1-v2 intersects
                    if ( d1 === 0.0 ) {
                        Vec3.copy( v1, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( d2 === 0.0 ) {
                        Vec3.copy( v2, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( d1IsNegative && !d2IsNegative ) {
                        //v1-(v2-v1)*(d1/(-d1+d2))) )
                        Vec3.sub( v2, v1, tmpHit );
                        Vec3.mult( tmpHit, d1 / ( -d1 + d2 ), tmpHit );
                        Vec3.sub( v1, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( !d1IsNegative && d2IsNegative ) {
                        //(v1+(v2-v1)*(d1/(d1-d2)))
                        Vec3.sub( v2, v1, tmpHit );
                        Vec3.mult( tmpHit, d1 / ( d1 - d2 ), tmpHit );
                        Vec3.add( v1, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    }
                    // edge v1-v3 intersects
                    if ( d3 === 0.0 ) {
                        Vec3.copy( v3, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( d1IsNegative && !d3IsNegative ) {
                        // v1-(v3-v1)*(d1/(-d1+d3))
                        Vec3.sub( v3, v1, tmpHit );
                        Vec3.mult( tmpHit, d1 / ( -d1 + d3 ), tmpHit );
                        Vec3.sub( v1, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( !d1IsNegative && d3IsNegative ) {
                        // v1+(v3-v1)*(d1/(d1-d3))
                        Vec3.sub( v3, v1, tmpHit );
                        Vec3.mult( tmpHit, d1 / ( d1 - d3 ), tmpHit );
                        Vec3.add( v1, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    }
                    // edge v2-v3 intersects
                    if ( d2IsNegative && !d3IsNegative ) {
                        // v2-(v3-v2)*(d2/(-d2+d3))
                        Vec3.sub( v3, v2, tmpHit );
                        Vec3.mult( tmpHit, d2 / ( -d2 + d3 ), tmpHit );
                        Vec3.sub( v2, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    } else if ( !d2IsNegative && d3IsNegative ) {
                        //v2+(v3-v2)*(d2/(d2-d3))
                        Vec3.sub( v3, v2, tmpHit );
                        Vec3.mult( tmpHit, d2 / ( d2 - d3 ), tmpHit );
                        Vec3.add( v2, tmpHit, tmpHit );
                        this._candidates.push( Vec3.copy( tmpHit, Vec3.create() ) );
                        this._candidatesMasks.push( selectorMask );
                    }
                }
                if ( insideMask === this._planesMask ) {
                    // triangle lies inside of all planes
                    this._candidates.push( Vec3.copy( v1, Vec3.create() ) );
                    this._candidatesMasks.push( this._planesMask );
                    this._candidates.push( Vec3.copy( v2, Vec3.create() ) );
                    this._candidatesMasks.push( this._planesMask );
                    this._candidates.push( Vec3.copy( v3, Vec3.create() ) );
                    this._candidatesMasks.push( this._planesMask );
                    this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
                    return;
                }
                var numCands = this.checkCandidatePoints( insideMask );
                if ( numCands > 0 ) {
                    this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
                    return;
                }
                // handle case where the polytope goes through the triangle
                // without containing any point of it
                // Probably it can be moved to other function and do the relevant closures.

                var lines = this.getPolytopeLines();
                this._candidates = [];
                // check all polytope lines against the triangle
                // use algorithm from "Real-time rendering" (second edition) pp.580
                //var e1= Vec3.create();
                //var e2= Vec3.create();

                Vec3.sub( v2, v1, e1 );
                Vec3.sub( v3, v1, e2 );
                for ( i = 0; i < lines.length; ++i ) {
                    //var point = Vec3.create();
                    //var p = Vec3.create(); 
                    Vec3.cross( lines[ i ]._dir, e2, p );
                    var a = Vec3.dot( e1, p );
                    if ( Math.abs( a ) < 1E-6 ) continue;
                    var f = 1.0 / a;
                    //var s = Vec3.create();
                    Vec3.sub( lines[ i ]._pos, v1, s );
                    var u = f * ( Vec3.dot( s, p ) );
                    if ( u < 0.0 || u > 1.0 ) continue;
                    //var q = Vec3.create();
                    Vec3.cross( s, e1, q );
                    var v = f * ( Vec3.dot( lines[ i ]._dir, q ) );
                    if ( v < 0.0 || u + v > 1.0 ) continue;
                    var t = f * ( Vec3.dot( e2, q ) );
                    Vec3.mult( lines[ i ]._dir, t, point );
                    Vec3.add( lines[ i ]._pos, point, point );
                    this._candidates.push( Vec3.copy( point, Vec3.create() ) );
                    this._candidatesMasks.push( lines[ i ]._planeMask );
                }
                numCands = this.checkCandidatePoints( insideMask );
                if ( numCands > 0 ) {
                    this._intersections.push( new PolytopeIntersection( this._index, this._candidates, this._candidatesMasks, this._referencePlane, this._nodePath.slice( 0 ) ) );
                    return;
                }
            };
        } )(),

        getPolytopeLines: ( function () {
            var lineDirection = Vec3.create();
            var searchDirection = Vec3.create();
            var normal1 = Vec3.create();
            var point1 = Vec3.create();
            var normal2 = Vec3.create();
            var linePoint = Vec3.create();
            var epsilon = 1E-6;
            return function () {
                if ( this._lines.length > 0 ) return this._lines; // Polytope lines already calculated
                var selectorMask = 0x1;
                for ( var i = 0, j = this._planes.length; i < j; i++, selectorMask <<= 1 ) {
                    Vec3.copy( this.getNormal( this._planes[ i ] ), normal1 );
                    Vec3.mult( normal1, -this._planes[ i ][ 3 ], point1 ); // canonical point on plane[ i ]
                    var subSelectorMask = ( selectorMask << 1 );
                    for ( var jt = i + 1, k = this._planes.length; jt < k; ++jt, subSelectorMask <<= 1 ) {
                        Vec3.copy( this.getNormal( this._planes[ jt ] ), normal2 );
                        if ( Math.abs( Vec3.dot( normal1, normal2 ) ) > ( 1.0 - epsilon ) ) continue;
                        Vec3.cross( normal1, normal2, lineDirection );
                        Vec3.cross( lineDirection, normal1, searchDirection );
                        //-plane2.distance(point1)/(searchDirection*normal2);
                        var searchDist = -this.distance( this._planes[ jt ], point1 ) / Vec3.dot( searchDirection, normal2 );
                        if ( isNaN( searchDist ) ) continue;
                        Vec3.mult( searchDirection, searchDist, linePoint );
                        Vec3.add( point1, lineDirection, lineDirection );
                        this._lines.push( new PlanesLine( selectorMask | subSelectorMask, Vec3.copy( linePoint, Vec3.create() ), Vec3.copy( lineDirection, Vec3.create() ) ) );
                    }
                }
                return this._lines;
            };
        } )(),

        setLimitOneIntersection: function ( limit ) {
            this._limitOneIntersection = limit;
        },

        distance: function ( plane, v ) {
            var d = plane[ 0 ] * v[ 0 ] + plane[ 1 ] * v[ 1 ] + plane[ 2 ] * v[ 2 ] + plane[ 3 ];
            return d;
        },

        getNormal: ( function () {
            var normal = Vec3.create();
            return function ( plane ) {
                normal[ 0 ] = plane[ 0 ];
                normal[ 1 ] = plane[ 1 ];
                normal[ 2 ] = plane[ 2 ];
                return normal;
            };
        } )()
    };

    return PolytopePrimitiveIntersector;
} );
