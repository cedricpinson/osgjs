define( [
    'osg/Utils',
    'osgShader/Compiler',
    'osgShader/shaderNode'

], function ( MACROUTILS, Compiler, shaderNode ) {

    var CompilerOutput = function ( state, attributes, textureAttributes, scene ) {
        Compiler.call( this, state, attributes, textureAttributes, scene );
        // add matcap texture because matcap is not a TextureMaterial
        var ta = textureAttributes[ 11 ];
        if ( ta !== undefined )
            this._textures[ 11 ] = ta[ 0 ];

        this._output = undefined;
    };


    CompilerOutput.DIFFUSE_COLOR = 1;
    CompilerOutput.DIFFUSE_INTENSITY = 2;
    CompilerOutput.SPECULAR_COLOR = 4;
    CompilerOutput.SPECULAR_HARDNESS = 8;
    CompilerOutput.GEOMETRY = 32;
    CompilerOutput.EMIT_COLOR = 64;
    CompilerOutput.OPACITY = 128;
    CompilerOutput.ENVIRONMENT = 256;
    CompilerOutput.MATCAP = 512;
    CompilerOutput.WIREFRAME = 1024;

    CompilerOutput.getDefaultRendering = function () {
        var cb = CompilerOutput;
        var val = cb.DIFFUSE_COLOR;
        val |= cb.DIFFUSE_INTENSITY;
        val |= cb.SPECULAR_COLOR;
        val |= cb.SPECULAR_HARDNESS;
        val |= cb.GEOMETRY;
        val |= cb.EMIT_COLOR;
        val |= cb.OPACITY;
        val |= cb.ENVIRONMENT;
        return val;
    };

    CompilerOutput.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
        setOutput: function ( frag ) {
            this._outputs = frag;
        },
        computeFragment: function ( index ) {
            return this.getDefaultFragment( index );
        },
        createFragmentShaderGraph: function () {
            this.declareUniforms();
            this.declareTextures();

            var fragColor = this.computeFragment( this._outputs );
            return fragColor;
        },
        getDefaultFragment: function ( index ) {
            var cb = CompilerOutput;

            this.declareUniforms();
            this.declareTextures();

            var diffuseColor, diffuseIntensity, emitColor, diffuseOutput;
            var specularColor, specularHardness, specularOutput;
            var normal, alpha, finalColor, envOutput;

            // alpha
            if ( index & cb.OPACITY ) alpha = this.getTextureChannel( 'Opacity' ) || new shaderNode.InlineConstant( '1.0' );
            else alpha = new shaderNode.InlineConstant( '1.0' );

            // emit color
            if ( index & cb.EMIT_COLOR ) emitColor = this.getTextureChannel( 'EmitColor' );

            // diffuse color
            if ( index & cb.DIFFUSE_COLOR ) diffuseColor = this.getTextureChannel( 'DiffuseColor' );
            diffuseColor = this.getVertexColor( diffuseColor );

            if ( index & cb.GEOMETRY ) normal = this.getOrCreateGeometryNormal();
            else normal = this.getOrCreateNormalizedNormal();

            // diffuse intensity
            if ( index & cb.DIFFUSE_INTENSITY ) diffuseIntensity = this.getTextureChannel( 'DiffuseIntensity' );
            diffuseColor = this.getDiffuseIntensity( diffuseColor, diffuseIntensity );
            // diffuse output after the lambertian operation
            diffuseOutput = this.getLambertOutput( diffuseColor, normal );

            // specular color
            if ( index & cb.SPECULAR_COLOR ) specularColor = this.getTextureChannel( 'SpecularColor' );
            // specular hardness
            if ( index & cb.SPECULAR_HARDNESS ) specularHardness = this.getTextureChannel( 'SpecularHardness' );
            // specular output after the cook torrance operation
            specularOutput = this.getCookTorranceOutput( specularColor, normal, specularHardness );

            // get environments
            if ( index & cb.ENVIRONMENT ) envOutput = this.getEnvironment( diffuseColor, normal, specularColor );

            // get final color
            finalColor = this.getFinalColor( emitColor, diffuseOutput, specularOutput, envOutput );

            finalColor = this.getPremultAlpha( finalColor, alpha );
            // get srgb color and apply alpha
            var frag = this.Variable( 'vec4' );
            new shaderNode.SetAlpha( this.getSrgbColor( finalColor ), alpha, frag );

            return frag;
        }
    } );

    return CompilerOutput;
} );
