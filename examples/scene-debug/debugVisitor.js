var osg = window.OSG.osg;
var nodeListSize = 0;
var fullNodeList = [];
var nodeList = [];
var linkListSize = 0;
var linkList = [];

var DebugVisitor = function ( /* name */) {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
};

DebugVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    apply: function ( node ) {

        var nodeMatrix = '';
        if ( node.matrix ) {
            var maxSize = 0;
            var firstRowMaxSize = 0;
            for ( i = 0; i < 16; i++ ) {
                if ( ( node.matrix[ i ] + '' ).length > maxSize ) {
                    maxSize = ( node.matrix[ i ] + '' ).length;
                }
                if ( i % 4 === 0 && ( node.matrix[ i ] + '' ).length > firstRowMaxSize ) {
                    firstRowMaxSize = ( node.matrix[ i ] + '' ).length;
                }
            }
            maxSize++;
            for ( i = 0; i < 16; i++ ) {
                if ( i % 4 === 0 ) {
                    for ( j = ( node.matrix[ i ] + '' ).length; j < firstRowMaxSize; j++ ) {
                        nodeMatrix += ' ';
                    }
                } else {
                    for ( j = ( node.matrix[ i ] + '' ).length; j < maxSize; j++ ) {
                        nodeMatrix += ' ';
                    }
                }
                nodeMatrix += node.matrix[ i ];
                if ( ( i + 1 ) % 4 === 0 ) {
                    nodeMatrix += '<br />';
                }
            }
        }
        var stateset = null;
        if ( node.stateset ) {
            stateset = {
                name: 'StateSet - ' + node.getInstanceID(),
                statesetID: node.stateset.getInstanceID(),
                parentID: node.getInstanceID(),
                stateset: node.stateset,
                numTexture: node.stateset.getNumTextureAttributeLists()
            };
        }


        fullNodeList[ node.getInstanceID() ] = node;

        nodeList[ nodeListSize ] = {
            name: node.getName(),
            className: node.className(),
            instanceID: node.getInstanceID(),
            stateset: stateset,
            matrix: nodeMatrix
        };
        nodeListSize++;

        for ( var childID in node.children ) {
            linkList[ linkListSize ] = {
                parentNode: node.getInstanceID(),
                childrenNode: node.children[ childID ].getInstanceID()
            };
            linkListSize++;
        }

        this.traverse( node );
    }
} );