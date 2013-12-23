define( [
    'vr'
], function ( vr ) {

    var Oculus = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'Oculus';
        this._enable = true;
        this._vrstate = null;
    };

    Oculus.prototype = {
        init: function () {
            if ( !vr )
                return;
            this._vrstate = new vr.State();
        },

        getManipulatorController: function () {
            return this._viewer.getManipulator().getControllerList()[ this._type ];
        },

        isValid: function () {
            if ( !this._enable )
                return false;

            var manipulator = this._viewer.getManipulator();
            if ( !manipulator )
                return false;

            if ( !manipulator.getControllerList()[ this._type ] )
                return false;

            return true;
        },

        update: function () {
            if ( !this.isValid() )
                return;

            var vrstate = this._vrstate;
            if ( !vr || !vrstate )
                return;

            if ( !vr.pollState( vrstate ) || !vrstate.hmd.present )
                return;

            var manipulatorAdapter = this.getManipulatorController();
            if ( manipulatorAdapter.update ) {
                manipulatorAdapter.update( vrstate.hmd.rotation );
            }
        }
    };
    return Oculus;
} );