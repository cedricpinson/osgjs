define( [
    'text!osgShadow/shaders/shadowsCastVert.glsl',
    'text!osgShadow/shaders/shadowsCastFrag.glsl',
    'text!osgShadow/shaders/shadowsReceive.glsl',
    'text!osgShadow/shaders/shadowLinearSoft.glsl',
    'text!osgShadow/shaders/pcfBand.glsl',
    'text!osgShadow/shaders/pcfTap.glsl',
    'text!osgShadow/shaders/pcfPoisson.glsl',
    'text!osgShadow/shaders/esm.glsl',
    'text!osgShadow/shaders/vsm.glsl',
    'text!osgShadow/shaders/evsm.glsl'
], function ( shadowsCastVert, shadowsCastFrag, shadowsReceive, shadowLinearSoft, pcfBand, pcfTap, pcfPoisson, esm, vsm, evsm ) {
    'use strict';

    return {
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive,
        'shadowLinearSoft.glsl': shadowLinearSoft,
        'pcfBand.glsl': pcfBand,
        'pcfTap.glsl': pcfTap,
        'pcfPoisson.glsl': pcfPoisson,
        'esm.glsl': esm,
        'vsm.glsl': vsm,
        'evsm.glsl': evsm
    };
} );