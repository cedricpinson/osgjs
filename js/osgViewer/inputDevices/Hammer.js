osgViewer.inputDevices = osgViewer.inputDevices || {};

osgViewer.inputDevices.Hammer = function(viewer) {
    this._enable = true;
    this._viewer = viewer;
    this._type = 'Hammer';

    this._eventNode = undefined;

};

osgViewer.inputDevices.Hammer.prototype = {
    init: function(args) {

        var options = {
            prevent_default: true,
            rotation_treshold: 180,
            scale_treshold: 0.2
        };
        
        this._eventNode = args.eventNode;
        if (this._eventNode) {
            this._hammer = new Hammer(this._eventNode, options);
        }
    },

    isValid: function() {
        if (this._enable && this._viewer.getManipulator() && this._viewer.getManipulator().getInputDeviceSupported()[this._type])
            return true;
        return false;
    },
    getManipulatorDevice: function() {
        return this._viewer.getManipulator().getInputDeviceSupported()[this._type];
    },

    // use the update to set the input device to mouse controller
    // it's needed to compute size
    update: function() {
        if (!this.isValid())
            return;

        // we pass directly hammer object
        this.getManipulatorDevice().setInputDevice(this._hammer);
    }
    
};
