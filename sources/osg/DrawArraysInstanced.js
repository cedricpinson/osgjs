'use strict';

var WebGLCaps = require( 'osg/WebGLCaps' );
var DrawArrays = require( 'osg/DrawArrays' );
var MACROUTILS = require( 'osg/Utils' );
var notify = require( 'osg/notify' );

/**
 * DrawArrays manage rendering of indexed primitives
 * @class DrawArrays
 */
var DrawArraysInstanced = function ( mode, first, count, numInstances ) {
    DrawArrays.call( this, mode, first, count );
    this._numInstances = numInstances;
    this._extension = undefined;
};

/** @lends DrawArrays.prototype */
DrawArraysInstanced.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( DrawArrays.prototype, {

    draw: function ( state ) {
        if ( this._count === 0 )
            return;
        var gl = state.getGraphicContext();
        if ( !this._extension ) {
            this._extension = WebGLCaps.instance( gl ).getWebGLExtension( 'ANGLE_instanced_arrays' );
            if ( !this._extension ) {
                notify.error( 'Your browser does not support instanced arrays extension' );
                return;
            }
        }
        this._extension.drawArraysInstancedANGLE( this._mode, this._first, this._count, this._numInstances );
    },

    setNumPrimitives: function ( numPrimitives ) {
        this._numPrimitives = numPrimitives;
    },

    getNumPrimitives: function () {
        return this._numPrimitives;
    }

} ) );

module.exports = DrawArraysInstanced;
