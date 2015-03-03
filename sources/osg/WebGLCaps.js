define( [
    'osg/Texture'
], function ( Texture ) {

    'use strict';

    var WebGLCaps = function ( gl ) {
        this._gl = gl;
        this._checkRTT = {};
        this._webGLExtensions = {};
        this._webGLParameters = {};
        this._webGLShaderMaxInt = 'NONE';
        this._webGLShaderMaxFloat = 'NONE';
    };

    WebGLCaps.prototype = {
        init: function () {
            this.initWebGLParameters();
            this.initWebGLExtensions();
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
        checkRTTSupport: function ( typeFloat, typeTexture ) {
            var gl = this._gl;
            if ( gl === undefined )
                return false;
            var key = typeFloat + ',' + typeTexture;
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
        hasRTTLinearHalfFloat: function () {
            return this._webGLExtensions[ 'OES_texture_half_float_linear' ] && this.checkRTTSupport( Texture.HALF_FLOAT, Texture.LINEAR );
        },
        hasRTTLinearFloat: function () {
            return this._webGLExtensions[ 'OES_texture_float_linear' ] && this.checkRTTSupport( Texture.FLOAT, Texture.LINEAR );
        },
        hasRTTHalfFloat: function () {
            return this._webGLExtensions[ 'OES_texture_half_float' ] && this.checkRTTSupport( Texture.HALF_FLOAT, Texture.NEAREST );
        },
        hasRTTFloat: function () {
            return this._webGLExtensions[ 'OES_texture_float' ] && this.checkRTTSupport( Texture.FLOAT, Texture.NEAREST );
        },
        initWebGLParameters: function () {
            var gl = this._gl;
            if ( gl === undefined )
                return;

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

            // TODO ?
            // try to compile a small shader to test the spec is respected
        },
        getWebGLExtension: function ( str ) {
            return this._webGLExtensions[ str ];
        },
        getWebGLExtensions: function () {
            return this._webGLExtensions;
        },
        initWebGLExtensions: function () {
            var gl = this._gl;
            if ( gl === undefined )
                return;
            var supported = gl.getSupportedExtensions();
            var ext = this._webGLExtensions;
            // we load all the extensions
            for ( var i = 0, len = supported.length; i < len; ++i ) {
                var sup = supported[ i ];
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
