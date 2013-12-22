define( [], function () {

    /**
     *  Sampler is responsible to interpolate keys
     *  @class Sampler
     */
    var Sampler = function ( keys, interpolator ) {
        if ( !keys ) {
            keys = [];
        }
        this._keys = keys;
        this._interpolator = interpolator;
    };

    /** @lends Sampler.prototype */
    Sampler.prototype = {

        getKeyframes: function () {
            return this._keys;
        },
        setKeyframes: function ( keys ) {
            this._keys = keys;
        },
        setInterpolator: function ( interpolator ) {
            this._interpolator = interpolator;
        },
        getInterpolator: function () {
            return this._interpolator;
        },
        getStartTime: function () {
            if ( this._keys.length === 0 ) {
                return undefined;
            }
            return this._keys[ 0 ].t;
        },
        getEndTime: function () {
            if ( this._keys.length === 0 ) {
                return undefined;
            }
            return this._keys[ this._keys.length - 1 ].t;
        },

        // result contains the keyIndex where to start, this key
        // will be updated when calling the Interpolator
        // result.value will contain the interpolation result
        // { 'value': undefined, 'keyIndex': 0 };
        getValueAt: function ( t, result ) {
            // reset the key if invalid
            if ( this._keys[ result.key ].t > t ) {
                result.key = 0;
            }
            this._interpolator( this._keys, t, result );
        }
    };

    return Sampler;
} );
