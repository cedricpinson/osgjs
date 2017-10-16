import shadowCast from 'osgShadow/shaders/shadowCast.glsl';
import shadowReceive from 'osgShadow/shaders/shadowReceive.glsl';
import shadowLinearSoft from 'osgShadow/shaders/shadowLinearSoft.glsl';
import floatFromTex from 'osgShadow/shaders/floatFromTex.glsl';
import tapPCF from 'osgShadow/shaders/tapPCF.glsl';

export default {
    'shadowCast.glsl': shadowCast,
    'shadowReceive.glsl': shadowReceive,
    'shadowLinearSoft.glsl': shadowLinearSoft,
    'floatFromTex.glsl': floatFromTex,
    'tapPCF.glsl': tapPCF
};
