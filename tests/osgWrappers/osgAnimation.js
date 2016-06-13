'use strict';
var assert = require( 'chai' ).assert;

var MACROUTILS = require( 'osg/Utils' );
var Input = require( 'osgDB/Input' );
var BasicAnimationManager = require( 'osgAnimation/BasicAnimationManager' );
var NodeVisitor = require( 'osg/NodeVisitor' );

module.exports = function () {

    var FindAnimationManagerVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._cb = undefined;
    };
    FindAnimationManagerVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        getAnimationManager: function () {
            return this._cb;
        },
        apply: function ( node ) {
            var cbs = node.getUpdateCallbackList();
            for ( var i = 0, l = cbs.length; i < l; i++ ) {
                if ( cbs[ 0 ] instanceof BasicAnimationManager ) {
                    this._cb = cbs[ 0 ];
                    return;
                }
            }
            this.traverse( node );
        }
    } );

    var getChannelsInfo = function ( animation ) {

        var nbChannelSyncEnd = 0;
        var nbTimesEmptySlot = 0;
        var nbKeysEmptySlot = 0;

        var channels = animation.channels;
        var nbChannels = channels.length;
        for ( var i = 0; i < nbChannels; ++i ) {
            var chan = channels[ i ].channel;
            if ( animation.duration === chan.end )
                nbChannelSyncEnd++;

            if ( chan.times.buffer.byteLength - chan.times.byteLength === 4 )
                nbTimesEmptySlot++;

            var sizeElt = BasicAnimationManager.TypeToSize[ chan.type ];
            if ( chan.keys.buffer.byteLength - chan.keys.byteLength === 4 * sizeElt )
                nbKeysEmptySlot++;
        }

        return {
            nbChannelSyncEnd: nbChannelSyncEnd,
            nbTimesEmptySlot: nbTimesEmptySlot,
            nbKeysEmptySlot: nbKeysEmptySlot
        };
    };

    test( 'osgAnimation character', function ( done ) {

        var input = new Input();
        input.readNodeURL( '../examples/media/models/animation/character.osgjs' ).then( function ( scene ) {

            var findAnimationManager = new FindAnimationManagerVisitor();
            scene.accept( findAnimationManager );
            var manager = findAnimationManager.getAnimationManager();

            assert.isOk( manager !== undefined, 'BasicAnimationManager found' );

            var animations = manager.getAnimations();
            assert.isOk( Object.keys( animations ).length === 6, 'found 6 animations' );

            var anim = animations[ 'Default Take' ];
            var nbChannels = anim.channels.length;
            assert.isOk( nbChannels === 144, 'check number of channels in Default Take' );

            // the order of the channels is not important for this test so we simply take a random one
            var info = getChannelsInfo( anim );
            assert.isOk( info.nbChannelSyncEnd === 48, 'nb sync end channels' );
            assert.isOk( info.nbTimesEmptySlot === nbChannels, 'nb times empty slot' );
            assert.isOk( info.nbKeysEmptySlot === nbChannels, 'nb times empty slot' );

            assert.approximately( anim.duration, 1.93333, 1e-5, 'check duration of animation' );

            // test lerp-end start
            manager.setAnimationLerpEndStart( anim, 1.5 );
            assert.approximately( anim.duration, 1.93333 + 1.5, 1e-5, 'check duration of animation after lerpStartEnd' );

            manager.setAnimationLerpEndStart( anim, 1.5 );
            assert.approximately( anim.duration, 1.93333 + 1.5, 1e-5, 'check duration of animation after 2 calls to lerpStartEnd' );

            // test lerp end-start channel (additional slot should been used now)
            info = getChannelsInfo( anim );
            assert.isOk( info.nbChannelSyncEnd === 48, 'nb sync end channels' );
            assert.isOk( info.nbTimesEmptySlot === nbChannels - info.nbChannelSyncEnd, 'nb times empty slot' );
            assert.isOk( info.nbKeysEmptySlot === nbChannels - info.nbChannelSyncEnd, 'nb times empty slot' );

            // remove lerp end-start
            manager.setAnimationLerpEndStart( anim, 0 );
            assert.approximately( anim.duration, 1.93333, 1e-5, 'check duration of animation after 2 calls to lerpStartEnd' );
            info = getChannelsInfo( anim );
            assert.isOk( info.nbChannelSyncEnd === 48, 'nb sync end channels' );
            assert.isOk( info.nbTimesEmptySlot === nbChannels, 'nb times empty slot' );
            assert.isOk( info.nbKeysEmptySlot === nbChannels, 'nb times empty slot' );

            done();
        } );

    } );

};
