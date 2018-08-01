import utils from 'osg/utils';
import InputSource from 'osgViewer/input/source/InputSource';

/**
 * Standard Keyboard Event handled directly on the canvas.
 * @param canvas
 * @constructor
 */
var InputSourceKeyboard = function(canvas) {
    InputSource.call(this, canvas);
    this._supportedEvents = ['keydown', 'keyup', 'keypress'];
};
utils.createPrototypeObject(
    InputSourceKeyboard,
    utils.objectInherit(InputSource.prototype, {
        getName: function() {
            return 'Keyboard';
        },

        setEnable: function(name, callback, enable) {
            if (enable) {
                this._target.addEventListener(name, callback);
            } else {
                this._target.removeEventListener(name, callback);
            }
        },

        populateEvent: function(ev, customEvent) {
            customEvent.key = ev.key;
            customEvent.keyCode = ev.keyCode;
            customEvent.code = ev.code;
            customEvent.location = ev.location;
            customEvent.repeat = ev.repeat;

            // modifiers
            customEvent.ctrlKey = ev.ctrlKey;
            customEvent.shiftKey = ev.shiftKey;
            customEvent.altKey = ev.altKey;
            customEvent.metaKey = ev.metaKey;
        },

        isEventRegistered: function(nativeEvent, parsedEvent) {
            if (!parsedEvent.action) {
                return true;
            }

            // IE11 has no nativeEvent.key when hitting "modifer" (shift)
            if (nativeEvent.key && nativeEvent.key.toLowerCase() !== parsedEvent.action) {
                if (nativeEvent.code.toLowerCase() !== parsedEvent.action) {
                    return false;
                }
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
    'InputSourceKeyboard'
);

export default InputSourceKeyboard;
