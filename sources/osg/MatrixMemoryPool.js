'use strict';
var Matrix = require( 'osg/Matrix' );


/**
 *  Prevents Memory fragmentation, GC heavy usage
 *  using pre-allocated memory segment
 *  allowing reuse of memory
 *  @class MatrixMemoryPool
 *  @memberof osg
 */
var MatrixMemoryPool = function () {

    this._stack = [ Matrix.create() ];
    this._current = 0;

};


/** @lends MatrixMemoryPool.prototype */
MatrixMemoryPool.prototype = {

    // start reuse the stack
    reset: function () {

        // ensure next stack.get gives
        // same result as a Matrix.create()
        // (ensure no side effect)
        // Beware: _stack start at 1 !
        for ( var i = 0, l = this._current; i <= l; i++ ) {
            Matrix.makeIdentity( this._stack[ i ] );
        }
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
