osgGA.getOrbitLeapMotionControllerClass = function(module) {

    var LeapMotionController = function(manipulator) {
        this._manipulator = manipulator;
        this.init();
    };

    LeapMotionController.prototype = {
        init: function() {
            this._virtualCursor = [0.0,0.0];
            this._targetPosition = [0.0,0.0];
            this._previousFrame = undefined;
            this._displacement = [0.0, 0.0];
            this._motion = [0.0, 0.0];
        },
        update: function(frame) {

            if (!this._previousFrame) {
                this._previousFrame = frame;
            }

            var deltaFrame = this._previousFrame.translation(frame);
            var dt = 1.0;
            this._motion[0] = deltaFrame[0]*dt;
            this._motion[1] = deltaFrame[1]*dt;

            // handle virtual 2d cursor
            this._targetPosition[0] += motion[0];
            this._targetPosition[1] += motion[1];

            var smothiness = dt/500.0;
            this._displacement[0] = (this._targetPosition[0] - this._virtualCursor[0]) * smothiness;
            this._displacement[1] = (this._targetPosition[1] - this._virtualCursor[1]) * smothiness;

            this._virtualCursor[0] += displacement[0];
            this._virtualCursor[1] += displacement[1];
            
            this._previousFrame = frame;
        }
    };

    return LeapMotionController;
};
