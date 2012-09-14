/** -*- compile-command: "jslint-cli Manipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  Manipulator
 *  @class
 */
osgGA.Manipulator = function() {
    this._touches = [];

    this._inverseMatrix = new Array(16);
    osg.Matrix.makeIdentity(this._inverseMatrix);
};

/** @lends osgGA.Manipulator.prototype */
osgGA.Manipulator.prototype = {
    getPositionRelativeToCanvas: function(e) {
        var myObject = e.target;
        var posx,posy;
	if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
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
    },

    /**
       Method called when a keydown event is triggered
        @type KeyEvent
     */
    keydown: function(event) {},
    /**
       Method called when a keyup event is triggered
       @type KeyEvent
     */
    keyup: function(event) {},
    mouseup: function(event) {},
    mousedown: function(event) {},
    mousemove: function(event) {},
    dblclick: function(event) {},

    touchstart: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            this._touches[id] = touch;
            // relative to element position
            var rte = this.getPositionRelativeToCanvas(touch);
            osg.debug("touch " + id + " started at " + rte[0] + " " + rte[1] );
        }
    },
    touchend: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            this._touches[id] = undefined;
            // relative to element position
            var rte = this.getPositionRelativeToCanvas(touch);
            osg.debug("touch " + id + " stoped at " + rte[0] + " " + rte[1] );
        }
    },
    touchmove: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            // relative to element position
            var rteCurrent = this.getPositionRelativeToCanvas(touch);
            var rtePrevious = this.getPositionRelativeToCanvas(this._touches[id]);
            var deltax = rteCurrent[0] - rtePrevious[0];
            var deltay = rteCurrent[1] - rtePrevious[1];
            this._touches[id] = touch;
            osg.debug("touch " + id + " moved " + deltax + " " + deltay);
        }
    },
    touchleave: function(event) {
        return this.touchend(event);
    },
    touchcancel: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            this._touches[id] = undefined;
            var rte = this.getPositionRelativeToCanvas(touch);
            osg.debug("touch " + id + " cancelled at " + rte[0] + " " + rte[1] );
        }
    },
    gesturestart: function(event) {
        event.preventDefault();
        osg.debug("gesturestart  scale " + event.scale + " rotation " + event.rotation);
    },
    gestureend: function(event) {
        event.preventDefault();
        osg.debug("gestureend  scale " + event.scale + " rotation " + event.rotation);
    },
    gesturechange: function(event) {
        event.preventDefault();
        osg.debug("gesturechange scale " + event.scale + " rotation " + event.rotation);
    },


    mousewheel: function(event, intDelta, deltaX, deltaY) {
        event.preventDefault();
        osg.debug("mousewheel " + intDelta + " " + " " + deltaX + " " + deltaY );
    },

    // The node visitor let you get information during the traverse time.
    // it contains a FrameStamp object

    // setReferenceTime = function(s) { startSimulation = s; };
    // setSimulationTime = function(s) { currentSimulation = s; };
    // getReferenceTime = function() { return startSimulation; };
    // getSimulationTime = function() { return currentSimulation; };
    // setFrameNumber = function(n) { frame = n; };
    // getFrameNumber = function() { return frame; };

    // eg: var currentTime = nv.getFrameStamp().getSimulationTime();
    update: function(nv) {
    },

    getInverseMatrix: function () { 
        return this._inverseMatrix;
    }

};
