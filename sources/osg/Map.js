define( [

], function () {

    var Map = function() {
        this._dirty = true;
        this._map = {};
        this._keys = undefined;
    };

    Map.prototype = {
        dirty: function() { this._dirty = true; },
        setMapContent: function( map ) { this._map = map; this._dirty = true; },
        getMapContent: function() { return this._map; },
        getKeys: function() {
            if ( this._dirty ) {
                this._keys = Object.keys( this._map );
                this._dirty = false;
            }
            return this._keys;
        }
    };

    return Map;

});
