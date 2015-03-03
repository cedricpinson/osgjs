define( [
    'osg/Utils',
    'osg/StateAttribute'
], function ( MACROUTILS, StateAttribute ) {

    'use strict';

    var ColorMask = function ( red, green, blue, alpha ) {

        StateAttribute.call( this );

        this._colorMask = [ true, true, true, true ];
        this.setMask( red, green, blue, alpha );
    };

    ColorMask.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'ColorMask',

        cloneType: function () {
            return new ColorMask();
        },

        setMask: function ( red, green, blue, alpha ) {

            if ( red !== undefined &&
                green !== undefined &&
                blue !== undefined &&
                alpha !== undefined ) {

                this._colorMask[ 0 ] = red;
                this._colorMask[ 1 ] = green;
                this._colorMask[ 2 ] = blue;
                this._colorMask[ 3 ] = alpha;

                this.dirty();
            }
        },

        apply: function ( state ) {
            var gl = state.getGraphicContext();
            gl.colorMask( this._colorMask[ 0 ], this._colorMask[ 1 ], this._colorMask[ 2 ], this._colorMask[ 3 ] );
            this._dirty = false;
        }
    } ), 'osg', 'ColorMask' );

    return ColorMask;
} );
