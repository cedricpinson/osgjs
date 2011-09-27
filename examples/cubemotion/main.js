/** -*- compile-command: "jslint-cli main.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */



var main = function() {
    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var stats = document.getElementById("Stats");

    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true, alpha: true });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();

        var mousedown = function(ev) {
            ev.stopPropagation();
        };
        document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

    } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }
};


var TransitionUpdateCallback = function(target) { this._target = target};
TransitionUpdateCallback.prototype = {

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;
        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;

        var m = node.getMatrix();
        var current = [];
        osg.Matrix.getTrans(m, current);
        var target = this._target;
        var dx = target[0] - current[0];
        var dy = target[1] - current[1];
        var dz = target[2] - current[2];

        var speedSqr = dx*dx + dy*dy + dz*dz;
        var maxSpeed = 10.0;
        var maxSpeedSqr = maxSpeed*maxSpeed;
        if (speedSqr > maxSpeedSqr) {
            var quot = maxSpeed/Math.sqrt(speedSqr);
            dx *= quot;
            dy *= quot;
            dz *= quot;
        }
        //osg.log("speed " + Math.sqrt(dx*dx + dy*dy + dz*dz) );
        
        var ratio = osgAnimation.EaseInQuad(Math.min((t-node._start)/2.0, 1.0));
        current[0] += dx * dt * ratio;
        current[1] += dy * dt * ratio;
        current[2] += dz * dt * ratio;

        osg.Matrix.makeRotate((t-node._start) * ratio, node._axis[0], node._axis[1], node._axis[2] ,m);
        osg.Matrix.setTrans(m, current[0], current[1], current[2]);
        return true;
    }
};


function createScene() {
    var root = new osg.Node();
    var group = new osg.MatrixTransform();


    var size = [2,2,2];
    var model = osg.createTexturedBoxGeometry(0,0,0,
                                              size[0], size[1], size[2]);

    var target = new osg.MatrixTransform();
    target.addChild(model);
    var material = new osg.Material();
    material.setDiffuse([1,0,0,1]);
    target.getOrCreateStateSet().setAttributeAndMode(material);

    var maxx = 10;
    var maxy = 2;

    var cb = new TransitionUpdateCallback([0,0,0]);
    var center = [8,0,40];
    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr = new osg.MatrixTransform();
            var rx = x*size[0] - maxx*size[0]*0.5 + center[0];
            var ry = 0 + center[1];
            var rz = y*size[2] - maxy*size[2]*0.5 + center[2];
            mtr.setMatrix(osg.Matrix.makeTranslate(rx,ry,rz,[]));
            mtr.addChild(model);
            group.addChild(mtr);
            mtr.addUpdateCallback(cb);
            var t = (x + y*maxx)*0.1;
            mtr._lastUpdate = t;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random()];
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }

    //group.setMatrix();
    root.addChild(group);

    
    root.addChild(target);

    return root;
}



window.addEventListener("load", main ,true);
