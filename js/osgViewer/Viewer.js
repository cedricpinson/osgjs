/** -*- compile-command: "jslint-cli Viewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */
(function() {


    // install an html console logger for mobile
    var optionsURL = function() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            var element = hash[0].toLowerCase();
            vars.push(element);
            var result = hash[1];
            if (result === undefined) {
                result = "1";
            }
            vars[element] = result.toLowerCase();

        }
        return vars;
    };

    var options = optionsURL();

    if (options.log === "html") {
        var logContent = [];
        var divLogger = document.createElement('div');
        var codeElement = document.createElement('pre');
        document.addEventListener("DOMContentLoaded", function() {
            document.body.appendChild(divLogger);
            divLogger.appendChild(codeElement);
        });
        var logFunc = function(str) {
            logContent.unshift(str);
            codeElement.innerHTML = logContent.join('\n');
        };
        divLogger.style.overflow="hidden";
        divLogger.style.position="absolute";
        divLogger.style.zIndex="10000";
        divLogger.style.height="100%";
        divLogger.style.maxWidth="600px";
        codeElement.style.overflow="scroll";
        codeElement.style.width="105%";
        codeElement.style.height="100%";
        codeElement.style.fontSize="10px";

        ["log", "error", "warn", "info", "debug"].forEach(function(value) {
            window.console[value] = logFunc;
        });
    }
    
})();

osgViewer.Viewer = function(canvas, options, error) {
    osgViewer.View.call(this);

    if (options === undefined) {
        options = {antialias : true};
    }

    if (osg.SimulateWebGLLostContext) {
        canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
        canvas.loseContextInNCalls(osg.SimulateWebGLLostContext);
    }

    gl = WebGLUtils.setupWebGL(canvas, options, error );
    var self = this;
    canvas.addEventListener("webglcontextlost", function(event) {
        self.contextLost();
        event.preventDefault();
    }, false);

    canvas.addEventListener("webglcontextrestored", function() {
        self.contextRestored();
    }, false);


    if (osg.reportWebGLError  || options.reportWebGLError) {
        gl = WebGLDebugUtils.makeDebugContext(gl);
    }


    if (gl) {
        this.setGraphicContext(gl);
        osg.init();
        this._canvas = canvas;
        this._frameRate = 60.0;
        osgUtil.UpdateVisitor = osg.UpdateVisitor;
        osgUtil.CullVisitor = osg.CullVisitor;
        this._urlOptions = true;

        this._mouseWheelEventNode = canvas;
        this._mouseEventNode = canvas;
        this._keyboardEventNode = document;
        this._gamepadEventNode = window;
        if (options) {
            if(options.mouseWheelEventNode){
                this._mouseWheelEventNode = options.mouseWheelEventNode;
            }
            if(options.mouseEventNode){
                this._mouseEventNode = options.mouseEventNode;
            }
            if(options.keyboardEventNode){
                this._keyboardEventNode = options.keyboardEventNode;
            }
            if(options.gamepadEventNode){
                this._gamepadEventNode = options.gamepadEventNode;
            }
        }

        this.setUpView(canvas);
    } else {
        throw "No WebGL implementation found";
    }
};


