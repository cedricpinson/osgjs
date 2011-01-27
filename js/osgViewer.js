/** -*- compile-command: "jslint-cli osgViewer.js" -*-
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
        gl = canvas.getContext("experimental-webgl", {alpha: true, antialias : true });
        osg.init();
    } catch(e) {
        alert("Could not initialise WebGL, sorry :-(" + e);
        return;
    }

    this.canvas = canvas;
    this.frameRate = 60.0;
    osgUtil.UpdateVisitor = osg.UpdateVisitor;
    osgUtil.CullVisitor = osg.CullVisitorNew;
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
        this.view.setProjectionMatrix(osg.Matrix.makePerspective(60, ratio, 1.0, 1000.0));

        this.view.light = new osg.Light();
        this.view.getOrCreateStateSet().setAttributeAndMode(new osg.Material());

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


        this.updateVisitor = new osgUtil.UpdateVisitor();
        this.cullVisitor = new osgUtil.CullVisitor();

        this.renderStage = new osg.RenderStage();
        this.stateGraph = new osg.StateGraph();
        this.renderStage.setViewport(this.view.getViewport());

        //this.cullTime;
        //this.frameTime;
        //this.drawTime;
    },

    update: function() {
        this.view.accept(this.updateVisitor);
    },
    cull: function() {
        this.stateGraph.clean();
        this.renderStage.reset();

        this.cullVisitor.reset();
        this.cullVisitor.setStateGraph(this.stateGraph);
        this.cullVisitor.setRenderStage(this.renderStage);

        //this.renderStage.setViewport(this.view.getClearDepth());
        this.renderStage.setClearDepth(this.view.getClearDepth());
        this.renderStage.setClearColor(this.view.getClearColor());
        this.renderStage.setClearMask(this.view.getClearMask());

        this.view.accept(this.cullVisitor);
    },
    draw: function() {
        this.state.applyWithoutProgram();
        this.renderStage.draw(this.state);
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
        if (this.scene === undefined) {
            this.scene = new osg.Node();
        }
        this.view.addChild(this.scene);
        var that = this;
        var call = function() {
            that.frame();
        };
        var t = Math.floor(1.0/this.frameRate*1000.0);
        osg.log("run loop at " + this.frameRate + " fps");
        setInterval( call , t);
    }, 

    getManipulator: function() { return this.manipulator; },
    setupManipulator: function(manipulator, dontBindDefaultEvent) {
        if (manipulator === undefined) {
            manipulator = new osgGA.OrbitManipulator();
        }

        this.manipulator = manipulator;
        this.manipulator.view = this.view;

        var that = this;
        this.manipulator.convertEventToCanvas = function(e) {
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

        if (dontBindDefaultEvent === undefined || dontBindDefaultEvent === false) {

            var disableMouse = false;

            var touchDown = function(ev)
            {
                disableMouse = true;
                return Viewer.getManipulator().touchDown(ev);
            };
            var touchUp = function(ev)
            {
                disableMouse = true;
                return Viewer.getManipulator().touchUp(ev);
            };
            var touchMove = function(ev)
            {
                disableMouse = true;
                return Viewer.getManipulator().touchMove(ev);
            };

            document.addEventListener("MozTouchDown", touchDown, false);
            document.addEventListener("MozTouchUp", touchUp, false);
            document.addEventListener("MozTouchMove", touchMove, false);

            jQuery(this.canvas).bind( {
                mousedown: function(ev) {
                    if (disableMouse === false) {
                        return manipulator.mousedown(ev);
                    }
                },
                mouseup: function(ev) {
                    if (disableMouse === false) {
                        return manipulator.mouseup(ev);
                    }
                },
                mousemove: function(ev) {
                    if (disableMouse === false) {
                        return manipulator.mousemove(ev);
                    }
                },
                dblclick: function(ev) {
                    if (disableMouse === false) {
                        return manipulator.dblclick(ev);
                    }
                }
            });

            if (true) {
                if (jQuery(document).mousewheel !== undefined) {
                    jQuery(document).mousewheel(function(objEvent, intDelta, deltaX, deltaY) {
	                if (intDelta > 0){
                            manipulator.distanceDecrease();
	                }
	                else if (intDelta < 0){
                            manipulator.distanceIncrease();
	                }
                        return false;
	            });
                }
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
    }
};
