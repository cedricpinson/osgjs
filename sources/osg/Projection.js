'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var mat4 = require( 'osg/glMatrix' ).mat4;

var Projection = function () {
    Node.call( this );
    this.projection = mat4.create();
};

MACROUTILS.createPrototypeNode( Projection, MACROUTILS.objectInherit( Node.prototype, {
    getProjectionMatrix: function () {
        return this.projection;
    },
    setProjectionMatrix: function ( m ) {
        this.projection = m;
    }
} ), 'osg', 'Projection' );

module.exports = Projection;
