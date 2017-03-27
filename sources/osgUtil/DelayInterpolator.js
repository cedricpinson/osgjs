var DelayInterpolator = function ( size, delay ) {
    this._current = new Float32Array( size );
    this._target = new Float32Array( size );
    this._delta = new Float32Array( size );
    this._delay = ( delay !== undefined ) ? delay : 0.15;
    this._reset = false;
    this._start = 0.0;
    this.reset();
};

DelayInterpolator.prototype = {
    setDelay: function ( delay ) {
        this._delay = delay;
    },
    reset: function () {
        for ( var i = 0, l = this._current.length; i < l; i++ ) {
            this._current[ i ] = this._target[ i ] = 0.0;
        }
        this._reset = true;
    },
    update: function ( dt ) {
        // assume 60 fps to be consistent with the old _delay values for backward compatibility
        // (otherwise we'd have to adjust the _delay values by multiplying to 60 )
        var dtDelay = Math.min( 1.0, this._delay * dt * 60.0 );
        for ( var i = 0, l = this._current.length; i < l; i++ ) {
            var d = ( this._target[ i ] - this._current[ i ] ) * dtDelay;
            this._delta[ i ] = d;
            this._current[ i ] += d;
        }
        return this._delta;
    },
    set: function () {
        for ( var i = 0, l = this._current.length; i < l; i++ ) {
            this._current[ i ] = this._target[ i ] = arguments[ i ];
        }
        this._reset = false;
    },
    isReset: function () {
        return this._reset;
    },
    getCurrent: function () {
        return this._current;
    },
    setTarget: function () {
        for ( var i = 0, l = this._target.length; i < l; i++ ) {
            if ( this._reset ) {
                this._target[ i ] = this._current[ i ] = arguments[ i ];
            } else {
                this._target[ i ] = arguments[ i ];
            }
        }
        this._reset = false;
    },
    addTarget: function () {
        for ( var i = 0; i < arguments.length; i++ ) {
            this._target[ i ] += arguments[ i ];
        }
    },
    getTarget: function () {
        return this._target;
    },
    getDelta: function () {
        return this._delta;
    },
    getStart: function () {
        return this._start;
    },
    setStart: function ( start ) {
        this._start = start;
    }
};

module.exports = DelayInterpolator;
