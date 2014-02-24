define( [
    'osg/Utils',
    'osg/Object',
    'osg/BoundingBox',
    'osg/BoundingSphere',
    'osg/StateSet',
    'osg/NodeVisitor',
    'osg/Matrix',
    'osg/ComputeMatrixFromNodePath',
    'osg/TransformEnums'
], function ( MACROUTILS, Object, BoundingBox, BoundingSphere, StateSet, NodeVisitor, Matrix, ComputeMatrixFromNodePath, TransformEnums ) {

        /**
     *  Node that can contains child node
     *  @class Node
     */
    var Node = function () {
        Object.call( this );

        this.children = [];
        this.parents = [];
        /*jshint bitwise: false */
        this.nodeMask = ~0;
        /*jshint bitwise: true */

        this.boundingSphere = new BoundingSphere();
        this.boundingSphereComputed = false;
        this._updateCallbacks = [];
        this._cullCallback = undefined;
    };

    /** @lends Node.prototype */
    Node.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Object.prototype, {
        /**
        Return StateSet and create it if it does not exist yet
        @type StateSet
     */
        getOrCreateStateSet: function () {
            if ( this.stateset === undefined ) {
                this.stateset = new StateSet();
            }
            return this.stateset;
        },
        getStateSet: function () {
            return this.stateset;
        },
        accept: function ( nv ) {
            if ( nv.validNodeMask( this ) ) {
                nv.pushOntoNodePath( this );
                nv.apply( this );
                nv.popFromNodePath();
            }
        },
        dirtyBound: function () {
            if ( this.boundingSphereComputed === true ) {
                this.boundingSphereComputed = false;
                for ( var i = 0, l = this.parents.length; i < l; i++ ) {
                    this.parents[ i ].dirtyBound();
                }
            }
        },
        setNodeMask: function ( mask ) {
            this.nodeMask = mask;
        },
        getNodeMask: function ( ) {
            return this.nodeMask;
        },
        setStateSet: function ( s ) {
            this.stateset = s;
        },

        /**
       <p>
        Set update node callback, called during update traversal.
        The Object must have the following method
        update(node, nodeVisitor) {}
        note, callback is responsible for scenegraph traversal so
        they must call traverse(node,nv) to ensure that the
        scene graph subtree (and associated callbacks) are traversed.
        </p>
        <p>
        Here a dummy UpdateCallback example
        </p>
        @example
        var DummyUpdateCallback = function() {};
        DummyUpdateCallback.prototype = {
            update: function(node, nodeVisitor) {
                return true;
            }
        };

        @param Oject callback
     */
        setUpdateCallback: function ( cb ) {
            this._updateCallbacks[ 0 ] = cb;
        },
        /** Get update node callback, called during update traversal.
        @type Oject
     */
        getUpdateCallback: function () {
            return this._updateCallbacks[ 0 ];
        },

        addUpdateCallback: function ( cb ) {
            this._updateCallbacks.push( cb );
        },
        removeUpdateCallback: function ( cb ) {
            var arrayIdx = this._updateCallbacks.indexOf( cb );
            if ( arrayIdx !== -1 )
                this._updateCallbacks.splice( arrayIdx, 1 );
        },
        getUpdateCallbackList: function () {
            return this._updateCallbacks;
        },


        /**
       <p>
        Set cull node callback, called during cull traversal.
        The Object must have the following method
        cull(node, nodeVisitor) {}
        note, callback is responsible for scenegraph traversal so
        they must return true to traverse.
        </p>
        <p>
        Here a dummy CullCallback example
        </p>
        @example
        var DummyCullCallback = function() {};
        DummyCullCallback.prototype = {
            cull: function(node, nodeVisitor) {
                return true;
            }
        };

        @param Oject callback
     */
        setCullCallback: function ( cb ) {
            this._cullCallback = cb;
        },
        getCullCallback: function () {
            return this._cullCallback;
        },

        hasChild: function ( child ) {
            for ( var i = 0, l = this.children.length; i < l; i++ ) {
                if ( this.children[ i ] === child ) {
                    return true;
                }
            }
            return false;
        },
        addChild: function ( child ) {
            var c = this.children.push( child );
            child.addParent( this );
            this.dirtyBound();
            return c;
        },
        getChildren: function () {
            return this.children;
        },
        getParents: function () {
            return this.parents;
        },
        addParent: function ( parent ) {
            this.parents.push( parent );
        },
        removeParent: function ( parent ) {
            for ( var i = 0, l = this.parents.length, parents = this.parents; i < l; i++ ) {
                if ( parents[ i ] === parent ) {
                    parents.splice( i, 1 );
                    return;
                }
            }
        },
        removeChildren: function () {
            var children = this.children;
            if ( children.length !== 0 ) {
                for ( var i = 0, l = children.length; i < l; i++ ) {
                    children[ i ].removeParent( this );
                }
                children.length = 0;
                this.dirtyBound();
            }
        },

        // preserve order
        removeChild: function ( child ) {
            var children = this.children;
            for ( var i = 0, l = children.length; i < l; i++ ) {
                if ( children[ i ] === child ) {
                    child.removeParent( this );
                    children.splice( i, 1 );
                    i--;
                    l--;
                    this.dirtyBound();
                }
            }
        },

        traverse: function ( visitor ) {
            for ( var i = 0, l = this.children.length; i < l; i++ ) {
                var child = this.children[ i ];
                child.accept( visitor );
            }
        },

        ascend: function ( visitor ) {
            for ( var i = 0, l = this.parents.length; i < l; i++ ) {
                var parent = this.parents[ i ];
                parent.accept( visitor );
            }
        },

        getBound: function () {
            if ( !this.boundingSphereComputed ) {
                this.computeBound( this.boundingSphere );
                this.boundingSphereComputed = true;
            }
            return this.boundingSphere;
        },

        computeBound: function ( bsphere ) {
            var bb = new BoundingBox();
            bb.init();
            bsphere.init();
            for ( var i = 0, l = this.children.length; i < l; i++ ) {
                var child = this.children[ i ];
                if ( child.referenceFrame === undefined || child.referenceFrame === TransformEnums.RELATIVE_RF ) {
                    bb.expandBySphere( child.getBound() );
                }
            }
            if ( !bb.valid() ) {
                return bsphere;
            }
            bsphere._center = bb.center();
            bsphere._radius = 0.0;
            for ( var j = 0, l2 = this.children.length; j < l2; j++ ) {
                var cc = this.children[ j ];
                if ( cc.referenceFrame === undefined || cc.referenceFrame === TransformEnums.RELATIVE_RF ) {
                    bsphere.expandRadiusBySphere( cc.getBound() );
                }
            }

            return bsphere;
        },

        getWorldMatrices: function ( halt ) {
            var CollectParentPaths = function ( halt ) {
                this.nodePaths = [];
                this.halt = halt;
                NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
            };
            CollectParentPaths.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node.parents.length === 0 || node === this.halt ) {
                        // copy
                        this.nodePaths.push( this.nodePath.slice( 0 ) );
                    } else {
                        this.traverse( node );
                    }
                }
            } );
            var collected = new CollectParentPaths( halt );
            this.accept( collected );
            var matrixList = [];

            for ( var i = 0, l = collected.nodePaths.length; i < l; i++ ) {
                var np = collected.nodePaths[ i ];
                if ( np.length === 0 ) {
                    matrixList.push( Matrix.makeIdentity( [] ) );
                } else {
                    matrixList.push( ComputeMatrixFromNodePath.computeLocalToWorld( np ) );
                }
            }
            return matrixList;
        }


    } ), 'osg', 'Node' );
    MACROUTILS.setTypeID( Node );

    return Node;
} );
