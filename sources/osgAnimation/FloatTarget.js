define( [
    'osg/Utils',
    'osgAnimation/Target'
], function ( MACROUTILS, Target ) {

    var FloatTarget = function ( value ) {
        Target.call( this );
        this._target = [ value ];
    };

    FloatTarget.prototype = MACROUTILS.objectInehrit( Target.prototype, {
        update: function ( weight, val, priority ) {
            if ( this._weight || this._priorityWeight ) {

                if ( this._lastPriority !== priority ) {
                    // change in priority
                    // add to weight with the same previous priority cumulated weight
                    this._weight += this._priorityWeight * ( 1.0 - this._weight );
                    this._priorityWeight = 0;
                    this._lastPriority = priority;
                }

                this._priorityWeight += weight;
                var t = ( 1.0 - this._weight ) * weight / this._priorityWeight;
                this._target += ( val - this._target ) * t;
            } else {

                this._priorityWeight = weight;
                this._lastPriority = priority;
                this._target = val;
            }
        }
    } );

    return FloatTarget;
} );