osgViewer.Viewer.prototype = osg.objectInehrit(osgViewer.View.prototype, {

    contextLost: function() {
        osg.log("webgl context lost");
        window.cancelRequestAnimFrame(this._requestID);
    },
    contextRestored: function() {
        osg.log("webgl context restored, but not supported - reload the page");
    },

    init: function() {
        this._done = false;
        this._state = new osg.State();

        var gl = this.getGraphicContext();
        this._state.setGraphicContext(gl);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this._updateVisitor = new osgUtil.UpdateVisitor();
        this._cullVisitor = new osgUtil.CullVisitor();

        this._renderStage = new osg.RenderStage();
        this._stateGraph = new osg.StateGraph();

        this._gamepad = false;
        this._gamepadPolling = false;

        if (this._urlOptions) {
            this.parseOptions();
        }

        this.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
    },
    getState: function() {
        // would have more sense to be in view
        // but I would need to put cull and draw on lower Object
        // in View or a new Renderer object
        return this._state;
    },
    parseOptions: function() {

        var optionsURL = function() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                var element = hash[0].toLowerCase();
                vars.push(element);
                var result = hash[1];
                if (result === undefined) {
                    result = "1";
                }
                vars[element] = result.toLowerCase();

            }
            return vars;
        };

        var options = optionsURL();

        if (options.stats === "1") {
            this.initStats(options);
        }

        if (options.gamepad !== "0") {
            this.initGamepad();
        }

        var gl = this.getGraphicContext();
        // not the best way to do it
        if (options.depth_test === "0") {
            this.getGraphicContext().disable(gl.DEPTH_TEST);
        }
        if (options.blend === "0") {
            this.getGraphicContext().disable(gl.BLEND);
        }
        if (options.cull_face === "0") {
            this.getGraphicContext().disable(gl.CULL_FACE);
        }
        if (options.light === "0") {
            this.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);
        }

    },

    initGamepad: function() {

        var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
        
        // || (navigator.userAgent.indexOf('Firefox/') != -1); // impossible to detect Gamepad API support in FF

        if (!gamepadSupportAvailable) return;

        // Use events available in FF when available at least in Nightlies:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=604039
        //
        // this._gamepadEventNode.addEventListener('MozGamepadConnected', function() { self.onGamepadConnect(); }, false);
        // this._gamepadEventNode.addEventListener('MozGamepadDisconnected', function() { self.onGamepadDisconnect(); }, false);

        // Chrome fallbacks to polling
        if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
            this.webkitStartGamepadPolling();
        }
    },

    webkitStartGamepadPolling:function() {
        var self = this;
        this._gamepadPolling = setInterval(function() { self.webkitGamepadPoll(); }, 500);
    },

    webkitGamepadPoll:function() {
        var self = this;

        var rawGamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;

        if (rawGamepads[0]) {
            if (!this._gamepad) {
                this.onGamepadConnect({gamepad:rawGamepads[0]});
            }
            this._gamepad = rawGamepads[0];
        } else if (this._gamepad) {
            this.onGamepadDisconnect({gamepad:this._gamepad});
        }
    },

    onGamepadConnect:function(evt) {
        this._gamepad=evt.gamepad;

        osg.log("Detected new gamepad!", this._gamepad);
    },

    onGamepadDisconnect:function(evt) {
        this._gamepad=false;

        osg.log("Gamepad disconnected", this._gamepad);
    },

    // Called in each frame
    updateGamepad:function() {

        var m = this.getManipulator();

        if (!m.gamepadaxes) return;

        if (this._gamepadPolling && this._gamepad) {
            this.webkitGamepadPoll();
        }
        
        // if (Math.random()>0.99) osg.warn(this._gamepad);

        if (this._gamepad) {
            m.gamepadaxes(this._gamepad.axes);

            // Dummy event wrapper
            var emptyFunc = function() {};
            for (var i=0;i<this._gamepad.buttons.length;i++) {
                if (this._gamepad.buttons[i]) {
                    m.gamepadbuttondown({
                        preventDefault:emptyFunc,
                        gamepad:this._gamepad,
                        button:i
                    },!!this._gamepad.buttons[i]);
                }
            }

        }
        

    },


    initStats: function(options) {

        var maxMS = 35;
        var stepMS = 5;
        var fontsize = 14;

        if (options.statsMaxMS !== undefined) {
            maxMS = parseInt(options.statsMaxMS,10);
        }
        if (options.statsStepMS !== undefined) {
            stepMS = parseInt(options.statsStepMS,10);
        }

        var createDomElements = function (elementToAppend) {
            var dom = [
                "<div id='StatsDiv' style='top: 0; position: absolute; width: 300px; height: 150px; z-index: 10;'>",

                "<div id='StatsCanvasDiv' style='position: relative;'>",
                "<canvas id='StatsCanvasGrid' width='300' height='150' style='z-index:-1; position: absolute; background: rgba(14,14,14,0.8); ' ></canvas>",
                "<canvas id='StatsCanvas' width='300' height='150' style='z-index:8; position: absolute;' ></canvas>",
                "<canvas id='StatsCanvasText' width='300' height='150' style='z-index:9; position: absolute;' ></canvas>",
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


            return {graph: document.getElementById("StatsCanvas"), text: document.getElementById("StatsCanvasText")};
        };

        if (this._canvasStats === undefined || this._canvasStats === null) {
            var  domStats = createDomElements();
            this._canvasStats = domStats.graph;
            this._canvasStatsText = domStats.text;
        }
        this._stats = new Stats.Stats(this._canvasStats, this._canvasStatsText);
        var that = this;
        this._frameRate = 1;
        this._frameTime = 0;
        this._updateTime = 0;
        this._cullTime = 0;
        this._drawTime = 0;
        this._stats.addLayer("#ff0fff", 120,
            function(t) { return (1000.0 / that._frameRate) ;},
            function(a) { return "FrameRate: " + (a).toFixed(0) + " fps";}  );

        this._stats.addLayer("#ffff00", maxMS,
            function(t) { return that._frameTime ;},
            function(a) { return "FrameTime: " + a.toFixed(2) + " ms";} );

        this._stats.addLayer("#d07b1f", maxMS,
            function(t) { return that._updateTime;},
            function(a) { return "UpdateTime: " + a.toFixed(2) + " ms";} );

        this._stats.addLayer("#73e0ff", maxMS,
            function(t) { return that._cullTime;},
            function(a) { return "CullTime: " + a.toFixed(2)+ " ms";} );

        this._stats.addLayer("#ff0000", maxMS,
            function(t) { return that._drawTime;},
            function(a) { return "DrawTime: " + a.toFixed(2) + " ms";} );

        if (window.performance && window.performance.memory && window.performance.memory.totalJSHeapSize)
            this._stats.addLayer("#00ff00", window.performance.memory.totalJSHeapSize*2,
                function(t) { return  that._memSize;},
                function(a) { return "Memory : " + a.toFixed(0) + " b";} );

    },

    update: function() {
        this.getScene().accept(this._updateVisitor);
    },
    cull: function() {
        // this part of code should be called for each view
        // right now, we dont support multi view
        this._stateGraph.clean();
        this._renderStage.reset();

        this._cullVisitor.reset();
        this._cullVisitor.setStateGraph(this._stateGraph);
        this._cullVisitor.setRenderStage(this._renderStage);
        var camera = this.getCamera();
        this._cullVisitor.pushStateSet(camera.getStateSet());
        this._cullVisitor.pushProjectionMatrix(camera.getProjectionMatrix());

        // update bound
        var bs = camera.getBound();

        var identity = osg.Matrix.makeIdentity([]);
        this._cullVisitor.pushModelviewMatrix(identity);

        if (this._light) {
            this._cullVisitor.addPositionedAttribute(this._light);
        }

        this._cullVisitor.pushModelviewMatrix(camera.getViewMatrix());
        this._cullVisitor.pushViewport(camera.getViewport());
        this._cullVisitor.setCullSettings(camera);

        this._renderStage.setClearDepth(camera.getClearDepth());
        this._renderStage.setClearColor(camera.getClearColor());
        this._renderStage.setClearMask(camera.getClearMask());
        this._renderStage.setViewport(camera.getViewport());

        //osg.CullVisitor.prototype.handleCullCallbacksAndTraverse.call(this._cullVisitor,camera);
        this.getScene().accept(this._cullVisitor);

        // fix projection matrix if camera has near/far auto compute
        this._cullVisitor.popModelviewMatrix();
        this._cullVisitor.popProjectionMatrix();
        this._cullVisitor.popViewport();
        this._cullVisitor.popStateSet();

        this._renderStage.sort();
    },
    draw: function() {
        var state = this.getState();
        this._renderStage.draw(state);

        // noticed that we accumulate lot of stack, maybe because of the stateGraph
        state.popAllStateSets();
        state.applyWithoutProgram();  //state.apply(); // apply default state (global)
    },

    frame: function() {
        var frameTime, beginFrameTime;
        frameTime = osg.performance.now();
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = 0;
        }
        this._frameRate = frameTime - this._lastFrameTime;
        this._lastFrameTime = frameTime;
        beginFrameTime = frameTime;

        var frameStamp = this.getFrameStamp();

        if (frameStamp.getFrameNumber() === 0) {
            frameStamp.setReferenceTime(frameTime/1000.0);
            this._numberFrame = 0;
        }

        frameStamp.setSimulationTime(frameTime/1000.0 - frameStamp.getReferenceTime());

        // setup framestamp
        this._updateVisitor.setFrameStamp(this.getFrameStamp());
        //this._cullVisitor.setFrameStamp(this.getFrameStamp());


        // Update Manipulator/Event
        // should be merged with the update of game pad below
        if (this.getManipulator()) {
            this.getManipulator().update(this._updateVisitor);
            osg.Matrix.copy(this.getManipulator().getInverseMatrix(), this.getCamera().getViewMatrix());
        }

        //TODO: does this belong here?
        // Not really, Input Device should be updated together.
        // I would merge this update with the update of the manipulator
        // just above
        if (this._gamepad) {
            this.updateGamepad();
        }


        if(this._stats === undefined) {
            // time the update
            this.update();
            this.cull();
            this.draw();
            frameStamp.setFrameNumber(frameStamp.getFrameNumber()+1);
            this._numberFrame++;
            this._frameTime = osg.performance.now() - beginFrameTime;
        }
        else{
            this._updateTime = osg.performance.now();
            this.update();
            this._updateTime =  osg.performance.now() - this._updateTime;


            this._cullTime =  osg.performance.now();
            this.cull();
            this._cullTime = osg.performance.now() - this._cullTime;

            this._drawTime =  osg.performance.now();
            this.draw();
            this._drawTime = osg.performance.now() - this._drawTime;

            frameStamp.setFrameNumber(frameStamp.getFrameNumber()+1);

            this._numberFrame++;
            this._frameTime = osg.performance.now() - beginFrameTime;

            if ( window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize)
                this._memSize = window.performance.memory.usedJSHeapSize;
            this._stats.update();
        }
    },

    setDone: function(bool) { this._done = bool; },
    done: function() { return this._done; },

    run: function() {
        var self = this;
        var render = function() {
            if (!self.done()) {
                self._requestID = window.requestAnimationFrame(render, self.canvas);
                self.frame();
            }
        };
        render();
    },

    setupManipulator: function(manipulator, dontBindDefaultEvent) {
        if (manipulator === undefined) {
            manipulator = new osgGA.OrbitManipulator();
        }

        if (manipulator.setNode !== undefined) {
            manipulator.setNode(this.getSceneData());
        } else {
            // for backward compatibility
            manipulator.view = this;
        }

        this.setManipulator(manipulator);

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

            //for ( var i = this.props.length, prop; i; ) {
            //    prop = this.props[ --i ];
            //    event[ prop ] = originalEvent[ prop ];
            //}

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
            if ( event.pageX === null && event.clientX !== null ) {
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

        if (dontBindDefaultEvent === undefined || dontBindDefaultEvent === false) {

            var disableMouse = false;

            var touchstart = function(ev)
            {
                //disableMouse = true;
                return viewer.getManipulator().touchstart(ev);
            };
            var touchend = function(ev)
            {
                //disableMouse = true;
                return viewer.getManipulator().touchend(ev);
            };
            var touchmove = function(ev)
            {
                //disableMouse = true;
                return viewer.getManipulator().touchmove(ev);
            };

            var touchcancel = function(ev)
            {
                //disableMouse = true;
                return viewer.getManipulator().touchcancel(ev);
            };

            var touchleave = function(ev)
            {
                //disableMouse = true;
                return viewer.getManipulator().touchleave(ev);
            };

            // iphone/ipad
            var gesturestart = function(ev)
            {
                return viewer.getManipulator().gesturestart(ev);
            };
            var gesturechange = function(ev)
            {
                return viewer.getManipulator().gesturechange(ev);
            };
            var gestureend = function(ev)
            {
                return viewer.getManipulator().gestureend(ev);
            };

            // touch events
            this._canvas.addEventListener("touchstart", touchstart, false);
            this._canvas.addEventListener("touchend", touchend, false);
            this._canvas.addEventListener("touchmove", touchmove, false);
            this._canvas.addEventListener("touchcancel", touchcancel, false);
            this._canvas.addEventListener("touchleave", touchleave, false);

            // iphone/ipad
            this._canvas.addEventListener("gesturestart", gesturestart, false);
            this._canvas.addEventListener("gesturechange", gesturechange, false);
            this._canvas.addEventListener("gestureend", gestureend, false);

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
                this._mouseEventNode.addEventListener("mousedown", mousedown, false);
            }
            if (viewer.getManipulator().mouseup) {
                this._mouseEventNode.addEventListener("mouseup", mouseup, false);
            }
            if (viewer.getManipulator().mousemove) {
                this._mouseEventNode.addEventListener("mousemove", mousemove, false);
            }
            if (viewer.getManipulator().dblclick) {
                this._mouseEventNode.addEventListener("dblclick", dblclick, false);
            }
            if (viewer.getManipulator().mousewheel) {
                this._mouseWheelEventNode.addEventListener("DOMMouseScroll", mousewheel, false);
                this._mouseWheelEventNode.addEventListener("mousewheel", mousewheel, false);
            }

            var keydown = function(ev) {return viewer.getManipulator().keydown(ev); };
            var keyup = function(ev) {return viewer.getManipulator().keyup(ev);};

            if (viewer.getManipulator().keydown) {
                this._keyboardEventNode.addEventListener("keydown", keydown, false);
            }
            if (viewer.getManipulator().keyup) {
                this._keyboardEventNode.addEventListener("keyup", keyup, false);
            }

            var self = this;
            var resize = function(ev) {
                var w = window.innerWidth;
                var h = window.innerHeight;

                var prevWidth = self._canvas.width;
                var prevHeight = self._canvas.height;
                self._canvas.width = w;
                self._canvas.height = h;
                self._canvas.style.width = w;
                self._canvas.style.height = h;
                osg.debug("window resize "  + prevWidth + "x" + prevHeight + " to " + w + "x" + h);
                var camera = self.getCamera();
                var vp = camera.getViewport();
                var widthChangeRatio = w/vp.width();
                var heightChangeRatio = h/vp.height();
                var aspectRatioChange = widthChangeRatio / heightChangeRatio;
                vp.setViewport(vp.x()*widthChangeRatio, vp.y()*heightChangeRatio, vp.width()*widthChangeRatio, vp.height()*heightChangeRatio);

                if (aspectRatioChange !== 1.0) {

                    osg.Matrix.postMult(osg.Matrix.makeScale(1.0, aspectRatioChange, 1.0 ,[]), camera.getProjectionMatrix());
                }
            };
            window.onresize = resize;
        }
    }
});
