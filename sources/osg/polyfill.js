(function() {
    // prevent crash on old browser
    if (!window.Set || !window.Map || !window.Uint8ClampedArray) return;

    // This file contains needed polyfills mainly for IE11
    if (!Math.sign) {
        Math.sign = function(a) {
            return a > 0.0 ? 1.0 : a < 0.0 ? -1.0 : 0.0;
        };
    }

    if (!Math.log2) {
        Math.log2 = function(x) {
            return Math.log(x) * Math.LOG2E;
        };
    }

    if (!Math.log10) {
        Math.log10 = function(x) {
            return Math.log(x) * Math.LOG10E;
        };
    }

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(str) {
            return this.slice(-str.length) === str;
        };
    }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(str) {
            return this.slice(0, str.length) === str;
        };
    }

    if (!Float32Array.prototype.slice) {
        var _slicePolyfill = function(start, end) {
            return new this.constructor(this.subarray(start, end));
        };

        Int8Array.prototype.slice = _slicePolyfill;
        Uint8Array.prototype.slice = _slicePolyfill;
        Uint8ClampedArray.prototype.slice = _slicePolyfill;
        Int16Array.prototype.slice = _slicePolyfill;
        Uint16Array.prototype.slice = _slicePolyfill;
        Int32Array.prototype.slice = _slicePolyfill;
        Uint32Array.prototype.slice = _slicePolyfill;
        Float32Array.prototype.slice = _slicePolyfill;
        Float64Array.prototype.slice = _slicePolyfill;
    }

    // IE11 does not support Set with constructing arguments. May 2017.
    var setTest = new window.Set(['test']);
    var hasConstructorParameterSupport = setTest.has('test');
    if (hasConstructorParameterSupport) return;
    var nativeSetConstructor = window.Set;
    window.Set = function(init) {
        var set = new nativeSetConstructor();
        if (init) {
            for (var i = 0; i < init.length; ++i) {
                set.add(init[i]);
            }
        }
        return set;
    };
})();
