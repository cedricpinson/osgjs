/** -*- compile-command: "jslint-cli SwitchManipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  OrbitManipulator
 *  @class
 */
osgGA.SwitchManipulator = function () {
    osgGA.Manipulator.call(this);
    this._manipulatorList = [];
    this._currentManipulator = undefined;
};

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.SwitchManipulator.prototype = osg.objectInehrit(osgGA.Manipulator.prototype, {
    update: function(nv) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.update(nv);
        }
    },
    setNode: function (node) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator.setNode === undefined) {
            osg.log("manipulator has not setNode method");
            return;
        }
        manipulator.setNode(node);
    },
    getNumManipulator: function () {
        return this._manipulatorList.length;
    },
    addManipulator: function (manipulator) {
        this._manipulatorList.push(manipulator);
        if (this._currentManipulator === undefined) {
            this._currentManipulator = 0;
        }
    },
    getManipulatorList: function () {
        return this._manipulatorList;
    },
    setManipulatorIndex: function (index) {
        this._currentManipulator = index;
    },
    getCurrentManipulatorIndex: function() {
        return this._currentManipulator;
    },
    getCurrentManipulator: function () {
        var manipulator = this._manipulatorList[this._currentManipulator];
        return manipulator;
    },
    reset: function() {
        this.getCurrentManipulator().reset();
    },
    computeHomePosition: function() {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            manipulator.computeHomePosition();
        }
    },
    /**
       Method called when a keydown event is triggered
        @type KeyEvent
     */
    keydown: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.keydown(ev);
        }
    },
    /**
       Method called when a keyup event is triggered
       @type KeyEvent
     */
    keyup: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.keyup(ev);
        }
    },
    mouseup: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.mouseup(ev);
        }
    },
    mousedown: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.mousedown(ev);
        }
    },
    mousemove: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.mousemove(ev);
        }
    },
    dblclick: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.dblclick(ev);
        }
    },
    touchstart: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchstart(ev);
        }
    },
    touchend: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchend(ev);
        }
    },
    touchmove: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchmove(ev);
        }
    },

    touchleave: function(event) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchleave(event);
        }
    },
    touchcancel: function(event) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchcancel(event);
        }
    },

    gesturestart: function(event) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.gesturestart(event);
        }
    },
    gestureend: function(event) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.gestureend(event);
        }
    },
    gesturechange: function(event) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.gesturechange(event);
        }
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.mousewheel(ev, intDelta, deltaX, deltaY);
        }
    },
    getInverseMatrix: function () {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.getInverseMatrix();
        }
    }
});

