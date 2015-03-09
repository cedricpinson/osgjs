define( [
    'tests/osgShader/Compiler',
    'tests/osgShader/ShaderGenerator',
], function ( Compiler, ShaderGenerator ) {

    return function () {
        Compiler();
        ShaderGenerator();
    };
} );
