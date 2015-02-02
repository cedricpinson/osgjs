define( [], function () {

    var CullSettings = function () {
        this._computeNearFar = true;
        this._nearFarRatio = 0.005;

        var lookVector = [ 0.0, 0.0, -1.0 ];
        /*jshint bitwise: false */
        this.bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
        this.bbCornerNear = ( ~this.bbCornerFar ) & 7;
        /*jshint bitwise: true */
        this._enableFrustumCulling = false;

        this._settingsSource = this;
    };

    CullSettings.prototype = {
        setCullSettings: function ( settings ) {
            this._computeNearFar = settings._computeNearFar;
            this._nearFarRatio = settings._nearFarRatio;
            this._enableFrustumCulling = settings._enableFrustumCulling;
            this._settingsSource = settings._settingsSource;
        },
        setNearFarRatio: function ( ratio ) {
            this._nearFarRatio = ratio;
        },
        getNearFarRatio: function () {
            return this._nearFarRatio;
        },
        setComputeNearFar: function ( value ) {
            this._computeNearFar = value;
        },
        getComputeNearFar: function () {
            return this._computeNearFar;
        },

        setEnableFrustumCulling: function ( value ) {
            this._enableFrustumCulling = value;
        },
        getEnableFrustumCulling: function () {
            return this._enableFrustumCulling;
        },

        getSettingSource: function () {
            return this._settingsSource;
        }

    };

    return CullSettings;
} );