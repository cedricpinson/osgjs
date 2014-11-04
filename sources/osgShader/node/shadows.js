define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, ShaderUtils, Node ) {
    'use strict';

    // TODO : use GLSL libraries shadow.glsl
    var ShadowNode = function ( shadowOutput, lightedOutput, lighted, lightPos, lightDir, lightNDL, lighting, light ) {
        Node.call( this );

        this._lighting = lighting;
        this._light = light;
        this._lightedOutput = lightedOutput;
        this._lighted = lighted;
        this._lightPos = lightPos;
        this._lightDir = lightDir;
        this._lightNDL = lightNDL;


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
            var shadowDepthRange = context.getOrCreateUniform( 'vec4', 'Shadow_DepthRange' + lightNum );
            var shadowMapSize = context.getOrCreateUniform( 'vec4', 'Shadow_MapSize' + lightNum );


            var bias = context.getOrCreateUniform( 'float', 'bias_' + lightNum );
            var VsmEpsilon = context.getOrCreateUniform( 'float', 'VsmEpsilon_' + lightNum );
            var exponent = context.getOrCreateUniform( 'float', 'exponent_' + lightNum );
            var exponent1 = context.getOrCreateUniform( 'float', 'exponent1_' + lightNum );
            var debug = context.getOrCreateUniform( 'float', 'debug_' + lightNum );

            //var tex = context.getOrCreateSampler( 'sampler2D', 'Texture' + ( lightNum + 1 ) );
            var tex = context.getOrCreateSampler( 'sampler2D', 'shadow_light' + lightNum );

            //
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
