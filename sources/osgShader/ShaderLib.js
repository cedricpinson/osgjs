define( [
    'text!osgShader/shaderNode/functions.glsl',
    'text!osgShader/shaderNode/lights.glsl',
    'text!osgShader/shaderNode/textures.glsl'
], function ( functions, lights, textures ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures
    };
});
