define( [
    'text!osgShader/node/functions.glsl',
    'text!osgShader/node/lights.glsl',
    'text!osgShader/node/textures.glsl',
    'text!osgShader/node/floatrgbacodec.glsl',
    'text!osgShader/node/shadowsCastVert.glsl',
    'text!osgShader/node/shadowsCastFrag.glsl',
    'text!osgShader/node/shadowsReceive.glsl'
], function ( functions, lights, textures, floatCodec, shadowsCastVert, shadowsCastFrag, shadowsReceive ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures,
        'floatrgbacodec.glsl': floatCodec,
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive
    };
} );
