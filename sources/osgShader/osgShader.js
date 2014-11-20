define( [
    'osgShader/Compiler',
    'osgShader/ShaderGenerator',
    'osgShader/ShaderGeneratorProxy',
    'osgShader/ShaderProcessor',
    'osgShader/node',
    'osgShader/utils'

], function ( Compiler, ShaderGenerator, ShaderGeneratorProxy, ShaderProcessor, node, utils ) {

    'use strict';

    var osgShader = {};

    osgShader.Compiler = Compiler;
    osgShader.ShaderGenerator = ShaderGenerator;
    osgShader.ShaderGeneratorProxy = ShaderGeneratorProxy;
    osgShader.ShaderProcessor = ShaderProcessor;

    osgShader.node = node;
    osgShader.utils = utils;


    // set it to one to have verbose in shaders
    osgShader.debugShaderNode = true;


    return osgShader;
} );
