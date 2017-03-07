'use strict';

var WebGLCaps = require( 'osg/WebGLCaps' );
var DrawElements = require( 'osg/DrawElements' );
var MACROUTILS = require( 'osg/Utils' );
var notify = require( 'osg/notify' );

/**
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
var DrawElementsInstanced = function ( mode, indices, numPrimitives ) {
    DrawElements.call( this, mode, indices );
    this._numPrimitives = numPrimitives;
    this._extension = undefined;
};

/** @lends DrawElements.prototype */
DrawElementsInstanced.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( DrawElements.prototype, {

    drawElements: function ( state ) {
        var gl = state.getGraphicContext();
        if ( this._extension === undefined )
            this._extension = WebGLCaps.instance( gl ).getWebGLExtension( 'ANGLE_instanced_arrays' );
        if ( !this._extension ) notify.error( 'Your browser does not support instanced arrays extension' );
        this._extension.drawElementsInstancedANGLE( this._mode, this._count, this._uType, this._offset, this._numPrimitives );
    },

    setNumPrimitives: function ( numPrimitives ) {
        this._numPrimitives = numPrimitives;
    },

    getNumPrimitives: function () {
        return this._numPrimitives;
    }

} ) );

module.exports = DrawElementsInstanced;
