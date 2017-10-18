import Light from 'osg/Light';
import LightSource from 'osg/LightSource';
import { mat4 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Node from 'osg/Node';
import Shape from 'osg/shape';
import ShadowedScene from 'osgShadow/ShadowedScene';
import ShadowSettings from 'osgShadow/ShadowSettings';
import ShadowMap from 'osgShadow/ShadowMap';

var addScene = function(rootNode, count, shadows, culling) {
    var groundSubNode;
    var groundSize = 75 / count;

    var root = new Node();
    var ground = Shape.createTexturedQuadGeometry(0, 0, 0, groundSize, 0, 0, 0, groundSize, 0);
    for (var wG = 0; wG < count; wG++) {
        for (var wH = 0; wH < count; wH++) {
            var groundSubNodeTrans = new MatrixTransform();
            groundSubNodeTrans.setMatrix(
                mat4.fromTranslation(groundSubNodeTrans.getMatrix(), [
                    wG * groundSize - 100,
                    wH * groundSize - 100,
                    -5.0
                ])
            );
            // only node are culled in CullVisitor frustum culling
            groundSubNode = new Node();
            groundSubNode.setCullingActive(culling);
            groundSubNode.setName('groundSubNode_' + wG + '_' + wH);
            groundSubNodeTrans.addChild(ground);
            groundSubNodeTrans.setCullingActive(culling);
            groundSubNode.addChild(groundSubNodeTrans);
            root.addChild(groundSubNode);
        }
    }
    root.setCullingActive(culling);

    if (shadows) {
        var lightNew = new Light(0);
        lightNew._enabled = true;
        // light source is a node handling the light
        var lightSourcenew = new LightSource();
        lightSourcenew.setLight(lightNew);
        var lightNodeModelNodeParent = new MatrixTransform();
        lightNodeModelNodeParent.addChild(lightSourcenew);
        rootNode.getOrCreateStateSet().setAttributeAndModes(lightNew);
        rootNode.addChild(lightNodeModelNodeParent);
        // setting light, each above its cube
        lightNodeModelNodeParent.setMatrix(mat4.fromTranslation(mat4.create(), [-10, -10, 10]));
        var shadowedScene = new ShadowedScene();
        shadowedScene.addChild(root);
        var shadowSettings = new ShadowSettings();
        shadowSettings.setLight(lightNew);
        var shadowMap = new ShadowMap(shadowSettings);
        shadowedScene.addShadowTechnique(shadowMap);
        shadowMap.setShadowSettings(shadowSettings);
        rootNode.addChild(shadowedScene);
    } else {
        rootNode.addChild(root);
    }
};

export default {
    addScene: addScene
};
