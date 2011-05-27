osg.StateAttribute = function() {
    this._dirty = true;
};
osg.StateAttribute.prototype = {
    isDirty: function() { return this._dirty; },
    dirty: function() { this._dirty = true; }
};

osg.StateAttribute.OFF = 0;
osg.StateAttribute.ON = 1;
osg.StateAttribute.OVERRIDE = 2;
osg.StateAttribute.PROTECTED = 4;
osg.StateAttribute.INHERIT = 8;
