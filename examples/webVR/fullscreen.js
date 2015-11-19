/*!
 * screenfull
 * v2.0.0 - 2014-12-22
 * (c) Sindre Sorhus; MIT License
 */

( function () {
    'use strict';

    var isCommonjs = typeof module !== 'undefined' && module.exports;

    var fn = ( function () {
        var val;
        var valLength;

        var fnMap = [
            [
                'requestFullscreen',
                'exitFullscreen',
                'fullscreenElement',
                'fullscreenEnabled',
                'fullscreenchange',
                'fullscreenerror'
            ],
            // new WebKit
            [
                'webkitRequestFullscreen',
                'webkitExitFullscreen',
                'webkitFullscreenElement',
                'webkitFullscreenEnabled',
                'webkitfullscreenchange',
                'webkitfullscreenerror'

            ],
            // old WebKit (Safari 5.1)
            [
                'webkitRequestFullScreen',
                'webkitCancelFullScreen',
                'webkitCurrentFullScreenElement',
                'webkitCancelFullScreen',
                'webkitfullscreenchange',
                'webkitfullscreenerror'

            ],
            [
                'mozRequestFullScreen',
                'mozCancelFullScreen',
                'mozFullScreenElement',
                'mozFullScreenEnabled',
                'mozfullscreenchange',
                'mozfullscreenerror'
            ],
            [
                'msRequestFullscreen',
                'msExitFullscreen',
                'msFullscreenElement',
                'msFullscreenEnabled',
                'MSFullscreenChange',
                'MSFullscreenError'
            ]
        ];

        var i = 0;
        var l = fnMap.length;
        var ret = {};

        for ( ; i < l; i++ ) {
            val = fnMap[ i ];
            if ( val && val[ 1 ] in document ) {
                for ( i = 0, valLength = val.length; i < valLength; i++ ) {
                    ret[ fnMap[ 0 ][ i ] ] = val[ i ];
                }
                return ret;
            }
        }

        return false;
    } )();

    var screenfull = {
        request: function ( elem, options ) {
            var request = fn.requestFullscreen;
            var element = elem || document.documentElement;
            element[ request ]( options );

        },
        exit: function () {
            document[ fn.exitFullscreen ]();
        },
        toggle: function ( elem, options ) {
            if ( this.isFullscreen ) {
                this.exit();
            } else {
                this.request( elem, options );
            }
        },
        raw: fn
    };

    if ( !fn ) {
        if ( isCommonjs ) {
            module.exports = false;
        } else {
            window.screenfull = false;
        }

        return;
    }

    Object.defineProperties( screenfull, {
        isFullscreen: {
            get: function () {
                return !!document[ fn.fullscreenElement ];
            }
        },
        element: {
            enumerable: true,
            get: function () {
                return document[ fn.fullscreenElement ];
            }
        },
        enabled: {
            enumerable: true,
            get: function () {
                // Coerce to boolean in case of old WebKit
                return !!document[ fn.fullscreenEnabled ];
            }
        }
    } );

    if ( isCommonjs ) {
        module.exports = screenfull;
    } else {
        window.screenfull = screenfull;
    }
} )();
