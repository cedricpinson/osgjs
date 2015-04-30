define( [
    'osgShader/node/functions.glsl',
    'osgShader/node/lights.glsl',
    'osgShader/node/skeletal.glsl',
    'osgShader/node/textures.glsl',
    'osgShader/node/colorEncode.glsl'
], function ( functions, lights, skeletal, textures, colorEncode ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'skeletal.glsl': skeletal,
        'textures.glsl': textures,
        'colorEncode.glsl': colorEncode
    };
} );
