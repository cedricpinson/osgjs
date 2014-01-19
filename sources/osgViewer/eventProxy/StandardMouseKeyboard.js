define( [], function () {

    var StandardMouseKeyboard = function ( viewer ) {
        this._enable = true;
        this._viewer = viewer;
        this._type = 'StandardMouseKeyboard';

        this._mouseEventNode = undefined;
        this._wheelEventNode = undefined;
        this._keyboardEventNode = undefined;
        this._eventList = [ 'mousedown', 'mouseup', 'mousemove', 'dblclick' ];
        this._mousePosition = [ 0, 0 ];
    };

    StandardMouseKeyboard.prototype = {
        init: function ( args ) {

            this.removeEventListeners( this._mouseEventNode, this._wheelEventNode, this._keyboardEventNode );

            var mouse = args.mouseEventNode;
            var mousewheel = args.wheelEventNode || mouse;
            var keyboard = args.keyboardEventNode || mouse;

            this.addEventListeners( mouse, mousewheel, keyboard );
            this._mouseEventNode = mouse;
            this._wheelEventNode = mousewheel;
            this._keyboardEventNode = keyboard;
        },

        addEventListeners: function ( mouse, mousewheel, keyboard ) {
            if ( mouse ) {
                for ( var i = 0, l = this._eventList.length; i < l; i++ ) {
                    var ev = this._eventList[ i ];
                    if ( this[ ev ] ) {
                        mouse.addEventListener( ev, this[ ev ].bind( this ), false );
                    }
                }
            }
            if ( mousewheel ) {
                mousewheel.addEventListener( 'DOMMouseScroll', this.mousewheel.bind( this ), false );
                mousewheel.addEventListener( 'mousewheel', this.mousewheel.bind( this ), false );
            }

            if ( keyboard ) {
                keyboard.addEventListener( 'keydown', this.keydown.bind( this ), false );
                keyboard.addEventListener( 'keyup', this.keyup.bind( this ), false );
            }
        },

        removeEventListeners: function ( mouse, mousewheel, keyboard ) {
            if ( mouse ) {
                for ( var i = 0, l = this._eventList.length; i < l; i++ ) {
                    var ev = this._eventList[ i ];
                    if ( this[ ev ] ) {
                        mouse.removeEventListener( ev, this[ ev ] );
                    }
                }
            }
            if ( mousewheel ) {
                mousewheel.removeEventListener( 'DOMMouseScroll', this.mousewheel );
                mousewheel.removeEventListener( 'mousewheel', this.mousewheel );
            }
            if ( keyboard ) {
                keyboard.removeEventListener( 'keydown', this.keydown );
                keyboard.removeEventListener( 'keyup', this.keyup );
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
        keyup: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().keyup )
                return this.getManipulatorController().keyup( ev );
        },
        keydown: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().keydown )
                return this.getManipulatorController().keydown( ev );
        },

        mousedown: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().mousedown )
                return this.getManipulatorController().mousedown( ev );
        },

        mouseup: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().mouseup )
                return this.getManipulatorController().mouseup( ev );
        },

        mousemove: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().mousemove )
                return this.getManipulatorController().mousemove( ev );
        },

        dblclick: function ( ev ) {
            if ( !this.isValid() )
                return;
            if ( this.getManipulatorController().dblclick )
                return this.getManipulatorController().dblclick( ev );
        },

        mousewheel: function ( event ) {
            if ( !this.isValid() )
                return;

            var manipulatorAdapter = this.getManipulatorController();
            if ( !manipulatorAdapter.mousewheel )
                return;

            // from jquery
            var orgEvent = event || window.event,
                args = [].slice.call( arguments, 1 ),
                delta = 0,
                //returnValue = true,
                deltaX = 0,
                deltaY = 0;
            //event = $.event.fix(orgEvent);
            event.type = 'mousewheel';

            // Old school scrollwheel delta
            if ( event.wheelDelta ) {
                delta = event.wheelDelta / 120;
            }
            if ( event.detail ) {
                delta = -event.detail / 3;
            }

            // New school multidimensional scroll (touchpads) deltas
            deltaY = delta;

            // Gecko
            if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
                deltaY = 0;
                deltaX = -1 * delta;
            }

            // Webkit
            if ( orgEvent.wheelDeltaY !== undefined ) {
                deltaY = orgEvent.wheelDeltaY / 120;
            }
            if ( orgEvent.wheelDeltaX !== undefined ) {
                deltaX = -1 * orgEvent.wheelDeltaX / 120;
            }
            // Add event and delta to the front of the arguments
            args.unshift( event, delta, deltaX, deltaY );

            return this.getManipulatorController().mousewheel.apply( manipulatorAdapter, args );
        },

        divGlobalOffset: function ( obj ) {
            var x = 0,
                y = 0;
            x = obj.offsetLeft;
            y = obj.offsetTop;
            var body = document.getElementsByTagName( 'body' )[ 0 ];
            while ( obj.offsetParent && obj !== body ) {
                x += obj.offsetParent.offsetLeft;
                y += obj.offsetParent.offsetTop;
                obj = obj.offsetParent;
            }
            this._mousePosition[ 0 ] = x;
            this._mousePosition[ 1 ] = y;
            return this._mousePosition;
        },

        getPositionRelativeToCanvas: function ( e, result ) {
            var myObject = e.target;
            var posx, posy;
            if ( e.pageX || e.pageY ) {
                posx = e.pageX;
                posy = e.pageY;
            } else if ( e.clientX || e.clientY ) {
                posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            // posx and posy contain the mouse position relative to the document
            // Do something with this information
            var globalOffset = this.divGlobalOffset( myObject );
            posx = posx - globalOffset[ 0 ];
            posy = myObject.height - ( posy - globalOffset[ 1 ] );

            // NaN in camera check here
            if ( isNaN( posx ) || isNaN( posy ) ) {
                //debugger;
            }

            // copy data to result if need to keep result
            // else we use a tmp variable inside manipulator
            // that we override at each call
            if ( result === undefined ) {
                result = this._mousePosition;
            }
            result[ 0 ] = posx;
            result[ 1 ] = posy;
            return result;
        },

        // use the update to set the input device to mouse controller
        // it's needed to compute size
        update: function () {
            if ( !this.isValid() )
                return;

            this.getManipulatorController().setEventProxy( this );
        }

    };
    return StandardMouseKeyboard;
} );
