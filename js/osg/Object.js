/** -*- compile-command: "jslint-cli Object.js" -*- */

/**
 *  Object class
 *  @class Object
 */
osg.Object = function () {
    this._name = undefined;
    this._userdata = undefined;
    this._instanceID = osg.Object.getInstanceID();
};

/** @lends osg.Object.prototype */
osg.Object.prototype = osg.objectLibraryClass(
    {
        getInstanceID: function() { return this._instanceID; },
        setName: function(name) { this._name = name; },
        getName: function() { return this._name; },
        setUserData: function(data) { this._userdata = data; },
        getUserData: function() { return this._userdata; }
    },
    "osg","Object");


// get an instanceID for each object
(function() {
    var instanceID = 0;
    osg.Object.getInstanceID = function() {
        instanceID += 1;
        return instanceID;
    };
})();
