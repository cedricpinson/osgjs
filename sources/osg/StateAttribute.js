define( [
    'osg/Utils',
    'osg/Object'
], function ( MACROUTILS, Object ) {

    'use strict';

    var StateAttribute = function () {
        Object.call( this );
        this._dirty = true;
    };


    StateAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        isDirty: function () {
            return this._dirty;
        },

        dirty: function () {
            this._dirty = true;
        },

        setDirty: function ( dirty ) {
            this._dirty = dirty;
        },

        getType: function () {
            return this.attributeType;
        },

        getTypeMember: function () {
            return this.attributeType;
        },

        apply: function () {},

        // getHash is used by the compiler to know if a change in a StateAttribute
        // must trigger a shader build
        // If you create your own attribute you will have to customize this function
        // a good rule is to that if you change uniform it should not rebuild a shader
        // but if you change a type or representation of your StateAttribute, then it should
        // if it impact the rendering.
        // check other attributes for examples
        getHash: function () {
            return this.getTypeMember();
        }

    } ), 'osg', 'StateAttribute' );

    StateAttribute.OFF = 0;
    StateAttribute.ON = 1;
    StateAttribute.OVERRIDE = 2;
    StateAttribute.PROTECTED = 4;
    StateAttribute.INHERIT = 8;

    return StateAttribute;
} );
