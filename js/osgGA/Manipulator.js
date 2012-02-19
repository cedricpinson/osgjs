/** -*- compile-command: "jslint-cli Manipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

/** 
 *  Manipulator
 *  @class
 */
osgGA.Manipulator = function() {};

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
    touchDown: function(event) {},
    touchUp: function(event) {},
    touchMove: function(event) {},
    mousewheel: function(event, intDelta, deltaX, deltaY) {},
    getInverseMatrix: function () { return osg.Matrix.makeIdentity([]);}

};
