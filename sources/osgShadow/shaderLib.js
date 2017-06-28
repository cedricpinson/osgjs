'use strict';
var shadowCast = require('osgShadow/shaders/shadowCast.glsl');
var shadowReceive = require('osgShadow/shaders/shadowReceive.glsl');
var shadowLinearSoft = require('osgShadow/shaders/shadowLinearSoft.glsl');
var floatFromTex = require('osgShadow/shaders/floatFromTex.glsl');
var tapPCF = require('osgShadow/shaders/tapPCF.glsl');

module.exports = {
    'shadowCast.glsl': shadowCast,
    'shadowReceive.glsl': shadowReceive,
    'shadowLinearSoft.glsl': shadowLinearSoft,
    'floatFromTex.glsl': floatFromTex,
    'tapPCF.glsl': tapPCF
};
