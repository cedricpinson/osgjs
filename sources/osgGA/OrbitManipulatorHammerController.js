define( [
    'osg/Notify'
], function ( Notify ) {

    var OrbitManipulatorHammerController = function ( manipulator ) {
        this._manipulator = manipulator;
        this.init();
    };

    OrbitManipulatorHammerController.prototype = {
        init: function () {
            this._panFactorX = 0.5;
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

            var computeTouches = function ( gesture ) {
                if ( gesture.touches !== undefined )
                    return gesture.touches.length;
                return 1; // mouse
            };

            var dragCB = function ( ev ) {
                return 'touches ' + computeTouches( ev ) + ' distance ' + ev.distance + ' x ' + ev.deltaX + ' y ' + ev.deltaY;
            };

            hammer.on( 'dragstart', function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || self._transformStarted ) {
                    return;
                }
                var gesture = event.gesture;
                if ( computeTouches( gesture ) === 2 ) {
                    self._pan = true;
                }

                self._dragStarted = true;
                if ( self._pan ) {
                    manipulator.getPanInterpolator().reset();
                    manipulator.getPanInterpolator().set( gesture.center.pageX * self._panFactorX, gesture.center.pageY * self._panFactorY );
                } else {
                    manipulator.getRotateInterpolator().reset();
                    manipulator.getRotateInterpolator().set( gesture.center.pageX * self._rotateFactorX, gesture.center.pageY * self._rotateFactorY );
                }
                Notify.debug( 'drag start, ' + dragCB( gesture ) );
            } );

            hammer.on( 'drag', function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator ) {
                    return;
                }
                if ( !self._dragStarted ) {
                    return;
                }
                if ( self._transformStarted ) {
                    self._dragStarted = false;
                    return;
                }

                var gesture = event.gesture;
                if ( self._pan ) {

                    // if a pan started and we release one finger,
                    // we dont take care of the those event
                    if ( computeTouches( gesture ) !== 2 )
                        return;

                    manipulator.getPanInterpolator().setTarget( gesture.center.pageX * self._panFactorX, gesture.center.pageY * self._panFactorY );
                    Notify.debug( 'pad, ' + dragCB( gesture ) );
                } else {
                    manipulator.getRotateInterpolator().setDelay( self._delay );
                    manipulator.getRotateInterpolator().setTarget( gesture.center.pageX * self._rotateFactorX, gesture.center.pageY * self._rotateFactorY );
                    Notify.debug( 'rotate, ' + dragCB( gesture ) );
                }
            } );
            hammer.on( 'dragend', function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || !self._dragStarted ) {
                    return;
                }
                self._dragStarted = false;
                var gesture = event.gesture;
                self._pan = false;
                Notify.debug( 'drag end, ' + dragCB( gesture ) );
            } );

            var toucheScale;
            hammer.on( 'transformstart', function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator ) {
                    return;
                }
                self._transformStarted = true;
                var gesture = event.gesture;

                toucheScale = gesture.scale;
                var scale = gesture.scale;
                manipulator.getZoomInterpolator().reset();
                manipulator.getZoomInterpolator().set( gesture.scale );

                Notify.debug( 'transform start ' + gesture.scale + ' ' + scale );
                event.preventDefault();
                hammer.options.drag = false;
            } );
            hammer.on( 'transformend', function ( event ) {
                self._transformStarted = false;
                Notify.debug( 'transform end ' + event.gesture.scale );
                hammer.options.drag = true;

            } );
            hammer.on( 'transform', function ( event ) {
                var manipulator = self._manipulator;
                if ( !manipulator || !self._transformStarted ) {
                    return;
                }

                var gesture = event.gesture;

                var scale = ( gesture.scale - toucheScale ) * self._zoomFactor;
                toucheScale = gesture.scale;
                var target = manipulator.getZoomInterpolator().getTarget()[ 0 ];
                manipulator.getZoomInterpolator().setTarget( target - scale );
                Notify.debug( 'transform ' + gesture.scale + ' ' + ( target - scale ) );
            } );

        },
        setManipulator: function ( manipulator ) {
            this._manipulator = manipulator;
        }
    };
    return OrbitManipulatorHammerController;
} );
