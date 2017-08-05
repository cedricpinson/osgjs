var MACROUTILS = require('osg/Utils');
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
    if (config.average) {
        this._avgMs = config.avgMs ? config.avgMs : 1000;
    }
};

MACROUTILS.createPrototypeObject(Counter, {
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
        this._time = performance.now();
    },
    end: function() {
        this._value = performance.now() - this._time;
        this.average(this._value);
    },
    set: function(value) {
        this._value = value;
        this.average(value);
    },
    value: function() {
        return this._value;
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

module.exports = Counter;
