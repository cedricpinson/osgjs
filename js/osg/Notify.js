/** -*- compile-command: 'jslint-cli osg.js' -*- */

define( [], function () {

    var Notify = {};

    Notify.DEBUG = 0;
    Notify.INFO = 1;
    Notify.NOTICE = 2;
    Notify.WARN = 3;
    Notify.ERROR = 4;

    Notify.setNotifyLevel = function ( level ) {

        var log = function ( str ) {
            if ( window.console !== undefined ) {
                window.console.log( str, getStackTrace() );
            }
        };

        var info = function ( str ) {
            if ( window.console !== undefined ) {
                window.console.info( str, getStackTrace() );
            }
        };

        var warn = function ( str ) {
            if ( window.console !== undefined ) {
                window.console.warn( str, getStackTrace() );
            }
        };

        var error = function ( str ) {
            if ( window.console !== undefined ) {
                window.console.error( str, getStackTrace() );
            }
        };

        var debug = function ( str ) {
            if ( window.console !== undefined ) {
                window.console.debug( str, getStackTrace() );
            }
        };

        var dummy = function () {};

        Notify.debug = dummy;
        Notify.info = dummy;
        Notify.log = dummy;
        Notify.warn = dummy;
        Notify.error = dummy;

        if ( level <= Notify.DEBUG ) {
            Notify.debug = debug;
        }
        if ( level <= Notify.INFO ) {
            Notify.info = info;
        }
        if ( level <= Notify.NOTICE ) {
            Notify.log = log;
        }
        if ( level <= Notify.WARN ) {
            Notify.warn = warn;
        }
        if ( level <= Notify.ERROR ) {
            Notify.error = error;
        }
    };

    Notify.setNotifyLevel( Notify.NOTICE );

    Notify.reportWebGLError = false;

    return Notify;
} );