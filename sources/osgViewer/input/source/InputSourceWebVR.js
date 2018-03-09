import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';
import notify from 'osg/notify';

/**
 * WebVR Hmd device input handling.
 * @param canvas
 * @constructor
 */
var InputSourceWebVR = function(elem, options) {
    InputSource.call(this);
    this._supportedEvents = [
        'vrdisplayposechanged',
        'vrdisplayconnected',
        'vrdisplaynotfound',
        'vrdisplaydisconnected'
    ];

    this._callbacks = {};
    this._events = {};
    for (var i = 0; i < this._supportedEvents.length; i++) {
        var eventName = this._supportedEvents[i];
        var event = new Event(eventName);
        this._events[eventName] = event;
    }
    this._nbCallbacks = 0;
    // We poll the device at regular interval, if ever a headset is plugged in.
    // 3 seconds default poll interval
    // If the pollInterval is set to 0 or less the polling is disabled and the user
    // will have to poll it manually with the pollHeadset method
    this._pollInterval =
        options && options.pollInterval !== undefined ? options.pollInterval : 3000;
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
                    // only poll for device if we have callbacks.
                    this._schedulePolling();
                }
            } else {
                if (index >= 0) {
                    callbacks.splice(index, 1);
                    this._nbCallbacks--;
                    if (!this._nbCallbacks) {
                        // no more callbacks let's stop polling
                        this._cancelPolling();
                    }
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
            customEvent.worldFactor = this._inputManager.getParam('worldFactor');
            if (!customEvent.worldFactor) customEvent.worldFactor = 1.0;
        },

        _schedulePolling: function() {
            if (this._pollInterval > 0 && this._pollingTimeout === undefined) {
                this._pollingTimeout = setInterval(this.pollHeadset.bind(this), this._pollInterval);
            }
        },

        _cancelPolling: function() {
            if (this._pollingTimeout !== undefined) {
                clearInterval(this._pollingTimeout);
            }
        },

        pollHeadset: function() {
            if (!navigator.getVRDisplays) {
                this._hmd = undefined;
                this._frameData = undefined;
                this.triggerNotFoundEvent();
                return;
            }

            var self = this;
            navigator.getVRDisplays().then(
                function(displays) {
                    if (displays.length === 0) {
                        this.triggerNotFoundEvent();
                        return;
                    }

                    if (self._hmd === displays[0]) {
                        // still the same display nothing to do
                        return;
                    }

                    notify.log('Found a VR display');
                    //fire the disconnect event
                    var event = self._events['vrdisplaydisconnected'];
                    event.vrDisplay = self._hmd;
                    this._dispatchEvent(event, self._callbacks['vrdisplaydisconnected']);

                    //fire the connect event
                    event = self._events['vrdisplayconnected'];
                    event.vrDisplay = displays[0];
                    this._dispatchEvent(event, self._callbacks['vrdisplayconnected']);

                    self._hmd = displays[0];
                    self._frameData = new window.VRFrameData();
                }.bind(this)
            );
        },

        triggerNotFoundEvent: function() {
            if (this._pollInterval > 0) {
                // we are in auto polling mode, don't trigger the event
                return;
            }

            // in case of manual polling we trigger an event when no display was found
            var event = this._events['vrdisplaynotfound'];
            this._dispatchEvent(event, this._callbacks['vrdisplaynotfound']);
        },

        setPollInterval: function(interval) {
            this._pollInterval = interval;
        },

        _dispatchEvent: function(event, callbacks) {
            if (!callbacks) return;

            for (var i = 0; i < callbacks.length; i++) {
                var callback = callbacks[i];
                callback(event);
            }
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

            this._dispatchEvent(event, callbacks);
        }
    }),
    'osgViewer',
    'InputSourceWebVR'
);

export default InputSourceWebVR;
