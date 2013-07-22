
(function(module) {
    var EventProxy = function() {
        this._viewer = viewer;
        this._type = 'GamePad';
        this._enable = true;
    };

    EventProxy.prototype = {
        init: function(args) {

            var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
            
            // || (navigator.userAgent.indexOf('Firefox/') != -1); // impossible to detect Gamepad API support in FF

            if (!gamepadSupportAvailable) return;

            // Use events available in FF when available at least in Nightlies:
            // https://bugzilla.mozilla.org/show_bug.cgi?id=604039
            //
            // this._gamepadEventNode.addEventListener('MozGamepadConnected', function() { self.onGamepadConnect(); }, false);
            // this._gamepadEventNode.addEventListener('MozGamepadDisconnected', function() { self.onGamepadDisconnect(); }, false);

            // Chrome fallbacks to polling
            if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
                this.webkitStartGamepadPolling();
            }
        },

        isValid: function() {
            if (!this._enable)
                return false;

            var manipulator = this._viewer.getManipulator();
            if (!manipulator)
                return false;

            var constrollerList = manipulator.getControllerList();
            if (!constrollerList[this._type])
                return false;

            return true;
        },

        getManipulatorController: function() {
            return this._viewer.getManipulator().getControllerList()[this._type];
        },

        webkitStartGamepadPolling:function() {
            var self = this;
            this._gamepadPolling = setInterval(function() { self.webkitGamepadPoll(); }, 500);
        },

        webkitGamepadPoll:function() {
            var self = this;

            var rawGamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;

            if (rawGamepads[0]) {
                if (!this._gamepad) {
                    this.onGamepadConnect({gamepad:rawGamepads[0]});
                }
                this._gamepad = rawGamepads[0];
            } else if (this._gamepad) {
                this.onGamepadDisconnect({gamepad:this._gamepad});
            }
        },

        onGamepadConnect: function(evt) {
            this._gamepad = evt.gamepad;
            osg.log("Detected new gamepad!", this._gamepad);
        },

        onGamepadDisconnect:function(evt) {
            this._gamepad = false;
            osg.log("Gamepad disconnected", this._gamepad);
        },
        getGamePad: function() { return this._gamepad;},


        // Called in each frame
        updateGamepad:function() {

            if ( this._gamepad) {
                return;
            }

            if (this._gamepadPolling && this._gamepad) {
                this.webkitGamepadPoll();
            }
            
            var manipulatorAdapter = this.getManipulatorController();
            if (manipulatorAdapter.update) {
                manipulatorAdapter.update(this);
            }
        }
    };

    module = EventProxy;
})(osgViewer.EventProxy.GamePad);
