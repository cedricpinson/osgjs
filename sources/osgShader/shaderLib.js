define( [
    'text!osgShader/node/functions.glsl',
    'text!osgShader/node/lights.glsl',
    'text!osgShader/node/textures.glsl',
    'text!osgShader/node/colorEncode.glsl',
    'text!osgShader/node/shadowsCastVert.glsl',
    'text!osgShader/node/shadowsCastFrag.glsl',
    'text!osgShader/node/shadowsReceive.glsl'
], function ( functions, lights, textures, colorEncode, shadowsCastVert, shadowsCastFrag, shadowsReceive ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures,
        'colorEncode.glsl': colorEncode,
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive
    };
} );