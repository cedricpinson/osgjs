define( [
    'osgViewer/eventProxy/GamePad',
    'osgViewer/eventProxy/Hammer',
    'osgViewer/eventProxy/LeapMotion',
    'osgViewer/eventProxy/StandardMouseKeyboard'
] ),
function ( GamePad, HammerOsg, LeapMotion, StandardMouseKeyboard ) {

    return {
        GamePad: GamePad,
        Hammer: HammerOsg,
        LeapMotion: LeapMotion,
        StandardMouseKeyboard: StandardMouseKeyboard
    };
} );