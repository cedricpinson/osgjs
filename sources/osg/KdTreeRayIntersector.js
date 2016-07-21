'use strict';
var Vec3 = require( 'osg/Vec3' );
var TriangleIntersector = require( 'osgUtil/TriangleIntersector' );
var Notify = require( 'osg/Notify' );

var KdTreeRayIntersector = function () {

    if ( arguments && arguments.length ) {
        Notify.warn( 'using ctor as initialiser is deprecated, use init(intersections, start, end, nodePath) and/or     setKdtree: function ( vertices, nodes, triangles )' );
    }

    this._intersector = new TriangleIntersector();
    this._dInvX = Vec3.create();
    this._dInvY = Vec3.create();
    this._dInvZ = Vec3.create();

};

KdTreeRayIntersector.prototype = {
    setKdtree: function ( vertices, nodes, triangles ) {
        this._vertices = vertices;
        this._kdNodes = nodes;
        this._triangles = triangles;
    },
    init: ( function () {

        var dir = Vec3.create();

        return function ( intersections, start, end, nodePath ) {
            var d = Vec3.sub( end, start, dir );
            var len = Vec3.length( d );
            var invLen = 0.0;
            if ( len !== 0.0 )
                invLen = 1.0 / len;
            Vec3.mult( d, invLen, d );
            if ( d[ 0 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 0 ], this._dInvX );
            if ( d[ 1 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 1 ], this._dInvY );
            if ( d[ 2 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 2 ], this._dInvZ );

            this._intersector._intersections = intersections;
            this._intersector.setNodePath( nodePath );
            this._intersector.set( start, end );
        };
    } )(),
    // Classic ray intersection test
    // If it's a leaf it does ray-triangles intersection with the triangles in the cell
    // If it's not a leaf, it descend in the tree in a recursive way as long as the ray
    // intersects the boundinbox of the nodes
    intersect: ( function () {

        var v0 = Vec3.create();
        var v1 = Vec3.create();
        var v2 = Vec3.create();

        return function ( node, ls, le ) {
            var first = node._first;
            var second = node._second;
            var triangles = this._triangles;
            var vertices = this._vertices;

            if ( first < 0 ) {
                // treat as a leaf
                var istart = -first - 1;
                var iend = istart + second;
                var intersector = this._intersector;
                intersector.index = istart;

                for ( var i = istart; i < iend; ++i ) {
                    var id = i * 3;
                    var iv0 = triangles[ id ];
                    var iv1 = triangles[ id + 1 ];
                    var iv2 = triangles[ id + 2 ];

                    var j = iv0 * 3;
                    v0[ 0 ] = vertices[ j ];
                    v0[ 1 ] = vertices[ j + 1 ];
                    v0[ 2 ] = vertices[ j + 2 ];

                    j = iv1 * 3;
                    v1[ 0 ] = vertices[ j ];
                    v1[ 1 ] = vertices[ j + 1 ];
                    v1[ 2 ] = vertices[ j + 2 ];

                    j = iv2 * 3;
                    v2[ 0 ] = vertices[ j ];
                    v2[ 1 ] = vertices[ j + 1 ];
                    v2[ 2 ] = vertices[ j + 2 ];

                    intersector.intersect( v0, v1, v2, iv0, iv1, iv2 );
                }
            } else {
                var s = node._nodeRayStart;
                var e = node._nodeRayEnd;
                var kNodes = this._kdNodes;

                var kNode;
                Vec3.copy( ls, s );
                Vec3.copy( le, e );
                if ( first > 0 ) {
                    kNode = kNodes[ first ];
                    if ( this.intersectAndClip( s, e, kNode._bb ) ) {
                        this.intersect( kNode, s, e );
                    }
                }
                if ( second > 0 ) {
                    Vec3.copy( ls, s );
                    Vec3.copy( le, e );
                    kNode = kNodes[ second ];
                    if ( this.intersectAndClip( s, e, kNode._bb ) ) {
                        this.intersect( kNode, s, e );
                    }
                }
            }
        };
    } )(),
    // This method do 2 things
    // It test if the ray intersects the node
    // If so... it clip the ray so that the start and end point of the ray are
    // snapped to the bounding box of the nodes
    intersectAndClip: ( function () {

        // needed because of precision picking
        var tmp = new Float64Array( 3 );

        return function ( s, e, bb ) {
            var min = bb._min;
            var xmin = min[ 0 ];
            var ymin = min[ 1 ];
            var zmin = min[ 2 ];

            var max = bb._max;
            var xmax = max[ 0 ];
            var ymax = max[ 1 ];
            var zmax = max[ 2 ];

            var invX = this._dInvX;
            var invY = this._dInvY;
            var invZ = this._dInvZ;

            if ( s[ 0 ] <= e[ 0 ] ) {
                // trivial reject of segment wholely outside.
                if ( e[ 0 ] < xmin ) return false;
                if ( s[ 0 ] > xmax ) return false;

                if ( s[ 0 ] < xmin ) {
                    // clip s to xMin.
                    Vec3.mult( invX, xmin - s[ 0 ], tmp );
                    Vec3.add( s, tmp, s );
                }

                if ( e[ 0 ] > xmax ) {
                    // clip e to xMax.
                    Vec3.mult( invX, xmax - s[ 0 ], tmp );
                    Vec3.add( s, tmp, e );
                }
            } else {
                if ( s[ 0 ] < xmin ) return false;
                if ( e[ 0 ] > xmax ) return false;

                if ( e[ 0 ] < xmin ) {
                    // clip s to xMin.
                    Vec3.mult( invX, xmin - s[ 0 ], tmp );
                    Vec3.add( s, tmp, e );
                }

                if ( s[ 0 ] > xmax ) {
                    // clip e to xMax.
                    Vec3.mult( invX, xmax - s[ 0 ], tmp );
                    Vec3.add( s, tmp, s );
                }
            }

            // compate s and e against the yMin to yMax range of bb.
            if ( s[ 1 ] <= e[ 1 ] ) {

                // trivial reject of segment wholely outside.
                if ( e[ 1 ] < ymin ) return false;
                if ( s[ 1 ] > ymax ) return false;

                if ( s[ 1 ] < ymin ) {
                    // clip s to yMin.
                    Vec3.mult( invY, ymin - s[ 1 ], tmp );
                    Vec3.add( s, tmp, s );
                }

                if ( e[ 1 ] > ymax ) {
                    // clip e to yMax.
                    Vec3.mult( invY, ymax - s[ 1 ], tmp );
                    Vec3.add( s, tmp, e );
                }
            } else {
                if ( s[ 1 ] < ymin ) return false;
                if ( e[ 1 ] > ymax ) return false;

                if ( e[ 1 ] < ymin ) {
                    // clip s to yMin.
                    Vec3.mult( invY, ymin - s[ 1 ], tmp );
                    Vec3.add( s, tmp, e );
                }

                if ( s[ 1 ] > ymax ) {
                    // clip e to yMax.
                    Vec3.mult( invY, ymax - s[ 1 ], tmp );
                    Vec3.add( s, tmp, s );
                }
            }

            // compate s and e against the zMin to zMax range of bb.
            if ( s[ 2 ] <= e[ 2 ] ) {
                // trivial reject of segment wholely outside.
                if ( e[ 2 ] < zmin ) return false;
                if ( s[ 2 ] > zmax ) return false;

                if ( s[ 2 ] < zmin ) {
                    // clip s to zMin.
                    Vec3.mult( invZ, zmin - s[ 2 ], tmp );
                    Vec3.add( s, tmp, s );
                }

                if ( e[ 2 ] > zmax ) {
                    // clip e to zMax.
                    Vec3.mult( invZ, zmax - s[ 2 ], tmp );
                    Vec3.add( s, tmp, e );
                }
            } else {
                if ( s[ 2 ] < zmin ) return false;
                if ( e[ 2 ] > zmax ) return false;

                if ( e[ 2 ] < zmin ) {
                    // clip s to zMin.
                    Vec3.mult( invZ, zmin - s[ 2 ], tmp );
                    Vec3.add( s, tmp, e );
                }

                if ( s[ 2 ] > zmax ) {
                    // clip e to zMax.
                    Vec3.mult( invZ, zmax - s[ 2 ], tmp );
                    Vec3.add( s, tmp, s );
                }
            }
            return true;
        };
    } )()
};

module.exports = KdTreeRayIntersector;
