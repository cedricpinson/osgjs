var OrbitManipulatorWebVRController = function(manipulator) {
    this._manipulator = manipulator;
    this.init();
};

OrbitManipulatorWebVRController.prototype = {
    init: function() {},
    update: function(q, position) {
        this._manipulator.setPoseVR(q, position);
    }
};

export default OrbitManipulatorWebVRController;
