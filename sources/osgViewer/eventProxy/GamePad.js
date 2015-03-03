define( [
    'osg/Notify'
], function ( Notify ) {

    var GamePad = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'GamePad';
        this._enable = true;
    };

    GamePad.prototype = {
        init: function ( /*args*/ ) {

            var gamepadSupportAvailable = !! navigator.webkitGetGamepads || !! navigator.webkitGamepads;
            // || (navigator.userAgent.indexOf('Firefox/') != -1); // impossible to detect Gamepad API support in FF
            if ( !gamepadSupportAvailable ) return;

        },

        isValid: function () {
            if ( !this._enable )
                return false;

            var manipulator = this._viewer.getManipulator();
            if ( !manipulator )
                return false;

            var constrollerList = manipulator.getControllerList();
            if ( !constrollerList[ this._type ] )
                return false;

            return true;
        },

        getManipulatorController: function () {
            return this._viewer.getManipulator().getControllerList()[ this._type ];
        },

        webkitGamepadPoll: function () {
            var rawGamepads = ( navigator.webkitGetGamepads && navigator.webkitGetGamepads() ) || navigator.webkitGamepads;
            if ( !rawGamepads ) {
                return;
            }

            if ( rawGamepads[ 0 ] ) {
                if ( !this._gamepad ) {
                    this.onGamepadConnect( {
                        gamepad: rawGamepads[ 0 ]
                    } );
                }
                this._gamepad = rawGamepads[ 0 ];
            } else if ( this._gamepad ) {
                this.onGamepadDisconnect( {
                    gamepad: this._gamepad
                } );
            }
        },

        onGamepadConnect: function ( evt ) {
            this._gamepad = evt.gamepad;
            Notify.log( 'Detected new gamepad!', this._gamepad );
        },

        onGamepadDisconnect: function ( /*evt*/ ) {
            this._gamepad = false;
            Notify.log( 'Gamepad disconnected', this._gamepad );
        },
        getGamePad: function () {
            return this._gamepad;
        },

        // Called in each frame
        update: function () {

            // necessary
            this.webkitGamepadPoll();

            if ( !this._gamepad )
                return;

            var manipulatorAdapter = this.getManipulatorController();
            //manipulatorAdapter.setEventProxy(this);
            if ( manipulatorAdapter.update ) {
                manipulatorAdapter.update( this );
            }
        }
    };
    return GamePad;
} );
