import GamePad from 'osgViewer/eventProxy/GamePad';
import HammerOsg from 'osgViewer/eventProxy/Hammer';
import StandardMouseKeyboard from 'osgViewer/eventProxy/StandardMouseKeyboard';
import WebVR from 'osgViewer/eventProxy/WebVR';
import DeviceOrientation from 'osgViewer/eventProxy/DeviceOrientation';

export default {
    GamePad: GamePad,
    Hammer: HammerOsg,
    StandardMouseKeyboard: StandardMouseKeyboard,
    WebVR: WebVR,
    DeviceOrientation: DeviceOrientation
};
