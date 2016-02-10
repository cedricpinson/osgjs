'use strict';
var OrbitManipulator = require( 'osgGA/OrbitManipulator' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var Matrix = require( 'osg/Matrix' );
var Vec2 = require( 'osg/Vec2' );
var ComputeMatrixFromNodePath = require( 'osg/ComputeMatrixFromNodePath' );

var CADManipulatorStandardMouseKeyboardController = function ( manipulator ) {
    this._manipulator = manipulator;
    this._timer = false;
    this.init();
};

CADManipulatorStandardMouseKeyboardController.prototype = {
    init: function () {
        this.releaseButton();
        this._rotateKey = 65; // a
        this._zoomKey = 83; // s
        this._panKey = 68; // d
        this._dimensionMask = ( 1 << 2 );
        this._mode = undefined;
    },
    getMode: function () {
        return this._mode;
    },
    setMode: function ( mode ) {
        this._mode = mode;
    },
    setEventProxy: function ( proxy ) {
        this._eventProxy = proxy;
    },
    setManipulator: function ( manipulator ) {
        this._manipulator = manipulator;
    },
    setDimensionMask: function ( dimMask ) {
        this._dimensionMask = dimMask;
    },
    getPositionRelativeToCanvas: function ( ev ) {
        var offset = Vec2.create();
        var viewer = this._eventProxy._viewer;
        var canvas = viewer._camera._graphicContext.canvas;
        this.getOffsetRect( canvas, offset );
        var ratioX = canvas.width / canvas.clientWidth;
        var ratioY = canvas.height / canvas.clientHeight;
        var clientX, clientY;

        clientX = ev.clientX;
        clientY = ev.clientY;

        var pos = Vec2.create();
        pos[ 0 ] = ( clientX - offset[ 1 ] ) * ratioX;
        pos[ 1 ] = ( canvas.clientHeight - ( clientY - offset[ 0 ] ) ) * ratioY;
        return pos;
    },

    getOffsetRect: function ( elem, pos ) {
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        pos[ 0 ] = Math.round( top );
        pos[ 1 ] = Math.round( left );
        return pos;
    },

    mousemove: function ( ev ) {
        if ( this._buttonup === true ) {
            return;
        }
        var pos = this.getPositionRelativeToCanvas( ev );

        var manipulator = this._manipulator;
        if ( isNaN( pos[ 0 ] ) === false && isNaN( pos[ 1 ] ) === false ) {

            var mode = this.getMode();
            if ( mode === OrbitManipulator.Rotate ) {
                manipulator.getRotateInterpolator().setTarget( pos[ 0 ], pos[ 1 ] );

            } else if ( mode === OrbitManipulator.Pan ) {
                manipulator.getPanInterpolator().setTarget( pos[ 0 ], pos[ 1 ] );

            } else if ( mode === OrbitManipulator.Zoom ) {
                var zoom = manipulator.getZoomInterpolator();
                this.computeIntersections( pos );

                if ( zoom.isReset() ) {
                    zoom._start = pos[ 1 ];
                    zoom.set( 0.0 );
                }
                var dy = pos[ 1 ] - zoom._start;
                zoom._start = pos[ 1 ];
                var v = zoom.getTarget()[ 0 ];
                zoom.setTarget( v - dy / 20.0 );
            }
        }

        ev.preventDefault();
    },
    mousedown: function ( ev ) {
        var manipulator = this._manipulator;
        var mode = this.getMode();
        if ( mode === undefined ) {
            if ( ev.button === 0 ) {
                if ( ev.shiftKey ) {
                    this.setMode( OrbitManipulator.Pan );
                } else if ( ev.ctrlKey ) {
                    this.setMode( OrbitManipulator.Zoom );
                } else {
                    this.setMode( OrbitManipulator.Rotate );
                }
            } else {
                this.setMode( OrbitManipulator.Pan );
            }
        }

        this.pushButton();

        var cam = this._eventProxy._viewer.getCamera();
        var width = cam.getViewport().width();
        var height = cam.getViewport().height();
        manipulator.getRotateInterpolator().setWidth( width );
        manipulator.getRotateInterpolator().setHeight( height );
        manipulator.getPanInterpolator().setWidth( width );
        manipulator.getPanInterpolator().setHeight( height );

        var pos = this.getPositionRelativeToCanvas( ev );
        this.computeIntersections( pos );

        mode = this.getMode();
        if ( mode === OrbitManipulator.Rotate ) {
            manipulator.getRotateInterpolator().reset();
            manipulator.getRotateInterpolator().set( pos[ 0 ], pos[ 1 ] );
        } else if ( mode === OrbitManipulator.Pan ) {
            manipulator.getPanInterpolator().reset();
            manipulator.getPanInterpolator().set( pos[ 0 ], pos[ 1 ] );
        } else if ( mode === OrbitManipulator.Zoom ) {
            manipulator.getZoomInterpolator()._start = pos[ 1 ];
            manipulator.getZoomInterpolator().set( 0.0 );
        }
        ev.preventDefault();
    },
    mouseup: function ( /*ev */) {
        this.releaseButton();
        this.setMode( undefined );
    },
    mousewheel: function ( ev, intDelta /*, deltaX, deltaY */ ) {
        var manipulator = this._manipulator;
        ev.preventDefault();
        var zoomTarget = manipulator.getZoomInterpolator().getTarget()[ 0 ] - intDelta;
        manipulator.getZoomInterpolator().setTarget( zoomTarget );
        var timer;
        if ( this._timer === false ) {
            this._timer = true;
            var that = this;
            clearTimeout( timer );
            timer = setTimeout( function () {
                that._timer = false;
            }, 200 );
            var pos = this.getPositionRelativeToCanvas( ev );
            this.computeIntersections( pos );
        }
    },

    dblclick: function ( ev ) {
        var manipulator = this._manipulator;
        ev.preventDefault();

        manipulator.getZoomInterpolator().set( 0.0 );
        var zoomTarget = manipulator.getZoomInterpolator().getTarget()[ 0 ] - 10; // Default interval 10
        manipulator.getZoomInterpolator().setTarget( zoomTarget );
        var pos = this.getPositionRelativeToCanvas( ev );
        this.computeIntersections( pos );
    },

    pushButton: function () {
        this._buttonup = false;
    },
    releaseButton: function () {
        this._buttonup = true;
    },

    keydown: function ( ev ) {
        if ( ev.keyCode === 32 ) {
            this._manipulator.computeHomePosition();
            ev.preventDefault();

        } else if ( ev.keyCode === this._panKey &&
            this.getMode() !== OrbitManipulator.Pan ) {
            this.setMode( OrbitManipulator.Pan );
            this._manipulator.getPanInterpolator().reset();
            this.pushButton();
            ev.preventDefault();
        } else if ( ev.keyCode === this._zoomKey &&
            this.getMode() !== OrbitManipulator.Zoom ) {
            this.setMode( OrbitManipulator.Zoom );
            this._manipulator.getZoomInterpolator().reset();
            this.pushButton();
            ev.preventDefault();
        } else if ( ev.keyCode === this._rotateKey &&
            this.getMode() !== OrbitManipulator.Rotate ) {
            this.setMode( OrbitManipulator.Rotate );
            this._manipulator.getRotateInterpolator().reset();
            this.pushButton();
            ev.preventDefault();
        }

    },

    keyup: function ( ev ) {
        if ( ev.keyCode === this._panKey ) {
            this.mouseup( ev );
        } else if ( ev.keyCode === this._rotateKey ) {
            this.mouseup( ev );
        } else if ( ev.keyCode === this._rotateKey ) {
            this.mouseup( ev );
        }
        this.setMode( undefined );
    },

    computeIntersections: function ( pos ) {
        var manipulator = this._manipulator;
        var viewer = this._eventProxy._viewer;
        var hits = [];
        var point, matrix, pTrans;
        if ( ( this._dimensionMask & ( 1 << 2 ) ) !== 0 ) {
            hits = viewer.computeIntersections( pos[ 0 ], pos[ 1 ] );

            if ( hits.length > 0 ) {
                point = hits[ 0 ].point;
                hits[ 0 ].nodepath.shift();
                matrix = ComputeMatrixFromNodePath.computeLocalToWorld( hits[ 0 ].nodepath );
                pTrans = Matrix.transformVec3( matrix, point, [] );
                manipulator.setPivotPoint( pTrans );
            }
        }
        if ( hits.length === 0 ) {
            var pi = manipulator.getPolytopeIntersector();

            pi.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE_PER_DRAWABLE );
            pi.setPolytopeFromWindowCoordinates( pos[ 0 ] - 5, pos[ 1 ] - 5, pos[ 0 ] + 5, pos[ 1 ] + 5 );
            pi.setDimensionMask( PolytopeIntersector.DimZero | PolytopeIntersector.DimOne );
            var iv = manipulator.getIntersectionVisitor();
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
                pTrans = Matrix.transformVec3( matrix, point, [] );
                manipulator.setPivotPoint( pTrans );
            }
        }
    }

};

module.exports = CADManipulatorStandardMouseKeyboardController;
