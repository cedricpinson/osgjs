define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, shaderUtils, Node ) {
    'use strict';



    // base class for all point based light: Point/Directional/Spot/Hemi
    // avoid duplicate code
    var NodeLightsPointBased = function () {
        Node.apply( this, arguments );
    };

    NodeLightsPointBased.prototype = MACROUTILS.objectInherit( Node.prototype, {

        globalFunctionDeclaration: function () {
            return '#pragma include "lights.glsl"';
        }

    } );



    var PointLight = function () {
        NodeLightsPointBased.apply( this, arguments );
    };

    PointLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'PointLight',

        validInputs: [
            'normal',
            'eyeVector',
            'materialambient',
            'materialdiffuse',
            'materialspecular',
            'materialshininess',

            'lightambient',
            'lightdiffuse',
            'lightspecular',

            'lightposition',
            'lightattenuation',

            'lightmatrix',
            'lightinvMatrix',
        ],

        computeFragment: function () {

            return shaderUtils.callFunction(
                'computePointLightShading',
                this._outputs, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    this._inputs.materialambient,
                    this._inputs.materialdiffuse,
                    this._inputs.materialspecular,
                    this._inputs.materialshininess,

                    this._inputs.lightambient,
                    this._inputs.lightdiffuse,
                    this._inputs.lightspecular,

                    this._inputs.lightposition,
                    this._inputs.lightattenuation,

                    this._inputs.lightmatrix,
                    this._inputs.lightinvMatrix,
                ] );
        }

    } );



    var SpotLight = function () {
        NodeLightsPointBased.apply( this, arguments );
    };

    SpotLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'SpotLight',

        validInputs: [
            'normal',
            'eyeVector',

            'materialambient',
            'materialdiffuse',
            'materialspecular',
            'materialshininess',

            'lightambient',
            'lightdiffuse',
            'lightspecular',

            'lightdirection',
            'lightattenuation',
            'lightposition',
            'lightspotCutOff',
            'lightspotBlend',

            'lightmatrix',
            'lightinvMatrix'
        ],

        computeFragment: function () {

            return shaderUtils.callFunction(
                'computeSpotLightShading',
                this._outputs, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    this._inputs.materialambient,
                    this._inputs.materialdiffuse,
                    this._inputs.materialspecular,
                    this._inputs.materialshininess,

                    this._inputs.lightambient,
                    this._inputs.lightdiffuse,
                    this._inputs.lightspecular,

                    this._inputs.lightdirection,
                    this._inputs.lightattenuation,
                    this._inputs.lightposition,
                    this._inputs.lightspotCutOff,
                    this._inputs.lightspotBlend,

                    this._inputs.lightmatrix,
                    this._inputs.lightinvMatrix,
                ] );
        }

    } );


    var SunLight = function () {
        NodeLightsPointBased.apply( this, arguments );
    };

    SunLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'SunLight',

        validInputs: [
            'normal',
            'eyeVector',
            'materialambient',
            'materialdiffuse',
            'materialspecular',
            'materialshininess',

            'lightambient',
            'lightdiffuse',
            'lightspecular',

            'lightposition',

            'lightmatrix',
            'lightinvMatrix'
        ],

        computeFragment: function () {

            return shaderUtils.callFunction(
                'computeSunLightShading',
                this._outputs, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    this._inputs.materialambient,
                    this._inputs.materialdiffuse,
                    this._inputs.materialspecular,
                    this._inputs.materialshininess,

                    this._inputs.lightambient,
                    this._inputs.lightdiffuse,
                    this._inputs.lightspecular,

                    this._inputs.lightposition,

                    this._inputs.lightmatrix,
                    this._inputs.lightinvMatrix,
                ] );
        }
    } );


    return {
        'PointLight': PointLight,
        'SpotLight': SpotLight,
        'SunLight': SunLight
    };

} );
