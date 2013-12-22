define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/FrameStamp'
], function ( MACROUTILS, NodeVisitor, FrameStamp ) {

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
    UpdateVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
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
