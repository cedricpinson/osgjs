import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';
import { vec2 } from 'osg/glMatrix';

/**
 * Standard Mouse Event handled directly on the canvas.
 * @param canvas
 * @constructor
 */
var InputSourceMouse = function(canvas) {
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
        'mouseup',
        'wheel'
    ];
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
                if (name === 'wheel') {
                    this._target.addEventListener('mousewheel', callback);
                    this._target.addEventListener('DOMMouseScroll', callback);
                    this._target.addEventListener('MozMousePixelScroll', callback);
                }
            } else {
                this._target.removeEventListener(name, callback);
                if (name === 'wheel') {
                    this._target.addEventListener('mousewheel', callback);
                    this._target.removeEventListener('DOMMouseScroll', callback);
                    this._target.removeEventListener('MozMousePixelScroll', callback);
                }
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

            if (this._isMouseWheelEvent(ev)) {
                if (ev.deltaMode !== undefined) {
                    customEvent.deltaMode = ev.deltaMode;
                    customEvent.deltaY = ev.deltaY;
                    customEvent.deltaX = ev.deltaX;
                    customEvent.deltaZ = ev.deltaZ;
                } else {
                    customEvent.wheelDelta =
                        ev.wheelDelta === undefined ? -ev.detail : ev.wheelDelta;
                    customEvent.deltaMode = 0;
                    customEvent.deltaY = -ev.wheelDelta / 3;
                    customEvent.deltaX = 0;
                    customEvent.deltaZ = 0;
                }
            }
        },

        _isMouseWheelEvent: function(ev) {
            return (
                ev.type === 'wheel' ||
                ev.type === 'DOMMouseScroll' ||
                ev.type === 'mousewheel' ||
                ev.type === 'MozMousePixelScroll'
            );
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
