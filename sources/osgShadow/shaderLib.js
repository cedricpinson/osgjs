define( [
    'osgShadow/shaders/shadowsCastVert.glsl',
    'osgShadow/shaders/shadowsCastFrag.glsl',
    'osgShadow/shaders/shadowsReceive.glsl',
    'osgShadow/shaders/shadowLinearSoft.glsl',
    'osgShadow/shaders/bandPCF.glsl',
    'osgShadow/shaders/tapPCF.glsl',
    'osgShadow/shaders/hash.glsl',
    'osgShadow/shaders/arrayPoisson.glsl',
    'osgShadow/shaders/poissonPCF.glsl',
    'osgShadow/shaders/esm.glsl',
    'osgShadow/shaders/vsm.glsl',
    'osgShadow/shaders/evsm.glsl'
], function ( shadowsCastVert, shadowsCastFrag, shadowsReceive, shadowLinearSoft, bandPCF, tapPCF, hash, arrayPoisson, poissonPCF, esm, vsm, evsm ) {
    'use strict';

    return {
        'shadowsCastVert.glsl': shadowsCastVert,
        'shadowsCastFrag.glsl': shadowsCastFrag,
        'shadowsReceive.glsl': shadowsReceive,
        'shadowLinearSoft.glsl': shadowLinearSoft,
        'bandPCF.glsl': bandPCF,
        'tapPCF.glsl': tapPCF,
        'hash.glsl': hash,
        'arrayPoisson.glsl': arrayPoisson,
        'poissonPCF.glsl': poissonPCF,
        'esm.glsl': esm,
        'vsm.glsl': vsm,
        'evsm.glsl': evsm
    };
} );
