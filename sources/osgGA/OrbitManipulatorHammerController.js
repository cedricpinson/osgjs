define( [
    'osg/Notify'
], function ( Notify ) {

    'use strict';

    var OrbitManipulatorHammerController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    OrbitManipulatorHammerController.prototype = {
        init: function () {
            this._panFactorX = 1.0;
            this._panFactorY = -this._panFactorX;

            this._rotateFactorX = 0.6;
            this._rotateFactorY = -this._rotateFactorX;
            this._zoomFactor = 5.0;

            this._pan = false;
            this._delay = 0.15;
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

            this._cbPanStart = function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || self._transformStarted ) {
                    return;
                }
                var gesture = event;
                if ( computeTouches( gesture ) === 2 ) {
                    self._pan = true;
                }

                self._dragStarted = true;
                if ( self._pan ) {
                    manipulator.getPanInterpolator().reset();
                    manipulator.getPanInterpolator().set( event.center.x * self._panFactorX, event.center.y * self._panFactorY );
                } else {
                    manipulator.getRotateInterpolator().reset();
                    manipulator.getRotateInterpolator().set( event.center.x * self._rotateFactorX, event.center.y * self._rotateFactorY );
                }
                Notify.debug( 'drag start, ' + dragCB( gesture ) );
            };

            this._cbPanMove = function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator ) {
                    return;
                }
                if ( !self._dragStarted ) {
                    return;
                }
                var gesture = event;
                if ( self._pan ) {
                    manipulator.getPanInterpolator().setTarget( event.center.x * self._panFactorX, event.center.y * self._panFactorY );
                    Notify.debug( 'pan, ' + dragCB( gesture ) );
                } else {
                    manipulator.getRotateInterpolator().setDelay( self._delay );
                    manipulator.getRotateInterpolator().setTarget( event.center.x * self._rotateFactorX, event.center.y * self._rotateFactorY );
                    Notify.debug( 'rotate, ' + dragCB( gesture ) );
                }
            };

            this._cbPanEnd = function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || !self._dragStarted ) {
                    return;
                }
                self._dragStarted = false;
                var gesture = event;
                self._pan = false;
                Notify.debug( 'drag end, ' + dragCB( gesture ) );
            };

            var toucheScale;
            this._cbPinchStart = function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator ) {
                    return;
                }
                self._transformStarted = true;
                var gesture = event;

                toucheScale = gesture.scale;
                manipulator.getZoomInterpolator().reset();
                manipulator.getZoomInterpolator().set( toucheScale );
                event.preventDefault();
                Notify.debug( 'zoom start, ' + dragCB( gesture ) );
            };

            this._cbPinchEnd = function ( event ) {
                self._transformStarted = false;
                Notify.debug( 'zoom end, ' + dragCB( event ) );
            };

            this._cbPinchInOut = function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || !self._transformStarted ) {
                    return;
                }
                var gesture = event;
                var scale = ( gesture.scale - toucheScale ) * self._zoomFactor;
                toucheScale = gesture.scale;
                var target = manipulator.getZoomInterpolator().getTarget()[ 0 ];
                manipulator.getZoomInterpolator().setTarget( target - scale );
                Notify.debug( 'zoom, ' + dragCB( gesture ) );
            };

            hammer.on( 'panstart ', this._cbPanStart );
            hammer.on( 'panmove', this._cbPanMove );
            hammer.on( 'panend', this._cbPanEnd );
            hammer.on( 'pinchstart', this._cbPinchStart );
            hammer.on( 'pinchend', this._cbPinchEnd );
            hammer.on( 'pinchin pinchout', this._cbPinchInOut );
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
        },
        setManipulator: function ( manipulator ) {
            this._manipulator = manipulator;
        }
    };
    return OrbitManipulatorHammerController;
} );
