var CullSettings = function() {
    // Not doing a this.reset()
    // because of multiple inheritance
    // it will call the wrong reset
    // cullstack reset for isntance()
    CullSettings.prototype.reset.call(this);
};

CullSettings.prototype = {
    reset: function() {
        this._computeNearFar = true;
        this._nearFarRatio = 0.005;

        this._enableFrustumCulling = false;

        // who sets the parameter
        // if it's cullvisitor
        // it's an OVERRIDER for enableFrustumCulling
        // allowing for global EnableFrustimCulling
        this._settingsSourceOverrider = this;
        //LOD bias for the CullVisitor to use
        this._LODScale = 1.0;
        // Custom clampProjectionMatrix
        this._clampProjectionMatrixCallback = undefined;
    },

    setCullSettings: function(settings) {
        this._computeNearFar = settings._computeNearFar;
        this._nearFarRatio = settings._nearFarRatio;
        this._enableFrustumCulling = settings._enableFrustumCulling;
        this._settingsSourceOverrider = settings._settingsSourceOverrider;
        this._clampProjectionMatrixCallback = settings._clampProjectionMatrixCallback;
    },

    setNearFarRatio: function(ratio) {
        this._nearFarRatio = ratio;
    },
    getNearFarRatio: function() {
        return this._nearFarRatio;
    },
    setComputeNearFar: function(value) {
        this._computeNearFar = value;
    },
    getComputeNearFar: function() {
        return this._computeNearFar;
    },

    setEnableFrustumCulling: function(value) {
        this._enableFrustumCulling = value;
    },
    getEnableFrustumCulling: function() {
        return this._enableFrustumCulling;
    },

    getSettingSourceOverrider: function() {
        return this._settingsSourceOverrider;
    },

    setClampProjectionMatrixCallback: function(callback) {
        this._clampProjectionMatrixCallback = callback;
    },

    getClampProjectionMatrixCallback: function() {
        return this._clampProjectionMatrixCallback;
    },

    setLODScale: function(scale) {
        this._LODScale = scale;
    },
    getLODScale: function() {
        return this._LODScale;
    }
};

export default CullSettings;
