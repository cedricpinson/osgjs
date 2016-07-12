'use strict';
var MACROUTILS = require( 'osg/Utils' );
var StateAttribute = require( 'osg/StateAttribute' );
var Matrix = require( 'osg/Matrix' );

/** 
 * @class
 * @memberof osg
 */
var Viewport = function ( x, y, w, h ) {
    StateAttribute.call( this );

    this._x = x !== undefined ? x : 0;
    this._y = y !== undefined ? y : 0;
    this._width = w !== undefined ? w : 800;
    this._height = h !== undefined ? h : 600;
};

Viewport.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

    attributeType: 'Viewport',

    cloneType: function () {
        return new Viewport();
    },

    apply: function ( state ) {
        var gl = state.getGraphicContext();
        gl.viewport( this._x, this._y, this._width, this._height );
    },

    setViewport: function ( x, y, width, height ) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    },

    x: function () {
        return this._x;
    },

    y: function () {
        return this._y;
    },

    width: function () {
        return this._width;
    },

    height: function () {
        return this._height;
    },

    computeWindowMatrix: ( function () {
        var translate = Matrix.create();
        var scale = Matrix.create();
        return function ( destination ) {
            // res = Matrix offset * Matrix scale * Matrix translate
            Matrix.makeTranslate( 1.0, 1.0, 1.0, translate );
            Matrix.makeScale( 0.5 * this._width, 0.5 * this._height, 0.5, scale );
            var offset = Matrix.makeTranslate( this._x, this._y, 0.0, destination );
            //return Matrix.mult(Matrix.mult(translate, scale, translate), offset, offset);

            return Matrix.preMult( offset, Matrix.preMult( scale, translate ) );

        };
    } )()

} ), 'osg', 'Viewport' );

module.exports = Viewport;
