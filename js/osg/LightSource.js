/*global define */

define( [
	'osg/osg',
	'osg/Node',
], function ( osg, Node ) {

	/** -*- compile-command: 'jslint-cli Node.js' -*- */

	/** 
	 *  LightSource is a positioned node to use with StateAttribute Light
	 *  @class LightSource
	 */
	LightSource = function () {
		Node.call( this );
		this._light = undefined;
	};

	/** @lends LightSource.prototype */
	LightSource.prototype = osg.objectLibraryClass( osg.objectInehrit( Node.prototype, {
		getLight: function () {
			return this._light;
		},
		setLight: function ( light ) {
			this._light = light;
		}
	} ), 'osg', 'LightSource' );
	LightSource.prototype.objectType = osg.objectType.generate( 'LightSource' );

	return LightSource;
} );