'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Manipulator = require( 'osgGA/Manipulator' );
var OrbitManipulator = require( 'osgGA/OrbitManipulator' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var LineSegmentIntersector = require( 'osgUtil/LineSegmentIntersector' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var ComputeMatrixFromNodePath = require( 'osg/ComputeMatrixFromNodePath' );
var Matrix = require( 'osg/Matrix' );
var Vec2 = require( 'osg/Vec2' );
var Vec3 = require( 'osg/Vec3' );
var Quat = require( 'osg/Quat' );
var CADManipulatorStandardMouseKeyboardController = require( 'osgGA/CADManipulatorStandardMouseKeyboardController' );
var CADManipulatorHammerController = require( 'osgGA/CADManipulatorHammerController' );

/**
 *  CADManipulator
 *  @class Provides a manipulator with rotation and zoom capacities around a pivot point.
 *  The pivot point is computed through intersections. If no intersection is computed
 *  the manipulator uses the last computed pivot point.
 *  - Mousewheel/Pinch zooms in and out on the pivot point.
 *  - Double click/tap zooms in on the pivot point.
 *  - Left click/pan rotates around the pivot point.
 *  - Center/Right click or two-finger drag moves the view.
 *  - Spacebar resets the view.
 */

var CADManipulator = function () {
    Manipulator.call( this );
    this._tmpHomePosition = Vec3.create();
    this._intersectionVisitor = new IntersectionVisitor();
    this._lineSegmentIntersector = new LineSegmentIntersector();
    this._polytopeIntersector = undefined;
    this._usePolytopeIntersector = false;
    this._dimensionMask = ( 1 << 2 );
    this.init();
};

CADManipulator.Interpolator = function () {
    this._current = Vec2.create();
    this._target = Vec2.create();
    this._delta = Vec2.create();
    this._reset = false;
    this.reset();
    this._width = undefined;
    this._height = undefined;
};

CADManipulator.Interpolator.prototype = {
    setWidth: function ( width ) {
        this._width = width;
    },
    setHeight: function ( height ) {
        this._height = height;
    },
    reset: function () {
        for ( var i = 0, l = this._current.length; i < l; i++ ) {
            this._current[ i ] = this._target[ i ] = 0;
        }
        this._reset = true;
    },
    update: function () {
        var d0;
        var d1;
        if ( this._width === undefined ) d0 = 0;
        else d0 = ( this._target[ 0 ] - this._current[ 0 ] ) / this._width;
        this._delta[ 0 ] = d0;
        this._current[ 0 ] = this._target[ 0 ];
        if ( this._height === undefined ) d1 = 0;
        else d1 = ( this._target[ 1 ] - this._current[ 1 ] ) / this._height;
        this._delta[ 1 ] = d1;
        this._current[ 1 ] = this._target[ 1 ];
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

CADManipulator.AvailableControllerList = [ 'StandardMouseKeyboard', 'Hammer' ];
CADManipulator.ControllerList = [ 'StandardMouseKeyboard', 'Hammer' ];

/** @lends CADManipulator.prototype */
CADManipulator.prototype = MACROUTILS.objectInherit( Manipulator.prototype, {
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

        this._rotate = new CADManipulator.Interpolator();
        this._pan = new CADManipulator.Interpolator();
        this._zoom = new OrbitManipulator.Interpolator( 1 );

        this._panFactor = 1.5;
        this._rotateFactor = 1;
        this._zoomFactor = 1;

        this._inverseMatrix = Matrix.create();

        this._homeEye = undefined;
        this._homeCenter = undefined;
        this._homeUp = Vec3.createAndSet( 0.0, 0.0, 1.0 );

        this._orientation = Quat.create();
        this._pivotPoint = Vec3.create();

        this._eye = Vec3.create();

        this._right = Vec3.createAndSet( 1.0, 0.0, 0.0 );

        this._zoomDir = Vec3.create();

        // instance of controller
        var self = this;

        CADManipulator.ControllerList.forEach( function ( value ) {
            if ( CADManipulator[ value ] !== undefined ) {
                self._controllerList[ value ] = new CADManipulator[ value ]( self );
            }
        } );
    },

    setViewer: function ( viewer ) {
        this._viewer = viewer;
    },

    reset: function () {
        this.init();
    },

    setNode: function ( node ) {
        this._node = node;
    },

    setPivotPoint: function ( pivotPoint ) {
        // First calculate offset
        Vec3.copy( pivotPoint, this._pivotPoint );

    },

    setTarget: ( function () {
        var eyePos = Vec3.create();
        return function ( target ) {
            Vec3.copy( target, this._target );
            this.getEyePosition( eyePos );
            this._distance = Vec3.distance( eyePos, target );
        };
    } )(),

    setEyePosition: function ( eye ) {
        Vec3.copy( eye, this._eye );
        this._distance = Vec3.distance( eye, this._target );
    },

    setHomePosition: function ( eye, center, up ) {
        this._homeEye = eye;
        this._homeCenter = center;
        this._homeUp = up;
    },

    computeHomePosition: ( function () {
        var f = Vec3.create();
        var s = Vec3.create();
        var u = Vec3.create();
        var result = Matrix.create();
        return function ( boundStrategy ) {

            var bs = this.getHomeBound( boundStrategy );
            if ( !bs ) return;
            this.setDistance( this.getHomeDistance( bs ) );
            this.setTarget( bs.center() );
            this.setPivotPoint( bs.center() );

            if ( this._homeEye === undefined ) {
                this._homeEye = Vec3.create();
                this.getEyePosition( this._homeEye );
            }

            if ( this._homeCenter === undefined ) {
                this._homeCenter = Vec3.create();
                Vec3.copy( bs.center(), this._homeCenter );
            }
            Vec3.copy( this._homeEye, this._eye );
            Vec3.copy( this._homeCenter, this._target );
            Vec3.copy( this._homeUp, this._upz );

            Matrix.copy( this._rotation, result );
            var center = this._target;
            var eye = this._eye;

            Vec3.sub( center, eye, f );
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
            result[ 1 ] = u[ 0 ];
            result[ 2 ] = -f[ 0 ];
            result[ 3 ] = 0.0;
            result[ 4 ] = s[ 1 ];
            result[ 5 ] = u[ 1 ];
            result[ 6 ] = -f[ 1 ];
            result[ 7 ] = 0.0;
            result[ 8 ] = s[ 2 ];
            result[ 9 ] = u[ 2 ];
            result[ 10 ] = -f[ 2 ];
            result[ 11 ] = 0.0;
            result[ 12 ] = 0;
            result[ 13 ] = 0;
            result[ 14 ] = 0;
            result[ 15 ] = 1.0;

            Matrix.getRotate( result, this._orientation );
            Quat.inverse( this._orientation, this._orientation );
        };
    } )(),

    setZoomFactor: function ( f ) {
        this._zoomFactor = f;
    },

    setRotateFactor: function ( f ) {
        this._rotateFactor = f;
    },

    setPanFactor: function ( f ) {
        this._panFactor = f;
    },

    setDistance: function ( d ) {
        this._distance = d;
    },

    // If set to true, intersections are computed against points and lines
    setUsePolytopeIntersector: function ( upi ) {
        this._usePolytopeIntersector = upi;
    },

    getUsePolytopeIntersector: function () {
        return this._usePolytopeIntersector;
    },

    getDistance: function () {
        return this._distance;
    },

    zoom: function ( ratio ) {
        this._distance = ratio;
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

    getIntersectionVisitor: function () {
        return this._intersectionVisitor;
    },

    getLineSegmentIntersector: function () {
        return this._lineSegmentIntersector;
    },

    getOrCreatePolytopeIntersector: function () {
        if ( this._polytopeIntersector === undefined ) {
            this._polytopeIntersector = new PolytopeIntersector();
            this._polytopeIntersector.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE_PER_DRAWABLE );
            this._polytopeIntersector.setDimensionMask( PolytopeIntersector.DimZero | PolytopeIntersector.DimOne );
        }
        return this._polytopeIntersector;
    },

    getTarget: function ( target ) {
        Vec3.copy( this._target, target );
        return target;
    },

    getEyePosition: function ( eye ) {
        this.computeEyePosition( this._target, this._distance, eye );
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

    computePan: ( function () {
        var trans = Vec3.create();
        var rotPos = Vec3.create();
        var speedTmp = Vec3.create();
        return function ( dx, dy, rotMat ) {
            var speed = Vec3.length( Vec3.sub( this._eye, this._pivotPoint, speedTmp ) ) / this._panFactor;
            if ( speed < 10 ) speed = 10;
            trans[ 0 ] = dx * speed / 2;
            trans[ 1 ] = dy * speed / 2;
            trans[ 2 ] = 0;
            Matrix.transformVec3( rotMat, trans, rotPos );
            Vec3.add( this._eye, rotPos, this._eye );
        };
    } )(),

    computeZoom: ( function () {
        var vectorDistance = Vec3.create();
        var speedDist = Vec3.create();
        return function ( dz ) {
            var zoomSpeed = dz * this._zoomFactor;
            Vec3.sub( this._pivotPoint, this._eye, vectorDistance );
            Vec3.add( this._eye, Vec3.mult( vectorDistance, zoomSpeed, speedDist ), this._eye );
        };
    } )(),

    computeRotation: ( function () {

        var rightNormalized = Vec3.create();
        var right = Vec3.create();
        var dir = Vec3.create();
        var offset = Vec3.create();
        var pitchQuat = Quat.create();
        var yawQuat = Quat.create();
        var pitchyawQuat = Quat.create();
        var tmp = Vec3.create();
        var rightScalar = Vec3.create;

        return function ( yawDelta, pitchDelta ) {

            Quat.transformVec3( this._orientation, this._right, right );
            Vec3.normalize( right, rightNormalized );
            Vec3.sub( this._eye, this._pivotPoint, dir );
            var scalar = Vec3.dot( rightNormalized, dir );
            Vec3.sub( dir, Vec3.mult( rightNormalized, scalar, rightScalar ), offset );
            var xy = Vec3.createAndSet( -offset[ 0 ], -offset[ 1 ], 0 );

            var positionPitch = Math.atan2( -offset[ 2 ], Vec3.length( xy ) );
            pitchDelta = Math.max( -Math.PI / 2 + 0.01, Math.min( Math.PI / 2 - 0.01, ( positionPitch + pitchDelta ) ) ) - positionPitch;

            Quat.makeRotate( pitchDelta * this._rotateFactor, right[ 0 ], right[ 1 ], right[ 2 ], pitchQuat );
            Quat.makeRotate( yawDelta * this._rotateFactor, this._upz[ 0 ], this._upz[ 1 ], this._upz[ 2 ], yawQuat );

            Quat.mult( yawQuat, pitchQuat, pitchyawQuat );
            Quat.transformVec3( pitchyawQuat, dir, tmp );
            Vec3.add( tmp, this._pivotPoint, this._eye );

            // Find rotation offset and target
            Quat.mult( yawQuat, this._orientation, this._orientation );

            Quat.transformVec3( this._orientation, this._right, right );
            Quat.makeRotate( pitchDelta * this._rotateFactor, right[ 0 ], right[ 1 ], right[ 2 ], pitchQuat );
            Quat.mult( pitchQuat, this._orientation, this._orientation );
        };
    } )(),


    update: ( function () {
        var rotMat = Matrix.create();
        var transMat = Matrix.create();
        return function ( nv ) {

            var dt = nv.getFrameStamp().getDeltaTime();

            var mouseFactor = 10;
            //Note inverted y
            var delta = this._rotate.update();
            this.computeRotation( -delta[ 0 ] * mouseFactor, delta[ 1 ] * mouseFactor );
            Matrix.makeRotateFromQuat( this._orientation, rotMat );

            var deltapan = this._pan.update();
            this.computePan( -deltapan[ 0 ] * mouseFactor, -deltapan[ 1 ] * mouseFactor, rotMat );

            delta = this._zoom.update( dt );
            this.computeZoom( -delta[ 0 ] / 10.0 );

            Matrix.makeTranslate( this._eye[ 0 ], this._eye[ 1 ], this._eye[ 2 ], transMat );
            Matrix.mult( transMat, rotMat, this._inverseMatrix );
            Matrix.inverse( this._inverseMatrix, this._inverseMatrix );
        };
    } )(),
    getInverseMatrix: function () {
        return this._inverseMatrix;
    },

    computeIntersections: ( function () {
        var hits = [];
        var pTrans = Vec3.create();
        return function ( pos ) {
            var viewer = this._camera.getView();

            var cam = this._camera;
            var width = cam.getViewport().width();
            var height = cam.getViewport().height();
            this._rotate.setWidth( width );
            this._rotate.setHeight( height );
            this._pan.setWidth( width );
            this._pan.setHeight( height );

            var point, matrix;
            if ( ( this._dimensionMask & ( 1 << 2 ) ) !== 0 ) {
                hits = viewer.computeIntersections( pos[ 0 ], pos[ 1 ] );

                if ( hits.length > 0 ) {
                    point = hits[ 0 ].point;
                    hits[ 0 ].nodepath.shift();
                    matrix = ComputeMatrixFromNodePath.computeLocalToWorld( hits[ 0 ].nodepath );
                    Matrix.transformVec3( matrix, point, pTrans );
                    this.setPivotPoint( pTrans );
                }
            }

            if ( hits.length === 0 && this._usePolytopeIntersector ) {
                var pi = this.getOrCreatePolytopeIntersector();
                pi.reset();
                pi.setPolytopeFromWindowCoordinates( pos[ 0 ] - 5, pos[ 1 ] - 5, pos[ 0 ] + 5, pos[ 1 ] + 5 );
                var iv = this._intersectionVisitor;
                iv.setIntersector( pi );
                viewer.getCamera().accept( iv );
                hits = pi.getIntersections();
                hits.sort( function ( a, b ) {
                    return a._distance - b._distance;
                } );
                if ( hits.length > 0 ) {
                    point = hits[ 0 ]._center;
                    hits[ 0 ].nodePath.shift();
                    matrix = ComputeMatrixFromNodePath.computeLocalToWorld( hits[ 0 ].nodePath );
                    Matrix.transformVec3( matrix, point, pTrans );
                    this.setPivotPoint( pTrans );
                }
            }
        };
    } )(),

    getPositionRelativeToCanvas: ( function () {
        var offset = Vec2.create();
        var pos = Vec2.create();
        return function ( x, y ) {
            var canvas = this._camera._graphicContext.canvas;
            this.getOffsetRect( canvas, offset );
            var ratioX = canvas.width / canvas.clientWidth;
            var ratioY = canvas.height / canvas.clientHeight;
            pos[ 0 ] = ( x - offset[ 1 ] ) * ratioX;
            pos[ 1 ] = ( canvas.clientHeight - ( y - offset[ 0 ] ) ) * ratioY;
            return pos;
        };
    } )(),

    getCanvasCenter: ( function () {
        var offset = Vec2.create();
        var pos = Vec2.create();
        return function () {
            var canvas = this._camera.getGraphicContext().canvas;
            this.getOffsetRect( canvas, offset );
            var ratioX = canvas.width / canvas.clientWidth;
            var ratioY = canvas.height / canvas.clientHeight;
            pos[ 0 ] = ( canvas.clientWidth / 2 ) * ratioX;
            pos[ 1 ] = ( canvas.clientHeight / 2 ) * ratioY;
            return pos;
        };
    } )(),

    getOffsetRect: function ( elem, offset ) {
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        offset[ 0 ] = Math.round( top );
        offset[ 1 ] = Math.round( left );
        return offset;
    }

} );

CADManipulator.StandardMouseKeyboard = CADManipulatorStandardMouseKeyboardController;
CADManipulator.Hammer = CADManipulatorHammerController;

module.exports = CADManipulator;
