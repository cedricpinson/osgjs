define( [
    'osgShader/node/functions.glsl',
    'osgShader/node/lights.glsl',
    'osgShader/node/skinning.glsl',
    'osgShader/node/textures.glsl',
    'osgShader/node/colorEncode.glsl',
    'osgShader/node/noise.glsl'
], function ( functions, lights, skinning, textures, colorEncode, noise ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'skinning.glsl': skinning,
        'textures.glsl': textures,
        'colorEncode.glsl': colorEncode,
        'noise.glsl': noise
    };
} );
