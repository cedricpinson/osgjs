'use strict';
var Matrix = require( 'osg/Matrix' );


/**
 *  Prevents Memory fragmentation, GC heavy usage
 *    using pre-allocated memory segment
 *    allowing reuse of memory
 *  @class MatrixMemoryPool
 */
var MatrixMemoryPool = function () {

    this._stack = [ Matrix.create() ];
    this._current = 0;

};


/** @lends MatrixMemoryPool.prototype */
MatrixMemoryPool.prototype = {

    // start reuse the stack
    reset: function () {

        this._current = 0;

    },

    get: function () {

        var m = this._stack[ this._current++ ];

        if ( this._current === this._stack.length ) {

            this._stack.push( Matrix.create() );

        }

        return m;

    }

};

module.exports = MatrixMemoryPool;
