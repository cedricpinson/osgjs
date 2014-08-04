define( [
    'osgViewer/eventProxy/GamePad',
    'osgViewer/eventProxy/Hammer',
    'osgViewer/eventProxy/LeapMotion',
    'osgViewer/eventProxy/StandardMouseKeyboard',
    'osgViewer/eventProxy/Oculus',
    'osgViewer/eventProxy/DeviceOrientation'
], function ( GamePad, HammerOsg, LeapMotion, StandardMouseKeyboard, Oculus, DeviceOrientation ) {

    return {
        GamePad: GamePad,
        Hammer: HammerOsg,
        LeapMotion: LeapMotion,
        StandardMouseKeyboard: StandardMouseKeyboard,
        Oculus: Oculus,
        DeviceOrientation: DeviceOrientation,
    };
} );
