define( [
    'osg/Vec3',
    'osgUtil/TriangleIntersector'
], function ( Vec3, TriangleIntersector ) {

    'use strict';

    var KdTreeRayIntersector = function ( vertices, nodes, triangles, intersections, start, end, nodePath ) {
        this._vertices = vertices;
        this._kdNodes = nodes;
        this._triangles = triangles;
        this._intersector = new TriangleIntersector();
        this._dinvX = Vec3.create();
        this._dinvY = Vec3.create();
        this._dinvZ = Vec3.create();
        this.init( intersections, start, end, nodePath );
    };

    KdTreeRayIntersector.prototype = {
        init: function ( intersections, start, end, nodePath ) {
            var d = Vec3.sub( end, start, Vec3.create() );
            var len = Vec3.length( d );
            var invLen = 0.0;
            if ( len !== 0.0 )
                invLen = 1.0 / len;
            Vec3.mult( d, invLen, d );
            if ( d[ 0 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 0 ], this._dinvX );
            if ( d[ 1 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 1 ], this._dinvY );
            if ( d[ 2 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 2 ], this._dinvZ );

            this._intersector._intersections = intersections;
            this._intersector.setNodePath( nodePath );
            this._intersector.set( start, end );
        },
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
                        var iv0 = triangles[ id ] * 3;
                        var iv1 = triangles[ id + 1 ] * 3;
                        var iv2 = triangles[ id + 2 ] * 3;

                        v0[ 0 ] = vertices[ iv0 ];
                        v0[ 1 ] = vertices[ iv0 + 1 ];
                        v0[ 2 ] = vertices[ iv0 + 2 ];

                        v1[ 0 ] = vertices[ iv1 ];
                        v1[ 1 ] = vertices[ iv1 + 1 ];
                        v1[ 2 ] = vertices[ iv1 + 2 ];

                        v2[ 0 ] = vertices[ iv2 ];
                        v2[ 1 ] = vertices[ iv2 + 1 ];
                        v2[ 2 ] = vertices[ iv2 + 2 ];

                        intersector.intersect( v0, v1, v2 );
                    }
                } else {
                    var s = node._nodeRayStart;
                    var e = node._nodeRayEnd;
                    Vec3.copy( ls, s );
                    Vec3.copy( le, e );
                    if ( first > 0 ) {
                        if ( this.intersectAndClip( s, e, this._kdNodes[ first ]._bb ) ) {
                            this.intersect( this._kdNodes[ first ], s, e );
                        }
                    }
                    if ( second > 0 ) {
                        Vec3.copy( ls, s );
                        Vec3.copy( le, e );
                        if ( this.intersectAndClip( s, e, this._kdNodes[ second ]._bb ) ) {
                            this.intersect( this._kdNodes[ second ], s, e );
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
            var tmp = Vec3.create();
            return function ( s, e, bb ) {
                var min = bb._min;
                var xmin = min[ 0 ];
                var ymin = min[ 1 ];
                var zmin = min[ 2 ];

                var max = bb._max;
                var xmax = max[ 0 ];
                var ymax = max[ 1 ];
                var zmax = max[ 2 ];

                var invX = this._dinvX;
                var invY = this._dinvY;
                var invZ = this._dinvZ;

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

    return KdTreeRayIntersector;
} );
