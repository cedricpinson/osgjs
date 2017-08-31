'use strict';

var PooledResource = function(createFunction) {
    this._createFunction = createFunction;
    this._pool = [];
    this._length = 0;
};

PooledResource.prototype = {
    clean: function() {
        this._pool.length = 0;
        this._length = 0;
    },
    getLength: function() {
        return this._length;
    },
    reset: function() {
        this._length = 0;
    },
    getOrCreateObject: function() {
        var obj;
        if (this._length === this._pool.length) {
            obj = this._createFunction();
            this._pool.push(obj);
        } else {
            obj = this._pool[this._length];
        }
        this._length++;
        return obj;
    },
    forEach: function(func) {
        for (var i = 0; i < this._length; i++) func(this._pool[i]);
    }
};

module.exports = PooledResource;
