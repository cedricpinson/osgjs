define( [
    'text!osgShader/node/functions.glsl',
    'text!osgShader/node/lights.glsl',
    'text!osgShader/node/textures.glsl',
    'text!osgShader/node/colorEncode.glsl'
], function ( functions, lights, textures, colorEncode ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures,
        'colorEncode.glsl': colorEncode
    };
} );