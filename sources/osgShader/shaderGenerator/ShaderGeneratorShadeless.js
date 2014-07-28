define( [
    'osg/Utils',
    'osg/Program',
    'osg/Shader',
    'osgShader/shaderGenerator/ShaderGenerator',
    'osgShader/shaderGenerator/CompilerShadeless'

], function ( MACROUTILS, Program, Shader, ShaderGenerator, CompilerShadeless ) {

    var ShaderGeneratorShadeless = function () {
        ShaderGenerator.call( this );
    };

    ShaderGeneratorShadeless.prototype = MACROUTILS.objectInherit( ShaderGenerator.prototype, {
        getOrCreateProgram: function ( state ) {

            // extract valid attributes
            var hash = '';
            var attributes = [];
            var textureAttributes = [];
            hash += this.getActiveAttributeList( state, attributes );
            hash += this.getActiveTextureAttributeList( state, textureAttributes );

            if ( this._cache[ hash ] !== undefined ) {
                return this._cache[ hash ];
            }

            var shaderGen = new CompilerShadeless( state, attributes, textureAttributes, this._scene );
            var vertexshader = shaderGen.createVertexShader();
            var fragmentshader = shaderGen.createFragmentShader();

            var program = new Program(
                new Shader( Shader.VERTEX_SHADER, vertexshader ),
                new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );

            program.hash = hash;
            program.activeUniforms = this.getActiveUniforms( state, attributes, textureAttributes );
            program.generated = true;

            this._cache[ hash ] = program;
            return program;
        }
    } );

    return ShaderGeneratorShadeless;
} );
