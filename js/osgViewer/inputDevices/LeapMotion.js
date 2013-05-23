osgViewer.inputDevices = osgViewer.inputDevices || {};
osgViewer.inputDevices.LeapMotion = function(viewer) {
    this._viewer = viewer;
    this._type = 'LeapMotion';
};

osgViewer.inputDevices.LeapMotion.prototype = {
    init: function(args) {
        var element = document.getElementById(args.id);

        this._controller = new Leap.Controller({enableGestures: args.gestures || true});
        this._controller.on('ready', function() {
            if (args.readyCallback)
                args.readyCallback(this._controller);
            this._leapMotionReady = true;
            osg.info('leapmotion ready');
        });

        this._controller.loop(this._update);

    },

    isValid: function() {
        if (this._enable && this._viewer.getManipulator() && this._viewer.getManipulator().getSupportedInputDevices[this._type])
            return true;
        return false;
    },
    getManipulatorDevice: function() {
        return this._viewer.getManipulator().getSupportedInputDevices[this._type];
    },
    _update: function(frame) {
        if (!frame.valid || !this.isValid()) {
            return;
        }
        var manipulatorAdapter = this.getManipulatorDevice();
        if (manipulatorAdapter.update) {
            manipulatorAdapter.update(frame);
        }
    }

    
};
