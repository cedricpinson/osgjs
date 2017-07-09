'use strict';

// from require to global var
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;

// http://dev.opera.com/articles/w3c-device-orientation-usage/#practicalconsiderations
var orientationInfo = {};

var onDeviceOrientationChangeEvent = function(rawEvtData) {
    orientationInfo.deviceOrientation = rawEvtData;
};

var onScreenOrientationChangeEvent = function() {
    // do not get that event at all
    orientationInfo.screenOrientation = window.orientation || 0;
};

window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);

var degtorad = Math.PI / 180.0; // Degree-to-Radian conversion

// device orientation to 3x3 matrix
function getBaseRotationMatrix(alpha, beta, gamma) {
    var _x = beta ? beta * degtorad : 0; // beta value
    var _y = gamma ? gamma * degtorad : 0; // gamma value
    var _z = alpha ? alpha * degtorad : 0; // alpha value

    var cX = Math.cos(_x);
    var cY = Math.cos(_y);
    var cZ = Math.cos(_z);
    var sX = Math.sin(_x);
    var sY = Math.sin(_y);
    var sZ = Math.sin(_z);

    //
    // ZXY-ordered rotation matrix construction.
    //

    var m11 = cZ * cY - sZ * sX * sY;
    var m12 = -cX * sZ;
    var m13 = cY * sZ * sX + cZ * sY;

    var m21 = cY * sZ + cZ * sX * sY;
    var m22 = cZ * cX;
    var m23 = sZ * sY - cZ * cY * sX;

    var m31 = -cX * sY;
    var m32 = sX;
    var m33 = cX * cY;

    return [m11, m12, m13, m21, m22, m23, m31, m32, m33];
}

//screen orientation to 3x3 matrix
function getScreenTransformationMatrix(screenOrientation) {
    var orientationAngle = screenOrientation ? screenOrientation * degtorad : 0;

    var cA = Math.cos(orientationAngle);
    var sA = Math.sin(orientationAngle);

    // Construct our screen transformation matrix
    var rS = [cA, -sA, 0, sA, cA, 0, 0, 0, 1];
    return rS;
}
// rotate 90 on X
function getWorldTransformationMatrix(angleDeg, axis) {
    var x = angleDeg * degtorad;

    var cA = Math.cos(x);
    var sA = Math.sin(x);

    // Construct our world transformation matrix
    var r;
    if (axis[0]) {
        r = [1, 0, 0, 0, cA, -sA, 0, sA, cA];
    } else if (axis[1]) {
        r = [cA, 0, -sA, 0, 1, 0, -sA, 0, cA];
    } else if (axis[2]) {
        r = [cA, -sA, 0, sA, cA, 0, 0, 0, 1];
    }
    return r;
}

function matrixMultiply(a, b) {
    var final = [];

    final[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    final[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    final[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    final[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    final[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    final[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];

    final[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    final[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    final[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];

    return final;
}

function computeMatrix() {
    orientationInfo.screenOrientation = window.orientation || 0;

    var rotationMatrix = getBaseRotationMatrix(
        orientationInfo.deviceOrientation.alpha,
        orientationInfo.deviceOrientation.beta,
        orientationInfo.deviceOrientation.gamma
    ); // R

    var screenTransform = getScreenTransformationMatrix(orientationInfo.screenOrientation); // r_s
    var screenAdjustedMatrix = matrixMultiply(rotationMatrix, screenTransform); // R_s

    var worldTransform = getWorldTransformationMatrix(90, osg.vec3.fromValues(1, 0, 0)); // r_X
    var finalMatrix = matrixMultiply(screenAdjustedMatrix, worldTransform);
    return finalMatrix; // [ m11, m12, m13, m21, m22, m23, m31, m32, m33 ]
}

var main = function() {
    // The 3D canvas.
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
        _inv: [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
        _deviceMatrix: new Float32Array(16),
        _inverseDeviceMatrix: new Float32Array(16),
        cameraUpdate: function(/*currentTime, node, nv*/) {
            if (orientationInfo.deviceOrientation) {
                this._deviceMatrix = computeMatrix();
                var m = this._deviceMatrix;
                // [ m11, m12, m13, m21, m22, m23, m31, m32, m33 ]
                //to
                // [ m11, m12, m13, 0.0, m21, m22, m23, 0.0, m31, m32, m33, 0.0, 0.0, 0.0, 0.0,  1.0]
                this._inv = [
                    m[0],
                    m[1],
                    m[2],
                    0.0,
                    m[3],
                    m[4],
                    m[5],
                    0.0,
                    m[6],
                    m[7],
                    m[8],
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    1.0
                ];

                osg.mat4.invert(this._inverseDeviceMatrix, this._inv);

                osg.mat4.copy(viewer.getCamera().getViewMatrix(), this._inverseDeviceMatrix);
            }
        },
        lightUpdate: function(currentTime, node /*, nv*/) {
            // for all light on our mainNode (the root of our scen)
            for (i = 0; i < numLights; i++) {
                var l = node.lights[i];
                var n = node.lightSources[i];
                var fac = 5;
                var x = fac * Math.cos(currentTime + i / numLights);
                var y = fac * Math.sin(currentTime + i / numLights);

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
        },
        update: function(node, nv) {
            var currentTime = nv.getFrameStamp().getSimulationTime();

            this.cameraUpdate(currentTime, node, nv);
            this.lightUpdate(currentTime, node, nv);

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
    //viewer.setupManipulator();
    viewer.run();
};
// Wait for it
window.addEventListener('load', main, true);
