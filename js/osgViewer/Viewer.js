/** -*- compile-command: "jslint-cli Viewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */


osgViewer.Viewer = function(canvas, options) {
    if (options === undefined) {
        options = {antialias : true};
    }

    gl = WebGLUtils.setupWebGL(canvas, options );
    if (gl) {
        this.gl = gl;
        osg.init();
        this.canvas = canvas;
        this.frameRate = 60.0;
        osgUtil.UpdateVisitor = osg.UpdateVisitor;
        osgUtil.CullVisitor = osg.CullVisitor;
        this.urlOptions = true;

        this.mouseWheelEventNode = canvas;
        this.eventNode = document;
        if (options && options.mouseWheelEventNode) {
            this.mouseWheelEventNode = options.mouseWheelEventNode;
        }

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
            var parent;
            if (elementToAppend === undefined) {
                parent = document.body;
                //elementToAppend = "body";
            } else {
                parent = document.getElementById(elementToAppend);
            }

            //jQuery(dom).appendTo(elementToAppend);
            var mydiv = document.createElement('div');
            mydiv.innerHTML = dom;
            parent.appendChild(mydiv);

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
        var getStyle = function(el,styleProp)
        {
	    var x = document.getElementById(el);
	    if (x.style) {
		return x.style.getPropertyValue(styleProp);
            }
            return null;
        };
        this.stats.addLayer(getStyle("frameRate","color"), function(t) { 
            var v = (height)/60.0 * (1000/that.frameRate);
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("frameTime", "color"), function(t) { 
            var v = that.frameTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("updateTime","color"), function(t) { 
            var v = that.updateTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("cullTime","color"), function(t) { 
            var v = that.cullTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("drawTime","color"), function(t) { 
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
        this.renderStage.draw(this.state);

        // noticed that we accumulate lot of stack, maybe because of the stateGraph
        this.state.popAllStateSets();
        // should not be necessary because of dirty flag now in attrubutes
        //this.state.applyWithoutProgram();
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
        var viewer = this;
	var fixEvent = function( event ) {

	    //if ( event[ expando ] ) {
		//return event;
	    //}

	    // store a copy of the original event object
	    // and "clone" to set read-only properties

            // nop
	    //var originalEvent = event;
	    //event = jQuery.Event( originalEvent );

	    for ( var i = this.props.length, prop; i; ) {
		prop = this.props[ --i ];
		event[ prop ] = originalEvent[ prop ];
	    }

	    // Fix target property, if necessary
	    if ( !event.target ) {
		event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
	    }

	    // check if target is a textnode (safari)
	    if ( event.target.nodeType === 3 ) {
		event.target = event.target.parentNode;
	    }

	    // Add relatedTarget, if necessary
	    if ( !event.relatedTarget && event.fromElement ) {
		event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
	    }

	    // Calculate pageX/Y if missing and clientX/Y available
	    if ( event.pageX == null && event.clientX != null ) {
		var doc = document.documentElement, body = document.body;
		event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
		event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
	    }

	    // Add which for key events
	    if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) ) {
		event.which = event.charCode || event.keyCode;
	    }

	    // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
	    if ( !event.metaKey && event.ctrlKey ) {
		event.metaKey = event.ctrlKey;
	    }

	    // Add which for click: 1 === left; 2 === middle; 3 === right
	    // Note: button is not normalized, so don't use it
	    if ( !event.which && event.button !== undefined ) {
		event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
	    }

	    return event;
	};

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
                return viewer.getManipulator().touchDown(ev);
            };
            var touchUp = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchUp(ev);
            };
            var touchMove = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchMove(ev);
            };

            // touch events
            this.canvas.addEventListener("MozTouchDown", touchDown, false);
            this.canvas.addEventListener("MozTouchUp", touchUp, false);
            this.canvas.addEventListener("MozTouchMove", touchMove, false);

            // mouse
            var mousedown = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousedown(ev);
                }
            };
            var mouseup = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mouseup(ev);
                }
            };
            var mousemove = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousemove(ev);
                }
            };
            var dblclick = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().dblclick(ev);
                }
            };
            var mousewheel = function (event) 
            {
                if (disableMouse === false) {
                    // from jquery
                    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
                    //event = $.event.fix(orgEvent);
                    event.type = "mousewheel";
                    
                    // Old school scrollwheel delta
                    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
                    if ( event.detail     ) { delta = -event.detail/3; }
                    
                    // New school multidimensional scroll (touchpads) deltas
                    deltaY = delta;
                    
                    // Gecko
                    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
                        deltaY = 0;
                        deltaX = -1*delta;
                    }
                    
                    // Webkit
                    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
                    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
                    // Add event and delta to the front of the arguments
                    args.unshift(event, delta, deltaX, deltaY);
                    var m = viewer.getManipulator();
                    return m.mousewheel.apply(m, args);
                }
            };

            if (viewer.getManipulator().mousedown) {
                this.eventNode.addEventListener("mousedown", mousedown, false);
            }
            if (viewer.getManipulator().mouseup) {
                this.eventNode.addEventListener("mouseup", mouseup, false);
            }
            if (viewer.getManipulator().mousemove) {
                this.eventNode.addEventListener("mousemove", mousemove, false);
            }
            if (viewer.getManipulator().dblclick) {
                this.eventNode.addEventListener("dblclick", dblclick, false);
            }
            if (viewer.getManipulator().mousewheel) {
                this.canvas.addEventListener("DOMMouseScroll", mousewheel, false);
                this.canvas.addEventListener("mousewheel", mousewheel, false);
            }

            var keydown = function(ev) {return viewer.getManipulator().keydown(ev); };
            var keyup = function(ev) {return viewer.getManipulator().keyup(ev);};

            if (viewer.getManipulator().keydown) {
                this.eventNode.addEventListener("keydown", keydown, false);
            }
            if (viewer.getManipulator().keyup) {
                this.eventNode.addEventListener("keyup", keyup, false);
            }
        }
    }
};
