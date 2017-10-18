var FirstPersonManipulatorWebVRController = function(manipulator) {
    this._manipulator = manipulator;
    this.init();
};

FirstPersonManipulatorWebVRController.prototype = {
    init: function() {},
    update: function(q, position) {
        this._manipulator.setPoseVR(q, position);
    }
};

export default FirstPersonManipulatorWebVRController;
