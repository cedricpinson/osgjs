'use strict';

var Light = require( 'osg/Light' );
var Notify = require( 'osg/notify' );

var CompilerFragment = {

    _createFragmentShader: function () {
        // Call to specialised inhenrited shader Compiler
        var roots = this.createFragmentShaderGraph();
        var fname = this.getFragmentShaderName();
        if ( fname ) roots.push( this.getNode( 'Define', 'SHADER_NAME' ).setValue( fname ) );

        var shader = this.createShaderFromGraphs( roots );

        Notify.debug( this.getDebugIdentifier() );
        Notify.debug( shader );

        this.cleanAfterFragment();

        return shader;
    },

    applyPointSizeCircle: function ( color ) {
        if ( !this._pointSizeAttribute || !this._pointSizeAttribute.isEnabled() || !this._pointSizeAttribute.isCircleShape() )
            return color;

        this.getNode( 'InlineCode' ).code( 'if (length(2.0 * gl_PointCoord - 1.0) > %radius) discard;' ).inputs( {
            radius: this.getOrCreateConstantOne( 'float' )
        } ).outputs( {
            output: color
        } );

        return color;
    },

    cleanAfterFragment: function () {
        // reset for next
        this._variables = {};
        this._activeNodeList = {};

        // clean texture cache variable (for vertex shader re-usage)
        for ( var keyTexture in this._texturesByName ) {
            this._texturesByName[ keyTexture ].variable = undefined;
        }

        for ( var keyVarying in this._varyings ) {
            var varying = this._varyings[ keyVarying ];
            varying.reset();
            this._activeNodeList[ varying.getID() ] = varying;
            this._variables[ keyVarying ] = varying;
        }
    },

    createDefaultFragmentShaderGraph: function () {
        var fofd = this.getOrCreateConstant( 'vec4', 'fofd' ).setValue( 'vec4(1.0, 0.0, 1.0, 0.7)' );
        var fragCol = this.getNode( 'glFragColor' );
        this.getNode( 'SetFromNode' ).inputs( fofd ).outputs( fragCol );
        return fragCol;
    },

    createFragmentShaderGraph: function () {

        // shader graph can have multiple output (glPointsize, varyings)
        // here named roots all outputs must be pushed inside
        var roots = [];

        // no material then return a default shader
        if ( !this._material ) {
            roots.push( this.createDefaultFragmentShaderGraph() );
            return roots;
        }

        var finalColor = this.createLighting();

        var emission = this.getOrCreateMaterialEmission();
        if ( emission ) {
            var emit = this.createVariable( 'vec3' );
            this.getNode( 'Add' ).inputs( finalColor, emission ).outputs( emit );
            finalColor = emit;
        }

        var textureColor = this.getDiffuseColorFromTextures();
        if ( textureColor ) {
            var texColor = this.createVariable( 'vec3' );
            this.getNode( 'Mult' ).inputs( finalColor, textureColor ).outputs( texColor );
            finalColor = texColor;
        }

        var alpha = this.getAlpha();

        // premult alpha
        finalColor = this.getPremultAlpha( finalColor, alpha );

        var fragColor = this.getNode( 'glFragColor' );

        // todo add gamma corrected color, but it would also mean to handle correctly srgb texture
        // so it should be done at the same time. see osg.Tetxure to implement srgb
        this.getNode( 'SetAlpha' ).inputs( {
            color: finalColor,
            alpha: alpha
        } ).outputs( {
            color: fragColor
        } );

        roots.push( fragColor );

        return roots;
    },

    getAlpha: function () {
        // compute alpha
        var alpha = this.createVariable( 'float' );
        var textureTexel = this.getFirstValidTexture();

        var inputs = {
            color: this.getOrCreateMaterialDiffuseColor()
        };
        if ( textureTexel ) inputs.texelAlpha = textureTexel;

        var str = textureTexel ? '%alpha = %color.a * %texelAlpha.a;' : '%alpha = %color.a;';

        // Discard fragments totally transparents when rendering billboards
        if ( this._isBillboard )
            str += 'if ( %alpha == 0.0) discard;';

        this.getNode( 'InlineCode' ).code( str ).inputs( inputs ).outputs( {
            alpha: alpha
        } );

        return alpha;
    },

    getOrCreateFrontViewTangent: function () {
        var out = this._variables[ 'frontViewTangent' ];
        if ( out )
            return out;

        out = this.createVariable( 'vec4', 'frontViewTangent' );

        this.getNode( 'FrontNormal' ).inputs( {
            normal: this.getOrCreateVarying( 'vec4', 'vViewTangent' )
        } ).outputs( {
            normal: out
        } );

        return out;
    },

    getOrCreateFrontViewNormal: function () {
        var out = this._variables[ 'frontViewNormal' ];
        if ( out )
            return out;

        out = this.createVariable( 'vec3', 'frontViewNormal' );

        this.getNode( 'FrontNormal' ).inputs( {
            normal: this.getOrCreateVarying( 'vec3', 'vViewNormal' )
        } ).outputs( {
            normal: out
        } );

        return out;
    },

    getOrCreateNormalizedViewEyeDirection: function () {
        var eye = this._variables[ 'eyeVector' ];
        if ( eye )
            return eye;

        var nor = this.createVariable( 'vec3' );
        var castEye = this.createVariable( 'vec3' );
        this.getNode( 'SetFromNode' ).inputs( this.getOrCreateVarying( 'vec4', 'vViewVertex' ) ).outputs( castEye );
        this.getNode( 'Normalize' ).inputs( {
            vec: castEye
        } ).outputs( {
            vec: nor
        } );

        var out = this.createVariable( 'vec3', 'eyeVector' );
        this.getNode( 'Mult' ).inputs( nor, this.createVariable( 'float' ).setValue( '-1.0' ) ).outputs( out );
        return out;
    },

    getOrCreateNormalizedFrontViewNormal: function () {
        var out = this._variables[ 'nFrontViewNormal' ];
        if ( out )
            return out;

        out = this.createVariable( 'vec3', 'nFrontViewNormal' );
        this.getNode( 'Normalize' ).inputs( {
            vec: this.getOrCreateFrontViewNormal()
        } ).outputs( {
            vec: out
        } );

        return out;
    },

    getOrCreateFrontModelNormal: function () {
        var out = this._variables[ 'frontModelNormal' ];
        if ( out )
            return out;

        out = this.createVariable( 'vec3', 'frontModelNormal' );

        this.getNode( 'FrontNormal' ).inputs( {
            normal: this.getOrCreateVarying( 'vec3', 'vModelNormal' )
        } ).outputs( {
            normal: out
        } );

        return out;
    },

    getOrCreateNormalizedFrontModelNormal: function () {
        var out = this._variables[ 'nFrontModelNormal' ];
        if ( out )
            return out;

        out = this.createVariable( 'vec3', 'nFrontModelNormal' );
        this.getNode( 'Normalize' ).inputs( {
            vec: this.getOrCreateFrontModelNormal()
        } ).outputs( {
            vec: out
        } );

        return out;
    },

    getPremultAlpha: function ( finalColor, alpha ) {

        if ( alpha === undefined )
            return finalColor;

        var premultAlpha = this.createVariable( 'vec4' );

        this.getNode( 'PreMultAlpha' ).inputs( {
            color: finalColor,
            alpha: alpha
        } ).outputs( {
            color: premultAlpha
        } );

        return premultAlpha;
    },


    getColorsRGB: function ( finalColor ) {
        var finalSrgbColor = this.createVariable( 'vec3' );
        this.getNode( 'LinearTosRGB' ).inputs( {
            color: finalColor
        } ).outputs( {
            color: finalSrgbColor
        } );

        return finalSrgbColor;
    },

    multiplyDiffuseWithVertexColor: function ( diffuseColor ) {
        var vertexColor = this.getOrCreateVarying( 'vec4', 'vVertexColor' );
        var vertexColorUniform = this.getOrCreateUniform( 'float', 'uArrayColorEnabled' );
        var tmp = this.createVariable( 'vec4' );

        var str = [ '',
            '%color = %diffuse;',
            'if ( %hasVertexColor == 1.0)',
            '  %color *= %vertexColor;'
        ].join( '\n' );

        this.getNode( 'InlineCode' ).code( str ).inputs( {
            diffuse: diffuseColor,
            hasVertexColor: vertexColorUniform,
            vertexColor: vertexColor
        } ).outputs( {
            color: tmp
        } ).comment( 'diffuse color = diffuse color * vertex color' );

        return tmp;
    },

    getDiffuseColorFromTextures: function () {

        var texturesInput = [];
        var textures = this._texturesByName;

        for ( var keyTexture in textures ) {
            var texture = textures[ keyTexture ];

            if ( texture.shadow )
                continue;

            texturesInput.push( this.getTextureByName( keyTexture ).variable );
        }

        // if multi texture multiply them all with diffuse
        // but if only one, return the first
        if ( texturesInput.length > 1 ) {

            var texAccum = this.createVariable( 'vec3', 'texDiffuseAccum' );

            this.getNode( 'Mult' ).inputs( texturesInput ).outputs( texAccum );
            return texAccum;

        } else if ( texturesInput.length === 1 ) {

            return texturesInput[ 0 ];
        }

        return undefined;
    },

    getFirstValidTexture: function () {
        var textures = this._textures;
        for ( var i = 0, nb = textures.length; i < nb; ++i ) {
            var tex = textures[ i ];
            if ( tex ) return this.getTextureByName( tex.getName() ).variable;
        }
        return undefined;
    },

    _getShadowFromLightNum: function ( array, lightNum ) {
        // array is shadow textures or shadow receive attributes
        for ( var i = 0; i < array.length; i++ ) {
            var shadow = array[ i ];
            if ( shadow && shadow.getLightNumber() === lightNum ) {
                return shadow;
            }
        }
    },

    getInputsFromShadow: function ( shadowReceive, shadowTexture, lighted ) {
        var shadowUniforms = shadowReceive.getOrCreateUniforms();
        var tUnit = this._shadowsTextures.indexOf( shadowTexture );
        var textureUniforms = shadowTexture.getOrCreateUniforms( tUnit );

        var inputs = {
            lighted: lighted,
            shadowTexture: this.getOrCreateSampler( 'sampler2D', 'Texture' + tUnit ),
            shadowTextureRenderSize: this.getOrCreateUniform( textureUniforms.RenderSize ),
            shadowTextureProjectionMatrix: this.getOrCreateUniform( textureUniforms.ProjectionMatrix ),
            shadowTextureViewMatrix: this.getOrCreateUniform( textureUniforms.ViewMatrix ),
            shadowTextureDepthRange: this.getOrCreateUniform( textureUniforms.DepthRange ),
            normalWorld: this.getOrCreateNormalizedFrontModelNormal(),
            vertexWorld: this.getOrCreateVarying( 'vec3', 'vModelVertex' ),
            shadowBias: this.getOrCreateUniform( shadowUniforms.bias )
        };

        if ( shadowReceive.getAtlas() ) inputs.shadowTextureMapSize = this.getOrCreateUniform( textureUniforms.MapSize );
        if ( shadowReceive.getNormalBias() ) inputs.shadowNormalBias = this.getOrCreateUniform( shadowUniforms.normalBias );

        return inputs;
    },

    createShadowingLight: function ( light, lighted ) {

        var lightNum = light.getLightNumber();
        var shadowTexture = this._getShadowFromLightNum( this._shadowsTextures, lightNum );
        var shadowReceive = this._getShadowFromLightNum( this._shadows, lightNum );
        if ( !shadowTexture || !shadowReceive ) return undefined;

        var inputs = this.getInputsFromShadow( shadowReceive, shadowTexture, lighted );

        var shadowedOutput = this.createVariable( 'float' );
        this.getNode( 'ShadowReceive' ).setShadowAttribute( shadowReceive ).inputs( inputs ).outputs( {
            float: shadowedOutput
        } );

        return shadowedOutput;
    },

    getOrCreateMaterialNormal: function () {
        return this.getOrCreateNormalizedFrontViewNormal();
    },

    getOrCreateMaterialDiffuseColor: function () {
        var matDiffuse = this.getVariable( 'materialDiffuseColor' );
        if ( matDiffuse ) return matDiffuse;
        matDiffuse = this.createVariable( 'vec4', 'materialDiffuseColor' );

        var diffuse = this.getOrCreateUniform( this._material.getOrCreateUniforms().diffuse );
        this.getNode( 'Mult' ).inputs( this.multiplyDiffuseWithVertexColor( diffuse ) ).outputs( matDiffuse );

        return matDiffuse;
    },

    getOrCreateMaterialEmission: function () {
        return this.getOrCreateUniform( this._material.getOrCreateUniforms().emission );
    },

    getOrCreateMaterialSpecularColor: function () {
        return this.getOrCreateUniform( this._material.getOrCreateUniforms().specular );
    },

    getOrCreateMaterialSpecularHardness: function () {
        return this.getOrCreateUniform( this._material.getOrCreateUniforms().shininess );
    },

    getOrCreateMaterialAmbient: function () {
        return this.getOrCreateUniform( this._material.getOrCreateUniforms().ambient );
    },

    getInputsFromLight: function ( light ) {
        var lightUniforms = light.getOrCreateUniforms();

        var inputs = {
            normal: this.getOrCreateMaterialNormal(),
            eyeVector: this.getOrCreateNormalizedViewEyeDirection(),

            materialdiffuse: this.getOrCreateMaterialDiffuseColor(),
            materialspecular: this.getOrCreateMaterialSpecularColor(),
            materialshininess: this.getOrCreateMaterialSpecularHardness(),

            lightdiffuse: this.getOrCreateUniform( lightUniforms.diffuse ),
            lightposition: this.getOrCreateUniform( lightUniforms.position ),
            lightmatrix: this.getOrCreateUniform( lightUniforms.matrix )
        };

        var lightType = light.getLightType();
        if ( lightType === Light.POINT ) {
            inputs.lightspecular = this.getOrCreateUniform( lightUniforms.specular );
            inputs.lightattenuation = this.getOrCreateUniform( lightUniforms.attenuation );

        } else if ( lightType === Light.SPOT ) {
            inputs.lightspecular = this.getOrCreateUniform( lightUniforms.specular );
            inputs.lightattenuation = this.getOrCreateUniform( lightUniforms.attenuation );
            inputs.lightdirection = this.getOrCreateUniform( lightUniforms.direction );
            inputs.lightspotCutOff = this.getOrCreateUniform( lightUniforms.spotCutOff );
            inputs.lightspotBlend = this.getOrCreateUniform( lightUniforms.spotBlend );
            inputs.lightinvMatrix = this.getOrCreateUniform( lightUniforms.invMatrix );

        } else if ( lightType === Light.DIRECTION ) {
            inputs.lightspecular = this.getOrCreateUniform( lightUniforms.specular );

        } else if ( lightType === Light.HEMI ) {
            inputs.lightground = this.getOrCreateUniform( lightUniforms.ground );
        }

        return inputs;
    },

    getOutputsFromLight: function () {
        var outputs = {
            color: this.createVariable( 'vec3' ),
            lighted: this.createVariable( 'bool' ),
        };

        return outputs;
    },

    getEnumLightToNodeName: function () {
        return {
            DIRECTION: 'SunLight',
            SPOT: 'SpotLight',
            POINT: 'PointLight',
            HEMI: 'HemiLight'
        };
    },

    createLighting: function () {
        var lightSum = [];

        var enumToNodeName = this.getEnumLightToNodeName();
        for ( var i = 0; i < this._lights.length; i++ ) {

            var light = this._lights[ i ];

            var nodeName = enumToNodeName[ light.getLightType() ];
            var inputs = this.getInputsFromLight( light );
            var outputs = this.getOutputsFromLight( light );

            this.getNode( nodeName ).inputs( inputs ).outputs( outputs );

            var finalLight = outputs.color;

            var shadowFactor = this.createShadowingLight( light, outputs.lighted );
            if ( shadowFactor ) {
                finalLight = this.createVariable( 'vec3' );
                this.getNode( 'Mult' ).inputs( outputs.color, shadowFactor ).outputs( finalLight );
            }

            lightSum.push( finalLight );
        }

        this.addAmbientLighting( lightSum );

        if ( lightSum.length === 0 ) return this.getOrCreateMaterialDiffuseColor();
        if ( lightSum.length === 1 ) return lightSum[ 0 ];

        var output = this.createVariable( 'vec3' );
        this.getNode( 'Add' ).inputs( lightSum ).outputs( output );
        return output;
    },

    addAmbientLighting: function ( toBeAdded ) {
        for ( var i = 0; i < this._lights.length; i++ ) {
            var light = this._lights[ i ];

            var ambient = this.createVariable( 'vec3' );
            var lightambient = this.getOrCreateUniform( light.getOrCreateUniforms().ambient );
            var materialambient = this.getOrCreateMaterialAmbient();
            this.getNode( 'Mult' ).inputs( materialambient, lightambient ).outputs( ambient );

            toBeAdded.push( ambient );
        }
    },

    createTextureRGBA: function ( texture, textureSampler, texCoord ) {
        // but we could later implement srgb inside and read differents flag
        // as read only in the texture

        var texel = this.createVariable( 'vec4' );
        this.getNode( 'TextureRGBA' ).inputs( {
            sampler: textureSampler,
            uv: texCoord
        } ).outputs( {
            color: texel
        } );

        return texel;
    }
};

var wrapperFragmentOnly = function ( fn, name ) {
    return function () {
        if ( !this._fragmentShaderMode )
            this.logError( 'This function should not be called from vertex shader : ' + name );
        return fn.apply( this, arguments );
    };
};


for ( var fnName in CompilerFragment ) {
    CompilerFragment[ fnName ] = wrapperFragmentOnly( CompilerFragment[ fnName ], fnName );
}

module.exports = CompilerFragment;
