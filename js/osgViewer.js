/** -*- compile-command: "jslint-cli init.js" -*-
 *
 * Copyright (C) 2010 Cedric Pinson
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var osgViewer = {};

osgViewer.Viewer = function(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl", {antialias : true});
        //gl = canvas.getContext("experimental-webgl");
        osg.init();
    } catch(e) {
        alert("Could not initialise WebGL, sorry :-(" + e);
        return;
    }

    this.canvas = canvas;

};


osgViewer.Viewer.prototype = {
    getScene: function() { return this.scene; },
    setScene: function(scene) { this.scene = scene; },
    init: function() {
        this.state = new osg.State();
        this.view = new osg.View();

        var ratio = this.canvas.width/this.canvas.height;
        this.view.setViewport(new osg.Viewport(0,0, this.canvas.width, this.canvas.height));
        this.view.setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0]));
        this.view.setProjectionMatrix(osg.Matrix.makePerspective(60, ratio, 0.1, 100.0));

        this.view.light = new osg.Light();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.updateVisitor = new osg.UpdateVisitor();
        this.cullVisitor = new osg.CullVisitor();

        //this.cullTime;
        //this.frameTime;
        //this.drawTime;
    },

    update: function() {
        this.view.accept(this.updateVisitor);
    },
    cull: function() {
        this.cullVisitor.reset();
        this.view.accept(this.cullVisitor);
    },
    draw: function() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.cullVisitor.renderBin.drawImplementation(this.state);
    },

    frame: function() {
        var frameTime;
        frameTime = (new Date()).getTime();

        if (this.updateVisitor.getFrameStamp().getFrameNumber() === 0) {
            this.updateVisitor.getFrameStamp().setReferenceTime(frameTime/1000.0);
            this.numberFrame = 0;
        }

        this.updateVisitor.getFrameStamp().setSimulationTime(frameTime/1000.0 - this.updateVisitor.getFrameStamp().getReferenceTime());

        if (this.manipulator) {
            this.view.setViewMatrix(this.manipulator.getInverseMatrix());
        }

        this.update();
        this.cull();
        this.draw();

        var f = this.updateVisitor.getFrameStamp().getFrameNumber()+1;
        this.updateVisitor.getFrameStamp().setFrameNumber(f);

        this.numberFrame++;
        var endFrameTime = (new Date()).getTime();

        frameTime = endFrameTime - frameTime;
        if (this.numberFrame % 60 === 0.0) {
            /* Run a test. */
            var nd = endFrameTime;
            var diff = nd - this.statsStartTime;

            jQuery("#fps").text(this.numberFrame/(diff/1000));
            this.statsStartTime = nd;
            this.numberFrame = 0;
        }

    },

    run: function() {
        if (this.scene !== undefined) {
            this.view.addChild(this.scene);
        }
        var that = this;
        setInterval( function() { that.frame(); }
                     , 16);
    }, 

    setupManipulator: function() {

        var manipulator = new osgGA.OrbitManipulator();
        this.manipulator = manipulator;
        var that = this;
        var convertEventToCanvas = function(e) {
            var myObject = that.canvas;
            var posx,posy;
	    if (e.pageX || e.pageY) {
	        posx = e.pageX;
	        posy = e.pageY;
	    }
	    else if (e.clientX || e.clientY) {
	        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	    }

            var divGlobalOffset = function(obj) {
                var x=0, y=0;
                x = obj.offsetLeft;
                y = obj.offsetTop;
                var body = document.getElementsByTagName('body')[0];
                while (obj.offsetParent && obj!=body){
                    x += obj.offsetParent.offsetLeft;
                    y += obj.offsetParent.offsetTop;
                    obj = obj.offsetParent;
                }
                return [x,y];
            };
	    // posx and posy contain the mouse position relative to the document
	    // Do something with this information
            var globalOffset = divGlobalOffset(myObject);
            posx = posx - globalOffset[0];
            posy = myObject.height-(posy - globalOffset[1]);
            return [posx,posy];
        };

        jQuery(this.canvas).bind( {
            mousedown: function(ev) {
                manipulator.panning = true;
                manipulator.dragging = true;
                var pos = convertEventToCanvas(ev);
                manipulator.clientX = pos[0];
                manipulator.clientY = pos[1];
                manipulator.pushButton();
            },
            mouseup: function(ev) {
                manipulator.dragging = false;
                manipulator.panning = false;
                manipulator.releaseButton();
            },
            mousemove: function(ev) {
                var scaleFactor;
                var curX;
                var curY;
                var deltaX;
                var deltaY;
                var pos = convertEventToCanvas(ev);
                curX = pos[0];
                curY = pos[1];

                scaleFactor = 10.0;
                deltaX = (manipulator.clientX - curX) / scaleFactor;
                deltaY = (manipulator.clientY - curY) / scaleFactor;
                manipulator.clientX = curX;
                manipulator.clientY = curY;

                if (manipulator.dragging || manipulator.panning) {
                    manipulator.update(deltaX, deltaY);
                }
            },
            dblclick: function(ev) {
                if (manipulator.currentMode === "drag") {
                    manipulator.currentMode = "pan";
                } else {
                    manipulator.currentMode = "drag";
                }
            }
        });

        if (false) {
            jQuery(document).mousewheel(function(objEvent, intDelta) {
	        if (intDelta > 0){
                    view.manipulator.distanceIncrease();
	        }
	        else if (intDelta < 0){
                    view.manipulator.distanceDecrease();
	        }
	    });
        }

        if (true) {
            jQuery(document).bind({'keydown' : function(event) {
                if (event.keyCode === 33) { // pageup
                    manipulator.distanceIncrease();
                    return false;
                } else if (event.keyCode === 34) { //pagedown
                    manipulator.distanceDecrease();
                    return false;
                }
            }});
        }
    }
};
