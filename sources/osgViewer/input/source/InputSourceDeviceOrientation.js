import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';

/**
 * Device Orientation input handling
 * @constructor
 */
var InputSourceDeviceOrientation = function() {
    InputSource.call(this);
    this._target = window;
    this._callbacks = [];
    this._nbCallbacks = 0;
    this._event = new Event('deviceorientation');
    this._supportedEvents = ['deviceorientation', 'orientationchange'];
    this._update = this.onDeviceOrientation.bind(this);
};
utils.createPrototypeObject(
    InputSourceDeviceOrientation,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'DeviceOrientation';
        },

        setEnable: function(name, callback, enable) {
            if (name === 'orientationchange') {
                if (enable) {
                    this._target.addEventListener(name, callback);
                } else {
                    this._target.removeEventListener(name, callback);
                }
                return;
            }

            var callbacks = this._callbacks;
            var index = callbacks.indexOf(callback);
            if (enable) {
                if (index < 0) {
                    callbacks.push(callback);
                    this._nbCallbacks++;
                }
            } else {
                if (index >= 0) {
                    callbacks.splice(index, 1);
                    this._nbCallbacks--;
                }
            }
            if (this._nbCallbacks === 1) {
                window.addEventListener(name, this._update);
            }
            if (this._nbCallbacks === 0) {
                window.removeEventListener(name, this._update);
            }
        },

        onDeviceOrientation: function(ev) {
            this.populateEvent(ev, this._event);
        },

        populateEvent: function(ev, customEvent) {
            customEvent.absolute = ev.absolute;
            customEvent.alpha = ev.alpha;
            customEvent.beta = ev.beta;
            customEvent.gamma = ev.gamma;

            customEvent.screenOrientation = window.orientation;
        },

        isEventRegistered: function(ev) {
            if (ev.type === 'deviceorientation') {
                if (ev.alpha === null || ev.alpha === undefined) {
                    return false;
                }
            } else {
                if (window.orientation === null || window.orientation === undefined) {
                    return false;
                }
            }

            return true;
        },

        poll: function() {
            if (!this._nbCallbacks) {
                return;
            }

            for (var i = 0; i < this._callbacks.length; i++) {
                this._callbacks[i](this._event);
            }
        }
    }),
    'osgViewer',
    'InputSourceDeviceOrientation'
);

export default InputSourceDeviceOrientation;
