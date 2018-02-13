import { assert } from 'chai';
import InputManager from 'osgViewer/input/InputManager';
import InputSourceMouse from 'osgViewer/input/source/InputSourceMouse';
import InputSourceKeyboard from 'osgViewer/input/source/InputSourceKeyboard';

export default function() {
    test('Inputs', function() {
        // Event parsing
        (function() {
            var inputManager = new InputManager();
            var keyboard = new InputSourceKeyboard();
            var mouse = new InputSourceMouse();

            // parsing
            var parsedEvent = inputManager._parseNativeEvent('mousedown shift 0');
            assert(parsedEvent.name === 'mousedown', 'event name should be "mousedown"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.ctrl === undefined, 'event ctrl modifier should be undefined');
            assert(parsedEvent.action === '0', 'event action should be 0');

            parsedEvent = inputManager._parseNativeEvent('keypress v ctrl shift');
            assert(parsedEvent.name === 'keypress', 'event name should be "keypress"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.ctrl === true, 'event ctrl modifier should be true');
            assert(parsedEvent.action === 'v', 'event action should be v');

            parsedEvent = inputManager._parseNativeEvent('keydown ctrl shift');
            assert(parsedEvent.name === 'keydown', 'event name should be "keydown"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.ctrl === true, 'event ctrl modifier should be true');
            assert(parsedEvent.action === 'shift', 'event action should be shift');

            parsedEvent = inputManager._parseNativeEvent('keypress ctrl shift v g');
            assert(parsedEvent.name === 'keypress', 'event name should be "keypress"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.ctrl === true, 'event ctrl modifier should be true');
            assert(parsedEvent.action === 'g', 'event action should be g');

            parsedEvent = inputManager._parseNativeEvent('keyup');
            assert(parsedEvent.name === 'keyup', 'event name should be "keyup"');
            assert(parsedEvent.shift === undefined, 'event shift modifier should be undefined');
            assert(parsedEvent.ctrl === undefined, 'event ctrl modifier should be undefined');
            assert(parsedEvent.action === undefined, 'event action should be undefined');

            //localised modifier key
            parsedEvent = inputManager._parseNativeEvent('keypress ShiftRight');
            assert(parsedEvent.name === 'keypress', 'event name should be "keypress"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.action === 'shiftright', 'event action should be ShiftRight');

            // parsing and matching
            parsedEvent = inputManager._parseNativeEvent('keypress ctrl shift v');
            assert(parsedEvent.name === 'keypress', 'event name should be "keypress"');
            assert(parsedEvent.shift === true, 'event shift modifier should be true');
            assert(parsedEvent.ctrl === true, 'event ctrl modifier should be true');
            assert(parsedEvent.action === 'v', 'event action should be v');
            var event = {
                key: 'v',
                shiftKey: true,
                ctrlKey: true,
                metaKey: false,
                altKey: false,
                preventDefault: function() {}
            };
            assert(keyboard.isEventRegistered(event, parsedEvent), 'Event should match');

            parsedEvent = inputManager._parseNativeEvent('mousedown ctrl 1');
            assert(parsedEvent.name === 'mousedown', 'event name should be "mousedown"');
            assert(parsedEvent.ctrl === true, 'event ctrl modifier should be true');
            assert(parsedEvent.action === '1', 'event action should be 1');
            event = {
                button: 1,
                shiftKey: false,
                ctrlKey: true,
                metaKey: false,
                altKey: false,
                preventDefault: function() {}
            };
            assert(mouse.isEventRegistered(event, parsedEvent), 'Event should match');
        })();
    });
}
