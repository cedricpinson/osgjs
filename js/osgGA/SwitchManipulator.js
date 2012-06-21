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
        if (!this._currentManipulator) {
            return;
        }
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
    touchDown: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchDown(ev);
        }
    },
    touchUp: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchUp(ev);
        }
    },
    touchMove: function(ev) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.touchMove(ev);
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

