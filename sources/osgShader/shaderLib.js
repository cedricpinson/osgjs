define( [
    'osgShader/node/functions.glsl',
    'osgShader/node/lights.glsl',
    'osgShader/node/textures.glsl',
    'osgShader/node/colorEncode.glsl'
], function ( functions, lights, textures, colorEncode ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures,
        'colorEncode.glsl': colorEncode
    };
} );
