define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, shaderUtils, Node ) {
    'use strict';


        this._shadows = shadows || [];
        this._shadowsTextures = shadowsTextures || [];
                var shadowTextures = new Array( this._shadowsTextures.length );
                        shadow = this._shadows[ k ];
                    if ( shadow.getLight() === light ) {

                        for ( var p = 0; p < this._shadowsTextures.length; p++ ) {
                            var shadowTexture = this._shadowsTextures[ p ];
                            if ( shadowTexture && shadowTexture.getLightUnit() === light.getLightNumber() ) {
                                shadowTextures[ p ] = shadowTexture;
                                hasShadows = true;
                            }
                        }
                    }

                }
                // TODO Link shadowTexture and shadowAttribute ?
                    shadowNode = new ShadowNode( shadowTempOutput, lightedOutput, lighted, lightPos, lightDir, lightDNL, this, light, shadow, shadowTexture );

    // base class for all point based light: Point/Directional/Spot/Hemi
    // avoid duplicate code
    var NodeLightsPointBased = function () {
        Node.apply( this );
    };

    NodeLightsPointBased.prototype = MACROUTILS.objectInherit( Node.prototype, {

        validOutputs: [ 'color' ],
        globalFunctionDeclaration: function () {
            return '#pragma include "lights.glsl"';
        }

    } );

    var getVec3 = function ( vec ) {
        return vec.getType() === 'vec4' ? vec.getVariable() + '.rgb' : vec;
    };

    var PointLight = function () {
        NodeLightsPointBased.apply( this );
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
                this._outputs.color, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    getVec3( this._inputs.materialambient ),
                    getVec3( this._inputs.materialdiffuse ),
                    getVec3( this._inputs.materialspecular ),
                    this._inputs.materialshininess,

                    getVec3( this._inputs.lightambient ),
                    getVec3( this._inputs.lightdiffuse ),
                    getVec3( this._inputs.lightspecular ),

                    this._inputs.lightposition,
                    this._inputs.lightattenuation,

                    this._inputs.lightmatrix,
                    this._inputs.lightinvMatrix,
                ] );
        }

    } );



    var SpotLight = function () {
        NodeLightsPointBased.apply( this );
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
                this._outputs.color, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    getVec3( this._inputs.materialambient ),
                    getVec3( this._inputs.materialdiffuse ),
                    getVec3( this._inputs.materialspecular ),
                    this._inputs.materialshininess,

                    getVec3( this._inputs.lightambient ),
                    getVec3( this._inputs.lightdiffuse ),
                    getVec3( this._inputs.lightspecular ),

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
        NodeLightsPointBased.apply( this );
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
                this._outputs.color, [ this._inputs.normal,
                    this._inputs.eyeVector,

                    getVec3( this._inputs.materialambient ),
                    getVec3( this._inputs.materialdiffuse ),
                    getVec3( this._inputs.materialspecular ),
                    this._inputs.materialshininess,

                    getVec3( this._inputs.lightambient ),
                    getVec3( this._inputs.lightdiffuse ),
                    getVec3( this._inputs.lightspecular ),

                    this._inputs.lightposition,

                    this._inputs.lightmatrix,
                    this._inputs.lightinvMatrix,
                ] );
        }
    } );

    return {
        PointLight: PointLight,
        SpotLight: SpotLight,
        SunLight: SunLight
    };

} );
