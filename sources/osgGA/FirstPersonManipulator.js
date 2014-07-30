define( [
    'osg/Utils',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osg/Matrix',
    'osg/Vec2',
    'osg/Vec3',
    'osgGA/FirstPersonManipulatorMouseKeyboardController',
    'osgGA/FirstPersonManipulatorOculusController',
    'osgGA/FirstPersonManipulatorDeviceOrientationController'
], function ( MACROUTILS, Manipulator, OrbitManipulator, Matrix, Vec2, Vec3, FirstPersonManipulatorMouseKeyboardController, FirstPersonManipulatorOculusController, FirstPersonManipulatorDeviceOrientationController ) {

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

    FirstPersonManipulator.AvailableControllerList = [ 'StandardMouseKeyboard', 'Oculus', 'DeviceOrientation'];
    FirstPersonManipulator.ControllerList = [ 'StandardMouseKeyboard', 'Oculus', 'DeviceOrientation' ];

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
                var eye = this._eye;
                eye[ 0 ] = 0.0;
                eye[ 1 ] = -bs.radius();
                eye[ 2 ] = 0.0;
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
            this._target = [ 0.0, 0.0, 0.0 ];
            this._angleVertical = 0.0;
            this._angleHorizontal = 0.0;

            // tmp value use for computation
            this._tmpComputeRotation1 = Matrix.create();
            this._tmpComputeRotation2 = Matrix.create();
            this._tmpComputeRotation3 = Matrix.create();
            this._tmpGetTargetDir = [ 0.0, 0.0, 0.0 ];

            this._rotBase = Matrix.create();

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
                distance = 25.0;
            }
            var dir = Vec3.mult( this._direction, distance, this._tmpGetTargetDir );
            Vec3.add( this._eye, dir, pos );
            return pos;
        },

        setTarget: function ( pos ) {
            this._target[ 0 ] = pos[ 0 ];
            this._target[ 1 ] = pos[ 1 ];
            this._target[ 2 ] = pos[ 2 ];
            var dir = this._tmpGetTargetDir;
            Vec3.sub( pos, this._eye, dir );
            dir[ 2 ] = 0.0;
            Vec3.normalize( dir, dir );
            this._angleHorizontal = Math.acos( dir[ 1 ] );
            if ( dir[ 0 ] < 0.0 ) {
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

        computeRotation: ( function () {
            var upy = [ 0.0, 1.0, 0.0 ];
            var upz = [ 0.0, 0.0, 1.0 ];
            return function ( dx, dy ) {
                this._angleVertical += dy * 0.01;
                this._angleHorizontal -= dx * 0.01;

                var first = this._tmpComputeRotation1;
                var second = this._tmpComputeRotation2;
                var rotMat = this._tmpComputeRotation3;
                Matrix.makeRotate( this._angleVertical, 1.0, 0.0, 0.0, first );
                Matrix.makeRotate( this._angleHorizontal, 0.0, 0.0, 1.0, second );
                Matrix.mult( second, first, rotMat );

                // TOTO refactor the way the rotation matrix is managed
                Matrix.preMult( rotMat, this._rotBase );

                this._direction = Matrix.transformVec3( rotMat, upy, this._direction );
                Vec3.normalize( this._direction, this._direction );

                Matrix.transformVec3( rotMat, upz, this._up );
            };
        } )(),
        reset: function () {
            this.init();
        },

        setStepFactor: function ( t ) {
            this._stepFactor = t;
        },

        update: ( function () {
            var vec = [ 0.0, 0.0 ];
            return function ( nv ) {
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

                Vec3.add( this._eye, this._direction, this._target );

                Matrix.makeLookAt( this._eye, this._target, this._up, this._inverseMatrix );
            };
        } )(),
        setRotationBaseFromQuat: function ( quat ) {
            Matrix.makeRotateFromQuat( quat, this._rotBase );
        },

        getInverseMatrix: function () {
            return this._inverseMatrix;
        },

        moveForward: ( function () {
            var tmp = [ 0.0, 0.0, 0.0 ];
            return function ( distance ) {
                Vec3.normalize( this._direction, tmp );
                Vec3.mult( tmp, distance, tmp );
                Vec3.add( this._eye, tmp, this._eye );
            };
        } )(),

        strafe: ( function () {
            var tmp = [ 0.0, 0.0, 0.0 ];
            return function ( distance ) {
                Vec3.cross( this._direction, this._up, tmp );
                Vec3.normalize( tmp, tmp );
                Vec3.mult( tmp, distance, tmp );
                Vec3.add( this._eye, tmp, this._eye );
            };
        } )()
    } );

    ( function ( module ) {
        module.StandardMouseKeyboard = FirstPersonManipulatorMouseKeyboardController;
    } )( FirstPersonManipulator );

    ( function ( module ) {
        module.Oculus = FirstPersonManipulatorOculusController;
    } )( FirstPersonManipulator );

    ( function ( module ) {
        module.DeviceOrientation = FirstPersonManipulatorDeviceOrientationController;
    } )( FirstPersonManipulator );

    return FirstPersonManipulator;
} );
