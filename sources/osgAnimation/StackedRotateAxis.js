define( [
    'osg/Utils',
    'osg/Object',
    'osg/Matrix',
    'osgAnimation/Vec3Target',
    'osgAnimation/FloatTarget',
    'osg/Vec3',
    'osg/Quat'
], function ( MACROUTILS, Object, Matrix, Vec3Target, FloatTarget, Vec3, Quat ) {


    /**
     *  StackedRotateAxis
     *  @class StackedRotateAxis
     */
    var StackedRotateAxis = function ( name, axis, angle ) {
        Object.call( this );
        if ( !axis ) {
            axis = [ 1.0, 0.0, 0.0 ];
        }
        if ( !angle ) {
            angle = 0.0;
        }
        this._axis = axis;
        this._angle = angle;
        this._target = undefined;
        this.setName( name );

        this._matrixTmp = Matrix.create();
        this._quatTmp = Matrix.create();
    };

    /** @lends StackedRotateAxis.prototype */
    StackedRotateAxis.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        setAxis: function ( axis ) {
            Vec3.copy( axis, this._axis );
        },
        setAngle: function ( angle ) {
            this._angle = angle;
        },
        setTarget: function ( target ) {
            this._target = target;
        },
        getTarget: function () {
            return this._target;
        },
        update: function () {
            if ( this._target !== undefined ) {
                this._angle = this._target.getValue();
            }
        },
        getOrCreateTarget: function () {
            if ( !this._target ) {
                this._target = new FloatTarget( this._angle );
            }
            return this._target;
        },
        applyToMatrix: function ( m ) {
            var axis = this._axis;
            var qtmp = this._quatTmp;
            var mtmp = this._matrixTmp;

            Quat.makeRotate( this._angle, axis[ 0 ], axis[ 1 ], axis[ 2 ], qtmp );
            Matrix.setRotateFromQuat( mtmp, qtmp );
            Matrix.preMult( m, mtmp );
        }

    } );

    return StackedRotateAxis;
} );
