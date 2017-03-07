'use strict';
var PrimitiveSet = require( 'osg/primitiveSet' );


/**
 * DrawArrays manage rendering primitives
 * @class DrawArrays
 */
var DrawArrays = function ( mode, first, count ) {
    this._mode = mode;
    if ( mode !== undefined ) {
        if ( typeof ( mode ) === 'string' ) {
            mode = PrimitiveSet[ mode ];
        }
        this._mode = mode;
    }
    this._first = first;
    this._count = count;
};

/** @lends DrawArrays.prototype */
DrawArrays.prototype = {
    draw: function ( state ) {
        if ( this._count === 0 )
            return;
        var gl = state.getGraphicContext();
        gl.drawArrays( this._mode, this._first, this._count );
    },
    getMode: function () {
        return this._mode;
    },
    setCount: function ( count ) {
        this._count = count;
    },
    getCount: function () {
        return this._count;
    },
    setFirst: function ( first ) {
        this._first = first;
    },
    getFirst: function () {
        return this._first;
    },
    getNumIndices: function () {
        return this._count;
    },
    index: function ( i ) {
        return this._first + i;
    }

};

module.exports = DrawArrays;
