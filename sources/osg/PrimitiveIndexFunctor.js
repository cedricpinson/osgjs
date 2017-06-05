'use strict';

var PrimitiveSet = require( 'osg/primitiveSet' );
var DrawElements = require( 'osg/DrawElements' );
var DrawArrays = require( 'osg/DrawArrays' );

/**
 * PrimitiveIndexFunctor emulates the TemplatePrimitiveIndexFunctor class in OSG and can
 * be used to get access to the indices that compose the things drawn by osgjs.
 * Feed it with a callback that will be called for geometry.
 * The callback must be a closure and have the next structure:
 *
 * var myCallback = function(  ) {
 *     return {
 *          operatorPoint : function ( i ) { }, // Do your point operations here
 *          operatorLine : function ( i1, i2 ){ }, // Do you line operations here
 *          operatorTriangle : function ( i1, i2, i3 ) { } // Do your triangle operations here
 *      }
 * };
 */
var PrimitiveIndexFunctor = function ( geom, cb ) {
    this._geom = geom;
    this._cb = cb;
};

var functorDrawElements = PrimitiveIndexFunctor.functorDrawElements = [];
var functorDrawArrays = PrimitiveIndexFunctor.functorDrawArrays = [];

functorDrawElements[ PrimitiveSet.TRIANGLES ] = function ( offset, count, indexes, cb ) {
    var end = offset + count;
    for ( var i = offset; i < end; i += 3 ) {
        cb.operatorTriangle( indexes[ i ], indexes[ i + 1 ], indexes[ i + 2 ] );
    }
};

functorDrawElements[ PrimitiveSet.TRIANGLE_STRIP ] = function ( offset, count, indexes, cb ) {
    for ( var i = 2, j = offset; i < count; ++i, ++j ) {
        if ( i % 2 ) cb.operatorTriangle( indexes[ j ], indexes[ j + 2 ], indexes[ j + 1 ] );
        else cb.operatorTriangle( indexes[ j ], indexes[ j + 1 ], indexes[ j + 2 ] );
    }
};

functorDrawElements[ PrimitiveSet.TRIANGLE_FAN ] = function ( offset, count, indexes, cb ) {
    var first = indexes[ offset ];
    for ( var i = 2, j = offset + 1; i < count; ++i, ++j ) {
        cb.operatorTriangle( first, indexes[ j ], indexes[ j + 1 ] );
    }
};

functorDrawElements[ PrimitiveSet.POINTS ] = function ( offset, count, indexes, cb ) {
    var end = offset + count;
    for ( var i = offset; i < end; ++i ) {
        cb.operatorPoint( indexes[ i ] );
    }
};

functorDrawElements[ PrimitiveSet.LINES ] = function ( offset, count, indexes, cb ) {
    var end = offset + count;
    for ( var i = offset; i < end; i += 2 ) {
        cb.operatorLine( indexes[ i ], indexes[ i + 1 ] );
    }
};

functorDrawElements[ PrimitiveSet.LINE_STRIP ] = function ( offset, count, indexes, cb ) {
    var end = offset + count;
    for ( var i = offset; i < end; ++i ) {
        cb.operatorLine( indexes[ i ], indexes[ i + 1 ] );
    }
};

functorDrawElements[ PrimitiveSet.LINE_LOOP ] = function ( offset, count, indexes, cb ) {
    var end = offset + count;
    for ( var i = offset; i < end; ++i ) {
        cb.operatorLine( indexes[ i ], indexes[ i + 1 ] );
    }
    cb.operatorLine( indexes[ indexes.length - 1 ], indexes[ 0 ] );
};


functorDrawArrays[ PrimitiveSet.TRIANGLES ] = function ( first, count, cb ) {
    for ( var i = 2, pos = first; i < count; i += 3, pos += 3 ) {
        cb.operatorTriangle( pos, pos + 1, pos + 2 );
    }
};

functorDrawArrays[ PrimitiveSet.TRIANGLE_STRIP ] = function ( first, count, cb ) {
    for ( var i = 2, pos = first; i < count; ++i, ++pos ) {
        if ( i % 2 ) cb.operatorTriangle( pos, pos + 2, pos + 1 );
        else cb.operatorTriangle( pos, pos + 1, pos + 2 );
    }
};

functorDrawArrays[ PrimitiveSet.TRIANGLE_FAN ] = function ( first, count, cb ) {
    for ( var i = 2, pos = first + 1; i < count; ++i, ++pos ) {
        cb.operatorTriangle( first, pos, pos + 1 );
    }
};


functorDrawArrays[ PrimitiveSet.POINTS ] = function ( first, count, cb ) {
    for ( var i = 0, pos = first; i < count; ++i, ++pos ) {
        cb.operatorPoint( pos );
    }
};

functorDrawArrays[ PrimitiveSet.LINES ] = function ( first, count, cb ) {
    for ( var i = 1, pos = first; i < count; i += 2, pos += 2 ) {
        cb.operatorLine( pos, pos + 1 );
    }
};

functorDrawArrays[ PrimitiveSet.LINE_STRIP ] = function ( first, count, cb ) {
    for ( var i = 1, pos = first; i < count; ++i, ++pos ) {
        cb.operatorLine( pos, pos + 1 );
    }
};

functorDrawArrays[ PrimitiveSet.LINE_LOOP ] = function ( first, count, cb ) {
    for ( var i = 1, pos = first; i < count; ++i, ++pos ) {
        cb.operatorLine( pos, pos + 1 );
    }
    cb.operatorLine( first + count - 1, first );
};



PrimitiveIndexFunctor.prototype = {

    apply: function () {
        var geom = this._geom;
        var primitives = geom.getPrimitiveSetList();
        if ( !primitives )
            return;

        var cb = this._cb();
        var cbFunctor;

        var nbPrimitives = primitives.length;
        for ( var i = 0; i < nbPrimitives; i++ ) {

            var primitive = primitives[ i ];
            if ( primitive instanceof DrawElements ) {

                cbFunctor = functorDrawElements[ primitive.getMode() ];
                if ( cbFunctor ) {
                    var indexes = primitive.indices.getElements();
                    cbFunctor( primitive.getFirst() / indexes.BYTES_PER_ELEMENT, primitive.getCount(), indexes, cb );
                }

            } else if ( primitive instanceof DrawArrays ) {

                cbFunctor = functorDrawArrays[ primitive.getMode() ];
                if ( cbFunctor ) {
                    cbFunctor( primitive.getFirst(), primitive.getCount(), cb );
                }

            }
        }
    }
};

module.exports = PrimitiveIndexFunctor;
