define( [
    'osg/Notify'
], function ( Notify ) {

    /**
     *  OrbitManipulator
     *  @class
     */
    var SwitchManipulator = function () {
        this._manipulatorList = [];
        this._currentManipulator = undefined;
    };

    /** @lends SwitchManipulator.prototype */
    SwitchManipulator.prototype = {
        update: function ( nv ) {
            var manipulator = this.getCurrentManipulator();
            if ( manipulator !== undefined ) {
                return manipulator.update( nv );
            }
            return undefined;
        },
        setNode: function ( node ) {
            var manipulator = this.getCurrentManipulator();
            if ( manipulator.setNode === undefined ) {
                Notify.log( 'manipulator has not setNode method' );
                return;
            }
            manipulator.setNode( node );
        },
        getControllerList: function () {
            return this.getCurrentManipulator().getControllerList();
        },
        getNumManipulator: function () {
            return this._manipulatorList.length;
        },
        addManipulator: function ( manipulator ) {
            this._manipulatorList.push( manipulator );
            if ( this._currentManipulator === undefined ) {
                this.setManipulatorIndex( 0 );
            }
        },
        getManipulatorList: function () {
            return this._manipulatorList;
        },
        setManipulatorIndex: function ( index ) {
            this._currentManipulator = index;
        },
        getCurrentManipulatorIndex: function () {
            return this._currentManipulator;
        },
        getCurrentManipulator: function () {
            var manipulator = this._manipulatorList[ this._currentManipulator ];
            return manipulator;
        },
        reset: function () {
            this.getCurrentManipulator().reset();
        },
        computeHomePosition: function () {
            var manipulator = this.getCurrentManipulator();
            if ( manipulator !== undefined ) {
                manipulator.computeHomePosition();
            }
        },
        getInverseMatrix: function () {
            var manipulator = this.getCurrentManipulator();
            if ( manipulator !== undefined ) {
                return manipulator.getInverseMatrix();
            }
        }
    };

    return SwitchManipulator;
} );
