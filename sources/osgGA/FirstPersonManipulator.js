define( [
    'osg/Utils',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osg/Matrix',
    'osg/Vec2',
    'osg/Vec3',
    'osgGA/FirstPersonManipulatorMouseKeyboardController',
    'osgGA/FirstPersonManipulatorOculusController'
], function ( MACROUTILS, Manipulator, OrbitManipulator, Matrix, Vec2, Vec3, FirstPersonManipulatorMouseKeyboardController, FirstPersonManipulatorOculusController ) {

    /**
     * Authors:
     *  Matt Fontaine <tehqin@gmail.com>
     *  Cedric Pinson <trigrou@gmail.com>
     */

    /**
     *  FirstPersonManipulator
     *  @class
     */
    var FirstPersonManipulator = function () {
        Manipulator.call( this );
        this.init();
    };

    FirstPersonManipulator.AvailableControllerList = [ 'StandardMouseKeyboard', 'Oculus'];
    FirstPersonManipulator.ControllerList = [ 'StandardMouseKeyboard', 'Oculus' ];

    /** @lends FirstPersonManipulator.prototype */
    FirstPersonManipulator.prototype = MACROUTILS.objectInehrit( Manipulator.prototype, {
        setNode: function ( node ) {
            this._node = node;
            this.computeHomePosition();
        },
        computeHomePosition: function () {
            if ( this._node !== undefined ) {
                var bs = this._node.getBound();
                this._radius = bs.radius();
                this._eye = [ 0, -bs.radius() * 1.5, 0 ];
            }
        },
        init: function () {
            this._direction = [ 0.0, 1.0, 0.0 ];
            this._eye = [ 0.0, 25.0, 10.0 ];
            this._up = [ 0.0, 0.0, 1.0 ];
            this._radius = 1.0;
            this._forward = new OrbitManipulator.Interpolator( 1 );
            this._side = new OrbitManipulator.Interpolator( 1 );
            this._lookPosition = new OrbitManipulator.Interpolator( 2 );
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
            this._target = new Array( 3 );
            Vec3.init( this._target );
            this._angleVertical = 0.0;
            this._angleHorizontal = 0.0;

            // tmp value use for computation
            this._tmpComputeRotation1 = Matrix.makeIdentity( [] );
            this._tmpComputeRotation2 = Matrix.makeIdentity( [] );
            this._tmpComputeRotation3 = Matrix.makeIdentity( [] );
            this._tmpGetTargetDir = Vec3.init( [] );

            this._rotBase = Matrix.makeIdentity( [] );

            var self = this;

            this._controllerList = {};
            FirstPersonManipulator.ControllerList.forEach( function ( value ) {
                if ( FirstPersonManipulator[ value ] !== undefined ) {
                    self._controllerList[ value ] = new FirstPersonManipulator[ value ]( self );
                }
            } );

        },

        getEyePosition: function ( eye ) {
            eye[ 0 ] = this._eye[ 0 ];
            eye[ 1 ] = this._eye[ 1 ];
            eye[ 2 ] = this._eye[ 2 ];
            return eye;
        },

        setEyePosition: function ( eye ) {
            this._eye[ 0 ] = eye[ 0 ];
            this._eye[ 1 ] = eye[ 1 ];
            this._eye[ 2 ] = eye[ 2 ];
            return this;
        },

        getTarget: function ( pos, distance ) {
            if ( distance === undefined ) {
                distance = 25;
            }
            var dir = Vec3.mult( this._direction, distance, this._tmpGetTargetDir );
            Vec3.add( this._eye, dir, pos );
        },

        setTarget: function ( pos ) {
            this._target[ 0 ] = pos[ 0 ];
            this._target[ 1 ] = pos[ 1 ];
            this._target[ 2 ] = pos[ 2 ];
            var dir = this._tmpGetTargetDir;
            Vec3.sub( pos, this._eye, dir );
            dir[ 2 ] = 0;
            Vec3.normalize( dir, dir );
            this._angleHorizontal = Math.acos( dir[ 1 ] );
            if ( dir[ 0 ] < 0 ) {
                this._angleHorizontal = -this._angleHorizontal;
            }
            Vec3.sub( pos, this._eye, dir );
            Vec3.normalize( dir, dir );

            this._angleVertical = -Math.asin( dir[ 2 ] );
            Vec3.copy( dir, this._direction );
        },

        getLookPositionInterpolator: function () {
            return this._lookPosition;
        },
        getSideInterpolator: function () {
            return this._side;
        },
        getFowardInterpolator: function () {
            return this._forward;
        },

        computeRotation: function ( dx, dy ) {
            this._angleVertical += dy * 0.01;
            this._angleHorizontal -= dx * 0.01;

            var first = this._tmpComputeRotation1;
            var second = this._tmpComputeRotation2;
            var rotMat = this._tmpComputeRotation3;
            Matrix.makeRotate( this._angleVertical, 1, 0, 0, first );
            Matrix.makeRotate( this._angleHorizontal, 0, 0, 1, second );
            Matrix.mult( second, first, rotMat );

            var rotBase = this._rotBase;
            // TOTO refactor the way the rotation matrix is managed
            Matrix.preMult( rotMat, rotBase );

            this._direction = Matrix.transformVec3(rotMat, [ 0, 1, 0 ], this._direction );
            Vec3.normalize( this._direction, this._direction );

            this._up = Matrix.transformVec3( rotMat, [ 0, 0, 1 ], this._up );
        },

        reset: function () {
            this.init();
        },

        setStepFactor: function ( t ) {
            this._stepFactor = t;
        },

        update: function ( nv ) {
            var t = nv.getFrameStamp().getSimulationTime();
            if ( this._lastUpdate === undefined ) {
                this._lastUpdate = t;
            }
            var dt = t - this._lastUpdate;
            this._lastUpdate = t;

            this._forward.update();
            this._side.update();
            var delta = this._lookPosition.update();

            this.computeRotation( -delta[ 0 ] * 0.5, -delta[ 1 ] * 0.5 );

            var vec = new Array( 2 );
            vec[ 0 ] = this._forward.getCurrent()[ 0 ];
            vec[ 1 ] = this._side.getCurrent()[ 0 ];
            if ( Vec2.length( vec ) > 1.0 ) {
                Vec2.normalize( vec, vec );
            }
            var factor = this._radius;
            if ( this._radius < 1e-3 ) {
                factor = 1.0;
            }
            this.moveForward( vec[ 0 ] * factor * this._stepFactor * dt );
            this.strafe( vec[ 1 ] * factor * this._stepFactor * dt );

            var target = Vec3.add( this._eye, this._direction, [] );
            this._target = target;

            Matrix.makeLookAt( this._eye, target, this._up, this._inverseMatrix );
        },

        setRotationBaseFromQuat:function( quat ){
            Matrix.makeRotateFromQuat( quat, this._rotBase );
        },

        getInverseMatrix: function () {
            return this._inverseMatrix;
        },

        moveForward: function ( distance ) {
            var d = Vec3.mult( Vec3.normalize( this._direction, [] ), distance, [] );
            this._eye = Vec3.add( this._eye, d, [] );
        },

        strafe: function ( distance ) {
            var cx = Vec3.cross( this._direction, this._up, [] );
            var d = Vec3.mult( Vec3.normalize( cx, cx ), distance, [] );
            this._eye = Vec3.add( this._eye, d, [] );
        }

    } );

    ( function ( module ) {
        module.StandardMouseKeyboard = FirstPersonManipulatorMouseKeyboardController;
    } )( FirstPersonManipulator );

    ( function ( module ) {
        module.Oculus = FirstPersonManipulatorOculusController;
    } )( FirstPersonManipulator );

    return FirstPersonManipulator;
} );
