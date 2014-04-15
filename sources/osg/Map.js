define( [

], function () {

    var Map = function( obj ) {

        Object.defineProperty ( this, '_dirty', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: true
        });

        Object.defineProperty ( this, '_keys', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: undefined
        });

        if ( obj ) this.setMap( obj );
    };

    Map.prototype = {

        getKeys: function() {
            if ( this._dirty ) {
                this._keys = Object.keys( this );
                this._dirty = false;
            }
            return this._keys;
        },

        dirty: function() {
            this._dirty = true;
        },


        setMap: function( map ) {

            // remove all
            Object.keys( this ).forEach( function ( key ) {
                delete this[ key ];
            }.bind( this ) );

            Object.keys( map ).forEach( function ( key ) {
                this[ key ] = map[ key ];
            }.bind( this ) );

            this.dirty();
        }

    };

    return Map;

});
