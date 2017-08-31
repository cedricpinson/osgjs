'use strict';

var PooledArray = function() {
    this._pool = [];
    this._length = 0;
};

PooledArray.prototype = {
    clean: function() {
        this._length = 0;
        this._pool.length = 0;
    },
    reset: function() {
        this._length = 0;
    },
    getLength: function() {
        return this._length;
    },
    getArray: function() {
        return this._pool;
    },
    back: function() {
        return this._pool[this._length - 1];
    },
    pop: function() {
        this._length--;
        return this._pool[this._length];
    },
    push: function(value) {
        if (this._length === this._pool.length) {
            this._pool.push(value);
        } else {
            this._pool[this._length] = value;
        }
        this._length++;
    },
    forEach: function(func) {
        for (var i = 0; i < this._length; i++) func(this._pool[i]);
    }
};

module.exports = PooledArray;
