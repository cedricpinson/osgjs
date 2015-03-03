define( [
    'tests/osgDB/Input',
    'tests/osgDB/ReaderParser',
    'tests/osgDB/DatabasePager'
], function ( Input, ReaderParser, DatabasePager ) {

    return function () {
        Input();
        ReaderParser();
        DatabasePager();
    };
} );
