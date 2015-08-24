define( [
    'osg/Utils',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulator',
    'osg/Matrix',
    'osg/Vec2',
    'osg/Vec3',
    'osgGA/FirstPersonManipulatorDeviceOrientationController',
    'osgGA/FirstPersonManipulatorHammerController',
    'osgGA/FirstPersonManipulatorOculusController',
    'osgGA/FirstPersonManipulatorStandardMouseKeyboardController'
], function ( MACROUTILS, Manipulator, OrbitManipulator, Matrix, Vec2, Vec3, FirstPersonManipulatorDeviceOrientationController, FirstPersonManipulatorHammerController, FirstPersonManipulatorOculusController, FirstPersonManipulatorStandardMouseKeyboardController ) {

    'use strict';

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

    FirstPersonManipulator.AvailableControllerList = [ 'StandardMouseKeyboard', 'Oculus', 'DeviceOrientation', 'Hammer' ];
    FirstPersonManipulator.ControllerList = [ 'StandardMouseKeyboard', 'Oculus', 'DeviceOrientation', 'Hammer' ];

    /** @lends FirstPersonManipulator.prototype */
    FirstPersonManipulator.prototype = MACROUTILS.objectInherit( Manipulator.prototype, {
        computeHomePosition: function ( useBoundingBox ) {
            var bs = this.getHomeBound( useBoundingBox );
            if ( !bs ) return;

            this._distance = this.getHomeDistance( bs );
            var cen = bs.center();
            Vec3.mult( this._direction, -this._distance, this._eye );
            Vec3.add( cen, this._eye, this._eye );
            this.setTarget( cen );
        },
        init: function () {
            this._direction = [ 0.0, 1.0, 0.0 ];
            this._eye = [ 0.0, 25.0, 10.0 ];
            this._up = [ 0.0, 0.0, 1.0 ];
            this._distance = 1.0;
            this._forward = new OrbitManipulator.Interpolator( 1 );
            this._side = new OrbitManipulator.Interpolator( 1 );
            this._lookPosition = new OrbitManipulator.Interpolator( 2 );

            // direct pan interpolator (not based on auto-move)
            this._pan = new OrbitManipulator.Interpolator( 2 );
            this._zoom = new OrbitManipulator.Interpolator( 1 );

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

        getTarget: function ( pos ) {
            var dir = Vec3.mult( this._direction, this._distance, this._tmpGetTargetDir );
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
        getForwardInterpolator: function () {
            return this._forward;
        },
        getPanInterpolator: function () {
            return this._pan;
        },
        getZoomInterpolator: function () {
            return this._zoom;
        },
        getRotateInterpolator: function () {
            // for compatibility with orbit hammer controllers
            return this._lookPosition;
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
                Matrix.makeRotate( -this._angleVertical, 1.0, 0.0, 0.0, first );
                Matrix.makeRotate( -this._angleHorizontal, 0.0, 0.0, 1.0, second );
                Matrix.mult( second, first, rotMat );

                // TOTO refactor the way the rotation matrix is managed
                Matrix.preMult( rotMat, this._rotBase );

                Matrix.transformVec3( rotMat, upy, this._direction );
                Vec3.normalize( this._direction, this._direction );

                Matrix.transformVec3( rotMat, upz, this._up );
            };
        } )(),
        reset: function () {
            this.init();
        },
        setDistance: function ( d ) {
            this._distance = d;
        },
        getDistance: function () {
            return this._distance;
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

                // TDOO why check with epsilon ?
                var factor = this._distance < 1e-3 ? 1e-3 : this._distance;

                // see comment in orbitManipulator for fov modulation speed
                var proj = this._camera.getProjectionMatrix();
                var vFov = proj[ 15 ] === 1 ? 1.0 : 2.00 / proj[ 5 ];

                // time based displacement vector
                vec[ 0 ] = this._forward.getCurrent()[ 0 ];
                vec[ 1 ] = this._side.getCurrent()[ 0 ];
                if ( Vec2.length( vec ) > 1.0 ) Vec2.normalize( vec, vec );

                // direct displacement vectors
                var pan = this._pan.update();
                var zoom = this._zoom.update();

                var timeFactor = this._stepFactor * factor * vFov * dt;
                var directFactor = this._stepFactor * factor * vFov * 0.002;

                this.moveForward( vec[ 0 ] * timeFactor - zoom[ 0 ] * directFactor * 20.0 );
                this.strafe( vec[ 1 ] * timeFactor - pan[ 0 ] * directFactor );
                this.strafeVertical( -pan[ 1 ] * directFactor );

                Vec3.add( this._eye, this._direction, this._target );

                Matrix.makeLookAt( this._eye, this._target, this._up, this._inverseMatrix );
            };
        } )(),
        setRotationBaseFromQuat: function ( quat ) {
            Matrix.makeRotateFromQuat( quat, this._rotBase );
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
        } )(),

        strafeVertical: ( function () {
            var tmp = [ 0.0, 0.0, 0.0 ];
            return function ( distance ) {
                Vec3.normalize( this._up, tmp );
                Vec3.mult( tmp, distance, tmp );
                Vec3.add( this._eye, tmp, this._eye );
            };
        } )(),
    } );

    FirstPersonManipulator.DeviceOrientation = FirstPersonManipulatorDeviceOrientationController;
    FirstPersonManipulator.Hammer = FirstPersonManipulatorHammerController;
    FirstPersonManipulator.Oculus = FirstPersonManipulatorOculusController;
    FirstPersonManipulator.StandardMouseKeyboard = FirstPersonManipulatorStandardMouseKeyboardController;

    return FirstPersonManipulator;
} );
