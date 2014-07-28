define( [
    'osg/Utils',
    'osg/Notify',
    'osg/Program',
    'osg/Shader',
    'osg/Map',
    'osg/Light',
    'osgShader/shaderGenerator/ShaderGenerator',
    'osgShader/shaderGenerator/CompilerMaterial'
], function ( MACROUTILS, Notify, Program, Shader, Map, Light, ShaderGenerator, Compiler ) {


    var ShaderGeneratorMaterial = function () {
        ShaderGenerator.call( this );
    };

    ShaderGeneratorMaterial.prototype = MACROUTILS.objectInherit( ShaderGenerator.prototype, {

        getOrCreateProgram: ( function () {
            // TODO: double check GC impact of this stack
            var textureAttributes = [];
            var attributes = [];
            return function ( state ) {
                // extract valid attributes
                var hash = '';
                attributes.length = 0;
                textureAttributes.length = 0;
                hash += this.getActiveAttributeList( state, attributes );
                hash += this.getActiveTextureAttributeList( state, textureAttributes );

                if ( this._cache[ hash ] !== undefined ) {
                    return this._cache[ hash ];
                }
                var shaderGen = new Compiler( state, attributes, textureAttributes, this._scene );
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
            };
        } )()
    } );

    return ShaderGeneratorMaterial;
} );
