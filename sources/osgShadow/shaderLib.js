'use strict';
var shadowsCastFrag = require( 'osgShadow/shaders/shadowsCastFrag.glsl' );
var shadowsReceive = require( 'osgShadow/shaders/shadowsReceive.glsl' );
var shadowsReceiveMain = require( 'osgShadow/shaders/shadowsReceiveMain.glsl' );
var shadowLinearSoft = require( 'osgShadow/shaders/shadowLinearSoft.glsl' );
var pcf = require( 'osgShadow/shaders/pcf.glsl' );
var tapPCF = require( 'osgShadow/shaders/tapPCF.glsl' );
var hash = require( 'osgShadow/shaders/hash.glsl' );

module.exports = {
    'shadowsCastFrag.glsl': shadowsCastFrag,
    'shadowsReceive.glsl': shadowsReceive,
    'shadowsReceiveMain.glsl': shadowsReceiveMain,
    'shadowLinearSoft.glsl': shadowLinearSoft,
    'pcf.glsl': pcf,
    'tapPCF.glsl': tapPCF,
    'hash.glsl': hash
};
