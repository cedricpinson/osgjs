define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, ShaderUtils, Node ) {
    'use strict';

    // TODO : use GLSL libraries shadow.glsl
    var ShadowNode = function ( shadowOutput, lightedOutput, lighted, lightPos, lightDir, lightNDL, lighting, light, shadow, shadowTexture ) {
        Node.call( this );

        this._lighting = lighting;
        this._light = light;
        this._lightedOutput = lightedOutput;
        this._lighted = lighted;
        this._lightPos = lightPos;
        this._lightDir = lightDir;
        this._lightNDL = lightNDL;

        this._shadow = shadow;
        this._shadowTexture = shadowTexture;

        //
        //texture
        //
        this.connectInputs( lightedOutput, lighted, lightPos, lightDir, lightNDL );

        this.connectOutput( shadowOutput );
    };

    ShadowNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'ShadowBasic',

        defines: function () {
            var defines = this._light._shadowTechnique.getDefines();

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

            var lightNum = this._light.getLightNumber();
            // Common
            var normal = this._lighting._normal;

            var shadowUniforms = this._shadow.getOrCreateUniforms();
            var shadowTextureUniforms = this._shadowTexture.getOrCreateUniforms();

            var shadowDepthRange = context.getOrCreateUniform( 'vec4', shadowTextureUniforms.DepthRange );
            var shadowMapSize = context.getOrCreateUniform( 'vec4', shadowTextureUniforms.MapSize );

            var viewMat = context.getOrCreateUniform( 'mat4', shadowTextureUniforms.ViewMatrix );
            var projMat = context.getOrCreateUniform( 'mat4', shadowTextureUniforms.ProjectionMatrix );


            var bias = context.getOrCreateUniform( 'float', shadowUniforms.bias );
            var VsmEpsilon = context.getOrCreateUniform( 'float', shadowUniforms.bias.vsmEpsilon );
            var exponent0 = context.getOrCreateUniform( 'float', shadowUniforms.bias.exponent0 );
            var exponent1 = context.getOrCreateUniform( 'float', shadowUniforms.bias.exponent1 );

            //var tex = context.getOrCreateSampler( 'sampler2D', 'Texture' + ( lightNum + 1 ) );
            var tex = context.getOrCreateSampler( 'sampler2D', 'shadow_light' + lightNum );

            // Varyings
            var shadowVertexProjected = context.getOrCreateVarying( 'vec4', 'Shadow_VertexProjected' + lightNum );
            var shadowZ = context.getOrCreateVarying( 'vec4', 'Shadow_Z' + lightNum );



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
                exponent1,
                exponent,
                debug
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
