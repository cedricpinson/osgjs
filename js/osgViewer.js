/** -*- compile-command: "jslint-cli osgViewer.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var osgViewer = {};

osgViewer.Viewer = function(canvas) {
    gl = WebGLUtils.setupWebGL(canvas, {antialias : true} );
    if (gl) {
        this.gl = gl;
        osg.init();
        this.canvas = canvas;
        this.frameRate = 60.0;
        osgUtil.UpdateVisitor = osg.UpdateVisitor;
        osgUtil.CullVisitor = osg.CullVisitor;
        this.urlOptions = true;
    } else {
        throw "No WebGL implementation found";
    }
};


osgViewer.Viewer.prototype = {
    getScene: function() { return this.scene; },
    setScene: function(scene) {
        this.root.removeChildren();
        this.root.addChild( scene );
        this.scene = scene;
    },

    init: function() {
        this.root = new osg.Node();
        this.state = new osg.State();
        this.view = new osg.View();
        this.view.addChild(this.root);

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

        if (this.urlOptions) {
            this.parseOptions();
        }
    },

    parseOptions: function() {

        var optionsURL = function() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        };
        
        var options = optionsURL();

        if (options['stats'] === "1" || options['STATS'] === "1" || options['Stats'] === "1" ) {
            this.initStats(options);
        }

        // not the best way to do it
        if (options['DEPTH_TEST'] === "0") {
            gl.disable(gl.DEPTH_TEST);
        }
        if (options['BLEND'] === "0") {
            gl.disable(gl.BLEND);
        }
        if (options['CULL_FACE'] === "0") {
            gl.disable(gl.CULL_FACE);
        }
        if (options['LIGHT'] === "0") {
            delete this.view.light;
        }

         
    },

    initStats: function(options) {

        var maxMS = 50;
        var stepMS = 10;
        var fontsize = 14;

        if (options['statsMaxMS'] !== undefined) {
            maxMS = parseInt(options['statsMaxMS']);
        }
        if (options['statsStepMS'] !== undefined) {
            stepMS = parseInt(options['statsStepMS']);
        }

        var createDomElements = function (elementToAppend) {
            var dom = [
                "<div id='StatsDiv' style='float: left; position: relative; width: 300px; height: 150; z-index: 10;'>",
                "<div id='StatsLegends' style='position: absolute; left: 0px; font-size: " + fontsize +"px;color: #ffffff;'>",

                "<div id='frameRate' style='color: #00ff00;' > frameRate </div>",
                "<div id='frameTime' style='color: #ffff00;' > frameTime </div>",
                "<div id='updateTime' style='color: #d07b1f;'> updateTime </div>",
                "<div id='cullTime' style='color: #73e0ff;'> cullTime </div>",
                "<div id='drawTime' style='color: #ff0000;'> drawTime </div>",
                "<div id='fps'> </div>",
                
                "</div>",

                "<div id='StatsCanvasDiv' style='position: relative;'>",
                "<canvas id='StatsCanvasGrid' width='300' height='150' style='z-index:-1; position: absolute; background: rgba(14,14,14,0.8); ' ></canvas>",
                "<canvas id='StatsCanvas' width='300' height='150' style='z-index:8; position: absolute;' ></canvas>",
                "<canvas id='StatsCanvasFps' width='30' height='15' style='z-index:9; position: absolute; top: 130px' ></canvas>",
                "</div>",

                "</div>"
            ].join("\n");
            if (elementToAppend === undefined) {
                elementToAppend = "body";
            }
            jQuery(dom).appendTo(elementToAppend);
            var grid = document.getElementById("StatsCanvasGrid");
            var ctx = grid.getContext("2d");
            ctx.clearRect(0,0,grid.width, grid.height);

            var step = Math.floor(maxMS/stepMS).toFixed(0);
            var r = grid.height/step;
            ctx.strokeStyle = "rgb(70,70,70)";
            for (var i = 0, l = step; i < l; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i*r);
                ctx.lineTo(grid.width, i*r);
                ctx.stroke();
            }

            // setup the font for fps
            var cfps = document.getElementById("StatsCanvasFps");
            var ctx = cfps.getContext("2d");
            ctx.font = "14px Sans";

            return document.getElementById("StatsCanvas");
        };

        if (this.canvasStats === undefined || this.canvasStats === null) {
            this.canvasStats = createDomElements();
        }
        this.stats = new Stats.Stats(this.canvasStats);
        var that = this;
        this.frameRate = 1;
        this.frameTime = 0;
        this.updateTime = 0;
        this.cullTime = 0;
        this.drawTime = 0;
        var height = this.canvasStats.height;
        var ratio = height / maxMS;
        height = height - 2;
        this.stats.addLayer(jQuery("#frameRate").css("color"), function(t) { 
            var v = (height)/60.0 * (1000/that.frameRate);
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(jQuery("#frameTime").css("color"), function(t) { 
            var v = that.frameTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(jQuery("#updateTime").css("color"), function(t) { 
            var v = that.updateTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(jQuery("#cullTime").css("color"), function(t) { 
            var v = that.cullTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(jQuery("#drawTime").css("color"), function(t) { 
            var v = that.drawTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
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
        var frameTime, beginFrameTime;
        frameTime = (new Date()).getTime();
        if (this.lastFrameTime === undefined) {
            this.lastFrameTime = 0;
        }
        this.frameRate = frameTime - this.lastFrameTime;
        this.lastFrameTime = frameTime;
        beginFrameTime = frameTime;

        if (this.updateVisitor.getFrameStamp().getFrameNumber() === 0) {
            this.updateVisitor.getFrameStamp().setReferenceTime(frameTime/1000.0);
            this.numberFrame = 0;
        }

        this.updateVisitor.getFrameStamp().setSimulationTime(frameTime/1000.0 - this.updateVisitor.getFrameStamp().getReferenceTime());

        if (this.manipulator) {
            this.view.setViewMatrix(this.manipulator.getInverseMatrix());
        }

        // time the update
        var updateTime = (new Date()).getTime();
        this.update();

        var cullTime = (new Date()).getTime();
        updateTime = cullTime - updateTime;
        this.updateTime = updateTime;

        this.cull();
        var drawTime = (new Date()).getTime();
        cullTime = drawTime - cullTime;
        this.cullTime = cullTime;

        this.draw();
        drawTime = (new Date()).getTime() - drawTime;
        this.drawTime = drawTime;

        var f = this.updateVisitor.getFrameStamp().getFrameNumber()+1;
        this.updateVisitor.getFrameStamp().setFrameNumber(f);

        this.numberFrame++;
        var endFrameTime = (new Date()).getTime();

        this.frameTime = (new Date()).getTime() - beginFrameTime;
        if (this.stats !== undefined) {
            this.stats.update();

            if (this.numberFrame % 60 === 0.0) {
                var nd = endFrameTime;
                var diff = nd - this.statsStartTime;
                var fps = (this.numberFrame*1000/diff).toFixed(1);
                this.statsStartTime = nd;
                this.numberFrame = 0;

                var cfps = document.getElementById("StatsCanvasFps");
                var ctx = cfps.getContext("2d");
                ctx.clearRect(0,0,cfps.width, cfps.height);
                ctx.fillStyle = "rgb(255,255,255)";
                ctx.fillText(fps, 0, cfps.height);
            }
        }
    },

    run: function() {
        var that = this;
        var render = function() {
            window.requestAnimationFrame(render, this.canvas);
            that.frame();
        };
        render();
    },

    getManipulator: function() { return this.manipulator; },
    setupManipulator: function(manipulator, dontBindDefaultEvent) {
        if (manipulator === undefined) {
            manipulator = new osgGA.OrbitManipulator();
        }

        if (manipulator.setNode !== undefined) {
            manipulator.setNode(this.root);
        } else {
            // for backward compatibility
            manipulator.view = this.view;
        }

        this.manipulator = manipulator;

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
            
            if (manipulator.keydown !== undefined) {
                jQuery(document).bind({'keydown': function(event) {
                    return manipulator.keydown(event);
                }});
            }
        }
    }
};
