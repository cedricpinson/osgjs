define( [
    'osg/Utils',
    'osg/Texture',
    'osgShader/utils',
    'osgShader/node/Node'
], function ( MACROUTILS, Texture, ShaderUtils, Node ) {
    'use strict';

    // TODO : use GLSL libraries shadow.glsl
    var ShadowNode = function ( shadowOutput, lightedOutput, lighted, lightPos, lightDir, lightNDL, lighting, light, shadow, shadowTextures ) {
        Node.call( this );

        this._lighting = lighting;
        this._light = light;
        this._lightedOutput = lightedOutput;
        this._lighted = lighted;
        this._lightPos = lightPos;
        this._lightDir = lightDir;
        this._lightNDL = lightNDL;

        this._shadow = shadow;
        this._shadowTextures = shadowTextures;

        //
        //texture
        //
        this.connectInputs( lightedOutput, lighted, lightPos, lightDir, lightNDL );

        this.connectOutput( shadowOutput );
    };

    ShadowNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'ShadowBasic',

        defines: function () {
            var defines = [];

            var floatTex = this._shadow.getPrecision();
            var isFloat = false;
            if ( floatTex !== 'BYTE' && floatTex !== Texture.UNSIGNED_BYTE ) {
                isFloat = true;
            }

            var algo = this._shadow.getAlgorithm();
            if ( algo === 'ESM' ) {
                defines.push( '#define _ESM' );
            } else if ( algo === 'PCF' ) {
                defines.push( '#define _PCF' );
            } else if ( algo === 'VSM' ) {
                defines.push( '#define _VSM' );
            } else if ( algo === 'EVSM' && isFloat ) {
                defines.push( '#define _EVSM' );
            } else { //
                defines.push( '#define _NONE' );
            }

            if ( isFloat ) defines.push( '#define _FLOATTEX' );

            return defines.join( '\n' );
        },

        globalFunctionDeclaration: function () {
            return '#pragma include "shadowsReceive.glsl"';
        },

        connectInputsAndCallFunction: function ( name, output, inputs ) {
            // connects all inputs
            if ( inputs )
                this.connectInputs( inputs );
            this._text = ShaderUtils.callFunction( name, output, inputs );
            return this;
        },

        computeFragment: function () {
            return this._text;
        },


        createFragmentShaderGraph: function ( context ) {

            //var lightNum = this._light.getLightNumber();
            // Common
            var normal = this._lighting._normal;

            var shadowUniforms = this._shadow.getOrCreateUniforms();

            // per shadow uniforms
            var bias = context.getOrCreateUniform( shadowUniforms.bias );
            var VsmEpsilon = context.getOrCreateUniform( shadowUniforms.vsmEpsilon );
            var exponent0 = context.getOrCreateUniform( shadowUniforms.exponent0 );
            var exponent1 = context.getOrCreateUniform( shadowUniforms.exponent1 );

            // use this._shadowTextures.
            var tex, shadowDepthRange, shadowMapSize, shadowVertexProjected, shadowZ;
            // TODO: better handle multi tex.
            for ( var k = 0; k < this._shadowTextures.length; k++ ) {

                var shadowTexture = this._shadowTextures[ k ];
                if ( shadowTexture ) {
                    tex = context.getOrCreateSampler( 'sampler2D', shadowTexture.getName() );

                    // per texture uniforms
                    var shadowTextureUniforms = shadowTexture.getOrCreateUniforms( k );
                    shadowDepthRange = context.getOrCreateUniform( shadowTextureUniforms.DepthRange );
                    shadowMapSize = context.getOrCreateUniform( shadowTextureUniforms.MapSize );

                    // Varyings
                    shadowVertexProjected = context.getOrCreateVarying( 'vec4', shadowTexture.getUniformName( 'VertexProjected' ) );
                    shadowZ = context.getOrCreateVarying( 'vec4', shadowTexture.getUniformName( 'Z' ) );
                }

            }


            var inputs = [
                shadowVertexProjected,
                shadowZ,
                tex,
                shadowMapSize,
                shadowDepthRange,
                this._lightPos,
                this._lightNDL,
                normal,
                bias,
                VsmEpsilon,
                exponent0,
                exponent1
            ];
            // TODO:
            // shader function regex
            // [\r\n]\s[(vec4)|(vec3)|(vec2)|(float)|(bool)|(int)].*\(.*[.|\r\n]*\).*[\r\n]*{
            // doesn't handle multiline
            // then split(',')
            // then substring (out,in)
            // then type matching
            // (works by hand here.)
            /*
            var inputTypes = [
                'vec4',
                'vec4',
                'sampler2D',
                'vec4',
                'vec4',
                'vec3',
                'float',
                'vec3',
                'float',
                'float',
                'float',
                'float',
                'float'
            ];

            console.assert( inputs.length === inputTypes.length );
            var i = inputs.length;
            while ( i-- ) {
                console.assert( inputs[ i ]._type === inputTypes[ i ], inputs[ i ]._prefix );
            }
            */

            this.connectInputsAndCallFunction( 'computeShadow', this.getOutput(), inputs );
            return this;
        }

    } );

    return ShadowNode;
} );
