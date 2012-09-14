/** -*- compile-command: "jslint-cli Object.js" -*- */

/** 
 *  Object class
 *  @class Object
 */
osg.Object = function () {
    this._name = undefined;
    this._userdata = undefined;
};

/** @lends osg.Object.prototype */
osg.Object.prototype = {
    className: function() { return this._className; },
    setName: function(name) { this._name = name; },
    getName: function() { return this._name; },
    setUserData: function(data) { this._userdata = data; },
    getUserData: function() { return this._userdata; }
};
