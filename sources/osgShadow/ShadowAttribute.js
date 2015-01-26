define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Texture',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Texture, Uniform, Matrix, Vec3, Vec4, Map ) {
    'use strict';


    /**
     * ShadowAttribute encapsulate Shadow Main State object
     * @class ShadowAttribute
     * @inherits StateAttribute
     */
    var ShadowAttribute = function ( lightNumber, disable ) {
        StateAttribute.call( this );


        //this._lightNumber // (might be broken by light reordering change) // yeah agree

        // just in case
        // the object in case of change in ordering ?
        // need to be able to link in compiler the light uniforms as we use light uniforms in shadow shader code
        // well it's not supposed to be a problem, but yeah the ordering is an issue, so maybe it's better to link to
        // the light attribute, in this case we dont need anymore the _lightNumber
        // but re ordering light seems to not be a good practice in osg, it's still a risk
        this._light = undefined;
        // that could be more generic to have the unit instead of the object

        // see shadowSettings.js header for shadow algo param explanations

        this._lightNumber = lightNumber !== undefined ? lightNumber : 0;

        // hash change var
        this._algoType = 'NONE';

        // shadow depth bias as projected in shadow camera space texture
        // and viewer camera space projection introduce its bias
        this._bias = 0.001;
        // algo dependant
        // Exponential shadow maps use exponentials
        // to allows fuzzy depth
        this._exponent0 = 0.001;
        this._exponent1 = 0.001;
        // Variance Shadow mapping use One more epsilon
        this._epsilonVSM = 0.001;
        // shader compilation differnet upon texture precision
        this._precision = 'UNSIGNED_BYTE';
        // kernel size & type for pcf
        this._kernelSizePCF = undefined;

        this._enable = !disable;

    };

    ShadowAttribute.uniforms = {};
    ShadowAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'ShadowAttribute',

        cloneType: function () {
            return new ShadowAttribute( this._lightNumber, true );
        },

        getTypeMember: function () {
            return this.attributeType + this.getLightNumber();
        },
        getLightNumber: function () {
            return this._lightNumber;
        },

        getUniformName: function ( name ) {
            var prefix = this.getType() + this.getLightNumber().toString();
            return prefix + '_uniform_' + name;
        },

        setAlgorithm: function ( algo ) {
            this._algoType = algo;
        },
        getAlgorithm: function () {
            return this._algoType;
        },

        setBias: function ( bias ) {
            this._bias = bias;
        },
        getBias: function () {
            return this._bias;
        },
        setExponent0: function ( exp ) {
            this._exponent0 = exp;
        },
        getExponent0: function () {
            return this._exponent0;
        },
        setExponent1: function ( exp ) {
            this._exponent1 = exp;
        },
        getExponent1: function () {
            return this._exponent1;
        },
        setEpsilonVSM: function ( epsilon ) {
            this._epsilonVSM = epsilon;
        },
        getEpsilonVSM: function () {
            return this._epsilonVSM;
        },
        getKernelSizePCF: function () {
            return this._kernelSizePCF;
        },
        setKernelSizePCF: function ( v ) {
            this._kernelSizePCF = v;
        },
        setPrecision: function ( precision ) {
            this._precision = precision;
            this.dirty();
        },
        getPrecision: function () {
            return this._precision;
        },
        getLight: function () {
            return this._light;
        },
        setLight: function ( light ) {
            this._light = light;
            this._lightNumber = light.getLightNumber();
            this.dirty();
        },

        getOrCreateUniforms: function () {
            // uniform are once per CLASS attribute, not per instance
            var obj = ShadowAttribute;

            var typeMember = this.getTypeMember();

            if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

            // Variance Shadow mapping use One more epsilon
            var uniformList = {
                'bias': 'createFloat',
                'exponent0': 'createFloat',
                'exponent1': 'createFloat',
                'epsilonVSM': 'createFloat'
            };

            var uniforms = {};

            Object.keys( uniformList ).forEach( function ( key ) {

                var type = uniformList[ key ];
                var func = Uniform[ type ];
                uniforms[ key ] = func( this.getUniformName( key ) );

            }.bind( this ) );

            obj.uniforms[ typeMember ] = new Map( uniforms );

            return obj.uniforms[ typeMember ];
        },


        // Here to be common between  caster and receiver
        // (used by shadowMap and shadow node shader)
        getDefines: function () {

            var textureType = this.getPrecision();
            var algo = this.getAlgorithm();
            var defines = [];

            var isFloat = false;
            var isLinearFloat = false;

            if ( textureType !== 'UNSIGNED_BYTE' )
                isFloat = true;

            if ( isFloat && ( textureType === 'HALF_FLOAT_LINEAR' || textureType === 'FLOAT_LINEAR' ) )
                isLinearFloat = true;


            if ( algo === 'ESM' ) {
                defines.push( '#define _ESM' );
            } else if ( algo === 'NONE' ) {
                defines.push( '#define _NONE' );
            } else if ( algo === 'PCF' ) {
                defines.push( '#define _PCF' );
                var pcf = this.getKernelSizePCF();
                switch ( pcf ) {
                case '4Poisson(16texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx4' );
                    break;
                case '8Poisson(32texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx9' );
                    break;
                case '16Poisson(64texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx16' );
                    break;
                case '25Poisson(100texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx25' );
                    break;
                case '32Poisson(128texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx32' );
                    break;
                case '64Poisson(256texFetch)':
                    defines.push( '#define _POISSON_PCF' );
                    defines.push( '#define _PCFx64' );
                    break;
                case '4Band(4texFetch)':
                    defines.push( '#define _BAND_PCF' );
                    defines.push( '#define _PCFx4' );
                    break;
                case '9Band(9texFetch)':
                    defines.push( '#define _BAND_PCF' );
                    defines.push( '#define _PCFx9' );
                    break;
                case '16Band(16texFetch)':
                    defines.push( '#define _BAND_PCF' );
                    defines.push( '#define _PCFx16' );
                    break;
                case '9Tap(36texFetch)':
                    defines.push( '#define _TAP_PCF' );
                    defines.push( '#define _PCFx9' );
                    break;
                case '16Tap(64texFetch)':
                    defines.push( '#define _TAP_PCF' );
                    defines.push( '#define _PCFx25' );
                    break;
                default:
                case '4Tap(16texFetch)':
                    defines.push( '#define _TAP_PCF' );
                    defines.push( '#define _PCFx4' );
                    break;
                }
            } else if ( algo === 'VSM' ) {
                defines.push( '#define _VSM' );
            } else if ( algo === 'EVSM' ) {
                defines.push( '#define _EVSM' );
            }

            if ( isFloat ) {
                defines.push( '#define  _FLOATTEX' );
            }
            if ( isLinearFloat ) {
                defines.push( '#define  _FLOATLINEAR' );
            }

            return defines;
        },

        apply: function ( /*state*/) {

            var uniformMap = this.getOrCreateUniforms();

            uniformMap.bias.set( this._bias );
            uniformMap.exponent0.set( this._exponent0 );
            uniformMap.exponent1.set( this._exponent1 );
            uniformMap.epsilonVSM.set( this._epsilonVSM );

            this.setDirty( false );
        },

        // need a isEnable to let the ShaderGenerator to filter
        // StateAttribute from the shader compilation
        isEnable: function () {
            return this._enable;
        },

        getHash: function () {
            return this.getTypeMember() + this.getAlgorithm() + this.getKernelSizePCF();
        }

    } ), 'osgShadow', 'ShadowAttribute' );

    MACROUTILS.setTypeID( ShadowAttribute );

    return ShadowAttribute;
} );
