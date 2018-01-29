import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';
import notify from 'osg/notify';

var POLL_INTERVAL = 3000;

/**
 * WebVR Hmd device input handling.
 * @param canvas
 * @constructor
 */
var InputSourceWebVR = function() {
    InputSource.call(this);
    this._supportedEvents = ['vrdisplayposechanged', 'vrdisplayconnected', 'vrdisplaydisconnected'];

    this._callbacks = {};
    this._events = {};
    for (var i = 0; i < this._supportedEvents.length; i++) {
        var eventName = this._supportedEvents[i];
        var event = new Event(eventName);
        this._events[eventName] = event;
    }
    this._nbCallbacks = 0;

    this._pollHeadset();
};
utils.createPrototypeObject(
    InputSourceWebVR,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'WebVR';
        },

        setEnable: function(name, callback, enable) {
            var callbacks = this._callbacks[name];
            if (!callbacks) {
                callbacks = [];
                this._callbacks[name] = callbacks;
            }
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
        },

        populateEvent: function(ev, customEvent) {
            if (ev.vrDisplay) {
                customEvent.vrDisplay = ev.vrDisplay;
                return;
            }
            customEvent.pose = ev.pose;
            customEvent.sitToStandMatrix = ev.sitToStandMatrix;
            customEvent.worldScale = this._inputManager.getParam('worldScale');
            if (!customEvent.worldScale) customEvent.worldScale = 1.0;
        },

        _pollHeadset: function() {
            if (!navigator.getVRDisplays) {
                this._hmd = undefined;
                this._frameData = undefined;
                return;
            }

            setInterval(
                function() {
                    if (!this._nbCallbacks) {
                        //don't poll if there is no callback registered.
                        return;
                    }
                    var self = this;
                    navigator.getVRDisplays().then(function(displays) {
                        if (displays.length > 0) {
                            if (self._hmd !== displays[0]) {
                                notify.log('Found a VR display');
                                //fire the disconnect event
                                var event = self._events['vrdisplaydisconnected'];
                                event.vrDisplay = self._hmd;
                                var i, callback;
                                var callbacks = self._callbacks['vrdisplaydisconnected'];
                                if (callbacks) {
                                    for (i = 0; i < callbacks.length; i++) {
                                        callback = callbacks[i];
                                        callback(event);
                                    }
                                }

                                //fire the connect event
                                event = self._events['vrdisplayconnected'];
                                event.vrDisplay = displays[0];
                                callbacks = self._callbacks['vrdisplayconnected'];
                                if (callbacks) {
                                    for (i = 0; i < callbacks.length; i++) {
                                        callback = callbacks[i];
                                        callback(event);
                                    }
                                }
                                self._hmd = displays[0];
                                self._frameData = new window.VRFrameData();
                            }
                        }
                    });
                }.bind(this),
                POLL_INTERVAL
            );
        },

        poll: function() {
            if (!this._hmd) {
                return;
            }

            var callbacks = this._callbacks['vrdisplayposechanged'];
            if (!callbacks || !callbacks.length) {
                return;
            }

            //hmd movement
            this._hmd.getFrameData(this._frameData);

            var pose = this._frameData.pose;

            if (!pose) return;

            // WebVR up vector is Y
            // OSGJS up vector is Z

            var sitToStand =
                this._hmd.stageParameters && this._hmd.stageParameters.sittingToStandingTransform;

            var event = this._events['vrdisplayposechanged'];
            event.pose = pose;
            event.sitToStandMatrix = sitToStand;

            for (var i = 0; i < callbacks.length; i++) {
                var callback = callbacks[i];
                callback(event);
            }
        }
    }),
    'osgViewer',
    'InputSourceWebVR'
);

export default InputSourceWebVR;
