define( [
    'text!osgShadow/shaders/shadowsCastVert.glsl',
    'text!osgShadow/shaders/shadowsCastFrag.glsl',
    'text!osgShadow/shaders/shadowsReceive.glsl',
    'text!osgShadow/shaders/shadowLinearSoft.glsl',
    'text!osgShadow/shaders/bandPCF.glsl',
    'text!osgShadow/shaders/tapPCF.glsl',
    'text!osgShadow/shaders/poissonPCF.glsl',
    'text!osgShadow/shaders/esm.glsl',
    'text!osgShadow/shaders/vsm.glsl',
    'text!osgShadow/shaders/evsm.glsl'
], function ( shadowsCastVert, shadowsCastFrag, shadowsReceive, shadowLinearSoft, bandPCF, tapPCF, poissonPCF, esm, vsm, evsm ) {
    'use strict';

    return {
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive,
        'shadowLinearSoft.glsl': shadowLinearSoft,
        'bandPCF.glsl': bandPCF,
        'tapPCF.glsl': tapPCF,
        'poissonPCF.glsl': poissonPCF,
        'esm.glsl': esm,
        'vsm.glsl': vsm,
        'evsm.glsl': evsm
    };
} );
