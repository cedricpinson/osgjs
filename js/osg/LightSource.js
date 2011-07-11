/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  LightSource is a positioned node to use with StateAttribute Light
 *  @class LightSource
 */
osg.LightSource = function() {
    osg.Node.call(this);
    this._light = undefined;
};

/** @lends osg.LightSource.prototype */
osg.LightSource.prototype = osg.objectInehrit(osg.Node.prototype, {
    getLight: function() { return this._light; },
    setLight: function(light) { this._light = light; }
});
osg.LightSource.prototype.objectType = osg.objectType.generate("LightSource");
