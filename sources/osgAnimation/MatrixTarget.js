define( [
    'osg/Utils',
    'osgAnimation/Target',
    'osg/Matrix'
], function ( MACROUTILS, Target, Matrix ) {

    var MatrixTarget = function( target ) {
        Target.call( this );
        if ( !target )
            this._target = Matrix.create();
        else
            Matrix.copy( target, this._target);
    };

    MatrixTarget.prototype = MACROUTILS.objectInherit( Target.prototype, {
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
                Matrix.lerp( t, this._target, val, this._target );
            } else {

                this._priorityWeight = weight;
                this._lastPriority = priority;
                Matrix.copy( val, this._target );
            }
        }
    } );

    return MatrixTarget;
} );
