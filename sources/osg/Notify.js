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
		if (Notify.console && Notify.console.trace){
			Notify.console.trace();
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

    Notify.setNotifyLevel = function ( level ) {

        var log = function ( str ) {
            if ( this.console !== undefined ) {
                this.console.log( str, getStackTrace() );
            }
        };

        var info = function ( str ) {
            if ( this.console !== undefined ) {
                this.console.info( str, getStackTrace() );
            }
        };

        var warn = function ( str ) {
            if ( this.console !== undefined ) {
                this.console.warn( str, getStackTrace() );
            }
        };

        var error = function ( str ) {
            if ( this.console !== undefined ) {
                this.console.error( str, getStackTrace() );
            }
        };

        var debug = function ( str ) {
            if ( this.console !== undefined ) {
                this.console.debug( str, getStackTrace() );
            }
        };

        var dummy = function () {};

        Notify.debug = dummy;
        Notify.info = dummy;
        Notify.log = Notify.notice = dummy;
        Notify.warn = dummy;
        Notify.error = dummy;

        if ( level <= Notify.DEBUG ) {
            Notify.debug = debug;
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

    Notify.setConsole = function( replacement ) {
        Notify.console = replacement;
    };

    return Notify;
} );
