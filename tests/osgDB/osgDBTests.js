'use strict';
var Input = require( 'tests/osgDB/Input' );
var ReaderParser = require( 'tests/osgDB/ReaderParser' );
var DatabasePager = require( 'tests/osgDB/DatabasePager' );


module.exports = function () {
    Input();
    ReaderParser();
    DatabasePager();
};
