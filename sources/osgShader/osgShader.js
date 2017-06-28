'use strict';
var Compiler = require('osgShader/Compiler');
var ShaderGenerator = require('osgShader/ShaderGenerator');
var ShaderGeneratorProxy = require('osgShader/ShaderGeneratorProxy');
var ShaderProcessor = require('osgShader/ShaderProcessor');
var nodeFactory = require('osgShader/nodeFactory');
var Node = require('osgShader/node/Node');
var utils = require('osgShader/utils');

var lib = {};

lib.Compiler = Compiler;
lib.ShaderGenerator = ShaderGenerator;
lib.ShaderGeneratorProxy = ShaderGeneratorProxy;
lib.ShaderProcessor = ShaderProcessor;
lib.nodeFactory = nodeFactory;
lib.utils = utils;

lib.node = {};
lib.node.Node = Node; // used for inheritance
nodeFactory._nodes.forEach(function(value, key) {
    lib.node[key] = value;
});

// debug utility: set it to one to have verbose in shaders
lib.debugShaderNode = false;
/*develblock:start*/
lib.debugShaderNode = true;
/*develblock:end*/

module.exports = lib;
