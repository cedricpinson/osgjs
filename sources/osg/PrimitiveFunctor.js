/**
 * @author Jordi Torres
 */

define( [
    'osg/Vec3',
    'osg/PrimitiveSet'
], function ( Vec3, PrimitiveSet ) {

    /**
     * PrimitiveFunctor emulates the TemplatePrimitiveFunctor class in OSG and can
     * be used to get access to the vertices that compose the things drawn by osgjs.
     * Feed it with a callback that will be called for geometry.
     * The callback must be a closure and have the next structure:
     *
     * var myCallback = function(  ) {
     *     return {
     *          operatorPoint : function ( v ) { }, // Do your point operations here
     *          operatorLine : function ( v1, v2 ){ }, // Do you line operations here
     *          operatorTriangle : function ( v1, v2, v3 ) { } // Do your triangle operations here
     *      }
     * };
     *
     * Important Note: You should take into account that you are accesing the actual vertices of the primitive
     * you might want to do a copy of these values in your callback to avoid to modify the primitive geometry
     *  @class PrimitiveFunctor
     */

    var PrimitiveFunctor = function ( geom, cb, vertices ) {
        this._geom = geom;
        this._cb = cb;
        this._vertices = vertices;
    };

    PrimitiveFunctor.prototype = {
        applyDrawElementsPoints: ( function () {
            var v = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                for ( var i = 0; i < count; ++i ) {
                    var j = indexes[ i ] * 3;
                    v[ 0 ] = this._vertices[ j ];
                    v[ 1 ] = this._vertices[ j + 1 ];
                    v[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorPoint( v );
                }
            };
        } )(),
        applyDrawElementsLines: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                for ( var i = 0; i < count - 1; i += 2 ) {
                    var j = indexes[ i ] * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ i + 1 ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
            };
        } )(),

        applyDrawElementsLineStrip: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                for ( var i = 0; i < count - 1; ++i ) {
                    var j = indexes[ i ] * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ i + 1 ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
            };
        } )(),

        applyDrawElementsLineLoop: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                var last = count - 1;
                for ( var i = 0; i < last; ++i ) {
                    var j = indexes[ i ] * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ i + 1 ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
                last = indexes[ last ] * 3;
                v1[ 0 ] = this._vertices[ last ];
                v1[ 1 ] = this._vertices[ last + 1 ];
                v1[ 2 ] = this._vertices[ last + 2 ];
                var first = indexes[ 0 ] * 3;
                v2[ 0 ] = this._vertices[ first ];
                v2[ 1 ] = this._vertices[ first + 1 ];
                v2[ 2 ] = this._vertices[ first + 2 ];
                cb.operatorLine( v1, v2 );
            };
        } )(),

        applyDrawElementsTriangles: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                for ( var i = 0; i < count; i += 3 ) {
                    var j = indexes[ i ] * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ i + 1 ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ i + 2 ] * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorTriangle( v1, v2, v3 );
                }
            };
        } )(),

        applyDrawElementsTriangleStrip: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                for ( var i = 2, pos = 0; i < count; ++i, ++pos ) {
                    var j = indexes[ pos ] * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ pos + 1 ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ pos + 2 ] * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    if ( i % 2 ) {
                        cb.operatorTriangle( v1, v3, v2 );
                    } else {
                        cb.operatorTriangle( v1, v2, v3 );
                    }
                }
            };
        } )(),

        applyDrawElementsTriangleFan: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( count, indexes ) {
                var cb = this._cb();
                var first = indexes[ 0 ];
                for ( var i = 2, pos = 1; i < count; ++i, ++pos ) {
                    v1[ 0 ] = this._vertices[ first ];
                    v1[ 1 ] = this._vertices[ first + 1 ];
                    v1[ 2 ] = this._vertices[ first + 2 ];
                    var j = indexes[ pos ] * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = indexes[ pos + 1 ] * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorTriangle( v1, v2, v3 );
                }
            };
        } )(),

        applyDrawArraysPoints: ( function () {
            var v = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count; ++i ) {
                    var j = i * 3;
                    v[ 0 ] = this._vertices[ j ];
                    v[ 1 ] = this._vertices[ j + 1 ];
                    v[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorPoint( v );
                }
            };
        } )(),

        applyDrawArraysLines: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count - 1; i += 2 ) {
                    var j = i * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = ( i + 1 ) * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
            };
        } )(),

        applyDrawArraysLineStrip: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count - 1; ++i ) {
                    var j = i * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = ( i + 1 ) * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
            };
        } )(),
        applyDrawArraysLineLoop: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                var last = first + count - 1;
                for ( var i = first; i < last; ++i ) {
                    var j = i * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = ( i + 1 ) * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorLine( v1, v2 );
                }
                last = last * 3;
                v1[ 0 ] = this._vertices[ last ];
                v1[ 1 ] = this._vertices[ last + 1 ];
                v1[ 2 ] = this._vertices[ last + 2 ];
                first = first * 3;
                v2[ 0 ] = this._vertices[ first ];
                v2[ 1 ] = this._vertices[ first + 1 ];
                v2[ 2 ] = this._vertices[ first + 2 ];
                cb.operatorLine( v1, v2 );
            };
        } )(),

        applyDrawArraysTriangles: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = first; i < first + count; i += 3 ) {
                    var j = i * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = ( i + 1 ) * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = ( i + 2 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorTriangle( v1, v2, v3 );
                }
            };
        } )(),

        applyDrawArraysTriangleStrip: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = 2, pos = first; i < count; ++i, ++pos ) {
                    var j = pos * 3;
                    v1[ 0 ] = this._vertices[ j ];
                    v1[ 1 ] = this._vertices[ j + 1 ];
                    v1[ 2 ] = this._vertices[ j + 2 ];
                    j = ( pos + 1 ) * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = ( pos + 2 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    if ( i % 2 ) {
                        cb.operatorTriangle( v1, v3, v2 );
                    } else {
                        cb.operatorTriangle( v1, v2, v3 );
                    }
                }
            };
        } )(),

        applyDrawArraysTriangleFan: ( function () {
            var v1 = Vec3.create();
            var v2 = Vec3.create();
            var v3 = Vec3.create();
            return function ( first, count ) {
                var cb = this._cb();
                for ( var i = 2, pos = first + 1; i < count; ++i, ++pos ) {
                    v1[ 0 ] = this._vertices[ first ];
                    v1[ 1 ] = this._vertices[ first + 1 ];
                    v1[ 2 ] = this._vertices[ first + 2 ];
                    var j = pos * 3;
                    v2[ 0 ] = this._vertices[ j ];
                    v2[ 1 ] = this._vertices[ j + 1 ];
                    v2[ 2 ] = this._vertices[ j + 2 ];
                    j = ( pos + 1 ) * 3;
                    v3[ 0 ] = this._vertices[ j ];
                    v3[ 1 ] = this._vertices[ j + 1 ];
                    v3[ 2 ] = this._vertices[ j + 2 ];
                    cb.operatorTriangle( v1, v2, v3 );
                }
            };
        } )(),

        apply: function () {
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
                    case PrimitiveSet.LINES:
                        this.applyDrawElementsLines( primitive.getCount(), indexes );
                        break;
                    case PrimitiveSet.LINE_STRIP:
                        this.applyDrawElementsLineStrip( primitive.getCount(), indexes );
                        break;
                    case PrimitiveSet.LINE_LOOP:
                        this.applyDrawElementsLineLoop( primitive.getCount(), indexes );
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
                    case PrimitiveSet.LINE_LOOP:
                        this.applyDrawArraysLineLoop( primitive.getFirst(), primitive.getCount() );
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
