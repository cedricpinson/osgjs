'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var NodeVisitor = require( 'osg/NodeVisitor' );

/**
 *  Switch that can switch on and off separate children
 *  @class Switch
 */
var Switch = function () {
    Node.call( this );
    // This list of bools is effectively a bit mask.
    this._values = [];
};

/** @lends Switch.prototype */
MACROUTILS.createPrototypeNode( Switch, MACROUTILS.objectInherit( Node.prototype, {

    addChild: function ( node, value ) {
        Node.prototype.addChild.call( this, node );

        if ( value === undefined ) value = true;

        if ( this.children.length > this._values.length ) {
            this._values.push( value );
        } else {
            this._values[ this.children.length - 1 ] = value;
        }
        return true;
    },

    setValue: function ( index, value ) {
        if ( index < this._values.length ) {
            this._values[ index ] = value;
        }
    },

    getValue: function ( index ) {
        if ( index < this._values.length ) {
            return this._values[ index ];
        }
    },

    setAllChildrenOff: function () {
        for ( var i = 0; i < this._values.length; ++i ) {
            this._values[ i ] = false;
        }
    },

    setAllChildrenOn: function () {
        for ( var i = 0; i < this._values.length; ++i ) {
            this._values[ i ] = true;
        }
    },

    traverse: ( function () {

        return function ( visitor ) {
            var traversalMode = visitor.traversalMode;

            switch ( traversalMode ) {

            case NodeVisitor.TRAVERSE_ALL_CHILDREN:

                for ( var i = 0; i < this.children.length; ++i ) {
                    this.children[ i ].accept( visitor );
                }
                break;

            case ( NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ):
                var numChildren = this.children.length;
                if ( this._values.length < numChildren ) numChildren = this._values.length;

                for ( i = 0; i < numChildren; ++i ) {
                    if ( this._values[ i ] === true ) {
                        this.children[ i ].accept( visitor );
                    }
                }
                break;

            default:
                break;
            }
        };
    } )()

} ), 'osg', 'Switch' );

module.exports = Switch;
