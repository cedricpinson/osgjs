/** -*- compile-command: "jslint-cli Object.js" -*- */

/** 
 *  Object class
 *  @class Object
 */
osg.Object = function () {};

/** @lends osg.Node.prototype */
osg.Object.prototype = {
    setName: function(name) { this._name = name; },
    getName: function() { return this._name; }
};
