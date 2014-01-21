define( [
    'osg/Vec3',
    'osg/PrimitiveSet'
], function( Vec3, PrimitiveSet ) {

    // This class can be used to visit all the triangles of a geometry
    // You feed it with a callback that will be called for each triangle
    // (with the 3 indexes of vertices as arguments)
    var TriangleIndexFunctor = function( geom, cb ) {
        this._geom = geom;
        this._cb = cb;
    };

    TriangleIndexFunctor.prototype = {
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

        applyDrawArraysTriangles: function( first, count ) {
            var cb = this._cb;
            for ( var i = 2, pos = first; i < count; i += 3, pos += 3 ) {
                cb( pos, pos + 1, pos + 2 );
            }
        },

        applyDrawArraysTriangleStrip: function( first, count ) {
            var cb = this._cb;
            for ( var i = 2, pos = first; i < count; ++i, ++pos ) {
                if ( i % 2 ) cb( pos, pos + 2, pos + 1 );
                else cb( pos, pos + 1, pos + 2 );
            }
        },

        applyDrawArraysTriangleFan: function( first, count ) {
            var cb = this._cb;
            for ( var i = 2, pos = first + 1; i < count; ++i, ++pos ) {
                cb( first, pos, pos + 1 );
            }
        },

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

    return TriangleIndexFunctor;
} );
