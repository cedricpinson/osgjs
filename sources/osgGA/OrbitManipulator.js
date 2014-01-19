define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/Matrix',
    'osgGA/Manipulator',
    'osgGA/OrbitManipulatorLeapMotionController',
    'osgGA/OrbitManipulatorMouseKeyboardController',
    'osgGA/OrbitManipulatorHammerController',
    'osgGA/OrbitManipulatorGamePadController'
], function ( MACROUTILS, Vec3, Matrix, Manipulator, OrbitManipulatorLeapMotionController, OrbitManipulatorMouseKeyboardController, OrbitManipulatorHammerController, OrbitManipulatorGamePadController ) {

    /**
     *  OrbitManipulator
     *  @class
     */
    var OrbitManipulator = function () {
        Manipulator.call( this );
        this._tmpInverse = Matrix.makeIdentity( [] );
        this._tmpHomePosition = Vec3.init( [] );
        this.init();
    };

    OrbitManipulator.Interpolator = function ( size, delay ) {
        this._current = new Array( size );
        this._target = new Array( size );
        this._delta = new Array( size );
        this._delay = ( delay !== undefined ) ? delay : 0.15;
        this._reset = false;
        this.reset();
    };
    OrbitManipulator.Interpolator.prototype = {
        setDelay: function ( delay ) {
            this._delay = delay;
        },
        reset: function () {
            for ( var i = 0, l = this._current.length; i < l; i++ ) {
                this._current[ i ] = this._target[ i ] = 0;
            }
            this._reset = true;
        },
        update: function () {
            for ( var i = 0, l = this._current.length; i < l; i++ ) {
                var d = ( this._target[ i ] - this._current[ i ] ) * this._delay;
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
        }
    };

    OrbitManipulator.AvailableControllerList = [ 'StandardMouseKeyboard',
        'LeapMotion',
        'GamePad',
        'Hammer'
    ];

    OrbitManipulator.ControllerList = [ 'StandardMouseKeyboard',
        'LeapMotion',
        'GamePad',
        'Hammer'
    ];

    /** @lends OrbitManipulator.prototype */
    OrbitManipulator.prototype = MACROUTILS.objectInehrit( Manipulator.prototype, {
        init: function () {
            this._distance = 25;
            this._target = new Array( 3 );
            Vec3.init( this._target );

            this._rotation = Matrix.mult( Matrix.makeRotate( Math.PI, 0, 0, 1, [] ), Matrix.makeRotate( -Math.PI / 10.0, 1, 0, 0, [] ), [] );
            this._time = 0.0;

            this._rotate = new OrbitManipulator.Interpolator( 2 );
            this._pan = new OrbitManipulator.Interpolator( 2 );
            this._zoom = new OrbitManipulator.Interpolator( 1 );
            this._zoom.reset = function () {
                OrbitManipulator.Interpolator.prototype.reset.call( this );
                this._start = 0.0;
            };

            this._buttonup = true;

            this._scale = 10.0;
            this._maxDistance = 0;
            this._minDistance = 0;
            this._scaleMouseMotion = 1.0;

            this._inverseMatrix = new Array( 16 );
            this._rotateKey = 65; // a
            this._zoomKey = 83; // s
            this._panKey = 68; // d

            // instance of controller
            var self = this;

            OrbitManipulator.ControllerList.forEach( function ( value ) {
                if ( OrbitManipulator[ value ] !== undefined ) {
                    self._controllerList[ value ] = new OrbitManipulator[ value ]( self );
                }
            } );
        },
        reset: function () {
            this.init();
        },
        setNode: function ( node ) {
            this._node = node;
        },
        setTarget: function ( target ) {
            Vec3.copy( target, this._target );
            var eyePos = new Array( 3 );
            this.getEyePosition( eyePos );
            this._distance = Vec3.distance( eyePos, target );
        },
        setEyePosition: function ( eye ) {
            var result = this._rotation;
            var center = this._target;
            var up = [ 0, 0, 1 ];

            var f = Vec3.sub( eye, center, [] );
            Vec3.normalize( f, f );

            var s = Vec3.cross( f, up, [] );
            Vec3.normalize( s, s );

            var u = Vec3.cross( s, f, [] );
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
        },
        computeHomePosition: function () {
            if ( this._node !== undefined ) {
                //this.reset();
                var bs = this._node.getBound();
                this.setDistance( bs.radius() * 1.5 );
                this.setTarget( bs.center() );
            }
        },

        getHomePosition: function () {
            var eyePos = this._tmpHomePosition;
            if ( this._node !== undefined ) {

                var bs = this._node.getBound();
                var distance = bs.radius() * 1.5;

                var target = bs.center();

                this.computeEyePosition( target, distance, eyePos );
            }
            return eyePos;
        },

        setMaxDistance: function ( d ) {
            this._maxDistance = d;
        },
        setMinDistance: function ( d ) {
            this._minDistance = d;
        },
        setDistance: function ( d ) {
            this._distance = d;
        },
        getDistance: function () {
            return this._distance;
        },
        computePan: function ( dx, dy ) {
            dy *= this._distance;
            dx *= this._distance;

            var inv = new Array( 16 );
            var x = new Array( 3 );
            var y = new Array( 3 );
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
        },

        computeRotation: function ( dx, dy ) {
            var of = Matrix.makeRotate( dx / 10.0, 0, 0, 1, [] );
            var r = Matrix.mult( this._rotation, of, [] );

            of = Matrix.makeRotate( dy / 10.0, 1, 0, 0, [] );
            var r2 = Matrix.mult( of, r, [] );

            // test that the eye is not too up and not too down to not kill
            // the rotation matrix
            var inv = [];
            Matrix.inverse( r2, inv );
            var eye = Matrix.transformVec3( inv, [ 0, this._distance, 0 ], new Array( 3 ) );

            var dir = Vec3.neg( eye, [] );
            Vec3.normalize( dir, dir );

            var p = Vec3.dot( dir, [ 0, 0, 1 ] );
            if ( Math.abs( p ) > 0.95 ) {
                //discard rotation on y
                this._rotation = r;
                return;
            }
            this._rotation = r2;
        },

        computeZoom: function ( dz ) {
            this.zoom( dz );
        },

        zoom: function ( ratio ) {
            var newValue = this._distance * ratio;
            if ( this._minDistance > 0 ) {
                if ( newValue < this._minDistance ) {
                    newValue = this._minDistance;
                }
            }
            if ( this._maxDistance > 0 ) {
                if ( newValue > this._maxDistance ) {
                    newValue = this._maxDistance;
                }
            }
            this._distance = newValue;
        },

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
            Vec3.copy( this._target, target );
            return target;
        },
        getEyePosition: function ( eye ) {
            this.computeEyePosition( this._target, this._distance, eye );
        },

        computeEyePosition: function ( target, distance, eye ) {
            var inv = this._tmpInverse;
            Matrix.inverse( this._rotation, this._tmpInverse );
            Matrix.transformVec3( inv, [ 0, distance, 0 ],
                eye );
            Vec3.add( target, eye, eye );
        },

        update: function ( nv ) {
            var t = nv.getFrameStamp().getSimulationTime();
            if ( this._lastUpdate === undefined ) {
                this._lastUpdate = t;
            }
            //var dt = t - this._lastUpdate;
            this._lastUpdate = t;

            var delta;
            var mouseFactor = 0.1;
            delta = this._rotate.update();
            this.computeRotation( -delta[ 0 ] * mouseFactor * this._scaleMouseMotion, -delta[ 1 ] * mouseFactor * this._scaleMouseMotion );


            var panFactor = 0.002;
            delta = this._pan.update();
            this.computePan( -delta[ 0 ] * panFactor, -delta[ 1 ] * panFactor );


            delta = this._zoom.update();
            this.computeZoom( 1.0 + delta[ 0 ] / 10.0 );

            var target = this._target;
            var distance = this._distance;

            var eye = new Array( 3 );
            Matrix.inverse( this._rotation, this._inverseMatrix );
            Matrix.transformVec3( this._inverseMatrix, [ 0, distance, 0 ],
                eye );

            Matrix.makeLookAt( Vec3.add( target, eye, eye ),
                target, [ 0, 0, 1 ],
                this._inverseMatrix );
        },

        getInverseMatrix: function () {
            return this._inverseMatrix;
        }
    } );

    ( function ( module ) {
        module.LeapMotion = OrbitManipulatorLeapMotionController;
    } )( OrbitManipulator );


    ( function ( module ) {
        module.StandardMouseKeyboard = OrbitManipulatorMouseKeyboardController;
    } )( OrbitManipulator );


    ( function ( module ) {
        module.Hammer = OrbitManipulatorHammerController;
    } )( OrbitManipulator );

    ( function ( module ) {
        module.GamePad = OrbitManipulatorGamePadController;
    } )( OrbitManipulator );

    return OrbitManipulator;
} );
