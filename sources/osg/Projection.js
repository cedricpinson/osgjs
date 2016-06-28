'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var Matrix = require( 'osg/Matrix' );
/**
 * @class
 * @memberof osg
 * @extends Node
 */
var Projection = function () {
    Node.call( this );
    this.projection = Matrix.create();
};
Projection.prototype = MACROUTILS.objectInherit( Node.prototype, {
    getProjectionMatrix: function () {
        return this.projection;
    },
    setProjectionMatrix: function ( m ) {
        this.projection = m;
    }
} );

MACROUTILS.setTypeID( Projection );

module.exports = Projection;
