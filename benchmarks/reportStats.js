'use strict';

module.exports = ( function () {

    var reportStats = function () {

        if ( !navigator )
            return true;

        if ( navigator.userAgent.indexOf( 'PhantomJS' ) !== -1 )
            return true;

        return false;

    };

    var benchmarkOk = function ( timed, perfTarget, msg ) {

        var isCli = reportStats();
        var logMsg = msg;
        if ( logMsg === undefined ) {
            logMsg = ' perf ' + ( perfTarget ? ' of ' + perfTarget : '' ) + ' is: ' + ( timed ).toFixed() + ' ms';
        }
        if ( isCli ) {
            console.log( logMsg );
        }

        ok( isCli, logMsg );

    };

    return benchmarkOk;
} )();
