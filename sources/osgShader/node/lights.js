'use strict';
var MACROUTILS = require( 'osg/Utils' );
var shaderUtils = require( 'osgShader/utils' );
var Node = require( 'osgShader/node/Node' );

// base class for all point based light: Point/Directional/Spot/Hemi
// avoid duplicate code
var NodeLights = function () {
    Node.call( this );
};

MACROUTILS.createPrototypeObject( NodeLights, MACROUTILS.objectInherit( Node.prototype, {

    validOutputs: [ 'color', 'lighted' ],

    globalFunctionDeclaration: function () {
        return '#pragma include "lights.glsl"';
    }

} ), 'osgShader', 'NodeLights' );

var getVec3 = function ( vec ) {
    return vec.getType() === 'vec4' ? vec.getVariable() + '.rgb' : vec;
};

var PointLight = function () {
    NodeLights.call( this );
};

MACROUTILS.createPrototypeObject( PointLight, MACROUTILS.objectInherit( NodeLights.prototype, {

    type: 'PointLight',

    validInputs: [
        'normal',
        'eyeVector',

        'materialdiffuse',
        'materialspecular',
        'materialshininess',

        'lightdiffuse',
        'lightspecular',
        'lightposition',
        'lightattenuation',
        'lightmatrix',
    ],

    computeShader: function () {

        return shaderUtils.callFunction( 'computePointLightShading', this._outputs.color, [
            this._inputs.normal,
            this._inputs.eyeVector,

            getVec3( this._inputs.materialdiffuse ),
            getVec3( this._inputs.materialspecular ),
            this._inputs.materialshininess,

            getVec3( this._inputs.lightdiffuse ),
            getVec3( this._inputs.lightspecular ),
            this._inputs.lightposition,
            this._inputs.lightattenuation,
            this._inputs.lightmatrix,

            this._outputs.lighted
        ] );
    }

} ), 'osgShader', 'PointLight' );



var SpotLight = function () {
    NodeLights.call( this );
};

MACROUTILS.createPrototypeObject( SpotLight, MACROUTILS.objectInherit( NodeLights.prototype, {

    type: 'SpotLight',

    validInputs: [
        'normal',
        'eyeVector',

        'materialdiffuse',
        'materialspecular',
        'materialshininess',

        'lightdiffuse',
        'lightspecular',
        'lightdirection',
        'lightattenuation',
        'lightposition',
        'lightspotCutOff',
        'lightspotBlend',
        'lightmatrix',
        'lightinvMatrix',
    ],

    computeShader: function () {

        return shaderUtils.callFunction( 'computeSpotLightShading', this._outputs.color, [
            this._inputs.normal,
            this._inputs.eyeVector,

            getVec3( this._inputs.materialdiffuse ),
            getVec3( this._inputs.materialspecular ),
            this._inputs.materialshininess,

            getVec3( this._inputs.lightdiffuse ),
            getVec3( this._inputs.lightspecular ),
            this._inputs.lightdirection,
            this._inputs.lightattenuation,
            this._inputs.lightposition,
            this._inputs.lightspotCutOff,
            this._inputs.lightspotBlend,
            this._inputs.lightmatrix,
            this._inputs.lightinvMatrix,

            this._outputs.lighted
        ] );
    }

} ), 'osgShader', 'SpotLight' );


var SunLight = function () {
    NodeLights.call( this );
};

MACROUTILS.createPrototypeObject( SunLight, MACROUTILS.objectInherit( NodeLights.prototype, {

    type: 'SunLight',

    validInputs: [
        'normal',
        'eyeVector',

        'materialdiffuse',
        'materialspecular',
        'materialshininess',

        'lightdiffuse',
        'lightspecular',
        'lightposition',
        'lightmatrix',
    ],

    computeShader: function () {

        return shaderUtils.callFunction( 'computeSunLightShading', this._outputs.color, [
            this._inputs.normal,
            this._inputs.eyeVector,

            getVec3( this._inputs.materialdiffuse ),
            getVec3( this._inputs.materialspecular ),
            this._inputs.materialshininess,

            getVec3( this._inputs.lightdiffuse ),
            getVec3( this._inputs.lightspecular ),
            this._inputs.lightposition,
            this._inputs.lightmatrix,

            this._outputs.lighted
        ] );
    }
} ), 'osgShader', 'SunLight' );

var HemiLight = function () {
    NodeLights.call( this );
};

MACROUTILS.createPrototypeObject( HemiLight, MACROUTILS.objectInherit( NodeLights.prototype, {

    type: 'HemiLight',

    validInputs: [
        'normal',
        'eyeVector',

        'materialdiffuse',
        'materialspecular',
        'materialshininess',

        'lightdiffuse',
        'lightground',
        'lightposition',
        'lightmatrix',
    ],

    computeShader: function () {

        return shaderUtils.callFunction( 'computeHemiLightShading', this._outputs.color, [
            this._inputs.normal, this._inputs.eyeVector,

            getVec3( this._inputs.materialdiffuse ),
            getVec3( this._inputs.materialspecular ),
            this._inputs.materialshininess,

            getVec3( this._inputs.lightdiffuse ),
            getVec3( this._inputs.lightground ),
            this._inputs.lightposition,
            this._inputs.lightmatrix,

            this._outputs.lighted
        ] );
    }
} ), 'osgShader', 'HemiLight' );

module.exports = {
    PointLight: PointLight,
    SpotLight: SpotLight,
    SunLight: SunLight,
    HemiLight: HemiLight
};
