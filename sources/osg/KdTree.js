define( [
    'osg/Utils',
    'osg/BoundingBox',
    'osg/Vec3',
    'osg/TriangleIndexFunctor',
    'osgUtil/TriangleIntersect',
    'osg/PrimitiveSet'
], function( MACROUTILS, BoundingBox, Vec3, TriangleIndexFunctor, TriangleIntersect, PrimitiveSet ) {

    // **** GENERAL INFO ON KDTREE ****
    // A KdTree is a Spatial Partitionning Tree (http://en.wikipedia.org/wiki/Space_partitioning)
    // The type of tree is sort of defined by the splitting axis method:
    // - Per Axis split (octree/ kdtree)
    // - Arbritrary direction split (bsp)

    // The algorithm used for splitting, the name for finding best split is 'Surface Area Heuristic (SAH)'
    // Octree divide the space in 8 subspace (one box -> 8 sub boxes)
    // whereas kdtree does it by splitting population number in two equal group

    // Kd Tree http://en.wikipedia.org/wiki/K-d_tree
    // a given set of points is sorted along one Axis (e.g. X).
    // The sorted list is split at the median.
    // The result are two sets, one for each half-space (left and right).

    // Then, for the current node, the splitting-plane position (or the median-point) and depth is saved.
    // Finally, if the point-set has more than n point and the tree depth is below m 
    // (with n,m chosen by the user, as build options), two child-nodes (L/R one for each point-set) 
    // are created which themselfs repeat the pocedure.

    // The split-axis gets alternated at each depth, the split order is computed by checking the main
    // bounding box the length of its axis
    // **** GENERAL INFO ON KDTREE ****

    // The KdTree implemented here is flattened, ie, a node and its children all lie in the same array
    // The most important thing is the understanding of the variables first and second for each node
    // Their semantic depend if the node is a leaf or not
    // if it's a leaf :
    //   first and second defines a range in the triangles array (triangles in the cell)
    // if it's not a leaf :
    // - first and second respectively represents the left and right sub children
    // We know that a node is a leaf if first is negative, in that case the range will be defined by
    // [ -first - 1, -first-1 + second ]
    var KdNode = function( first, second ) {
        this._bb = new BoundingBox();
        this._first = first;
        this._second = second;
        // These variables represent the local clipped ray (for intersection test)
        // They are mostly temporary because they are recomputed for each intersection test
        this._nodeRayStart = [ 0.0, 0.0, 0.0 ];
        this._nodeRayEnd = [ 0.0, 0.0, 0.0 ];
    };

    var IntersectKdTree = function( vertices, nodes, triangles, intersections, start, end, nodePath ) {
        this._vertices = vertices;
        this._kdNodes = nodes;
        this._triangles = triangles;
        this._intersector = new TriangleIntersect();
        this._dinvX = [ 0.0, 0.0, 0.0 ];
        this._dinvY = [ 0.0, 0.0, 0.0 ];
        this._dinvZ = [ 0.0, 0.0, 0.0 ];
        this.init( intersections, start, end, nodePath );
    };

    IntersectKdTree.prototype = {
        init: function( intersections, start, end, nodePath ) {
            var d = Vec3.sub( end, start, [ 0.0, 0.0, 0.0 ] );
            var len = Vec3.length( d );
            var invLen = 0.0;
            if ( len !== 0.0 )
                invLen = 1.0 / len;
            Vec3.mult( d, invLen, d );
            if ( d[ 0 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 0 ], this._dinvX );
            if ( d[ 1 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 1 ], this._dinvY );
            if ( d[ 2 ] !== 0.0 ) Vec3.mult( d, 1.0 / d[ 2 ], this._dinvZ );

            this._intersector.hits = intersections;
            this._intersector.setNodePath( nodePath );
            this._intersector.set( start, end );
        },
        // Classic ray intersection test
        // If it's a leaf it does ray-triangles intersection with the triangles in the cell
        // If it's not a leaf, it descend in the tree in a recursive way as long as the ray
        // intersects the boundinbox of the nodes
        intersect: ( function() {

            var v0 = [ 0.0, 0.0, 0.0 ];
            var v1 = [ 0.0, 0.0, 0.0 ];
            var v2 = [ 0.0, 0.0, 0.0 ];

            return function( node, ls, le ) {
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
        intersectAndClip: ( function() {
            var tmp = [ 0.0, 0.0, 0.0 ];
            return function( s, e, bb ) {
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

    var BuildKdTree = function( kdTree ) {
        this._kdTree = kdTree;
        this._bb = new BoundingBox();
        this._primitiveIndices = null; // Uint32Array
        this._centers = null; // Float32Array
        this._axisOrder = [ 0, 0, 0 ];
        this._stackLength = 0;
    };

    BuildKdTree.prototype = {
        build: function( options, geom ) {
            var targetTris = options._targetNumTrianglesPerLeaf;
            var vertexAttrib = geom.getVertexAttributeList().Vertex;
            if ( !vertexAttrib )
                return false;
            var vertices = vertexAttrib.getElements();
            if ( !vertices )
                return false;
            var nbVertices = vertices.length / 3;
            if ( nbVertices < targetTris )
                return false;

            this._bb.copy( geom.getBoundingBox() );
            this._kdTree.setVertices( vertices );

            this.computeDivisions( options );
            options._numVerticesProcessed += nbVertices;

            this.computeTriangles( geom );

            var node = new KdNode( -1, this._primitiveIndices.length );
            node._bb.copy( this._bb );
            var nodeNum = this._kdTree.addNode( node );

            var bb = new BoundingBox();
            bb.copy( this._bb );
            nodeNum = this.divide( options, bb, nodeNum, 0 );

            // Here we re-order the triangle list so that we can have a flat tree
            // _primitiveIndices is the ordered array of the triangle indices
            var triangles = this._kdTree.getTriangles();
            var primitives = this._primitiveIndices;
            var nbPrimitives = primitives.length;
            var triangleOrdered = new MACROUTILS.Uint32Array( triangles.length );
            for ( var i = 0, j = 0; i < nbPrimitives; ++i, j += 3 ) {
                var id = primitives[ i ] * 3;
                triangleOrdered[ j ] = triangles[ id ];
                triangleOrdered[ j + 1 ] = triangles[ id + 1 ];
                triangleOrdered[ j + 2 ] = triangles[ id + 2 ];
            }
            this._kdTree.setTriangles( triangleOrdered );

            return this._kdTree.getNodes().length > 0;
        },
        // The function first gather all the triangles of the geometry
        // It then computes the centroid for each triangle and initialize
        // of triangles indices that will refer to the main triangles array
        computeTriangles: function( geom ) {
            var kdTree = this._kdTree;

            var totalLenArray = 0;
            var geomPrimitives = geom.primitives;
            var nbPrimitives = geomPrimitives.length;
            var i = 0;
            for ( i = 0; i < nbPrimitives; i++ ) {
                var prim = geomPrimitives[ i ];
                var mode = prim.getMode();
                if ( mode === PrimitiveSet.TRIANGLES )
                    totalLenArray += prim.getCount();
                else
                    totalLenArray += ( prim.getCount() - 2 ) * 3;
            }
            var indices = new MACROUTILS.Uint32Array( totalLenArray );
            var next = 0;
            var cb = function( i1, i2, i3 ) {
                if ( i1 === i2 || i1 === i3 || i2 === i3 )
                    return;
                indices[ next ] = i1;
                indices[ next + 1 ] = i2;
                indices[ next + 2 ] = i3;
                next += 3;
            };

            var tif = new TriangleIndexFunctor( geom, cb );
            tif.apply();
            indices = indices.subarray( 0, next );

            var nbTriangles = indices.length;
            kdTree.setTriangles( indices );

            var vertices = kdTree.getVertices();

            this._centers = new MACROUTILS.Float32Array( nbTriangles );
            var centers = this._centers;
            this._primitiveIndices = new MACROUTILS.Uint32Array( nbTriangles / 3 );
            var primitives = this._primitiveIndices;

            var j = 0;
            for ( i = 0, j = 0; i < nbTriangles; i += 3, ++j ) {
                var iv0 = indices[ i ];
                var iv1 = indices[ i + 1 ];
                var iv2 = indices[ i + 2 ];

                // discard degenerate points
                if ( iv0 === iv1 || iv1 === iv2 || iv0 === iv2 )
                    return;

                iv0 *= 3;
                iv1 *= 3;
                iv2 *= 3;

                var v0x = vertices[ iv0 ];
                var v0y = vertices[ iv0 + 1 ];
                var v0z = vertices[ iv0 + 2 ];

                var v1x = vertices[ iv1 ];
                var v1y = vertices[ iv1 + 1 ];
                var v1z = vertices[ iv1 + 2 ];

                var v2x = vertices[ iv2 ];
                var v2y = vertices[ iv2 + 1 ];
                var v2z = vertices[ iv2 + 2 ];

                var minx = Math.min( v0x, Math.min( v1x, v2x ) );
                var miny = Math.min( v0y, Math.min( v1y, v2y ) );
                var minz = Math.min( v0z, Math.min( v1z, v2z ) );

                var maxx = Math.max( v0x, Math.max( v1x, v2x ) );
                var maxy = Math.max( v0y, Math.max( v1y, v2y ) );
                var maxz = Math.max( v0z, Math.max( v1z, v2z ) );
                centers[ i ] = ( minx + maxx ) * 0.5;
                centers[ i + 1 ] = ( miny + maxy ) * 0.5;
                centers[ i + 2 ] = ( minz + maxz ) * 0.5;
                primitives[ j ] = j;
            }
        },
        computeDivisions: function( options ) {
            this._stackLength = options._maxNumLevels;
            var max = this._bb._max;
            var min = this._bb._min;
            var dx = max[ 0 ] - min[ 0 ];
            var dy = max[ 1 ] - min[ 1 ];
            var dz = max[ 2 ] - min[ 2 ];
            var axisOrder = this._axisOrder;

            // We set the cutting order (longest edge aabb first)
            axisOrder[ 0 ] = ( dx >= dy && dx >= dz ) ? 0 : ( dy >= dz ) ? 1 : 2;
            axisOrder[ 2 ] = ( dx < dy && dx < dz ) ? 0 : ( dy < dz ) ? 1 : 2;
            var sum = axisOrder[ 0 ] + axisOrder[ 2 ];
            axisOrder[ 1 ] = sum === 3 ? 0 : sum === 2 ? 1 : 2;
        },
        // The core function of the kdtree building
        // It checks if the node need to be subdivide or not
        // If it decides it's a leaf, it computes the final bounding box of the node
        // and it ends here
        // If it's a node, then it puts the splitting axis position on the median population
        // On the same time it reorder the triangle index array
        divide: function( options, bb, nodeIndex, level ) {
            var kdTree = this._kdTree;
            var primitives = this._primitiveIndices;
            var nodes = kdTree.getNodes();
            var node = nodes[ nodeIndex ];

            var first = node._first;
            var second = node._second;

            var needToDivide = level < this._stackLength && first < 0 && second > options._targetNumTrianglesPerLeaf;
            var istart = -first - 1;
            var iend = istart + second - 1;

            if ( !needToDivide ) {
                if ( first < 0 ) {
                    // leaf is done, now compute bound on it.
                    this.computeNodeBox( node, istart, iend );
                }
                return nodeIndex;
            }

            if ( first >= 0 )
                return nodeIndex;
            // leaf node as first < 0, so look at dividing it.

            var axis = this._axisOrder[ level % 3 ];
            var originalMin = bb._min[ axis ];
            var originalMax = bb._max[ axis ];

            var mid = ( originalMin + originalMax ) * 0.5;

            var originalLeftChildIndex = 0;
            var originalRightChildIndex = 0;
            var insitueDivision = false;

            var left = istart;
            var right = iend;

            var centers = this._centers;
            while ( left < right ) {
                while ( left < right && ( centers[ primitives[ left ] * 3 + axis ] <= mid ) ) {
                    ++left;
                }

                while ( left < right && ( centers[ primitives[ right ] * 3 + axis ] > mid ) ) {
                    --right;
                }

                if ( left < right ) {
                    var tmp = primitives[ left ];
                    primitives[ left ] = primitives[ right ];
                    primitives[ right ] = tmp;
                    ++left;
                    --right;
                }
            }

            if ( left === right ) {
                if ( centers[ primitives[ left ] * 3 + axis ] <= mid )++left;
                else --right;
            }

            if ( ( right - istart ) <= -1 ) {
                originalLeftChildIndex = 0;
                originalRightChildIndex = nodeIndex;
                insitueDivision = true;
            } else if ( ( iend - left ) <= -1 ) {
                originalLeftChildIndex = nodeIndex;
                originalRightChildIndex = 0;
                insitueDivision = true;
            } else {
                originalLeftChildIndex = kdTree.addNode( new KdNode( -istart - 1, ( right - istart ) + 1 ) );
                originalRightChildIndex = kdTree.addNode( new KdNode( -left - 1, ( iend - left ) + 1 ) );
            }


            var restore = bb._max[ axis ];
            bb._max[ axis ] = mid;

            var leftChildIndex = originalLeftChildIndex !== 0 ? this.divide( options, bb, originalLeftChildIndex, level + 1 ) : 0;

            bb._max[ axis ] = restore;

            restore = bb._min[ axis ];
            bb._min[ axis ] = mid;

            var rightChildIndex = originalRightChildIndex !== 0 ? this.divide( options, bb, originalRightChildIndex, level + 1 ) : 0;

            bb._min[ axis ] = restore;

            if ( !insitueDivision ) {
                node._first = leftChildIndex;
                node._second = rightChildIndex;

                insitueDivision = true;

                var bnode = node._bb;
                bnode.init();
                if ( leftChildIndex !== 0 ) bnode.expandByBoundingBox( nodes[ leftChildIndex ]._bb );
                if ( rightChildIndex !== 0 ) bnode.expandByBoundingBox( nodes[ rightChildIndex ]._bb );
            }
            return nodeIndex;
        },
        // It computes the bounding box of the node so that the box contains all the triangles
        // of the cell
        computeNodeBox: function( node, istart, iend ) {
            var minx = Infinity,
                miny = Infinity,
                minz = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                maxz = -Infinity;
            var triangles = this._kdTree.getTriangles();
            var vertices = this._kdTree.getVertices();
            var primitives = this._primitiveIndices;
            for ( var i = istart; i <= iend; ++i ) {
                var id = primitives[ i ] * 3;
                var iv0 = triangles[ id ] * 3;
                var iv1 = triangles[ id + 1 ] * 3;
                var iv2 = triangles[ id + 2 ] * 3;

                var v0x = vertices[ iv0 ];
                var v0y = vertices[ iv0 + 1 ];
                var v0z = vertices[ iv0 + 2 ];

                var v1x = vertices[ iv1 ];
                var v1y = vertices[ iv1 + 1 ];
                var v1z = vertices[ iv1 + 2 ];

                var v2x = vertices[ iv2 ];
                var v2y = vertices[ iv2 + 1 ];
                var v2z = vertices[ iv2 + 2 ];

                minx = Math.min( minx, Math.min( v0x, Math.min( v1x, v2x ) ) );
                miny = Math.min( miny, Math.min( v0y, Math.min( v1y, v2y ) ) );
                minz = Math.min( minz, Math.min( v0z, Math.min( v1z, v2z ) ) );

                maxx = Math.max( maxx, Math.max( v0x, Math.max( v1x, v2x ) ) );
                maxy = Math.max( maxy, Math.max( v0y, Math.max( v1y, v2y ) ) );
                maxz = Math.max( maxz, Math.max( v0z, Math.max( v1z, v2z ) ) );
            }
            var epsilon = 1E-6;
            var bnode = node._bb;
            var bmin = bnode._min;
            var bmax = bnode._max;
            bmin[ 0 ] = minx - epsilon;
            bmin[ 1 ] = miny - epsilon;
            bmin[ 2 ] = minz - epsilon;
            bmax[ 0 ] = maxx + epsilon;
            bmax[ 1 ] = maxy + epsilon;
            bmax[ 2 ] = maxz + epsilon;
        }
    };

    var KdTree = function() {
        this._vertices = null;
        this._kdNodes = [];
        this._triangles = null; // Float32Array
    };

    KdTree.prototype = MACROUTILS.objectLibraryClass( {
        getVertices: function() {
            return this._vertices;
        },
        setVertices: function( vertices ) {
            this._vertices = vertices;
        },
        getNodes: function() {
            return this._kdNodes;
        },
        getTriangles: function() {
            return this._triangles;
        },
        setTriangles: function( triangles ) {
            this._triangles = triangles;
        },
        addNode: function( node ) {
            this._kdNodes.push( node );
            return this._kdNodes.length - 1;
        },
        build: function( options, geom ) {
            var buildTree = new BuildKdTree( this );
            return buildTree.build( options, geom );
        },
        intersect: function( start, end, intersections, nodePath ) {
            if ( this._kdNodes.length === 0 ) {
                return false;
            }

            var numIntersectionsBefore = intersections.length;
            var intersector = new IntersectKdTree( this._vertices, this._kdNodes, this._triangles, intersections, start, end, nodePath );
            intersector.intersect( this.getNodes()[ 0 ], start, end );

            return numIntersectionsBefore !== intersections.length;
        }
    }, 'osg', 'KdTree' );

    return KdTree;
} );