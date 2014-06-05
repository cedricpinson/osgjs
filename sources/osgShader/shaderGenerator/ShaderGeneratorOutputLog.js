define( [
    'osg/Utils',
    'osg/Program',
    'osg/Shader',
    'osgShader/ShaderGenerator',
    'osgShader/shaderGenerator/CompilerOutputLog'

], function ( MACROUTILS, Program, Shader, ShaderGenerator, CompilerOutput ) {


    var ShaderGeneratorOutput = function () {
        ShaderGenerator.call( this );
        this._stackShader = [ CompilerOutput.getDefaultRendering() ];
        this._indexShader = 0;
        this._onSameShader = true;
    };

    ShaderGeneratorOutput.prototype = MACROUTILS.objectInherit( ShaderGenerator.prototype, {
        getNextIndexShader: function () {
            return this._indexShader === ( this._stackShader.length - 1 ) ? 0 : this._indexShader + 1;
        },
        onSameShader: function () {
            this._onSameShader = true;
        },
        toNextShader: function () {
            this._indexShader = this.getNextIndexShader();
            this._onSameShader = false;
        },
        getNextShader: function () {
            return this._stackShader[ this.getNextIndexShader() ];
        },
        getCurrentShader: function () {
            return this._stackShader[ this._indexShader ];
        },
        addShader: function ( shaderEnum ) {
            this._stackShader.push( shaderEnum );
        },
        compileAllShaders: function ( hash, state, attributes, textureAttributes ) {
            var stack = this._stackShader;
            var nbStack = stack.length;
            for ( var i = 0, l = nbStack * 2; i < l; ++i ) {
                var frag1 = stack[ i % nbStack ];
                var frag2 = i < nbStack ? frag1 : stack[ ( i + 1 ) % nbStack ];
                var hashBlend = hash + frag1 + frag2;
                if ( this._cache[ hashBlend ] !== undefined )
                    continue;

                var shaderGen = new CompilerOutput( state, attributes, textureAttributes, this._scene );
                shaderGen.setOutputs( frag1, frag2 );

                var vertexshader = shaderGen.createVertexShader();
                var fragmentshader = shaderGen.createFragmentShader();

                var program = new Program(
                    new Shader( Shader.VERTEX_SHADER, vertexshader ),
                    new Shader( Shader.FRAGMENT_SHADER, fragmentshader ) );

                program.hash = hashBlend;
                program.activeUniforms = this.getActiveUniforms( state, attributes, textureAttributes );
                program.generated = true;
                this._cache[ hashBlend ] = program;
            }
        },
        getOrCreateProgram: function ( state ) {
            var frag2 = this.getNextShader();
            var frag1 = this._onSameShader === true ? frag2 : this.getCurrentShader();

            // extract valid attributes
            var hash = '';
            var attributes = [];
            var textureAttributes = [];
            hash += this.getActiveAttributeList( state, attributes );
            hash += this.getActiveTextureAttributeList( state, textureAttributes );

            var hashBlend = hash + frag1 + frag2;

            if ( this._cache[ hashBlend ] !== undefined ) {
                return this._cache[ hashBlend ];
            }

            this.compileAllShaders( hash, state, attributes, textureAttributes );
            return this._cache[ hashBlend ];
        }
    } );

    return ShaderGeneratorOutput;
} );
