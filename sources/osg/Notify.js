'use strict';

var Notify = {};

Notify.DEBUG = 0;
Notify.INFO = 1;
Notify.NOTICE = Notify.LOG = 2;
Notify.WARN = 3;
Notify.ERROR = 4;

Notify.console = window.console;

/** logging with readability in mind.
 * @param { str } actual log text
 * @param { fold  }  sometimes you want to hide looooong text
 * @param { noTrace  } where that log came from ?
 * @param { level  } what severity is that log (gives text color too )
 */
function logSub( str, level ) {

    if ( !Notify.console ) return;

    Notify.console[ level ]( str );
    if ( Notify.traceLogCall && level !== 'error' ) console.trace();

}

function logSubFold( title, str, level ) {

    if ( !Notify.console ) return;

    if ( Notify.console.groupCollapsed ) Notify.console.groupCollapsed( title );
    Notify.console[ level ]( str );
    if ( Notify.traceLogCall && level !== 'error' ) console.trace();

    if ( Notify.console.groupEnd ) Notify.console.groupEnd();

}

var log = function ( str ) {
    logSub( str, 'log' );
};
var logFold = function ( title, str ) {
    logSubFold( title, str, 'log' );
};

var info = function ( str ) {
    logSub( str, 'info' );
};
var infoFold = function ( title, str ) {
    logSubFold( title, str, 'info' );
};

var warn = function ( str ) {
    logSub( str, 'warn' );
};
var warnFold = function ( title, str ) {
    logSubFold( title, str, 'warn' );
};

var error = function ( str ) {
    logSub( str, 'error' );
};
var errorFold = function ( title, str ) {
    logSubFold( title, str, 'error' );
};

var debug = function ( str ) {
    logSub( str, 'debug' );
};
var debugFold = function ( title, str ) {
    logSubFold( title, str, 'debug' );
};

var assert = function ( test, str ) {
    if ( this.console !== undefined && !test ) {
        this.console.assert( test, str );
    }
};
Notify.assert = assert;

Notify.setNotifyLevel = function ( logLevel ) {

    var dummy = function () {};

    Notify.debug = dummy;
    Notify.debugFold = dummy;

    Notify.info = dummy;
    Notify.infoFold = dummy;

    Notify.log = Notify.notice = dummy;
    Notify.logFold = Notify.noticeFold = dummy;

    Notify.warn = dummy;
    Notify.warnFold = dummy;

    Notify.error = dummy;
    Notify.errorFold = dummy;

    if ( logLevel <= Notify.DEBUG ) {
        Notify.debug = debug;
        Notify.debugFold = debugFold;
    }

    if ( logLevel <= Notify.INFO ) {
        Notify.info = info;
        Notify.infoFold = infoFold;
    }

    if ( logLevel <= Notify.NOTICE ) {
        Notify.log = Notify.notice = log;
        Notify.logFold = Notify.noticeFold = logFold;
    }

    if ( logLevel <= Notify.WARN ) {
        Notify.warn = warn;
        Notify.warnFold = warnFold;
    }

    if ( logLevel <= Notify.ERROR ) {
        Notify.error = error;
        Notify.errorFold = errorFold;
    }
};

Notify.setNotifyLevel( Notify.NOTICE );

Notify.reportWebGLError = false;

Notify.setConsole = function ( replacement ) {
    Notify.console = replacement;
};

// for debug
Notify.printMatrix = function ( m, rowMajor ) {
    if ( rowMajor ) {
        console.table( [ m.slice( 0, 4 ), m.slice( 4, 8 ), m.slice( 8, 12 ), m.slice( 12, 16 ) ] );
    } else {
        console.table( [
            [ m[ 0 ], m[ 4 ], m[ 8 ], m[ 12 ] ],
            [ m[ 1 ], m[ 5 ], m[ 9 ], m[ 13 ] ],
            [ m[ 2 ], m[ 6 ], m[ 10 ], m[ 14 ] ],
            [ m[ 3 ], m[ 7 ], m[ 11 ], m[ 15 ] ]
        ] );
    }
};

module.exports = Notify;
