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
        this._homePosition = [ 0.0, 0.0, 0.0 ];
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
            this._distance = 25.0;
            this._target = [ 0.0, 0.0, 0.0 ];
            this._upz = [ 0.0, 0.0, 1.0 ];
            Vec3.init( this._target );

            var rot1 = Matrix.makeRotate( Math.PI, 0.0, 0.0, 1.0, Matrix.create() );
            var rot2 = Matrix.makeRotate( -Math.PI / 10.0, 1.0, 0.0, 0.0, Matrix.create() );
            this._rotation = Matrix.create();
            Matrix.mult( rot1, rot2, this._rotation );
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
            this._maxDistance = 0.0;
            this._minDistance = 0.0;
            this._scaleMouseMotion = 1.0;

            this._inverseMatrix = Matrix.create();
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
            var eyePos = [ 0.0, 0.0, 0.0 ];
            this.getEyePosition( eyePos );
            this._distance = Vec3.distance( eyePos, target );
        },
        setEyePosition: ( function () {
            var f = [ 0.0, 0.0, 0.0 ];
            var s = [ 0.0, 0.0, 0.0 ];
            var u = [ 0.0, 0.0, 0.0 ];
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
        computeHomePosition: function () {
            if ( this._node !== undefined ) {
                //this.reset();
                var bs = this._node.getBound();
                this.setDistance( bs.radius() * 1.5 );
                this.setTarget( bs.center() );
            }
        },

        getHomePosition: function () {
            if ( this._node !== undefined ) {
                var bs = this._node.getBound();
                var distance = bs.radius() * 1.5;

                var target = bs.center();

                this.computeEyePosition( target, distance, this._homePosition );
            }
            return this._homePosition;
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
        computePan: ( function () {
            var inv = Matrix.create();
            var x = [ 0.0, 0.0, 0.0 ];
            var y = [ 0.0, 0.0, 0.0 ];
            return function ( dx, dy ) {
                dy *= this._distance;
                dx *= this._distance;
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
            var inv = Matrix.create();
            var tmp = [ 0.0, 0.0, 0.0 ];
            var tmpDist = [ 0.0, 0.0, 0.0 ];
            return function ( dx, dy ) {
                Matrix.makeRotate( dx / 10.0, 0.0, 0.0, 1.0, of );
                Matrix.mult( this._rotation, of, r );

                Matrix.makeRotate( dy / 10.0, 1.0, 0.0, 0.0, of );
                Matrix.mult( of, r, r2 );

                // test that the eye is not too up and not too down to not kill
                // the rotation matrix
                Matrix.inverse( r2, inv );
                tmpDist[ 1 ] = this._distance;
                Matrix.transformVec3( inv, tmpDist, tmp );

                Vec3.neg( tmp, tmp );
                Vec3.normalize( tmp, tmp );

                var p = Vec3.dot( tmp, this._upz );
                if ( Math.abs( p ) > 0.95 ) {
                    //discard rotation on y
                    Matrix.copy( r, this._rotation );
                    return;
                }
                Matrix.copy( r2, this._rotation );
            };
        } )(),
        computeZoom: function ( dz ) {
            this.zoom( dz );
        },

        zoom: function ( ratio ) {
            var newValue = this._distance * ratio;
            if ( this._minDistance > 0.0 ) {
                if ( newValue < this._minDistance ) {
                    newValue = this._minDistance;
                }
            }
            if ( this._maxDistance > 0.0 ) {
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

        computeEyePosition: ( function () {
            var tmpDist = [ 0.0, 0.0, 0.0 ];
            var tmpInverse = Matrix.create();
            return function ( target, distance, eye ) {
                Matrix.inverse( this._rotation, tmpInverse );
                tmpDist[ 1 ] = distance;
                Matrix.transformVec3( tmpInverse, tmpDist, eye );
                Vec3.add( target, eye, eye );
            };
        } )(),

        update: ( function () {
            var eye = [ 0.0, 0.0, 0.0 ];
            var tmpDist = [ 0.0, 0.0, 0.0 ];
            return function ( nv ) {
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

                Matrix.inverse( this._rotation, this._inverseMatrix );
                tmpDist[ 1 ] = distance;
                Matrix.transformVec3( this._inverseMatrix, tmpDist, eye );

                Matrix.makeLookAt( Vec3.add( target, eye, eye ), target, this._upz, this._inverseMatrix );
            };
        } )(),

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
