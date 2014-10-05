define( [
    'osgShader/Compiler',
    'osgShader/ShaderGenerator',
    'osgShader/ShaderGeneratorProxy',
    'osgShader/ShaderProcessor',
    'osgShader/node',
    'osgShader/utils'

], function ( Compiler,ShaderGenerator, ShaderGeneratorProxy,ShaderProcessor,node,utils  ) {

    'use strict';

    var lib = {};

    lib.Compiler = Compiler;
    lib.ShaderGenerator = ShaderGenerator;
    lib.ShaderGeneratorProxy = ShaderGeneratorProxy;
    lib.ShaderProcessor = ShaderProcessor;

    lib.node = node;
    lib.utils = utils;


    // set it to one to have verbose in shaders
    lib.debugShaderNode = true;


    return lib;
} );
