import utils from 'osg/utils';
var performance = window.performance;

var Counter = function(config) {
    this._caption = config.caption;
    this._accumValue = 0;
    this._accumSamples = 0;
    this._accumStart = 0;
    this._value = 0;
    this._averageValue = 0;
    this._time = 0;
    this._avgMs = 0;
    this._over = config.over > 0.0 ? config.over : 0;
    this._below = config.below > 0.0 ? config.below : 0;
    this._graph = !!config.graph;
    if (config.average) {
        this._avgMs = config.avgMs ? config.avgMs : 1000;
    }
    this._display = false;
};

utils.createPrototypeObject(Counter, {
    isDisplayable: function() {
        return this._display;
    },
    setDisplayable: function(boolean) {
        this._display = boolean;
    },
    getOver: function() {
        return this._over;
    },
    getBelow: function() {
        return this._below;
    },
    getGraph: function() {
        return this._graph;
    },
    getAverageMs: function() {
        return this._avgMs;
    },
    getAverageValue: function() {
        return this._averageValue;
    },
    getValue: function() {
        return this._value;
    },
    average: function(value) {
        if (!this._avgMs) return;

        this._accumValue += value;
        this._accumSamples++;
        var t = performance.now();
        if (t - this._accumStart > this._avgMs) {
            this._averageValue = this._accumValue / this._accumSamples;
            this._accumValue = 0;
            this._accumStart = t;
            this._accumSamples = 0;
        }
    },
    start: function() {
        this._display = true;
        this._time = performance.now();
    },
    end: function() {
        this._value = performance.now() - this._time;
        this.average(this._value);
    },
    set: function(value) {
        this._display = true;
        this._value = value;
        this.average(value);
    },
    tick: function() {
        this.end();
        this.start();
    },
    frame: function() {
        var delta = performance.now() - this._time;
        this.set(1000.0 / delta);
        this.start();
    }
});

export default Counter;
