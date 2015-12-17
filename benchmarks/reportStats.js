'use strict';

module.exports = function ( timed, perfTarget, msg ) {

    var logMsg = msg;
    if ( logMsg === undefined ) {
        logMsg = 'perf' + ( perfTarget ? ' of ' + perfTarget : '' ) + ' is: ' + ( timed ).toFixed() + ' ms';
    }

    ok( true, logMsg );

};
