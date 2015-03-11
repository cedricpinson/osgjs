define( [
    'osg/Utils',

], function ( MACROUTILS ) {

    var OptionsDefault = {
        'antialias': true, // activate MSAA
        //'overrideDevicePixelRatio': 1, // if specified override the device pixel ratio
        'fullscreen': true,
        'enableFrustumCulling': false,
        'stats': false, // display canvas with stats for the viewer
        'statsNoGraph': false, // display only text
        'scrollwheel': true
    };

    var Options = function () {

        Object.keys( OptionsDefault ).forEach( function ( key ) {
            this[ key ] = OptionsDefault[ key ];
        }.bind( this ) );

    };


    Options.prototype = {

        extend: function ( options ) {
            MACROUTILS.objectMix( this, options );
            return this;
        },

        get: function ( key ) {
            return this[ key ];
        },

        getBoolean: function ( key ) {
            var val = this.getString( key );
            if ( val ) return Boolean( JSON.parse( val ) );
            return undefined;
        },

        getNumber: function ( key ) {
            var val = this[ key ];
            if ( val ) return Number( JSON.parse( val ) );
            return undefined;
        },

        getString: function ( key ) {
            var val = this[ key ];
            if ( val ) return this[ key ].toString();
            return undefined;
        }

    };

    return Options;
} );
