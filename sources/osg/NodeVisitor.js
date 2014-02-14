define( [], function () {

    var NodeVisitor = function ( traversalMode ) {
        /*jshint bitwise: false */
        this.traversalMask = ~0x0;
        /*jshint bitwise: true */
        this.nodeMaskOverride = 0;
        this.traversalMode = traversalMode;
        if ( traversalMode === undefined ) {
            this.traversalMode = NodeVisitor.TRAVERSE_ALL_CHILDREN;
        }
        this.nodePath = [];
    };
    //NodeVisitor.TRAVERSE_NONE = 0;
    NodeVisitor.TRAVERSE_PARENTS = 1;
    NodeVisitor.TRAVERSE_ALL_CHILDREN = 2;
    NodeVisitor.TRAVERSE_ACTIVE_CHILDREN = 3;
    NodeVisitor._traversalFunctions = {};
    NodeVisitor._traversalFunctions[ NodeVisitor.TRAVERSE_PARENTS ] = function ( node ) {
        node.ascend( this );
    };
    NodeVisitor._traversalFunctions[ NodeVisitor.TRAVERSE_ALL_CHILDREN ] = function ( node ) {
        node.traverse( this );
    };
	NodeVisitor._traversalFunctions[ NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ] = function ( node ) {
        node.traverse( this );
    };
	
	
    NodeVisitor._pushOntoNodePath = {};
    NodeVisitor._pushOntoNodePath[ NodeVisitor.TRAVERSE_PARENTS ] = function ( node ) {
        this.nodePath.unshift( node );
    };
    NodeVisitor._pushOntoNodePath[ NodeVisitor.TRAVERSE_ALL_CHILDREN ] = function ( node ) {
        this.nodePath.push( node );
    };
	NodeVisitor._pushOntoNodePath[ NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ] = function ( node ) {
        this.nodePath.push( node );
    };
    NodeVisitor._popFromNodePath = {};
    NodeVisitor._popFromNodePath[ NodeVisitor.TRAVERSE_PARENTS ] = function () {
        return this.nodePath.shift();
    };
    NodeVisitor._popFromNodePath[ NodeVisitor.TRAVERSE_ALL_CHILDREN ] = function () {
        this.nodePath.pop();
    };
	NodeVisitor._popFromNodePath[ NodeVisitor.TRAVERSE_ACTIVE_CHILDREN ] = function () {
        this.nodePath.pop();
    };

    NodeVisitor.prototype = {
        setNodeMaskOverride: function ( m ) {
            this.nodeMaskOverride = m;
        },
        getNodeMaskOverride: function () {
            return this.nodeMaskOverride;
        },

        setTraversalMask: function ( m ) {
            this.traversalMask = m;
        },
        getTraversalMask: function () {
            return this.traversalMask;
        },

        pushOntoNodePath: function ( node ) {
            NodeVisitor._pushOntoNodePath[ this.traversalMode ].call( this, node );
        },
        popFromNodePath: function () {
            NodeVisitor._popFromNodePath[ this.traversalMode ].call( this );
        },
        validNodeMask: function ( node ) {
            var nm = node.getNodeMask();
            /*jshint bitwise: false */
            return ( ( this.traversalMask & ( this.nodeMaskOverride | nm ) ) !== 0 );
            /*jshint bitwise: true */
        },
        apply: function ( node ) {
            this.traverse( node );
        },
        traverse: function ( node ) {
            NodeVisitor._traversalFunctions[ this.traversalMode ].call( this, node );
        }
    };

    return NodeVisitor;
} );
