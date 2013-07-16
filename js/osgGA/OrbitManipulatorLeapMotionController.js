osgGA.getOrbitLeapMotionControllerClass = function(module) {

    var LeapMotionController = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    var EnumMode = [ 'getRotateInterpolator',
                     'getPanInterpolator',
                     'getZoomInterpolator'];
    
    var ModeConfig = {
        'getRotateInterpolator': {
            dtx: -1.2*1.2,
            dty: -0.9*1.2,
            delay: 0.05
        },
        'getPanInterpolator': {
            dtx: -1.2*1.2,
            dty: -0.9*1.2,
            delay: 0.05
        },
        'getZoomInterpolator': {
            dtx: 0.0,
            dty: -0.5,
            delay: 0.05
        }
    };

    LeapMotionController.prototype = {
        init: function() {
            this._virtualCursor = [0.0,0.0];
            this._targetPosition = [0.0,0.0];
            this._previousFrame = undefined;
            this._displacement = [0.0, 0.0];
            this._motion = [0.0, 0.0];
            this._delay = 0.05;
            this._threshold = 0.08;
            this._mode = 0;
        },
        handHasMoved: function(hand) {
            var self = this;
            if (self._hand === undefined || 
               (self._hand.id !== hand.id) ) {
                return true;
            }

            var dist = osg.Vec3.distance(hand.palmPosition, self._hand.palmPosition);
            if ( dist > 1.5 ) {
                return true;
            }

            var distRadius = Math.abs(hand.sphereRadius-self._hand.sphereRadius);
            //osg.log("distance radius " + distRadius.toString());
            if (distRadius > 1) {
                return false;
            }
            //osg.log('dist ' + dist.toString());
            return true;
        },
        update: function(frame) {
            if (!this._previousFrame) {
                this._previousFrame = frame;
            }

            // no fingers ? return
            if (frame.fingers.length === 0 ) {
                return;
            }
            //osg.debug("hands " + frame.hands.length.toString() + " fingers " + frame.fingers.length.toString());

            var deltaFrame = this._previousFrame.translation(frame);

            this._previousFrame = frame;

            if (frame.hands.length === 0) {
                return;
            }

            // filter noise
            if (Math.abs(deltaFrame[0]) < this._threshold && 
                Math.abs(deltaFrame[1]) < this._threshold) {
                return;
            }

            var mode = this._mode;
            var dist = 0;
            var scaleFactor = 1.0;

            // scale is when there two hands with but with two hand with more than 1 fingers
            if (frame.hands.length >= 2 && 
                frame.hands[0].fingers.length > 1 &&
                frame.hands[1].fingers.length > 1) {
                mode = 2;
                dist = osg.Vec3.distance(frame.hands[0].palmPosition,frame.hands[1].palmPosition);

                // we want one finger from hand and hand that will move to drag the model
            // } else if (frame.hands.length >= 2 && ( 
            //     ( frame.hands[0].fingers.length === 1 && frame.hands[1].fingers.length > 1) || ( frame.hands[0].fingers.length > 1 && frame.hands[1].fingers.length === 1) ) ) {
            } else if (frame.hands.length === 1 &&  
                       frame.hands[0].fingers.length === 2) {
                mode = 1;
            } else {
                // by default onw hand moving means rotation
                mode = 0;
            }

            var zoom  = this._manipulator.getZoomInterpolator();

            if (frame.hands.length === 1 &&
                frame.hands[0].fingers.length >= 5) {
                // if ( !this.handHasMoved(frame.hands[0])) {
                //     //mode = 2;
                //     dist = frame.hands[0].sphereRadius;
                //     osg.log('radius ' + frame.hands[0].sphereRadius.toString());
                // }
                var distR;
                if ( false ) {
                    distR = frame.hands[0].sphereRadius / 2.0;
                    //osg.log(distR);
                } else {
                    mode = 2;
                    distR = frame.hands[0].palmPosition[1]/10.0;
                }
                osg.log(distR);
                dist = distR;
                zoom.setTarget(distR);

                this._hand = frame.hands[0];
            }


            // change mode reset counter and skip this frame
            var enumMode = EnumMode[mode];
            if (mode !== this._mode) {
                osg.info("Switch to mode " + enumMode.toString());

                this._motion[0] = 0;
                this._motion[1] = 0;
                this._mode = mode;

                if (enumMode === 'getZoomInterpolator') {
                    if (zoom.isReset()) {
                        zoom._start = 1.0; //dist;
                        zoom.set(0.0);
                    }
                }
                return;
            }

            var dtx,dty;
            dtx = ModeConfig[enumMode].dtx;
            dty = ModeConfig[enumMode].dty;

            this._motion[0] += deltaFrame[0]*dtx;
            this._motion[1] += deltaFrame[1]*dty;

            var delay = ModeConfig[enumMode].delay;
            
            // we use the mode enum to get the good method
            this._manipulator[enumMode]().setDelay(delay);

            if (enumMode === 'getZoomInterpolator') {
                var dy = dist-zoom._start;
                //zoom._start = dist;
                var v = zoom.getTarget()[0];
                zoom.setTarget(dist/5.0);
                zoom.setTarget(dist);
            } else {
                this._manipulator[enumMode]().addTarget(this._motion[0], this._motion[1]);
            }
            
            this._motion[1] = this._motion[0] = 0;
        }
    };

    return LeapMotionController;
};
