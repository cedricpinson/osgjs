'use strict';

// from require to global var
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

// Wait for it
var main = function() {
    var canvas = document.getElementById('View');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var viewer;

    // We create  boxes and ground which will be lighted
    var group = new osg.MatrixTransform();
    var size = 5;
    var ground = osg.createTexturedBoxGeometry(0, 0, -5, 400, 400, 0.1);
    group.addChild(ground);
    ground = osg.createTexturedBoxGeometry(-10, -10, 0, size, size, size);
    group.addChild(ground);
    ground = osg.createTexturedBoxGeometry(10, -10, 0, size, size, size);
    group.addChild(ground);
    ground = osg.createTexturedBoxGeometry(-10, 10, 0, size, size, size);
    group.addChild(ground);
    ground = osg.createTexturedBoxGeometry(10, 10, 0, size, size, size);
    group.addChild(ground);

    // 3 light for 4 boxes and a ground
    var i,
        numLights = 3;

    // That's where we update lights direction at each frame
    var LightUpdateCallback = function() {};
    LightUpdateCallback.prototype = {
        update: function(node, nv) {
            var currentTime = nv.getFrameStamp().getSimulationTime();

            // for all light on our mainNode (the root of our scen)
            for (i = 0; i < numLights; i++) {
                var l = node.lights[i];
                var n = node.lightSources[i];
                var fac = 5;
                var x = fac * Math.cos(currentTime + i / numLights);
                var y = fac * Math.sin(currentTime + i / numLights);
                //var h = fac;

                //  GENERIC Code getting direction
                //var lightPos = l.getPosition();
                var lightPos = l._position;

                var lightTarget = osg.vec4.fromValues(x, y, 1, 1);
                var lightDir = osg.vec3.sub(osg.vec3.create(), lightPos, lightTarget);
                osg.vec3.normalize(lightDir, lightDir);

                var up = osg.vec3.fromValues(0, 0, -1); //   camera up
                // Check it's not coincident with lightdir
                if (Math.abs(osg.vec3.dot(up, lightDir)) >= 1.0) {
                    // another camera up
                    this.up = osg.vec3.fromValues(0, 1, 0);
                }

                // that part is just for updating the 'debug' axis node
                // you can comment it and ligths will still rotates
                var lightMatrix = n.getMatrix();
                osg.mat4.lookAt(lightMatrix, lightPos, lightTarget, up);
                osg.mat4.invert(lightMatrix, lightMatrix);

                // that's where we actually update the light
                l.setDirection(lightDir);
            }
            node.traverse(nv);
        }
    };

    var mainNode = new osg.Node();
    // branch the callback
    mainNode.addUpdateCallback(new LightUpdateCallback());

    // just handy variables to keep tersm to light
    // you could also give it as paramters to the updatecallback
    // or even retrieve theme in the graph inside the callback
    mainNode.lights = [];
    mainNode.lightSources = [];
    mainNode.lightPos = [];
    // the lights themselves
    for (i = 0; i < numLights; i++) {
        // Important the paramater is the light
        // unit slot.
        // if you want to overwrite a light
        // on a node under by attachine a light
        // use the same slot.
        var lightnew = new osg.Light(i);

        // pretty spotlight fallof showing
        // clearly directions
        lightnew.setSpotCutoff(25);
        lightnew.setSpotBlend(1.0);
        lightnew.setConstantAttenuation(0);
        lightnew.setLinearAttenuation(0.005);
        lightnew.setQuadraticAttenuation(0);
        lightnew.setName('light' + i);
        lightnew._enabled = true;

        // lightsource is a node handling the light
        var lightSourcenew = new osg.LightSource();
        lightSourcenew.setName('lightNode' + i);
        lightSourcenew.setLight(lightnew);

        // node helping positionnning the light
        var lightNodemodelNodeParent = new osg.MatrixTransform();

        // debug node showing light pos
        var lightNodemodelAxis = osg.createAxisGeometry();
        var lightNodemodelNode = new osg.MatrixTransform();
        lightNodemodelNode.addChild(lightNodemodelAxis);
        lightNodemodelNodeParent.addChild(lightNodemodelNode);
        lightNodemodelNodeParent.addChild(lightSourcenew);
        mainNode.addChild(lightNodemodelNodeParent);

        // position at 0, as position set by the parent 'positionner' node
        lightnew.setPosition([0, 0, 0, 1]);

        // Important: set the light as attribute so that it's inherted by all node under/attacherd the mainNode
        mainNode.getOrCreateStateSet().setAttributeAndModes(lightnew);

        // store commmodity pointers
        mainNode.lights.push(lightnew);
        mainNode.lightSources.push(lightNodemodelNode);
        mainNode.lightPos.push(lightNodemodelNodeParent);
    }

    // setting light, each above its cube
    mainNode.lightPos[0].setMatrix(
        osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(-10, -10, 10))
    );
    mainNode.lightPos[1].setMatrix(
        osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(10, -10, 10))
    );
    mainNode.lightPos[2].setMatrix(
        osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(10, 10, 10))
    );

    // Each light has a channel for visual debug

    // red light
    mainNode.lights[0].setAmbient(osg.vec4.fromValues(0.0, 0, 0.0, 1.0));
    mainNode.lights[0].setDiffuse(osg.vec4.fromValues(1.0, 0, 0.0, 1.0));
    mainNode.lights[0].setSpecular(osg.vec4.fromValues(1.0, 0, 0.0, 1.0));

    //gree light
    mainNode.lights[1].setAmbient(osg.vec4.fromValues(0.0, 0.0, 0.0, 1.0));
    mainNode.lights[1].setDiffuse(osg.vec4.fromValues(0.0, 1.0, 0.0, 1.0));
    mainNode.lights[1].setSpecular(osg.vec4.fromValues(0.0, 1.0, 0.0, 1.0));

    // blue light
    mainNode.lights[2].setAmbient(osg.vec4.fromValues(0.0, 0.0, 0.0, 1.0));
    mainNode.lights[2].setDiffuse(osg.vec4.fromValues(0.0, 0.0, 1.0, 1.0));
    mainNode.lights[2].setSpecular(osg.vec4.fromValues(0.0, 0.0, 1.0, 1.0));

    mainNode.addChild(group);

    // The viewer
    viewer = new osgViewer.Viewer(canvas);
    viewer.init();
    // we'll do it ourself
    viewer.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);
    viewer.setSceneData(mainNode);
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener('load', main, true);
