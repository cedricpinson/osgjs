define( [
    'osg/Utils',

], function ( MACROUTILS ) {

    var OptionsDefault = {
        'antialias': true,
        'useDevicePixelRatio': true,
        'fullscreen': true,
        'enableFrustumCulling': false
    };

    var Options = function () {

        Object.keys( OptionsDefault ).forEach( function ( key ) {
            this[ key ] = OptionsDefault[ key ];
        }.bind( this ) );

    };


    Options.prototype = {

        extend: function( options ) {
            MACROUTILS.objectMix( this, options );
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
});
