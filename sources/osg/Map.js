define( [

], function () {
    'use strict';

    var Map = function ( obj ) {

        Object.defineProperty( this, '_dirty', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: true
        } );

        Object.defineProperty( this, '_keys', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: undefined
        } );

        if ( obj ) this.setMap( obj );
    };

    Map.prototype = {

        getKeys: function () {
            if ( this._dirty ) {
                this._keys = Object.keys( this );
                this._dirty = false;
            }
            return this._keys;
        },

        dirty: function () {
            this._dirty = true;
        },

        remove: function ( key ) {
            //this[ key ] = undefined;
            delete this[ key ];
            this.dirty();
            this.getKeys();
        },

        setMap: function ( map ) {

            var i, l;
            // remove all
            var keys = Object.keys( this );
            if ( keys.length > 0 ) {
                for ( i = 0, l = keys.length; i < l; i++ )
                    delete this[ keys[ i ] ];
            }

            // add new
            keys = Object.keys( map );
            if ( keys.length > 0 ) {
                for ( i = 0, l = keys.length; i < l; i++ ) {
                    var key = keys[ i ];
                    this[ key ] = map[ key ];
                }
            }

            this.dirty();
        }

    };

    return Map;

} );