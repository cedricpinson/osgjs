'use strict';

var PooledResource = function(createFunction) {
    this._createFunction = createFunction;
    this._pool = [];
    this.length = 0;
};

PooledResource.prototype = {
    clean: function() {
        this._pool.length = 0;
        this.length = 0;
    },
    reset: function() {
        this.length = 0;
    },
    getOrCreateObject: function() {
        var obj;
        if (this.length === this._pool.length) {
            obj = this._createFunction();
            this._pool.push(obj);
        } else {
            obj = this._pool[this.length];
        }
        this.length++;
        return obj;
    }
};

module.exports = PooledResource;
