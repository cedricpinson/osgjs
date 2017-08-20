'use strict';

var PooledArray = function() {
    this._pool = [];
    this.length = 0;
};

PooledArray.prototype = {
    clean: function() {
        this.length = 0;
        this._pool.length = 0;
    },
    reset: function() {
        this.length = 0;
    },
    getArray: function() {
        return this._pool;
    },
    back: function() {
        return this._pool[this.length - 1];
    },
    pop: function() {
        this.length--;
        return this._pool[this.length];
    },
    push: function(value) {
        if (this.length === this._pool.length) {
            this._pool.push(value);
        } else {
            this._pool[this.length] = value;
        }
        this.length++;
    },
    forEach: function(func) {
        for (var i = 0; i < this.length; i++) func(this._pool[i]);
    }
};

module.exports = PooledArray;
