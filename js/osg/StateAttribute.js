/*global define */

define( [
    'osg/osg',
    'osg/Object'
], function ( osg, Object ) {

    /**
     * StateAttribute base class
     * @class StateAttribute
     */
    var StateAttribute = function () {
        Object.call( this );
        this._dirty = true;
    };

    /** @lends StateAttribute.prototype */
    StateAttribute.prototype = osg.objectLibraryClass( osg.objectInherit( Object.prototype, {
        isDirty: function () {
            return this._dirty;
        },
        dirty: function () {
            this._dirty = true;
        },
        setDirty: function ( dirty ) {
            this._dirty = dirty;
        }
    } ), 'osg', 'StateAttribute' );

    StateAttribute.OFF = 0;
    StateAttribute.ON = 1;
    StateAttribute.OVERRIDE = 2;
    StateAttribute.PROTECTED = 4;
    StateAttribute.INHERIT = 8;

    return StateAttribute;
} );