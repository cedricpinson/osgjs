'use strict';
var StackPool = function() {
    this._globalDefault = undefined;
    this._lastApplied = undefined;
    this._changed = false;

    this._values = [];
    this._back = undefined;
    this._length = 0;
};

StackPool.prototype = {
    push: function(value) {
        if (this._length === this._values.length) {
            this._values.push(value);
        } else {
            this._values[this._length] = value;
        }
        this._back = value;
        this._length++;
    },
    pop: function() {
        var values = this._values;
        if (!this._length) return undefined;
        this._length--;
        var value = values[this._length];
        this._back = this._length ? values[this._length - 1] : undefined;
        return value;
    }
};

module.exports = StackPool;
