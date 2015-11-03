define( [
    'osg/Hash',
    'osg/Utils',
    'osg/Object'
], function ( Hash, MACROUTILS, Object ) {

    'use strict';

    var StateAttribute = function () {
        Object.call( this );
        this._dirty = true;
        this._dirtyHash = true;

        // default hash in case of missing getHashString override
        // moreoften than not must also be called from
        // inherited classes ctor at end of the ctor (once getHashString makes sense)
        this._hash = Hash.hashComputeCodeFromString( this.attributeType );

    };


    StateAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        isDirty: function () {
            return this._dirty;
        },

        // when the StateAttribute State changes.
        // ( NOT when uniform associated change )
        dirty: function () {
            this._dirty = true;
            this._dirtyHash = true;
        },

        setDirty: function ( dirty ) {

            // this._dirtyHash or only if it WAS dirty and won't be anymore now
            this._dirtyHash = this._dirtyHash || ( this._dirty && !dirty );
            this._dirty = dirty;

        },

        getType: function () {
            return this.attributeType;
        },

        getTypeMember: function () {
            return this.attributeType;
        },

        apply: function () {
            this.setDirty( false );
        },

        // getHash is used by the compiler to know if a change in a StateAttribute
        // must trigger a shader build
        // If you create your own attribute you will have to customize this function
        // a good rule is to that if you change uniform it should not rebuild a shader
        // but if you change a type or representation of your StateAttribute, then it should
        // if it impact the rendering.
        // check other attributes for examples
        getHashString: function () {
            return this.getTypeMember();
        },
        // return int hash
        getHash: function () {

            if ( this._dirtyHash ) {
                this._hash = Hash.hashComputeCodeFromString( this.getHashString() );
                this._dirtyHash = false;
            }

            return this._hash;

        }


    } ), 'osg', 'StateAttribute' );

    StateAttribute.OFF = 0;
    StateAttribute.ON = 1;
    StateAttribute.OVERRIDE = 2;
    StateAttribute.PROTECTED = 4;
    StateAttribute.INHERIT = 8;

    return StateAttribute;
} );
