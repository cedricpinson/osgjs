import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';

/**
 * Game Pads input handling
 * @constructor
 */
var InputSourceGamePad = function() {
    InputSource.call(this);
    this._target = window;
    this._supportedEvents = [
        'buttondown',
        'buttonup',
        'buttonvalue',
        'axis',
        'gamepadconnected',
        'gamepaddisconnected'
    ];
    this._callbacks = {};
    this._nbCallbacks = 0;
    this._gamePadState = [];

    this._valueThreshold = 0.01;

    window.addEventListener(
        'gamepadconnected',
        function(e) {
            this._newGamePad(e.gamepad);
            this._onConnectionStateChange(e, 'gamepadconnected');
        }.bind(this)
    );

    window.addEventListener(
        'gamepaddisconnected',
        function(e) {
            this._previousState[e.gamepad.index] = undefined;
            this._onConnectionStateChange(e, 'gamepaddisconnected');
        }.bind(this)
    );
};
utils.createPrototypeObject(
    InputSourceGamePad,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'GamePad';
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

        _onConnectionStateChange: function(event, state) {
            var callback = this._callbacks[state];
            if (!callback) {
                return;
            }
            callback(event);
        },

        _newGamePad: function(gamepad) {
            var state = {
                buttons: []
            };
            state._buttonEvents = [];
            state._axisEvents = [];
            var i;
            for (i = 0; i < gamepad.buttons.length; i++) {
                state._buttonEvents[i] = {
                    buttondown: this._initEvent('buttondown', i, gamepad.index, 'button'),
                    buttonup: this._initEvent('buttonup', i, gamepad.index, 'button'),
                    buttonvalue: this._initEvent('buttonvalue', i, gamepad.index, 'button')
                };
            }

            for (i = 0; i < gamepad.axes.length; i++) {
                state._axisEvents[i] = {
                    axis: this._initEvent('axis', i, gamepad.index, 'axis')
                };
            }

            this._gamePadState[gamepad.index] = state;
        },

        setValueThreshold: function(threshold) {
            this._valueThreshold = threshold;
        },

        _initEvent: function(name, index, gamepadIndex, type) {
            var event = new Event(name);
            event[type] = index;
            event.gamepadIndex = gamepadIndex;
            return event;
        },

        populateEvent: function(ev, customEvent) {
            customEvent.gamepadIndex = ev.gamepadIndex;
            if (ev.button !== undefined) {
                customEvent.button = ev.button;
                customEvent.value = ev.value;
            }

            if (ev.axis !== undefined) {
                customEvent.axis = ev.axis;
                customEvent.value = ev.value;
            }
        },

        isEventRegistered: function(nativeEvent, parsedEvent) {
            if (!parsedEvent.action) {
                return true;
            }

            var value = parseInt(parsedEvent.action);

            if (nativeEvent.button !== undefined && nativeEvent.button !== value) {
                return false;
            }

            if (nativeEvent.axis !== undefined && nativeEvent.axis !== value) {
                return false;
            }

            return true;
        },

        _fireCallbacks: function(callbacks, event) {
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](event);
            }
        },

        poll: function() {
            if (!this._nbCallbacks) {
                return;
            }

            var gamepads = navigator.getGamepads();

            if (!gamepads) {
                return;
            }

            for (var i = 0; i < gamepads.length; i++) {
                var gamepad = gamepads[i];

                if (!gamepad) continue;

                var state = this._gamePadState[i];

                if (!state) {
                    continue;
                }

                var buttonDownCallbacks = this._callbacks['buttondown'];
                var buttonUpCallbacks = this._callbacks['buttonup'];
                var buttonValueCallbacks = this._callbacks['buttonvalue'];
                if (buttonDownCallbacks || buttonUpCallbacks || buttonValueCallbacks) {
                    for (var j = 0; j < gamepad.buttons.length; j++) {
                        var button = gamepad.buttons[j];
                        var btnDownEvent = state._buttonEvents[j].buttondown;
                        btnDownEvent.value = button.value;
                        var btnUpEvent = state._buttonEvents[j].buttonup;
                        btnUpEvent.value = button.value;
                        if (button.pressed && !state.buttons[j]) {
                            if (buttonDownCallbacks && buttonDownCallbacks.length) {
                                this._fireCallbacks(buttonDownCallbacks, btnDownEvent);
                            }
                            state.buttons[j] = button.pressed;
                        }
                        if (!button.pressed && state.buttons[j]) {
                            //button was pressed but not anymore
                            if (buttonUpCallbacks && buttonUpCallbacks.length) {
                                this._fireCallbacks(buttonUpCallbacks, btnUpEvent);
                            }
                            state.buttons[j] = false;
                        }

                        if (button.pressed && buttonValueCallbacks && buttonValueCallbacks.length) {
                            var btnValueEvent = state._buttonEvents[j].buttonvalue;
                            btnValueEvent.value = button.value;
                            if (Math.abs(button.value) >= this._valueThreshold) {
                                this._fireCallbacks(buttonValueCallbacks, btnValueEvent);
                            }
                        }
                    }
                }

                var axisCallback = this._callbacks['axis'];
                if (!axisCallback) {
                    continue;
                }

                for (j = 0; j < gamepad.axes.length; j++) {
                    var axis = gamepad.axes[j];
                    var axisValueEvent = state._axisEvents[j].axis;
                    axisValueEvent.value = axis;
                    if (Math.abs(axis) >= this._valueThreshold) {
                        this._fireCallbacks(axisCallback, axisValueEvent);
                    }
                }
            }
        }
    }),
    'osgViewer',
    'InputSourceGamePad'
);

export default InputSourceGamePad;
