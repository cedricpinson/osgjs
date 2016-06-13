'use strict';
var assert = require( 'chai' ).assert;

module.exports = function ( timed, perfTarget, msg ) {

    var logMsg = msg;
    if ( logMsg === undefined ) {
        logMsg = 'perf' + ( perfTarget ? ' of ' + perfTarget : '' ) + ' is: ' + ( timed ).toFixed() + ' ms';
    }

    assert.isOk( true, logMsg );

};
