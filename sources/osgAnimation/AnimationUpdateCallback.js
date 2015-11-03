'use strict';
var Notify = require( 'osg/Notify' );
var MACROUTILS = require( 'osg/Utils' );
var Object = require( 'osg/Object' );


/**
 *  AnimationUpdateCallback
 *  @class AnimationUpdateCallback
 */
var AnimationUpdateCallback = function () {
    Object.call( this );
};

/** @lends AnimationUpdateCallback.prototype */
AnimationUpdateCallback.prototype = MACROUTILS.objectInherit( Object.prototype, {

    linkChannel: function () {},
    linkAnimation: function ( anim ) {
        var name = this.getName();
        if ( name.length === 0 ) {
            Notify.log( 'no name on an update callback, discard' );
            return 0;
        }
        var nbLinks = 0;
        var channels = anim.getChannels();
        for ( var i = 0, l = channels.length; i < l; i++ ) {
            var channel = channels[ i ];
            if ( channel.getTargetName() === name ) {
                this.linkChannel( channel );
                nbLinks++;
            }
        }
        return nbLinks;
    }
} );

module.exports = AnimationUpdateCallback;
