define( [
    'text!osgShadow/shaders/shadowsCastVert.glsl',
    'text!osgShadow/shaders/shadowsCastFrag.glsl',
    'text!osgShadow/shaders/shadowsReceive.glsl'
], function ( shadowsCastVert, shadowsCastFrag, shadowsReceive ) {
    'use strict';

    return {
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive
    };
} );