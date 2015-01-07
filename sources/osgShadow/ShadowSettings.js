define( [
    'osg/Utils',
    'osg/Object',
    'osg/Texture'
], function ( MACROUTILS, Object, Texture ) {
    'use strict';
    /**
     *  ShadowSettings provides the parameters that the ShadowTechnique should use as a guide for setting up shadowing
     *  @class ShadowSettings
     */
    var ShadowSettings = function ( options ) {
        Object.call( this );

        this._receivesShadowTraversalMask = 0xffffffff;
        this._castsShadowTraversalMask = 0xffffffff;

        this._textureSize = 1024;

        // important note:
        // comparison shadow is: DepthShadow > DephFragment => shadowed
        // which is d<z
        // and
        // Average( (d < z) ) != (Average( z ) < d)
        // so PCF/NONE technique cannot be prefiltered (bilinear, etc..) with HW filter
        // on gl/dx desktop there is a sampler2DShadow that allows that taking z in third param
        // we emulate that with texture2DShadowLerp
        // which is why some techniques have more texfetch than advertized.
        // http://http.developer.nvidia.com/GPUGems/gpugems_ch11.html

        this._config = {
            // Impact on shadow aliasing by better coverage
            'texturesize': 1024,
            // algo for shadow
            //'Variance Shadow Map (VSM)': 'VSM',
            //'Exponential Variance Shadow Map (EVSM)': 'EVSM',
            //'Exponential Shadow Map (ESM)': 'ESM',
            //'Shadow Map': 'NONE',
            //'Shadow Map Percentage Close Filtering (PCF)': 'PCF'
            // nice overview here
            // http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf
            // ALGO alllowing filtering
            //
            // ESM http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
            // http://pixelstoomany.wordpress.com/2008/06/12/a-conceptually-simpler-way-to-derive-exponential-shadow-maps-sample-code/
            // VSM: http://www.punkuser.net/vsm/
            // http://lousodrome.net/blog/light/tag/evsm
            'shadow': 'PCF',
            // texture precision. (and bandwith implication)
            'texturetype': 'UNSIGNED_BYTE',
            'lightnum': 1,
            // depth offset (shadow acne / peter panning)
            'bias': 0.005,
            // VSM bias
            'VsmEpsilon': 0.0008,
            // PCF algo and kernel size
            // Band kernelsize gives nxn texFetch
            // others a n*n*4 (emulating the HW shadowSampler)
            // '4Band(4texFetch)', '9Band(9texFetch)', '16Band(16texFetch)', '4Tap(16texFetch)', '9Tap(36texFetch)', '16Tap(64texFetch)', '4Poisson(16texFetch)', '8Poisson(32texFetch)', '16Poisson(64texFetch)', '25Poisson(100texFetch)', '32Poisson(128texFetch)', '64Poisson(256texFetch)'
            'pcfKernelSize': '4Tap(4texFetch)', //'4Tap', '9Tap', '16Tap', '16Band'
            // for prefilterable technique (ESM/VSM/EVSM)
            'supersample': 0,
            'blur': false,
            'blurKernelSize': 4.0,
            'blurTextureSize': 256,
            // either orthogonal (non-fov) or perpsective (fov)
            'shadowproj': 'fov',
            // fov size: can be infered from spotlight angle
            'fov': 50,
            // Exponential techniques variales
            'exponent': 40,
            'exponent1': 10.0
        };

        this._textureType = 'UNSIGNED_BYTE';
        this._textureFormat = Texture.RGBA;
        this._textureFilterMin = Texture.NEAREST;
        this._textureFilterMax = Texture.NEAREST;

        this._algorithm = 'PCF';

        // if url options override url options
        MACROUTILS.objectMix( this._config, options );
    };

    /** @lends ShadowSettings.prototype */
    ShadowSettings.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Object.prototype, {


        setCastsShadowTraversalMask: function ( mask ) {
            this._castsShadowTraversalMask = mask;
        },
        getCastsShadowTraversalMask: function () {
            return this._castsShadowTraversalMask;
        },

        setLightSource: function ( lightSource ) {
            this._lightSource = lightSource;
        },
        getLightSource: function () {
            return this._lightSource;
        },


        setTextureSize: function ( textureSize ) {
            this._textureSize = textureSize;
            this._dirty = true;
        },
        getTextureSize: function () {
            return this._textureSize;
        },
        setTextureType: function ( tt ) {
            this._textureType = tt;
            this._dirty = true;
        },
        getTextureType: function () {
            return this._textureType;
        },
        setTextureFilter: function ( tfMin, tfMax /* level af*/ ) {
            this._textureFilterMin = tfMin;
            this._textureFilterMax = tfMax;
            this._dirty = true;
        },
        getTextureFilterMax: function () {
            return this._textureFilterMax;
        },
        getTextureFilterMin: function () {
            return this._textureFilterMin;
        },
        setTextureFormat: function ( tf ) {
            this._textureFormat = tf;
        },
        getTextureFormat: function () {
            return this._textureFormat;
        },
        setAlgorithm: function ( alg ) {
            this._algorithm = alg;
            this._dirty = true;
        },
        getAlgorithm: function () {
            return this._algorithm;
        },

        getConfig: function ( idx ) {
            return this._config[ idx ];
        }

    } ), 'osgShadow', 'ShadowSettings' );
    MACROUTILS.setTypeID( ShadowSettings );

    return ShadowSettings;
} );