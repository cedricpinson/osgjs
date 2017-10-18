import PooledArray from 'osg/PooledArray';

var PooledMap = function() {
    this._keys = new PooledArray();
    this._map = {};
};

PooledMap.prototype = {
    reset: function() {
        var array = this._keys.getArray();
        var arrayLength = this._keys.getLength();
        for (var i = 0; i < arrayLength; i++) {
            var key = array[i];
            this._map[key] = undefined;
        }
        this._keys.reset();
    },
    /**
     * Set a key value
     * you have to check that the key does not exist before otherwise you could hit performance hit when calling reset/forEach
     */
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
        var arrayLength = this._keys.getLength();
        for (var i = 0; i < arrayLength; i++) {
            var key = array[i];
            func(key, this._map[key]);
        }
    }
};

export default PooledMap;
