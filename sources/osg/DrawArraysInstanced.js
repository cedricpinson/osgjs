'use strict';

var WebGLCaps = require( 'osg/WebGLCaps' );
var DrawArrays = require( 'osg/DrawArrays' );
var MACROUTILS = require( 'osg/Utils' );

/**
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
var DrawArraysInstanced = function ( mode, first, count, numInstances ) {
    DrawArrays.call( this, mode, first, count );
    this.numInstances = numInstances;
    this.extension = undefined;
};

/** @lends DrawElements.prototype */
DrawArraysInstanced.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( DrawArrays.prototype, {

    draw: function ( state ) {
        if ( this.count === 0 )
            return;
        var gl = state.getGraphicContext();
        if ( this.extension === undefined )
            this.extension = WebGLCaps.instance( gl ).getWebGLExtension( 'ANGLE_instanced_arrays' );
        this.extension.drawArraysInstancedANGLE( this.mode, this.first, this.count, this.numInstances );
    },

    setNumPrimitives: function ( numPrimitives ) {
        this.numPrimitives = numPrimitives;
    },

    getNumPrimitives: function () {
        return this.numPrimitives;
    }

} ) );

module.exports = DrawArraysInstanced;
