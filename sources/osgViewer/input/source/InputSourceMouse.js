import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';
import { vec2 } from 'osg/glMatrix';

// Mouse Wheel event reports different values depending on the browser and OS.
// Standard event "wheel" should report a deltaX value. This value is totally inconsistent depending on the browser and the os.
// Chrome has a consistent mouseDelta value across OS (120 for a wheel step).
// Edge has the same mouseDelta value than chrome.
// Safari has the same mouseDelta value than chrome.
var mouseDeltaFactor = 120;
// Firefox has no mouseDelta and reports a deltaY attribute that is 3 times higher on linux and win (compared to mac) (1 on mac 3 otherwise)
// also deltaY direction is backward compared to wheelDelta
var deltaYFactor = navigator.platform.indexOf('Mac') === 0 ? -1 : -3;

/**
 * Standard Mouse Event handled directly on the canvas.
 * @param canvas
 * @param scrollwheel
 * @constructor
 */
var InputSourceMouse = function(canvas, options) {
    InputSource.call(this, canvas);
    this._defaultRatio = vec2.fromValues(1.0, 1.0);

    this._supportedEvents = [
        'click',
        'contextmenu',
        'dblclick',
        'mousedown',
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseover',
        'mouseout',
        'mouseup'
    ];

    if (!options || options.scrollwheel !== false) {
        this._supportedEvents.push('wheel');
    }
};
utils.createPrototypeObject(
    InputSourceMouse,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'Mouse';
        },

        setEnable: function(name, callback, enable) {
            // here we could parse the name of the event.
            // if the name is for example 'click left', only dispatch the event if the left button has ben clicked.
            // This would remove a lot of boiler plate from client code.

            if (enable) {
                this._target.addEventListener(name, callback);
            } else {
                this._target.removeEventListener(name, callback);
            }
        },

        populateEvent: function(ev, customEvent) {
            // desktop - mouse
            customEvent.canvasX = ev.offsetX === undefined ? ev.layerX : ev.offsetX;
            customEvent.canvasY = ev.offsetY === undefined ? ev.layerY : ev.offsetY;

            // x, y coordinates in the gl viewport
            var ratio = this._inputManager.getParam('pixelRatio');
            if (!ratio) ratio = this._defaultRatio;
            customEvent.glX = customEvent.canvasX * ratio[0];
            customEvent.glY = (this._target.clientHeight - customEvent.canvasY) * ratio[1];

            customEvent.clientX = ev.clientX;
            customEvent.clientY = ev.clientY;
            customEvent.screenX = ev.screenX;
            customEvent.screenX = ev.screenX;
            customEvent.pageX = ev.pageX;
            customEvent.pageY = ev.pageY;

            // modifiers
            customEvent.ctrlKey = ev.ctrlKey;
            customEvent.shiftKey = ev.shiftKey;
            customEvent.altKey = ev.altKey;
            customEvent.metaKey = ev.metaKey;

            //buttons
            customEvent.button = ev.button;
            customEvent.buttons = ev.buttons;

            if (ev.type === 'wheel') {
                if (ev.wheelDelta !== undefined) {
                    //chrome / safari / edge browser wheel delta
                    customEvent.deltaY = ev.wheelDelta / mouseDeltaFactor;
                } else if (ev.deltaMode === 1) {
                    // firefox with the standard wheel event (no wheelDelta)
                    customEvent.deltaY = ev.deltaY / deltaYFactor;
                } else {
                    // firefox with the track pad (no wheelDelta), events are fired 10 times the rate.
                    customEvent.deltaY = ev.deltaY / (deltaYFactor * 10);
                }
                customEvent.deltaMode = ev.deltaMode;
                customEvent.deltaX = ev.deltaX;
                customEvent.deltaZ = ev.deltaZ;
            }
        },

        isEventRegistered: function(nativeEvent, parsedEvent) {
            nativeEvent.preventDefault();
            if (parsedEvent.action && nativeEvent.button !== parseInt(parsedEvent.action)) {
                return false;
            }
            if (parsedEvent.ctrl !== undefined && nativeEvent.ctrlKey !== parsedEvent.ctrl) {
                return false;
            }
            if (parsedEvent.shift !== undefined && nativeEvent.shiftKey !== parsedEvent.shift) {
                return false;
            }
            if (parsedEvent.alt !== undefined && nativeEvent.altKey !== parsedEvent.alt) {
                return false;
            }
            if (parsedEvent.meta !== undefined && nativeEvent.metaKey !== parsedEvent.meta) {
                return false;
            }

            return true;
        }
    }),
    'osgViewer',
    'InputSourceMouse'
);

export default InputSourceMouse;
