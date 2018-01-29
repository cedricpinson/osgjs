import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';
import Hammer from 'hammer';
import { vec2 } from 'osg/glMatrix';

/**
 * Handles standard touch events and advanced touch events through Hammer.js
 * @param canvas
 * @param hammer
 * @constructor
 */
var InputSourceTouchScreen = function(canvas) {
    InputSource.call(this, canvas);
    this._defaultRatio = vec2.fromValues(1.0, 1.0);

    this._hammerEvents = [
        'pan',
        'pinch',
        'press',
        'rotate',
        'swipe',
        'doubletap',
        'doubletap2fingers',
        'singletap'
    ];
    this._supportedEvents = ['touchstart', 'touchend', 'touchcancel', 'touchmove'];

    this._hammer = new Hammer.Manager(canvas);

    // defaults: { event: 'pan', pointers: 1, direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 }
    this._hammer.add(new Hammer.Pan());
    this._hammer.add(new Hammer.Pinch());

    // Let the pan be detected with two fingers.
    // 2 => pan, 1 -> rotate
    this._hammer.get('pan').set({
        threshold: 0,
        pointers: 0
    });

    var pinch = this._hammer.get('pinch');
    // Set a minimal threshold on pinch event, to be detected after pan
    // pinch disable as default
    pinch.set({
        threshold: 0.1,
        enable: false
    });
    pinch.recognizeWith(this._hammer.get('pan'));

    this._hammer.add(
        new Hammer.Tap({
            event: 'doubletap',
            pointers: 1,
            taps: 2,
            time: 250, // def : 250.  Maximum press time in ms.
            interval: 450, // def : 300. Maximum time in ms between multiple taps.
            threshold: 5, // def : 2. While doing a tap some small movement is allowed.
            posThreshold: 50 // def : 30. The maximum position difference between multiple taps.
        })
    );

    this._hammer.add(
        new Hammer.Tap({
            event: 'doubletap2fingers',
            pointers: 2,
            taps: 2,
            time: 250,
            interval: 450,
            threshold: 5,
            posThreshold: 50
        })
    );

    this._hammer.add(
        new Hammer.Tap({
            event: 'singletap',
            pointers: 1,
            taps: 1,
            time: 250,
            interval: 450,
            threshold: 5,
            posThreshold: 20
        })
    );
};

utils.createPrototypeObject(
    InputSourceTouchScreen,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'TouchScreen';
        },

        setEnable: function(name, callback, enable) {
            if (this._isNativeEvent(name)) {
                if (enable) {
                    this._target.addEventListener(name, callback);
                } else {
                    this._target.removeEventListener(name, callback);
                }
            } else {
                if (name.indexOf('pinch') >= 0 && enable) {
                    this._hammer.get('pinch').set({ enable: true });
                }
                if (enable) {
                    this._hammer.on(name, callback);
                } else {
                    this._hammer.off(name, callback);
                }
            }
        },

        populateEvent: function(ev, customEvent) {
            if (this._isNativeEvent(ev.type)) {
                //native event
                customEvent.canvasX = customEvent.canvasY = 0;
                var touches = ev.touches.length ? ev.touches : ev.changedTouches;
                var nbTouches = touches.length;
                for (var i = 0; i < nbTouches; ++i) {
                    customEvent.canvasX += touches[i].clientX / nbTouches;
                    customEvent.canvasY += touches[i].clientY / nbTouches;
                }
                // modifiers
                customEvent.ctrlKey = ev.ctrlKey;
                customEvent.shiftKey = ev.shiftKey;
                customEvent.altKey = ev.altKey;
                customEvent.metaKey = ev.metaKey;
                customEvent.pointers = ev.touches;
            } else {
                //hammer event
                customEvent.canvasX = ev.center.x;
                customEvent.canvasY = ev.center.y;
                customEvent.scale = ev.scale;
                customEvent.rotation = ev.rotation;
                customEvent.deltaX = ev.deltaX;
                customEvent.deltaY = ev.deltaY;
                customEvent.deltaTime = ev.deltaTime;
                customEvent.direction = ev.direction;
                customEvent.offsetDirection = ev.offsetDirection;
                customEvent.pointers = ev.pointers;
                customEvent.velocity = ev.velocity;
            }

            var offset = this._target.getBoundingClientRect();
            customEvent.canvasX += -offset.left;
            customEvent.canvasY += -offset.top;

            // x, y coordinates in the gl viewport
            var ratio = this._inputManager.getParam('pixelRatio');
            if (!ratio) ratio = this._defaultRatio;
            customEvent.glX = customEvent.canvasX * ratio[0];
            customEvent.glY = (this._target.clientHeight - customEvent.canvasY) * ratio[1];
        },

        _isNativeEvent: function(evt) {
            return this._supportedEvents.indexOf(evt) >= 0;
        },

        isEventRegistered: function(nativeEvent, parsedEvent) {
            nativeEvent.preventDefault();
            if (nativeEvent.pointerType && nativeEvent.pointerType !== 'touch') {
                return false;
            }

            if (!parsedEvent.action) {
                return true;
            }

            if (isNaN(parsedEvent.action)) {
                throw 'touch action should be a number representing the number of touches';
            }

            var touches = nativeEvent.pointers;
            if (!touches) {
                touches = nativeEvent.touches;
            }

            var nbTouches = parseInt(parsedEvent.action);

            if (nativeEvent.type === 'touchend' || nativeEvent.type === 'touchcancel') {
                //on touch end the number of touches will always be below the requested number of touches
                if (touches.length >= nbTouches) {
                    return false;
                }
            } else {
                if (touches.length !== nbTouches) {
                    return false;
                }
            }

            return true;
        },

        supportsEvent: function(eventName) {
            var result = InputSource.prototype.supportsEvent.call(this, eventName);
            if (result) {
                return result;
            }
            for (var i = 0; i < this._hammerEvents.length; i++) {
                var event = this._hammerEvents[i];
                if (eventName.indexOf(event) === 0) {
                    return true;
                }
            }
            return false;
        },

        getHammer: function() {
            return this._hammer;
        }
    }),
    'osgViewer',
    'InputSourceTouchScreen'
);

export default InputSourceTouchScreen;
