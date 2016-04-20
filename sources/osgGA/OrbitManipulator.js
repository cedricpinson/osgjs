'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Vec3 = require( 'osg/Vec3' );
var Matrix = require( 'osg/Matrix' );
var Manipulator = require( 'osgGA/Manipulator' );
var OrbitManipulatorDeviceOrientationController = require( 'osgGA/OrbitManipulatorDeviceOrientationController' );
var OrbitManipulatorGamePadController = require( 'osgGA/OrbitManipulatorGamePadController' );
var OrbitManipulatorHammerController = require( 'osgGA/OrbitManipulatorHammerController' );
var OrbitManipulatorLeapMotionController = require( 'osgGA/OrbitManipulatorLeapMotionController' );
var OrbitManipulatorStandardMouseKeyboardController = require( 'osgGA/OrbitManipulatorStandardMouseKeyboardController' );
var OrbitManipulatorWebVRController = require( 'osgGA/OrbitManipulatorWebVRController' );


/**
 *  OrbitManipulator
 *  @class
 */
var OrbitManipulator = function ( boundStrategy ) {
    Manipulator.call( this, boundStrategy );
    this._homePosition = Vec3.create();
    this._frustum = {};
    this.init();
};

OrbitManipulator.Interpolator = function ( size, delay ) {
    this._current = new Array( size );
    this._target = new Array( size );
    this._delta = new Array( size );
    this._delay = ( delay !== undefined ) ? delay : 0.15;
    this._reset = false;
    this._start = 0.0;
    this.reset();
};
OrbitManipulator.Interpolator.prototype = {
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

OrbitManipulator.AvailableControllerList = [ 'StandardMouseKeyboard',
    'LeapMotion',
    'GamePad',
    'Hammer',
    'DeviceOrientation',
    'WebVR'
];

OrbitManipulator.ControllerList = [ 'StandardMouseKeyboard',
    'LeapMotion',
    'GamePad',
    'Hammer',
    'DeviceOrientation',
    'WebVR'
];

var DOT_LIMIT = 0.99; // angle limit around the pole

/** @lends OrbitManipulator.prototype */
OrbitManipulator.prototype = MACROUTILS.objectInherit( Manipulator.prototype, {
    init: function () {
        this._distance = 25.0;
        this._target = Vec3.create();
        this._upz = Vec3.createAndSet( 0.0, 0.0, 1.0 );
        Vec3.init( this._target );

        var rot1 = Matrix.makeRotate( -Math.PI, 0.0, 0.0, 1.0, Matrix.create() );
        var rot2 = Matrix.makeRotate( Math.PI / 10.0, 1.0, 0.0, 0.0, Matrix.create() );
        this._rotation = Matrix.create();
        Matrix.mult( rot1, rot2, this._rotation );
        this._time = 0.0;
        this._rotBase = Matrix.create();

        this._rotate = new OrbitManipulator.Interpolator( 2 );
        this._pan = new OrbitManipulator.Interpolator( 2 );
        this._zoom = new OrbitManipulator.Interpolator( 1 );

        this._maxDistance = Infinity;
        this._minDistance = 1e-10; // min distance allowed between eye and target
        this._minSpeed = 1e-10; // set a limit to pan/zoom speed
        this._scaleMouseMotion = 1.0;

        this._inverseMatrix = Matrix.create();

        // if we hit the min distance and can't zoom anymore, maybe we still want to move on
        // with a very low _minDistance, it's like a fps manipulator as long as you don't unzoom
        this._autoPushTarget = true;

        // instance of controller
        var self = this;

        OrbitManipulator.ControllerList.forEach( function ( value ) {
            if ( OrbitManipulator[ value ] !== undefined ) {
                self._controllerList[ value ] = new OrbitManipulator[ value ]( self );
            }
        } );
    },
    setDelay: function ( dt ) {
        this._rotate.setDelay( dt );
        this._pan.setDelay( dt );
        this._zoom.setDelay( dt );
    },
    reset: function () {
        this.init();
    },
    setTarget: function ( target ) {
        Vec3.copy( target, this._target );
        var eyePos = Vec3.create();
        this.getEyePosition( eyePos );
        this._distance = Vec3.distance( eyePos, target );
    },
    setEyePosition: ( function () {
        var f = Vec3.create();
        var s = Vec3.create();
        var u = Vec3.create();
        return function ( eye ) {
            var result = this._rotation;
            var center = this._target;

            Vec3.sub( eye, center, f );
            Vec3.normalize( f, f );

            Vec3.cross( f, this._upz, s );
            Vec3.normalize( s, s );

            Vec3.cross( s, f, u );
            Vec3.normalize( u, u );

            // s[0], f[0], u[0], 0.0,
            // s[1], f[1], u[1], 0.0,
            // s[2], f[2], u[2], 0.0,
            // 0,    0,    0,     1.0
            result[ 0 ] = s[ 0 ];
            result[ 1 ] = f[ 0 ];
            result[ 2 ] = u[ 0 ];
            result[ 3 ] = 0.0;
            result[ 4 ] = s[ 1 ];
            result[ 5 ] = f[ 1 ];
            result[ 6 ] = u[ 1 ];
            result[ 7 ] = 0.0;
            result[ 8 ] = s[ 2 ];
            result[ 9 ] = f[ 2 ];
            result[ 10 ] = u[ 2 ];
            result[ 11 ] = 0.0;
            result[ 12 ] = 0;
            result[ 13 ] = 0;
            result[ 14 ] = 0;
            result[ 15 ] = 1.0;

            this._distance = Vec3.distance( eye, center );
        };
    } )(),

    computeHomePosition: function ( boundStrategy ) {

        var bs = this.getHomeBound( boundStrategy );
        if ( !bs || !bs.valid() ) return;

        this.setDistance( this.getHomeDistance( bs ) );
        this.setTarget( bs.center() );

    },

    getHomePosition: function () {

        if ( this._node !== undefined ) {

            var target = this._target;
            var distance = this.getDistance();

            this.computeEyePosition( target, distance, this._homePosition );
        }
        return this._homePosition;
    },

    setMaxDistance: function ( d ) {
        this._maxDistance = d;
    },
    getMaxDistance: function () {
        return this._maxDistance;
    },

    setMinDistance: function ( d ) {
        this._minDistance = Math.max( 1e-10, d );
    },
    getMinDistance: function () {
        return this._minDistance;
    },

    setMinSpeed: function ( s ) {
        this._minSpeed = s;
    },
    getMinSpeed: function () {
        return this._minSpeed;
    },

    setDistance: function ( d ) {
        this._distance = d;
    },
    getDistance: function () {
        return this._distance;
    },

    setRotationBaseFromQuat: function ( quat ) {
        Matrix.makeRotateFromQuat( quat, this._rotBase );
    },
    getSpeedFactor: function () {
        return Math.max( this._distance, this._minSpeed );
    },
    computePan: ( function () {
        var inv = Matrix.create();
        var x = Vec3.create();
        var y = Vec3.create();
        return function ( dx, dy ) {
            var proj = this._camera.getProjectionMatrix();
            // modulate panning speed with verticalFov value
            // if it's an orthographic we don't change the panning speed
            // TODO : manipulators in osgjs don't support well true orthographic camera anyway because they
            // manage the view matrix (and you need to edit the projection matrix to 'zoom' for true ortho camera)
            var vFov = proj[ 15 ] === 1 ? 1.0 : 2.00 / proj[ 5 ];
            var speed = this.getSpeedFactor() * vFov;
            dy *= speed;
            dx *= speed;

            Matrix.inverse( this._rotation, inv );
            x[ 0 ] = Matrix.get( inv, 0, 0 );
            x[ 1 ] = Matrix.get( inv, 0, 1 );
            x[ 2 ] = Matrix.get( inv, 0, 2 );
            Vec3.normalize( x, x );

            y[ 0 ] = Matrix.get( inv, 2, 0 );
            y[ 1 ] = Matrix.get( inv, 2, 1 );
            y[ 2 ] = Matrix.get( inv, 2, 2 );
            Vec3.normalize( y, y );

            Vec3.mult( x, -dx, x );
            Vec3.mult( y, dy, y );
            Vec3.add( this._target, x, this._target );
            Vec3.add( this._target, y, this._target );
        };
    } )(),
    computeRotation: ( function () {
        var of = Matrix.create();
        var r = Matrix.create();
        var r2 = Matrix.create();
        var tmp = Vec3.create();
        var radLimit = Math.acos( DOT_LIMIT ) * 2.0;
        return function ( dx, dy ) {
            Matrix.makeRotate( -dx / 10.0, 0.0, 0.0, 1.0, of );
            Matrix.mult( this._rotation, of, r );

            // limit the dy movement to the range [-radLimit, radLimit]
            // so that we can't "jump" to the other side of the poles
            // with a rapid mouse movement
            dy = Math.max( Math.min( dy / 10.0, radLimit ), -radLimit );
            Matrix.makeRotate( -dy, 1.0, 0.0, 0.0, of );
            Matrix.mult( of, r, r2 );

            // prevent going on the other side of the sphere (block y)
            Matrix.transformVec3( r2, this._upz, tmp );
            if ( Math.abs( tmp[ 1 ] ) > DOT_LIMIT ) {
                Matrix.copy( r, this._rotation );
                return;
            }
            Matrix.copy( r2, this._rotation );
        };
    } )(),
    computeZoom: function ( dz ) {
        this.zoom( dz );
    },

    setAutoPushTarget: function ( bool ) {
        this._autoPushTarget = bool;
    },

    zoom: ( function () {
        var dir = Vec3.create();
        return function ( ratio ) {
            var newValue = this._distance + this.getSpeedFactor() * ( ratio - 1.0 );

            if ( newValue < this._minDistance ) {
                if ( this._autoPushTarget ) {
                    // push the target instead of zooming on it
                    Vec3.sub( this._target, this.getEyePosition( dir ), dir );
                    Vec3.normalize( dir, dir );
                    Vec3.mult( dir, this._minDistance - newValue, dir );
                    Vec3.add( this._target, dir, this._target );
                }
                newValue = this._minDistance;
            }

            if ( newValue > this._maxDistance )
                newValue = this._maxDistance;

            this._distance = newValue;
        };
    } )(),

    getRotateInterpolator: function () {
        return this._rotate;
    },
    getPanInterpolator: function () {
        return this._pan;
    },
    getZoomInterpolator: function () {
        return this._zoom;
    },
    getTarget: function ( target ) {
        return Vec3.copy( this._target, target );
    },
    getEyePosition: function ( eye ) {
        this.computeEyePosition( this._target, this._distance, eye );
        return eye;
    },

    computeEyePosition: ( function () {
        var tmpDist = Vec3.create();
        var tmpInverse = Matrix.create();
        return function ( target, distance, eye ) {
            Matrix.inverse( this._rotation, tmpInverse );
            tmpDist[ 1 ] = distance;
            Matrix.transformVec3( tmpInverse, tmpDist, eye );
            Vec3.add( target, eye, eye );
        };
    } )(),

    update: ( function () {
        var eye = Vec3.create();
        return function ( nv ) {
            var dt = nv.getFrameStamp().getDeltaTime();

            var delta;
            var mouseFactor = 0.1;
            delta = this._rotate.update( dt );
            this.computeRotation( -delta[ 0 ] * mouseFactor * this._scaleMouseMotion, -delta[ 1 ] * mouseFactor * this._scaleMouseMotion );

            var panFactor = 0.002;
            delta = this._pan.update( dt );
            this.computePan( -delta[ 0 ] * panFactor, -delta[ 1 ] * panFactor );


            delta = this._zoom.update( dt );
            this.computeZoom( 1.0 + delta[ 0 ] / 10.0 );

            var target = this._target;
            var distance = this._distance;

            /* 1. Works but bypass other manipulators */
            // Matrix.copy( this._rotBase, this._inverseMatrix );

            /* 2. Works but gets broken by other manipulators */
            Matrix.inverse( this._rotation, this._inverseMatrix );
            Matrix.postMult( this._rotBase, this._inverseMatrix );

            /* 3. Doesnt' work */
            // Matrix.preMult( this._rotBase, this._rotation );
            // Matrix.inverse( this._rotBase, this._inverseMatrix );

            Vec3.set( 0.0, distance, 0.0, eye );
            Matrix.transformVec3( this._inverseMatrix, eye, eye );

            Matrix.makeLookAt( Vec3.add( target, eye, eye ), target, this._upz, this._inverseMatrix );
        };
    } )()
} );

OrbitManipulator.DeviceOrientation = OrbitManipulatorDeviceOrientationController;
OrbitManipulator.GamePad = OrbitManipulatorGamePadController;
OrbitManipulator.Hammer = OrbitManipulatorHammerController;
OrbitManipulator.LeapMotion = OrbitManipulatorLeapMotionController;
OrbitManipulator.WebVR = OrbitManipulatorWebVRController;
OrbitManipulator.StandardMouseKeyboard = OrbitManipulatorStandardMouseKeyboardController;

module.exports = OrbitManipulator;
