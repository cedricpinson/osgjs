'use strict';
var PooledArray = require('osg/PooledArray');

var PooledMap = function() {
    this._keys = new PooledArray();
    this._map = {};
};

PooledMap.prototype = {
    reset: function() {
        var array = this._keys.getArray();
        var arrayLength = this._keys.length;
        for (var i = 0; i < arrayLength; i++) {
            var key = array[i];
            this._map[key] = undefined;
        }
        this._keys.reset();
    },
    set: function(key, value) {
        this._keys.push(key);
        this._map[key] = value;
    },
    hasKey: function(key) {
        return this._map[key] !== undefined;
    },
    getMap: function() {
        return this._map;
    },
    getKeys: function() {
        return this._keys;
    },
    forEach: function(func) {
        var array = this._keys.getArray();
        var arrayLength = this._keys.length;
        for (var i = 0; i < arrayLength; i++) {
            var key = array[i];
            func(key, this._map[key]);
        }
    }
};

module.exports = PooledMap;
