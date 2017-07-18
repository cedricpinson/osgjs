'use strict';

var common = require('osgShader/node/common.glsl');
var functions = require('osgShader/node/functions.glsl');
var lightCommon = require('osgShader/node/lightCommon.glsl');
var lights = require('osgShader/node/lights.glsl');
var skinning = require('osgShader/node/skinning.glsl');
var morphing = require('osgShader/node/morphing.glsl');
var textures = require('osgShader/node/textures.glsl');
var colorEncode = require('osgShader/node/colorEncode.glsl');
var billboard = require('osgShader/node/billboard.glsl');

module.exports = {
    'common.glsl': common,
    'functions.glsl': functions,
    'lightCommon.glsl': lightCommon,
    'lights.glsl': lights,
    'skinning.glsl': skinning,
    'morphing.glsl': morphing,
    'textures.glsl': textures,
    'colorEncode.glsl': colorEncode,
    'billboard.glsl': billboard
};
