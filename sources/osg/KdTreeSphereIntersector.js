define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/KdTreeRayIntersector',
    'osgUtil/TriangleSphereIntersector'
], function ( MACROUTILS, Vec3, KdTreeRayIntersector, TriangleSphereIntersector ) {

    'use strict';

    var KdTreeSphereIntersector = function ( vertices, nodes, triangles, intersections, center, radius, nodePath ) {
        this._vertices = vertices;
        this._kdNodes = nodes;
        this._triangles = triangles;
        this._intersector = new TriangleSphereIntersector();
        this._intersector._intersections = intersections;
        this._intersector.setNodePath( nodePath );
        this._intersector.set( center, radius );
        this._center = center;
        this._radius = radius;
    };

    KdTreeSphereIntersector.prototype = MACROUTILS.objectInherit( KdTreeRayIntersector.prototype, {
        intersect: ( function () {

            var v0 = [ 0.0, 0.0, 0.0 ];
            var v1 = [ 0.0, 0.0, 0.0 ];
            var v2 = [ 0.0, 0.0, 0.0 ];

            return function ( node ) {
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
                    if ( first > 0 ) {
                        if ( this.intersectSphere( this._kdNodes[ first ]._bb ) ) {
                            this.intersect( this._kdNodes[ first ] );
                        }
                    }
                    if ( second > 0 ) {
                        if ( this.intersectSphere( this._kdNodes[ second ]._bb ) ) {
                            this.intersect( this._kdNodes[ second ] );
                        }
                    }
                }
            };
        } )(),
        intersectSphere: ( function () {
            var tmp = Vec3.create();
            return function ( bb ) {
                var r = this._radius + bb.radius();
                return Vec3.distance2( this._center, bb.center( tmp ) ) <= r * r;
            };
        } )()
    } );

    return KdTreeSphereIntersector;
} );
