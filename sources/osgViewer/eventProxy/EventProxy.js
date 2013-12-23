define( [
    'osgViewer/eventProxy/GamePad',
    'osgViewer/eventProxy/Hammer',
    'osgViewer/eventProxy/LeapMotion',
    'osgViewer/eventProxy/StandardMouseKeyboard',
    'osgViewer/eventProxy/Oculus'
], function ( GamePad, HammerOsg, LeapMotion, StandardMouseKeyboard, Oculus ) {

    return {
        GamePad: GamePad,
        Hammer: HammerOsg,
        LeapMotion: LeapMotion,
        StandardMouseKeyboard: StandardMouseKeyboard,
        Oculus: Oculus
    };
} );