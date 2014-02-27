define( [
    'Leap',
    'osg/Notify'
], function ( Leap, Notify ) {

    var LeapMotion = function ( viewer ) {
        this._viewer = viewer;
        this._type = 'LeapMotion';
        this._enable = true;
    };

    LeapMotion.prototype = {
        init: function ( args ) {

            var self = this;
            this._controller = new Leap.Controller( {
                enableGestures: args.gestures || true,
                tryReconnectOnDisconnect: true,
                connectAttempts: 3
            } );
            this._controller.on( 'ready', function () {
                if ( args.readyCallback )
                    args.readyCallback( self._controller );
                self._leapMotionReady = true;
                Notify.info( 'leapmotion ready' );
            } );
            this._controller.loop( this._update.bind( this ) );
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

        // this is binded
        _update: function ( frame ) {
            if ( !frame.valid || !this.isValid() ) {
                return;
            }
            var manipulatorAdapter = this.getManipulatorController();
            if ( manipulatorAdapter.update ) {
                manipulatorAdapter.update( frame );
            }
        }
    };
    return LeapMotion;
} );
