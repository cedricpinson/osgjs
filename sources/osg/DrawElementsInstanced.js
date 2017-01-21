'use strict';

var WebGLCaps = require( 'osg/WebGLCaps' );
var DrawElements = require( 'osg/DrawElements' );
var MACROUTILS = require( 'osg/Utils' );

/**
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
var DrawElementsInstanced = function ( mode, indices, numPrimitives ) {
    DrawElements.call( this, mode, indices );
    this.numPrimitives = numPrimitives;
    this.extension = undefined;
};

/** @lends DrawElements.prototype */
DrawElementsInstanced.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( DrawElements.prototype, {

    drawElements: function ( state ) {
        var gl = state.getGraphicContext();
        if ( this.extension === undefined )
            this.extension = WebGLCaps.instance( gl ).getWebGLExtension( 'ANGLE_instanced_arrays' );
        this.extension.drawElementsInstancedANGLE( this.mode, this.count, this.uType, this.offset, this.numPrimitives );
    },

    setNumPrimitives: function ( numPrimitives ) {
        this.numPrimitives = numPrimitives;
    },

    getNumPrimitives: function () {
        return this.numPrimitives;
    }

} ) );

module.exports = DrawElementsInstanced;
