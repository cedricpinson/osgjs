import { assert } from 'chai';
import Light from 'osg/Light';
import Material from 'osg/Material';
import Compiler from 'osgShader/Compiler';
import nodeFactory from 'osgShader/nodeFactory';
import ShadowReceiveAttribute from 'osgShadow/ShadowReceiveAttribute';
import ShadowTexture from 'osgShadow/ShadowTexture';

export default function() {
    test('Compiler', function() {
        (function() {
            var light = new Light(1);
            var shadowReceiveAttribute = new ShadowReceiveAttribute(light.getLightNumber());
            var shadowTexture = new ShadowTexture();
            shadowTexture.setLightNumber(light.getLightNumber());

            var material = new Material();
            var compiler = new Compiler(
                [light, material, shadowReceiveAttribute],
                [[shadowTexture]]
            );

            compiler._fragmentShaderMode = true;
            var root = compiler.createFragmentShaderGraph();

            var extensions = compiler.evaluateAndGatherField(root, 'getExtensions');
            assert.isOk(
                extensions.length === 1,
                'Compiler Evaluate And Gather Field: defines rightly so'
            );
            var defines = compiler.evaluateAndGatherField(root, 'getDefines');
            assert.isOk(
                defines.length === 1,
                'Compiler Evaluate And Gather Field: defines rightly so'
            );

            var globalDecl = compiler.evaluateGlobalVariableDeclaration(root);
            assert.isOk(globalDecl.length > 1, 'Compiler Evaluate Global Variables output smth');

            globalDecl = globalDecl.split('\n');
            var hasDuplicates = false;
            globalDecl.sort().filter(function(item, pos) {
                if (!hasDuplicates && item === globalDecl[pos - 1]) hasDuplicates = true;
                return !pos || item !== globalDecl[pos - 1];
            });
            assert.isOk(
                !hasDuplicates,
                'Compiler Evaluate Global Variables Declaration output no hasDuplicates'
            );

            globalDecl = compiler.evaluateGlobalFunctionDeclaration(root);
            assert.isOk(
                globalDecl.length > 1,
                'Compiler Evaluate Global Functions Declaration output smth'
            );

            var nodes = nodeFactory._nodes;
            var abstractNodeList = [];
            var variableNodeList = [];
            var realNodeList = [];
            nodes.forEach(function(value /*, key, map*/) {
                var instance = Object.create(value.prototype);
                value.apply(instance);
                var t = instance.getType();

                if (
                    instance.getName() === 'Variable' ||
                    (instance.isUnique && instance.isUnique())
                ) {
                    variableNodeList.push(instance);
                } else if (t && t !== '') {
                    realNodeList.push(t);
                } else {
                    abstractNodeList.push(instance);
                }
            });

            assert.isOk(
                abstractNodeList.length === 1,
                'Abstract Shader Node count OK. (error here means if you added an abstract node that you need to change the number here, or if you added a new node, you forgot to add a unique type for its class MANDATORY)'
            );

            //
            var realNodeListUniq = realNodeList.sort().filter(function(item, pos) {
                return !pos || item !== realNodeList[pos - 1];
            });
            assert.isOk(
                realNodeListUniq.length === realNodeList.length,
                'Shader Node Type string duplicate check (type must be unique, MANDATORY for compilation)'
            );
        })();
    });
}
