define( [
    'osg/Utils',
    'osgAnimation/Target',
    'osg/Quat'
], function ( MACROUTILS, Target, Quat ) {


    var QuatTarget = function () {
        Target.call( this );
        this._target = Quat.create();
    };
    QuatTarget.prototype = MACROUTILS.objectInehrit( Target.prototype, {
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
                Quat.lerp( t, this._target, val, this._target );
                Quat.normalize( this._target, this._target );

            } else {

                this._priorityWeight = weight;
                this._lastPriority = priority;
                Quat.copy( val, this._target );
            }
        }
    } );

    return QuatTarget;
} );
