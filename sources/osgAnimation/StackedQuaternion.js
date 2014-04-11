define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/QuatTarget',
    'osg/Quat'
], function ( MACROUTILS, Object, Matrix, QuatTarget, Quat ) {

    /**
     *  StackedQuaternion
     *  @class StackedQuaternion
     */
    var StackedQuaternion = function ( name, quat ) {
        Object.call( this );
        if ( !quat ) {
            quat = Quat.create();
        }
        this._quaternion = quat;
        this._target = undefined;
        this._matrixTmp = Matrix.create();
        this.setName( name );
    };

    /** @lends StackedQuaternion.prototype */
    StackedQuaternion.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        setQuaternion: function ( q ) {
            Quat.copy( q, this._quaternion );
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        getTarget: function () {
            return this._target;
        },
        update: function () {
            if ( this._target !== undefined ) {
                Quat.copy( this._target.getValue(), this._quaternion );
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new QuatTarget( this._quaternion );
            }
            return this._target;
        },
        applyToMatrix: function ( m ) {
            var mtmp = this._matrixTmp;
            Matrix.setRotateFromQuat( mtmp, this._quaternion );
            Matrix.preMult( m, mtmp );
        }
    } );

    return StackedQuaternion;
} );
