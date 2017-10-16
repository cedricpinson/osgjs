var Graph = function() {
    this._values = new Float32Array(Graph.maxGraphValue);
    this._index = 0;
    this._maxValue = 0.0;
    this._x = 0;
    this._y = 0;
};
Graph.maxGraphValue = 120;
Graph.prototype = {
    getIndex: function() {
        return this._index;
    },
    getValues: function() {
        return this._values;
    },
    setDisplayPosition: function(x, y) {
        this._x = x;
        this._y = y;
    },
    getX: function() {
        return this._x;
    },
    getY: function() {
        return this._y;
    },
    addValue: function(value, uvColor) {
        var index = this._index;
        this._maxValue = value > this._maxValue ? value : this._maxValue;
        this._maxValue *= 0.99;
        this._values[index] = value / (this._maxValue * 1.1);
        if (uvColor) this._values[index] += uvColor;
        this._index = (this._index + 1) % Graph.maxGraphValue;
    }
};

export default Graph;
