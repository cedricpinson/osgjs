define( [], function () {

    // user performance if available or fallback

    var now = ( function () {
        // if no window.performance
        if ( window.performance === undefined ) {
            return function () {
                return Date.now();
            };
        }

        var fn = window.performance.now || window.performance.mozNow || window.performance.msNow || window.performance.oNow || window.performance.webkitNow ||
            function () {
                return Date.now();
            };
        return function () {
            return fn.apply( window.performance, arguments );
        };
    } )();


    var Timer = function () {};

    Timer.instance = function () {

        if ( !Timer._instance )
            Timer._instance = new Timer();

        return Timer._instance;
    };

    Timer.prototype = {

        // delta in seconds
        deltaS: function ( t0, t1 ) {
            return ( t1 - t0 ) / 1000.0;
        },

        // delta in milliseconds
        deltaM: function ( t0, t1 ) {
            return t1 - t0;
        },

        tick: function () {
            return now();
        }


    };


    return Timer;

} );
