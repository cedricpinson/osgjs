define( [
    'text!osgShader/shaderNode/functions.glsl',
    'text!osgShader/shaderNode/lights.glsl',
//    'text!osgShader/shaderNode/operations.glsl',
    'text!osgShader/shaderNode/textures.glsl'
], function ( functions, lights, textures ) {

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
//        'operations.glsl': operations,
        'textures.glsl': textures,
        'prefix': 'osgShader/shaderNode/'
    };

});
