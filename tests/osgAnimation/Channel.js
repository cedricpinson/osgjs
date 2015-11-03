'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );


module.exports = function () {

    QUnit.module( 'osgAnimation' );

    QUnit.test( 'Channel', function () {
        var keys = mockup.createVec3Keyframes();

        ok( keys === keys, 'no tests' );
    } );
};
