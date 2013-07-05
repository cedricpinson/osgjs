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
            dty: 0.9*1.2,
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
                osg.log('dist ' + dist.toString());
            } else if (frame.hands.length >= 2 && ( 
                ( frame.hands[0].fingers.length === 1 && frame.hands[1].fingers.length > 1) || ( frame.hands[0].fingers.length > 1 && frame.hands[1].fingers.length === 1) ) ) {
                mode = 1;
            } else {
                mode = 0;
            }

            if (false && frame.gestures.length > 0) {
                for ( var i = 0; i < frame.gestures.length; i++) {
                    var gesture = frame.gestures[i];
                    var type = gesture.type;
                    if (type === "keyTap" || type === "screenTap") {
                        mode = (this._mode + 1) % EnumMode.length-1;
                        break;
                    }
                }
            }

            var zoom  = this._manipulator.getZoomInterpolator();

            // change mode reset counter and skip this frame
            var enumMode = EnumMode[mode];
            if (mode !== this._mode) {
                osg.info("Switch to mode " + enumMode.toString());

                this._motion[0] = 0;
                this._motion[1] = 0;
                this._mode = mode;

                if (enumMode === 'getZoomInterpolator') {
                    if (zoom.isReset()) {
                        zoom._start = dist;
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
                zoom._start = dist;
                var v = zoom.getTarget()[0];
                zoom.setTarget(v-dy/5.0);
            } else {
                this._manipulator[enumMode]().addTarget(this._motion[0], this._motion[1]);
            }
            
            this._motion[1] = this._motion[0] = 0;
        }
    };

    return LeapMotionController;
};
