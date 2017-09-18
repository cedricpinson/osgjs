'use strict';
var StackObjectPairPool = function() {
    this._globalDefault = undefined;
    this._lastApplied = undefined;
    this._changed = false;

    this._values = [];
    this._back = undefined;
    this._length = 0;
};

StackObjectPairPool.prototype = {
    getLength: function() {
        return this._length;
    },
    push: function(object, value) {
        var objectPair;
        if (this._length === this._values.length) {
            objectPair = { object: object, value: value };
            this._values.push(objectPair);
        } else {
            objectPair = this._values[this._length];
            objectPair.object = object;
            objectPair.value = value;
        }
        this._back = objectPair;
        this._length++;
    },
    pop: function() {
        if (!this._length) return undefined;
        var values = this._values;
        this._length--;
        var objectPair = values[this._length];
        this._back = this._length ? values[this._length - 1] : undefined;
        return objectPair;
    }
};
module.exports = StackObjectPairPool;
