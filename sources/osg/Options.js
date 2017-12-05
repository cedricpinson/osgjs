import notify from 'osg/notify';
import utils from 'osg/utils';

var OptionsDefault = {
    antialias: true, // activate MSAA
    //'overrideDevicePixelRatio': 1, // if specified override the device pixel ratio
    fullscreen: true,
    enableFrustumCulling: false,
    scrollwheel: true,
    webgl2: false,
    powerPreference: 'high-performance',
    stats: false // display stats, check in osgStats/Stats for all url options
    // statsFilter=cull;myGroup;webgl filters groups to display
    // statsFontSize=12 change the size of the fonts default 12
    // statsShowGraph=1 display graph
};

var Options = function() {
    for (var keyOption in OptionsDefault) {
        this[keyOption] = OptionsDefault[keyOption];
    }
};

var urlOptions;
Options.getOptionsURL = function() {
    if (urlOptions) return urlOptions;

    urlOptions = {};

    if (!window.location.search) return urlOptions;

    var vars = [];
    var hash;
    // slice(1) to remove leading '?'
    var hashes = window.location.search.slice(1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        var element = hash[0];
        vars.push(element);
        var result = hash[1];

        // ideally we should have typed option
        if (result === '0' || result === 'false') continue;
        if (result === undefined) result = '1';

        urlOptions[element] = result;
    }

    if (urlOptions.log !== undefined) {
        var level = urlOptions.log.toLowerCase();

        switch (level) {
            case 'debug':
                notify.setNotifyLevel(notify.DEBUG);
                break;
            case 'info':
                notify.setNotifyLevel(notify.INFO);
                break;
            case 'notice':
                notify.setNotifyLevel(notify.NOTICE);
                break;
            case 'warn':
                notify.setNotifyLevel(notify.WARN);
                break;
            case 'error':
                notify.setNotifyLevel(notify.ERROR);
                break;
            case 'html':
                var logContent = [];
                var divLogger = document.createElement('div');
                var codeElement = document.createElement('pre');
                document.addEventListener('DOMContentLoaded', function() {
                    document.body.appendChild(divLogger);
                    divLogger.appendChild(codeElement);
                });
                var logFunc = function(str) {
                    logContent.unshift(str);
                    codeElement.innerHTML = logContent.join('\n');
                };
                divLogger.style.overflow = 'hidden';
                divLogger.style.position = 'absolute';
                divLogger.style.zIndex = '10000';
                divLogger.style.height = '100%';
                divLogger.style.maxWidth = '600px';
                codeElement.style.overflow = 'scroll';
                codeElement.style.width = '105%';
                codeElement.style.height = '100%';
                codeElement.style.fontSize = '10px';

                ['log', 'error', 'warn', 'info', 'debug'].forEach(function(value) {
                    window.console[value] = logFunc;
                });
                break;
        }
    }

    return urlOptions;
};

Options.prototype = {
    extend: function(options) {
        utils.objectMix(this, options);
        return this;
    },

    get: function(key) {
        return this[key];
    },

    getBoolean: function(key) {
        var val = this.getString(key);
        if (val) return val !== 'false' && val !== '0';
        return undefined;
    },

    getNumber: function(key) {
        var val = this[key];
        if (val) return Number(val);
        return undefined;
    },

    getString: function(key) {
        var val = this[key];
        if (val !== undefined) return this[key].toString();
        return undefined;
    },

    extendWithOptionsURL: function() {
        this.extend(Options.getOptionsURL());
    }
};

export default Options;
