define( [
    'text!osgShader/node/functions.glsl',
    'text!osgShader/node/lights.glsl',
    'text!osgShader/node/textures.glsl'
], function ( functions, lights, textures ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures
    };
} );