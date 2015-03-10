define( [
    'tests/osgDB/Input',
    'tests/osgDB/ReaderParser',
    'tests/osgDB/DatabasePager'
], function ( Input, ReaderParser, DatabasePager ) {

    'use strict';

    return function () {
        Input();
        ReaderParser();
        DatabasePager();
    };
} );
