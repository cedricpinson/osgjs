/**
 * @author Jordi Torres
 */

define( [
    'osg/Vec3',
    'osg/PrimitiveSet'
], function( Vec3, PrimitiveSet ) {

    /**
     * PrimitiveFunctor emulates the TemplatePrimitiveFunctor class in OSG and can
     * be used to get access to the vertices that compose the things drawn by osgjs. 
     * Feed it with a callback that will be called for geometry. 
     * The callback must be a closure and have the next structure:
     *
     * var myCallback = function(  ) {
     *     return {
     *          point : function ( v ) { }, // Do your point operations here
     *          line : function ( v1, v2 ){ }, // Do you line operations here
     *          triangle : function ( v1, v2, v3 ) { } // Do your triangle operations here
     *      }
     * };
     *
     *  @class PrimitiveFunctor
     */

    var PrimitiveFunctor = function( geom, cb, vertices ) {
        this._geom = geom;
        this._cb = cb;
        this._vertices = vertices;
    };

    PrimitiveFunctor.prototype = {
        applyDrawElementsPoints: function( count, indexes ) {
            var cb = this._cb( );
            var v = Vec3.create();
            for ( var i = 0; i < count; i ++ ) {
                var j = i*3;
                v[ 0 ] = this._vertices[ indexes[ j ] ];
                v[ 1 ] = this._vertices[ indexes[ j ] +1 ];
                v[ 2 ] = this._vertices[ indexes[ j ] +2 ];
                cb.point( v );
            }
        },
        applyDrawElementsTriangles: function( count, indexes ) {
            var cb = this._cb;
            for ( var i = 0; i < count; i += 3 ) {
                cb( indexes[ i ], indexes[ i + 1 ], indexes[ i + 2 ] );
            }
        },

        applyDrawElementsTriangleStrip: function( count, indexes ) {
            var cb = this._cb;
            for ( var i = 2, j = 0; i < count; ++i, ++j ) {
                if ( i % 2 ) cb( indexes[ j ], indexes[ j + 2 ], indexes[ j + 1 ] );
                else cb( indexes[ j ], indexes[ j + 1 ], indexes[ j + 2 ] );
            }
        },

        applyDrawElementsTriangleFan: function( count, indexes ) {
            var cb = this._cb;
            var first = indexes[ 0 ];
            for ( var i = 2, j = 1; i < count; ++i, ++j ) {
                cb( first, indexes[ j ], indexes[ j + 1 ] );
            }
        },

        applyDrawArraysPoints: ( function() {
            var v = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb( );
                for ( var i = first; i < first + count; ++i ) {
                    var j = i*3;
                    v[ 0 ] = this._vertices[ j ];
                    v[ 1 ] = this._vertices[ j +1 ];
                    v[ 2 ] = this._vertices[ j +2 ];
                    cb.point( v );
                }
            };
        })(),

        applyDrawArraysLines: ( function() {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count - 1; i += 2 ) {
                    var j = i * 3 ;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j +1 ];
                    v1[ 2 ] = this._vertices[ j +2 ];
                    j = ( i + 1 ) * 3 ;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j +1 ];
                    v2[ 2 ] = this._vertices[ j +2 ];
                    cb.line( v1, v2 );
                }
            };
        })(),

        applyDrawArraysLineStrip: ( function() {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count - 1; ++i ) {
                    var j = i * 3 ;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j +1 ];
                    v1[ 2 ] = this._vertices[ j +2 ];
                    j = ( i + 1 ) * 3 ;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j +1 ];
                    v2[ 2 ] = this._vertices[ j +2 ];
                    cb.line( v1, v2 );
                }
            };
        })(),

        applyDrawArraysTriangles: ( function() {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count ; i +=3 ) {
                    var j = i * 3 ;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j +1 ];
                    v1[ 2 ] = this._vertices[ j +2 ];
                    j = ( i + 1 ) * 3 ;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j +1 ];
                    v2[ 2 ] = this._vertices[ j +2 ];
                    j = ( i +2 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j +1 ];
                    v3[ 2 ] = this._vertices[ j +2 ];
                    cb.triangles( v1, v2, v3 );
                }
            };
        })(),

        applyDrawArraysTriangleStrip: ( function() {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = 2, pos = first; i < count; ++i, ++pos )
                {
                    var j = pos * 3 ;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j +1 ];
                    v1[ 2 ] = this._vertices[ j +2 ];
                    j = ( pos + 1 ) * 3 ;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j +1 ];
                    v2[ 2 ] = this._vertices[ j +2 ];
                    j = ( pos + 2 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j +1 ];
                    v3[ 2 ] = this._vertices[ j +2 ];
                    if ( i % 2 )
                    {
                        cb.triangles( v1, v3, v2);
                    } else {
                        cb.triangles( v1, v2, v3);
                    }
                }
            };
        })(),

        applyDrawArraysTriangleFan: ( function() {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = 2, pos = first + 1; i < count; ++i, ++pos )
                {
                    v1[ 0 ] = this._vertices[ first ];
                    v1[ 1 ] = this._vertices[ first +1 ];
                    v1[ 2 ] = this._vertices[ first +2 ];
                    var j = pos * 3 ;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j +1 ];
                    v2[ 2 ] = this._vertices[ j +2 ];
                    j = ( pos + 1 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j +1 ];
                    v3[ 2 ] = this._vertices[ j +2 ];
                    cb.triangles( v1, v2, v3 );
                }
            };
        })(),

        apply: function() {
            var geom = this._geom;
            var primitives = geom.primitives;
            if ( !primitives )
                return;
            var nbPrimitives = primitives.length;
            for ( var i = 0; i < nbPrimitives; i++ ) {
                var primitive = primitives[ i ];
                if ( primitive.getIndices !== undefined ) {
                    var indexes = primitive.indices.getElements();
                    switch ( primitive.getMode() ) {
                        case PrimitiveSet.POINTS:
                            this.applyDrawElementsPoints( primitive.getCount(), indexes );
                            break;
                        case PrimitiveSet.TRIANGLES:
                            this.applyDrawElementsTriangles( primitive.getCount(), indexes );
                            break;
                        case PrimitiveSet.TRIANGLE_STRIP:
                            this.applyDrawElementsTriangleStrip( primitive.getCount(), indexes );
                            break;
                        case PrimitiveSet.TRIANGLE_FAN:
                            this.applyDrawElementsTriangleFan( primitive.getCount(), indexes );
                            break;
                    }
                } else { // draw array
                    switch ( primitive.getMode() ) {
                        case PrimitiveSet.POINTS:
                            this.applyDrawArraysPoints( primitive.getFirst(), primitive.getCount() );
                            break;
                        case PrimitiveSet.LINES:
                            this.applyDrawArraysLines( primitive.getFirst(), primitive.getCount() );
                            break;
                        case PrimitiveSet.LINE_STRIP:
                            this.applyDrawArraysLineStrip( primitive.getFirst(), primitive.getCount() );
                            break;
                        case PrimitiveSet.TRIANGLES:
                            this.applyDrawArraysTriangles( primitive.getFirst(), primitive.getCount() );
                            break;
                        case PrimitiveSet.TRIANGLE_STRIP:
                            this.applyDrawArraysTriangleStrip( primitive.getFirst(), primitive.getCount() );
                            break;
                        case PrimitiveSet.TRIANGLE_FAN:
                            this.applyDrawArraysTriangleFan( primitive.getFirst(), primitive.getCount() );
                            break;
                    }
                }
            }
        }
    };

    return PrimitiveFunctor;
} );
