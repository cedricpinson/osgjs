define( [], function () {

    var Notify = {};

    Notify.DEBUG = 0;
    Notify.INFO = 1;
    Notify.NOTICE = 2;
    Notify.WARN = 3;
    Notify.ERROR = 4;

    Notify.console = window.console;

    // #FIXME getStackTrace was initially in webgl-utils (as a global function) but only used in this file
    /** Obtain a stacktrace from the current stack http://eriwen.com/javascript/js-stack-trace/
     */
    function getStackTrace( err ) {
        if ( Notify.console && Notify.console.trace ) {
            if ( Notify.console.groupCollapsed ) Notify.console.groupCollapsed();
            Notify.console.trace();
            if ( Notify.console.groupEnd ) Notify.console.groupEnd();
            return '';
        }
        var callstack = [];
        try {
            if ( arguments.length === 1 ) {
                throw err;
            } else {
                throw new Error();
            }
        } catch ( error ) {
            if ( error.stack ) { //Firefox and Chrome
                callstack = ( error.stack + '\n' ).replace( /^\S[^\(]+?[\n$]/gm, '' ).
                replace( /^\s+(at eval )?at\s+/gm, '' ).
                replace( /^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2' ).
                replace( /^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1' ).split( '\n' );
                // Remove call to this function
                callstack.shift();

            }
        }
        // Remove empty entries
        for ( var i = 0; i < callstack.length; ++i ) {
            if ( callstack[ i ] === '' ) {
                callstack.splice( i, 1 );
                --i;
            }
        }

        return callstack;
    }

    /** logging with readability in mind.
     * @param { str } actual log text
     * @param { fold  }  sometimes you want to hide looooong text
     * @param { noTrace  } where that log came from ?
     * @param { level  } what severity is that log (gives text color too )
     */
    function logSub( str, level, fold, noTrace ) {
        if ( Notify.console !== undefined ) {
            if ( fold && Notify.console.groupCollapsed ) Notify.console.groupCollapsed();
            if ( noTrace ) {
                Notify.console[ level ]( str );
            } else {
                Notify.console[ level ]( str, getStackTrace() );
            }
            if ( fold && Notify.console.groupEnd ) Notify.console.groupEnd();
        }
    }

    Notify.setNotifyLevel = function ( level ) {


        var log = function ( str, fold, noTrace ) {
            logSub( str, 'log', fold, noTrace );
        };

        var info = function ( str, fold, noTrace ) {
            logSub( str, 'info', fold, noTrace );
        };

        var warn = function ( str, fold, noTrace ) {
            logSub( str, 'warn', fold, noTrace );
        };

        var error = function ( str, fold ) {
            logSub( str, 'error', fold, true ); // error does trace auto
        };

        var debug = function ( str, fold, noTrace ) {
            logSub( str, 'debug', fold, noTrace );
        };

        var assert = function ( test, str ) {
            if ( this.console !== undefined ) {
                this.console.assert( test, str, getStackTrace() );
            }
        };

        var dummy = function () {};

        Notify.assert = dummy;
        Notify.debug = dummy;
        Notify.info = dummy;
        Notify.log = Notify.notice = dummy;
        Notify.warn = dummy;
        Notify.error = dummy;

        if ( level <= Notify.DEBUG ) {
            Notify.debug = debug;
            Notify.assert = assert;
        }
        if ( level <= Notify.INFO ) {
            Notify.info = info;
        }
        if ( level <= Notify.NOTICE ) {
            Notify.log = Notify.notice = log;
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

    Notify.setConsole = function ( replacement ) {
        Notify.console = replacement;
    };

    return Notify;
} );
