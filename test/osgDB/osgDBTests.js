define( [
    'test/osgDB/Input',
    'test/osgDB/ReaderParser'
], function ( Input, ReaderParser ) {

    return function () {
        Input();
        ReaderParser();
    };
} );