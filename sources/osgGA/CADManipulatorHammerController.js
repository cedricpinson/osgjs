'use strict';
var Notify = require( 'osg/Notify' );
var PolytopeIntersector = require( 'osgUtil/PolytopeIntersector' );
var Matrix = require( 'osg/Matrix' );
var Vec2 = require( 'osg/Vec2' );
var Vec3 = require( 'osg/Vec3' );
var ComputeMatrixFromNodePath = require( 'osg/ComputeMatrixFromNodePath' );

var CADManipulatorHammerController = function ( manipulator ) {
    this._manipulator = manipulator;
    this._timer = false;
    this.init();
};

CADManipulatorHammerController.prototype = {
    init: function () {
        this._panFactorX = 1.0;
        this._panFactorY = -this._panFactorX;

        this._rotateFactorX = 0.6;
        this._rotateFactorY = -this._rotateFactorX;
        this._zoomFactor = 5.0;

        this._lastScale = 0;
        this._nbPointerLast = 0; // to check if we the number of pointers has changed

        this._dimensionMask = ( 1 << 2 );
        this._lastPos = Vec2.create(); // to set the pivot for rotation
    },
    setEventProxy: function ( proxy ) {
        if ( proxy === undefined || ( proxy !== undefined && proxy === this._eventProxy ) ) {
            return;
        }
        this._eventProxy = proxy;
        var self = this;
        var hammer = proxy;
        var computeTouches = function ( event ) {
            if ( event.pointers !== undefined )
                return event.pointers.length;
            return 1; // mouse
        };

        var dragCB = function ( ev ) {
            return 'touches ' + computeTouches( ev ) + ' distance ' + ev.distance + ' x ' + ev.deltaX + ' y ' + ev.deltaY;
        };
        // Set a minimal thresold on pinch event, to be detected after pan
        hammer.get( 'pinch' ).set( {
            threshold: 0.1
        } );
        // Let the pan be detected with two fingers.
        hammer.get( 'pan' ).set( {
            threshold: 0,
            pointers: 0
        } );
        hammer.get( 'pinch' ).recognizeWith( hammer.get( 'pan' ) );

        hammer.get( 'tap' ).set( {
            taps: 2,
            posThreshold: 300
        } );

        this._cbPanStart = ( function () {
            var origIntersect = Vec3.create();
            var dstIntersect = Vec3.create();

            return function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || self._transformStarted || event.pointerType === 'mouse' ) {
                    return;
                }
                var gesture = event;
                self._dragStarted = true;
                self._nbPointerLast = computeTouches( gesture );

                var pos;
                if ( self._nbPointerLast === 2 ) {
                    pos = self.getPositionRelativeToCanvas( gesture );
                    self._lastPos = pos;
                } else {
                    if ( self._lastPos.length === 0 ) {
                        pos = self.getCanvasCenter( gesture );
                    } else {
                        pos = self._lastPos;
                    }
                }

                var hits = [];
                var cam = manipulator.getCamera();
                var point, matrix, pTrans;

                var width = cam.getViewport().width();
                var height = cam.getViewport().height();
                manipulator.getRotateInterpolator().setWidth( width );
                manipulator.getRotateInterpolator().setHeight( height );
                manipulator.getPanInterpolator().setWidth( width );
                manipulator.getPanInterpolator().setHeight( height );

                var iv = manipulator.getIntersectionVisitor();
                if ( ( self._dimensionMask & ( 1 << 2 ) ) !== 0 ) {
                    var lsi = manipulator.getLineSegmentIntersector();
                    lsi.reset();

                    lsi.set( Vec3.set( pos[ 0 ], pos[ 1 ], 0.0, origIntersect ), Vec3.set( pos[ 0 ], pos[ 1 ], 1.0, dstIntersect ) );
                    iv.setIntersector( lsi );
                    cam.accept( iv );
                    hits = lsi.getIntersections();

                    if ( hits.length > 0 ) {
                        hits.sort( function ( a, b ) {
                            return a.ratio - b.ratio;
                        } );
                        point = hits[ 0 ].point;
                        hits[ 0 ].nodepath.shift();
                        matrix = ComputeMatrixFromNodePath.computeLocalToWorld( hits[ 0 ].nodepath );
                        pTrans = Matrix.transformVec3( matrix, point, [] );
                        manipulator.setPivotPoint( pTrans );
                    }
                }
                if ( hits.length === 0 ) {
                    var pi = manipulator.getPolytopeIntersector();
                    pi.reset();

                    pi.setIntersectionLimit( PolytopeIntersector.LIMIT_ONE_PER_DRAWABLE );
                    pi.setPolytopeFromWindowCoordinates( pos[ 0 ] - 5, pos[ 1 ] - 5, pos[ 0 ] + 5, pos[ 1 ] + 5 );
                    pi.setDimensionMask( PolytopeIntersector.DimZero | PolytopeIntersector.DimOne );

                    iv.setIntersector( pi );
                    cam.accept( iv );
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

                if ( self._nbPointerLast === 2 ) {
                    manipulator.getPanInterpolator().reset();
                    manipulator.getPanInterpolator().set( event.center.x * self._panFactorX, event.center.y * self._panFactorY );
                } else {
                    manipulator.getRotateInterpolator().reset();
                }
                Notify.debug( 'drag start, ' + dragCB( gesture ) );
            };
        } )();

        this._cbPanMove = function ( event ) {
            var manipulator = self._manipulator;
            if ( !manipulator || !self._dragStarted || event.pointerType === 'mouse' ) {
                return;
            }
            var gesture = event;
            var nbPointers = computeTouches( gesture );

            // prevent sudden big changes in the event.center variables
            if ( self._nbPointerLast !== nbPointers ) {
                if ( nbPointers === 2 ) manipulator.getPanInterpolator().reset();
                else manipulator.getRotateInterpolator().reset();
                self._nbPointerLast = nbPointers;
            }

            if ( nbPointers === 2 ) {
                manipulator.getPanInterpolator().setTarget( event.center.x * self._panFactorX, event.center.y * self._panFactorY );
                Notify.debug( 'pan, ' + dragCB( gesture ) );
            } else {
                manipulator.getRotateInterpolator().setTarget( event.center.x * self._rotateFactorX, event.center.y * self._rotateFactorY );
                Notify.debug( 'rotate, ' + dragCB( gesture ) );
            }
        };

        this._cbPanEnd = function ( event ) {
            var manipulator = self._manipulator;
            if ( !manipulator || !self._dragStarted || event.pointerType === 'mouse' ) {
                return;
            }
            self._dragStarted = false;
            var gesture = event;
            Notify.debug( 'drag end, ' + dragCB( gesture ) );
        };

        this._cbPinchStart = function ( event ) {
            var manipulator = self._manipulator;
            if ( !manipulator || event.pointerType === 'mouse' ) {
                return;
            }
            self._transformStarted = true;
            var gesture = event;

            self._lastScale = gesture.scale;
            manipulator.getZoomInterpolator().reset();
            manipulator.getZoomInterpolator().set( self._lastScale );
            event.preventDefault();

            Notify.debug( 'zoom start, ' + dragCB( gesture ) );
        };

        this._cbPinchEnd = function ( event ) {
            if ( event.pointerType === 'mouse' ) {
                return;
            }
            self._transformStarted = false;
            Notify.debug( 'zoom end, ' + dragCB( event ) );
        };

        this._cbPinchInOut = function ( event ) {
            var manipulator = self._manipulator;
            if ( !manipulator || !self._transformStarted || event.pointerType === 'mouse' ) {
                return;
            }
            var gesture = event;

            // make the dezoom faster
            var zoomFactor = gesture.scale > self._lastScale ? self._zoomFactor : self._zoomFactor * 4.0;
            var scale = ( gesture.scale - self._lastScale ) * zoomFactor;
            self._lastScale = gesture.scale;

            manipulator.getZoomInterpolator().setTarget( manipulator.getZoomInterpolator().getTarget()[ 0 ] - scale );

            Notify.debug( 'zoom, ' + dragCB( gesture ) );
        };

        this._cbDoubleTap = function ( event ) {
            var manipulator = self._manipulator;
            if ( !manipulator || event.pointerType === 'mouse' ) {
                return;
            }
            var gesture = event;

            var pos = self.getPositionRelativeToCanvas( gesture );
            self._lastPos = pos;

            manipulator.getZoomInterpolator().set( 0.0 );
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[ 0 ] - 10; // Default interval 10
            manipulator.getZoomInterpolator().setTarget( zoomTarget );

            Notify.debug( 'tap, ' + dragCB( gesture ) );
        };

        hammer.on( 'panstart ', this._cbPanStart );
        hammer.on( 'panmove', this._cbPanMove );
        hammer.on( 'panend', this._cbPanEnd );
        hammer.on( 'pinchstart', this._cbPinchStart );
        hammer.on( 'pinchend', this._cbPinchEnd );
        hammer.on( 'pinchin pinchout', this._cbPinchInOut );
        hammer.on( 'tap', this._cbDoubleTap );
    },
    removeEventProxy: function ( proxy ) {
        if ( !proxy || !this._eventProxy )
            return;
        proxy.off( 'panstart ', this._cbPanStart );
        proxy.off( 'panmove', this._cbPanMove );
        proxy.off( 'panend', this._cbPanEnd );
        proxy.off( 'pinchstart', this._cbPinchStart );
        proxy.off( 'pinchend', this._cbPinchEnd );
        proxy.off( 'pinchin pinchout', this._cbPinchInOut );
        proxy.off( 'tap', this._cbDoubleTap );
    },
    setManipulator: function ( manipulator ) {
        this._manipulator = manipulator;
    },

    getPositionRelativeToCanvas: function ( ev ) {
        var offset = Vec2.create();
        var canvas = this._eventProxy.element;
        this.getOffsetRect( canvas, offset );
        var ratioX = canvas.width / canvas.clientWidth;
        var ratioY = canvas.height / canvas.clientHeight;
        var clientX, clientY;
        if ( 'ontouchstart' in window ) {
            if ( 'center' in ev ) {
                clientX = ev.center.x;
                clientY = ev.center.y;
            } else {
                clientX = ev.pointers[ 0 ].clientX;
                clientY = ev.pointers[ 0 ].clientY;
            }
        } else {
            clientX = ev.clientX;
            clientY = ev.clientY;
        }

        var pos = Vec2.create();
        pos[ 0 ] = ( clientX - offset[ 1 ] ) * ratioX;
        pos[ 1 ] = ( canvas.clientHeight - ( clientY - offset[ 0 ] ) ) * ratioY;
        return pos;
    },

    getCanvasCenter: function () {
        var offset = Vec2.create();
        var canvas = this._eventProxy.element;
        this.getOffsetRect( canvas, offset );

        var ratioX = canvas.width / canvas.clientWidth;
        var ratioY = canvas.height / canvas.clientHeight;

        var pos = Vec2.create();
        pos[ 0 ] = ( canvas.clientWidth / 2 ) * ratioX;
        pos[ 1 ] = ( canvas.clientHeight / 2 ) * ratioY;
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
    }
};

module.exports = CADManipulatorHammerController;
