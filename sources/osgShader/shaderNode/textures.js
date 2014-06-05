/*global define */

define ( [
    'osg/Utils',
    'osgShader/shaderNode/Node'

], function ( MACROUTILS, Node ) {


    var TextureRGB = function ( sampler, uv, output ) {
        Node.call( this );
        this._sampler = sampler;
        this.connectInput( sampler );
        this.connectInput( uv );
        if ( output !== undefined ) {
            this.connectOutput( output );
        }
        this._uv = uv;
    };
    TextureRGB.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'TextureRGB',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureRGB( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        'vec3 textureRGB(const in sampler2D texture, const in vec2 uv) {',
                        '  return texture2D(texture, uv).rgb;',
                        '}'
                      ].join( '\n' );
            return str;
        }
    } );


    var TextureRGBA = function ( sampler, uv, output ) {
        TextureRGB.call( this, sampler, uv, output );
    };
    TextureRGBA.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {
        type: 'TextureRGBA',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureRGBA( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        'vec4 textureRGBA(const in sampler2D texture, const in vec2 uv) {',
                        '  return texture2D(texture, uv);',
                        '}'
                      ].join( '\n' );
            return str;
        }
    } );


    var TextureAlpha = function ( sampler, uv, output ) {
        TextureRGB.call( this, sampler, uv, output );
    };
    TextureAlpha.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {
        type: 'TextureAlpha',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureAlpha( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        'float textureAlpha(const in sampler2D texture, const in vec2 uv) {',
                        '  return texture2D(texture, uv).a;',
                        '}'
                      ].join( '\n' );
            return str;
        }
    } );


    var TextureCubemapRGB = function ( sampler, uv, output ) {
        TextureRGB.call( this, sampler, uv, output );
    };
    TextureCubemapRGB.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {
        type: 'TextureCubemapRGB',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureCubemapRGB( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xyz);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    } );

    var TextureSpheremap = function ( sampler, uv, output ) {
        TextureRGBA.call( this, sampler, uv, output );
    };
    TextureSpheremap.prototype = MACROUTILS.objectInherit( TextureRGBA.prototype, {
        type: 'TextureSpheremap',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureSpheremap( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xyz);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    } );

    var TextureSpheremapHDR = function ( sampler, size, uv, output ) {
        TextureRGBA.call( this, sampler, uv, output );

        this._size = size;
        this.connectInput( size );
    };
    TextureSpheremapHDR.prototype = MACROUTILS.objectInherit( TextureRGBA.prototype, {
        type: 'TextureSpheremapHDR',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureSpheremapHDR( ' + this._sampler.getVariable() + ', ' + this._size.getVariable() + ' , ' + this._uv.getVariable() + '.xyz);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    } );

    var TextureTranslucency = function ( sampler, uv ) {
        TextureAlpha.call( this, sampler, uv );
    };
    TextureTranslucency.prototype = MACROUTILS.objectInherit( TextureAlpha.prototype, {
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = 1.0 - textureAlpha( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        }
    } );

    var TextureIntensity = function ( sampler, uv, output ) {
        TextureRGB.call( this, sampler, uv, output );
    };
    TextureIntensity.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {
        type: 'TextureIntensity',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureIntensity( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    } );


    var TextureNormal = function ( sampler, uv, output ) {
        TextureRGB.call( this, sampler, uv, output );
    };
    TextureNormal.prototype = MACROUTILS.objectInherit( TextureRGB.prototype, {
        type: 'TextureNormal',
        computeFragment: function () {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureNormal( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy);'
                      ].join( '\n' );
            return str;
        },

        globalFunctionDeclaration: function () {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    } );


    var TextureGradient = function(sampler, coord, size, output) {
        TextureRGB.call(this, sampler, coord, output);
        this._step = size;
        this.connectInput(size);
    };
    TextureGradient.prototype = MACROUTILS.objectInherit(TextureRGB.prototype, {
        type: 'TextureGradient',
        computeFragment: function() {
            var str = [ '',
                        this.getOutput().getVariable() + ' = textureGradient( ' + this._sampler.getVariable() + ' , ' + this._uv.getVariable() + '.xy, ' + this._step.getVariable() + ');'
                      ].join('\n');
            return str;
        },

        globalFunctionDeclaration: function() {
            var str = [ '',
                        '#pragma include "textures.glsl"'
                      ].join( '\n' );
            return str;
        }
    });


    return { 'TextureRGB': TextureRGB,
             'TextureRGBA': TextureRGBA,
             'TextureAlpha': TextureAlpha,
             'TextureCubemapRGB': TextureCubemapRGB,
             'TextureSpheremap': TextureSpheremap,
             'TextureSpheremapHDR': TextureSpheremapHDR,
             'TextureTranslucency': TextureTranslucency,
             'TextureIntensity': TextureIntensity,
             'TextureNormal': TextureNormal,
             'TextureGradient': TextureGradient
           };
});
