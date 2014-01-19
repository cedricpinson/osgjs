define( [
    'Hammer'
], function ( Hammer ) {

    var HammerController = function ( viewer ) {
        this._enable = true;
        this._viewer = viewer;
        this._type = 'Hammer';

        this._eventNode = undefined;

    };

    HammerController.prototype = {
        init: function ( args ) {

            /*jshint camelcase: false */
            var options = {
                prevent_default: true,
                drag_max_touches: 2,
                transform_min_scale: 0.08,
                transform_min_rotation: 180,
                transform_always_block: true,
                hold: false,
                release: false,
                swipe: false,
                tap: false
            };
            /*jshint camelcase: true */

            this._eventNode = args.eventNode;
            if ( this._eventNode ) {
                this._hammer = new Hammer( this._eventNode, options );
            }
        },

        isValid: function () {
            if ( this._enable && this._viewer.getManipulator() && this._viewer.getManipulator().getControllerList()[ this._type ] )
                return true;
            return false;
        },
        getManipulatorController: function () {
            return this._viewer.getManipulator().getControllerList()[ this._type ];
        },

        // use the update to set the input device to mouse controller
        // it's needed to compute size
        update: function () {
            if ( !this.isValid() )
                return;

            // we pass directly hammer object
            this.getManipulatorController().setEventProxy( this._hammer );
        }

    };
    return HammerController;
} );
