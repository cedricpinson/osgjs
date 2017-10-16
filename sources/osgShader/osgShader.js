import Compiler from 'osgShader/Compiler';
import ShaderGenerator from 'osgShader/ShaderGenerator';
import ShaderGeneratorProxy from 'osgShader/ShaderGeneratorProxy';
import ShaderProcessor from 'osgShader/ShaderProcessor';
import nodeFactory from 'osgShader/nodeFactory';
import Node from 'osgShader/node/Node';
import utils from 'osgShader/utils';

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

export default lib;
