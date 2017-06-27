'use strict';
var MACROUTILS = require( 'osg/Utils' );
var utils = require( 'osgShader/utils' );
var Node = require( 'osgShader/node/Node' );

var NodeTextures = function () {
    Node.call( this );
};

MACROUTILS.createPrototypeObject( NodeTextures, MACROUTILS.objectInherit( Node.prototype, {

    type: 'TextureAbstractNode',

    // functionName is here to simplify all texture base functions
    // it's possible later it will have to move into another class
    // if base class needs to be more generic. But right now it simplify
    // all simple class to fetch texture ( seed above )
    functionName: 'noTextureFunction',

    validInputs: [ 'sampler', 'uv' ],
    validOutputs: [ 'color' ],

    computeShader: function () {

        return utils.callFunction( this.functionName,
            this._outputs.color, [
                this._inputs.sampler,
                this._inputs.uv.getVariable() + '.xy'
            ] );
    },

    globalFunctionDeclaration: function () {
        return '#pragma include "textures.glsl"';
    }

} ), 'osgShader', 'NodeTextures' );



var TextureRGB = function () {
    NodeTextures.call( this );
};

MACROUTILS.createPrototypeObject( TextureRGB, MACROUTILS.objectInherit( NodeTextures.prototype, {

    type: 'TextureRGB',
    functionName: 'textureRGB'

} ), 'osgShader', 'TextureRGB' );



var TextureRGBA = function () {
    TextureRGB.call( this );
};

MACROUTILS.createPrototypeObject( TextureRGBA, MACROUTILS.objectInherit( TextureRGB.prototype, {

    type: 'TextureRGBA',
    functionName: 'textureRGBA'

} ), 'osgShader', 'TextureRGBA' );


var TextureAlpha = function () {
    TextureRGB.call( this );
};

MACROUTILS.createPrototypeObject( TextureAlpha, MACROUTILS.objectInherit( TextureRGB.prototype, {

    type: 'TextureAlpha',
    functionName: 'textureAlpha'

} ), 'osgShader', 'TextureAlpha' );



var TextureIntensity = function () {
    TextureRGB.call( this );
};

MACROUTILS.createPrototypeObject( TextureIntensity, MACROUTILS.objectInherit( TextureRGB.prototype, {

    type: 'TextureIntensity',
    functionName: 'textureIntensity'

} ), 'osgShader', 'TextureIntensity' );

module.exports = {
    NodeTextures: NodeTextures,
    TextureRGB: TextureRGB,
    TextureRGBA: TextureRGBA,
    TextureAlpha: TextureAlpha,
    TextureIntensity: TextureIntensity
};
