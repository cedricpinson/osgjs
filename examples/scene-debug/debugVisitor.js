var osg = window.OSG.osg;

var DebugVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );

    this._nodeListSize = 0;
    this._fullNodeList = [];
    this._nodeList = [];
    this._linkListSize = 0;
    this._linkList = [];
};

DebugVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {

    apply: function ( node ) {

        if ( this._fullNodeList[ node.getInstanceID() ] !== node ) {

            var nodeMatrix = '';
            if ( node.matrix ) {
                nodeMatrix = this.createMatrixGrid( node, nodeMatrix );
            }
            var stateset = null;
            if ( node.stateset ) {
                stateset = this.createStateset( node, stateset );
            }

            this._fullNodeList[ node.getInstanceID() ] = node;

            this._nodeList[ this._nodeListSize ] = {
                name: node.getName(),
                className: node.className(),
                instanceID: node.getInstanceID(),
                stateset: stateset,
                matrix: nodeMatrix
            };
            this._nodeListSize++;

        }

        var keys = Object.keys( node.children );
        if ( keys.length > 0 ) {
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                this._linkList[ this._linkListSize ] = {
                    parentNode: node.getInstanceID(),
                    childrenNode: node.children[ key ].getInstanceID()
                };
                this._linkListSize++;
            }
        }

        this.traverse( node );
    },

    reset: function () {
        this._nodeListSize = 0;
        this._fullNodeList = [];
        this._nodeList = [];
        this._linkListSize = 0;
        this._linkList = [];
    },

    // Create a good sized array to display the matrix
    createMatrixGrid: function ( node, nodeMatrix ) {
        var maxSize = 0;
        var firstRowMaxSize = 0;
        var i;
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
            var j;
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
        return nodeMatrix;
    },

    // Get the stateset and create the stateset display structure
    createStateset: function ( node, stateset ) {
        stateset = {
            name: 'StateSet - ' + node.getInstanceID(),
            statesetID: node.stateset.getInstanceID(),
            parentID: node.getInstanceID(),
            stateset: node.stateset,
            numTexture: node.stateset.getNumTextureAttributeLists()
        };
        return stateset;
    },

    getNodeListSize: function () {
        return this._nodeListSize;
    },

    getFullNodeList: function () {
        return this._fullNodeList;
    },

    getNodeList: function () {
        return this._nodeList;
    },

    getLinkListSize: function () {
        return this._linkListSize;
    },

    getLinkList: function () {
        return this._linkList;
    }

} );
