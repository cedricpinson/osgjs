define( [
    'osg/Texture',
    'osgViewer/webgl-utils'
], function ( Texture, WebGLUtils ) {

    'use strict';

    var WebGLCaps = function () {

        this._checkRTT = {};
        this._webGLExtensions = {};
        this._webGLParameters = {};
        this._webGLShaderMaxInt = 'NONE';
        this._webGLShaderMaxFloat = 'NONE';

        this._bugsDB = {};
        this._webGLPlatforms = {};
    };

    WebGLCaps.instance = function () {

        if ( !WebGLCaps._instance ) {

            var c = document.createElement( 'canvas' );
            c.width = 32;
            c.height = 32;

            var gl = WebGLUtils.setupWebGL( c );

            // gracefully handle non webgl
            // like nodejs, phantomjs
            if ( gl ) {

                WebGLCaps._instance = new WebGLCaps();
                WebGLCaps._instance.init( gl );

            }

            //delete c;

        }
        return WebGLCaps._instance;
    };

    WebGLCaps.prototype = {
        init: function ( gl ) {

            // get capabilites
            this.initWebGLParameters( gl );

            // order is important
            // to allow webgl extensions filtering
            this.initPlatformSupport();
            this.initBugDB();

            // get extension
            this.initWebGLExtensions( gl );

            // get float support
            this.hasLinearHalfFloatRTT( gl );
            this.hasLinearFloatRTT( gl );
            this.hasHalfFloatRTT( gl );
            this.hasFloatRTT( gl );

        },
        // inevitable bugs per platform (browser/OS/GPU)
        initBugDB: function () {

            var p = this._webGLPlatforms;
            var ext = this._webGLParameters;

            // derivatives gives strange results on Shadow Shaders
            this._bugsDB[ 'OES_standard_derivatives' ] = ( p.Apple && ext.UNMASKED_VENDOR_WEBGL === undefined ) || ( ext.UNMASKED_VENDOR_WEBGL.indexOf( 'Intel' ) !== -1 && p.Apple );

        },
        initPlatformSupport: function () {

            var p = this._webGLPlatforms;

            p.Apple = navigator.vendor.indexOf( 'Apple' ) !== -1 || navigator.vendor.indexOf( 'OS X' ) !== -1;
            // degrades complexity on handhelds.
            p.Mobile = /Mobi/.test( navigator.userAgent ) || /ablet/.test( navigator.userAgent );

        },
        getWebGLPlatform: function ( str ) {
            return this._webGLPlatforms[ str ];
        },
        getWebGLPlatforms: function () {
            return this._webGLPlatforms;
        },

        getWebGLParameter: function ( str ) {
            return this._webGLParameters[ str ];
        },
        getWebGLParameters: function () {
            return this._webGLParameters;
        },
        getShaderMaxPrecisionFloat: function () {
            return this._webGLParameters.MAX_SHADER_PRECISION_FLOAT;
        },
        getShaderMaxPrecisionInt: function () {
            return this._webGLParameters.MAX_SHADER_PRECISION_INT;
        },
        checkSupportRTT: function ( gl, typeFloat, typeTexture ) {

            if ( !gl ) return false;

            var key = typeFloat + ',' + typeTexture;

            // check once only
            if ( this._checkRTT[ key ] !== undefined )
                return this._checkRTT[ key ];

            // from http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/#how-can-i-detect-if-i-can-render-to-floating-point-textures

            // setup the texture
            var texture = gl.createTexture();
            gl.bindTexture( gl.TEXTURE_2D, texture );
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, typeFloat, null );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, typeTexture );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, typeTexture );

            // setup the framebuffer
            var framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );
            gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0 );

            // check the framebuffer
            var status = this._checkRTT[ key ] = gl.checkFramebufferStatus( gl.FRAMEBUFFER ) === gl.FRAMEBUFFER_COMPLETE;

            // cleanup
            gl.deleteTexture( texture );
            gl.deleteFramebuffer( framebuffer );
            gl.bindTexture( gl.TEXTURE_2D, null );
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );

            return status;
        },
        hasLinearHalfFloatRTT: function ( gl ) {
            return this._webGLExtensions[ 'OES_texture_half_float_linear' ] && this.checkSupportRTT( gl, Texture.HALF_FLOAT, Texture.LINEAR );
        },
        hasLinearFloatRTT: function ( gl ) {
            return this._webGLExtensions[ 'OES_texture_float_linear' ] && this.checkSupportRTT( gl, Texture.FLOAT, Texture.LINEAR );
        },
        hasHalfFloatRTT: function ( gl ) {
            return this._webGLExtensions[ 'OES_texture_half_float' ] && this.checkSupportRTT( gl, Texture.HALF_FLOAT, Texture.NEAREST );
        },
        hasFloatRTT: function ( gl ) {
            return this._webGLExtensions[ 'OES_texture_float' ] && this.checkSupportRTT( gl, Texture.FLOAT, Texture.NEAREST );
        },
        initWebGLParameters: function ( gl ) {
            if ( !gl ) return;
            var limits = [
                'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
                'MAX_CUBE_MAP_TEXTURE_SIZE',
                'MAX_FRAGMENT_UNIFORM_VECTORS',
                'MAX_RENDERBUFFER_SIZE',
                'MAX_TEXTURE_IMAGE_UNITS',
                'MAX_TEXTURE_SIZE',
                'MAX_VARYING_VECTORS',
                'MAX_VERTEX_ATTRIBS',
                'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
                'MAX_VERTEX_UNIFORM_VECTORS',
                'MAX_VIEWPORT_DIMS',
                'SHADING_LANGUAGE_VERSION',
                'VERSION',
                'VENDOR',
                'RENDERER',
                'ALIASED_LINE_WIDTH_RANGE',
                'ALIASED_POINT_SIZE_RANGE',
                'RED_BITS',
                'GREEN_BITS',
                'BLUE_BITS',
                'ALPHA_BITS',
                'DEPTH_BITS',
                'STENCIL_BITS'
            ];
            var params = this._webGLParameters;
            for ( var i = 0, len = limits.length; i < len; ++i ) {
                var par = limits[ i ];
                params[ par ] = gl.getParameter( gl[ par ] );
            }

            //shader precisions for float
            if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'high';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'medium';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_FLOAT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_FLOAT = 'low';
            } else {
                params.MAX_SHADER_PRECISION_FLOAT = 'none';
            }

            //shader precisions for float
            if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'high';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.MEDIUM_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'medium';
            } else if ( gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.LOW_INT ).precision !== 0 ) {
                params.MAX_SHADER_PRECISION_INT = 'low';
            } else {
                params.MAX_SHADER_PRECISION_INT = 'none';
            }

            // get GPU, Angle or not, Opengl/directx, etc.
            //  ffx && chrome only
            var debugInfo = gl.getExtension( 'WEBGL_debug_renderer_info' );
            if ( debugInfo ) {
                params.UNMASKED_RENDERER_WEBGL = gl.getParameter( debugInfo.UNMASKED_VENDOR_WEBGL );
                params.UNMASKED_VENDOR_WEBGL = gl.getParameter( debugInfo.UNMASKED_RENDERER_WEBGL );

            }
            // TODO ?
            // try to compile a small shader to test the spec is respected
        },
        getWebGLExtension: function ( str ) {
            return this._webGLExtensions[ str ];
        },
        getWebGLExtensions: function () {
            return this._webGLExtensions;
        },
        initWebGLExtensions: function ( gl, filterBugs ) {

            // nodejs, phantomjs
            if ( !gl ) return;

            var doFilter = filterBugs;
            if ( doFilter === undefined )
                doFilter = true;

            var supported = gl.getSupportedExtensions();
            var ext = this._webGLExtensions;
            // we load all the extensions
            for ( var i = 0, len = supported.length; i < len; ++i ) {
                var sup = supported[ i ];

                if ( doFilter && this._bugsDB[ sup ] ) {
                    // bugs on that configuration, do not enable
                    continue;
                }

                ext[ sup ] = gl.getExtension( sup );
            }

            var anisoExt = this.getWebGLExtension( 'EXT_texture_filter_anisotropic' );
            if ( anisoExt ) {
                Texture.ANISOTROPIC_SUPPORT_EXT = true;
                Texture.ANISOTROPIC_SUPPORT_MAX = gl.getParameter( anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT );
            }

        }
    };


    return WebGLCaps;
} );
