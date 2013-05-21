osgViewer.inputDevices = osgViewer.inputDevices || {};

if (window.Leap) {
    osgViewer.inputDevices.LeapMotion = function() {
        this._controller = undefined;
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

            this._controller.loop(this.update);

        },

        update: function(frame) {
            if (!frame.valid) {
                return;
            }
            
        }
    };
}
