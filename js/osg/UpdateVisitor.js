/*global define */

define( [
    'osg/osg',
    'osg/NodeVisitor',
    'osg/FrameStamp'
], function ( osg, NodeVisitor, FrameStamp ) {

    var UpdateVisitor = function () {
        NodeVisitor.call( this );
        var framestamp = new FrameStamp();
        this.getFrameStamp = function () {
            return framestamp;
        };
        this.setFrameStamp = function ( s ) {
            framestamp = s;
        };
    };
    UpdateVisitor.prototype = osg.objectInehrit( NodeVisitor.prototype, {
        apply: function ( node ) {
            var ncs = node.getUpdateCallbackList();
            for ( var i = 0; i < ncs.length; i++ ) {
                if ( !ncs[ i ].update( node, this ) ) {
                    return;
                }
            }
            this.traverse( node );
        }
    } );

    return UpdateVisitor;
} );