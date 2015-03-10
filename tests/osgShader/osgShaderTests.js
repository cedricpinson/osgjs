define( [
    'tests/osgShader/Compiler',
    'tests/osgShader/ShaderGenerator',
], function ( Compiler, ShaderGenerator ) {

    'use strict';

    return function () {
        Compiler();
        ShaderGenerator();
    };
} );
