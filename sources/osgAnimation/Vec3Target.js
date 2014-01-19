define( [
    'osg/Utils',
    'osgAnimation/Target',
    'osg/Vec3'
], function ( MACROUTILS, Target, Vec3 ) {

    var Vec3Target = function () {
        Target.call( this );
        this._target = [ 0, 0, 0 ];
    };
    Vec3Target.prototype = MACROUTILS.objectInehrit( Target.prototype, {
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
                Vec3.lerp( t, this._target, val, this._target );
            } else {

                this._priorityWeight = weight;
                this._lastPriority = priority;
                Vec3.copy( val, this._target );
            }
        }
    } );

    return Vec3Target;
} );
