define( [
    'tests/osgDB/Input',
    'tests/osgDB/ReaderParser'
], function ( Input, ReaderParser ) {

    return function () {
        Input();
        ReaderParser();
    };
} );
