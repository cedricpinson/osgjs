osgViewer.EventProxy = osgViewer.EventProxy || {};

osgViewer.EventProxy.Hammer = function(viewer) {
    this._enable = true;
    this._viewer = viewer;
    this._type = 'Hammer';

    this._eventNode = undefined;

};

osgViewer.EventProxy.Hammer.prototype = {
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
        if (this._enable && this._viewer.getManipulator() && this._viewer.getManipulator().getControllerList()[this._type])
            return true;
        return false;
    },
    getManipulatorController: function() {
        return this._viewer.getManipulator().getControllerList()[this._type];
    },

    // use the update to set the input device to mouse controller
    // it's needed to compute size
    update: function() {
        if (!this.isValid())
            return;

        // we pass directly hammer object
        this.getManipulatorController().setEventProxy(this._hammer);
    }
    
};
