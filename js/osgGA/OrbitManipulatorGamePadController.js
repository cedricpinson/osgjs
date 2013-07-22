osgGA.getOrbitGamePadControllerClass = function(module) {

    var Controller = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    Controller.prototype = {
        init: function() {
            this._delay = 0.15;
            this._threshold = 0.08;
            this._mode = 0;
        },

        gamepadaxes: function(axes) {

            // Block badly balanced controllers
            var AXIS_THRESHOLD = 0.005;

            var rotateTarget,panTarget;
            var rotate = this._manipulator.getRotateInterpolator();
            var zoom = this._manipulator.getZoomInterpolator();
            var pan = this._manipulator.getPanInterpolator();
            // Regular gamepads
            if (axes.length==4) {
                
                if (Math.abs(axes[0])>AXIS_THRESHOLD || Math.abs(axes[1])>AXIS_THRESHOLD) {
                    rotate.setDelay(this._delay);
                    rotateTarget = rotate.getTarget();
                    rotate.setTarget(rotateTarget[0]-axes[0]*5, rotateTarget[1]+axes[1]*5);
                }
                if (Math.abs(axes[3])>AXIS_THRESHOLD) {
                    zoom.setDelay(this._delay);
                    zoom.setTarget(zoom.getTarget()[0] - axes[3]);
                }

                //SpaceNavigator & 6-axis controllers
            } else if (axes.length>=5) {

                if (Math.abs(axes[0])>AXIS_THRESHOLD || Math.abs(axes[1])>AXIS_THRESHOLD) {
                    panTarget = pan.getTarget();
                    pan.setDelay(this._delay);
                    pan.setTarget(panTarget[0]-axes[0]*20, panTarget[1]+axes[1]*20);
                }

                if (Math.abs(axes[2])>AXIS_THRESHOLD) {
                    zoom.setDelay(this._delay);
                    zoom.setTarget(zoom.getTarget()[0] - axes[2]);
                }
                if (Math.abs(axes[3])>AXIS_THRESHOLD || Math.abs(axes[4])>AXIS_THRESHOLD) {
                    rotate.setDelay(this._delay);
                    rotateTarget = rotate.getTarget();
                    rotate.setTarget(rotateTarget[0]+axes[4]*10, rotateTarget[1]+axes[3]*10);
                }
            }

        },

        gamepadbuttondown: function(event, pressed) {
            // Buttons 12 to 15 are the d-pad.
            if (event.button>=12 && event.button<=15) {
                var pan = this._manipulator.getPanInterpolator();
                var panTarget = pan.getTarget();
                var delta = {
                    12: [0 , -1],
                    13: [0 ,  1],
                    14: [-1,  0],
                    15: [1 ,  0]
                }[event.button];
                pan.setDelay(this._delay);
                pan.setTarget(panTarget[0]-delta[0]*10, panTarget[1]+delta[1]*10);
            }
        },

        update: function(gamepadProxyEvent) {
            if (!gamepad) {
                return;
            }
            
            var gm = gamepadProxyEvent.getGamePad();
            var axis = gm.axes;
            var buttons = gm.buttons;

            this.gamepadaxes(axis);
            
            // Dummy event wrapper
            var emptyFunc = function() {};
            for (var i=0;i<buttons.length;i++) {
                if (buttons[i]) {
                    this.gamepadbuttondown({
                        preventDefault:emptyFunc,
                        gamepad: gm,
                        button:i
                    },!!button[i]);
                }
            }
        }
    };

    return Controller;
};
