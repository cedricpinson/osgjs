/** 
 *  Node that can contains child node
 *  @class
 */
osg.Node = function () {
    this.children = [];
    this.parents = [];
    this.nodeMask = ~0;
    this.boundingSphere = new osg.BoundingSphere();
    this.boundingSphereComputed = false;
};

/** @lends osg.Node.prototype */
osg.Node.prototype = {
    /**
        Return StateSet and create it if it does not exist yet
        @type osg.StateSet
     */
    getOrCreateStateSet: function() {
        if (this.stateset === undefined) {
            this.stateset = new osg.StateSet();
        }
        return this.stateset;
    },
    getStateSet: function() { return this.stateset; },
    accept: function(nv) { 
        if (nv.validNodeMask(this)) {
            nv.pushOntoNodePath(this);
            nv.apply(this);
            nv.popFromNodePath();
        }
    },
    dirtyBound: function() {
        if (this.boundingSphereComputed === true) {
            this.boundingSphereComputed = false;
            for (var i = 0, l = this.parents.length; i < l; i++) {
                this.parents[i].dirtyBound();
            }
        }
    },
    setNodeMask: function(mask) { this.nodeMask = mask; },
    getNodeMask: function(mask) { return this.nodeMask; },
    setStateSet: function(s) { this.stateset = s; },

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
                node.traverse(nodeVisitor);
            }
        };

        @param Oject callback
     */
    setUpdateCallback: function(cb) { this.updateCallback = cb; },
    /** Get update node callback, called during update traversal.
        @type Oject
     */
    getUpdateCallback: function() { return this.updateCallback; },
    setName: function(name) { this.name = name; },
    getName: function() { return this.name; },
    hasChild: function(child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                return true;
            }
        }
        return false;
    },
    addChild: function (child) {
	var c =  this.children.push(child);
        child.addParent(this);
	this.dirtyBound();
	return c;
    },
    getChildren: function() { return this.children; },
    addParent: function( parent) {
        this.parents.push(parent);
    },
    removeParent: function(parent) {
        for (var i = 0, l = this.parents.length, parents = this.parents; i < l; i++) {
            if (parents[i] === parent) {
                parents.splice(i, 1);
                return;
            }
        }
    },
    removeChildren: function () {
        var children = this.children;
        if (children.length !== 0) {
            for (var i = 0, l = children.length; i < l; i++) {
                children[i].removeParent(this);
            }
	    this.children.length = 0;
	    this.dirtyBound();
        }
    },

    // preserve order
    removeChild: function (child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                child.removeParent(this);
                this.children.splice(i, 1);
	        this.dirtyBound();
            }
        }
    },

    traverse: function (visitor) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            var child = this.children[i];
            child.accept(visitor);
        }
    },

    ascend: function (visitor) {
        for (var i = 0, l = this.parents.length; i < l; i++) {
            var parent = this.parents[i];
            parent.accept(visitor);
        }
    },

    getBound: function() {
        if(!this.boundingSphereComputed) {
            this.computeBound(this.boundingSphere);
            this.boundingSphereComputed = true;
        }
        return this.boundingSphere;
    },

    computeBound: function (bsphere) {
        var bb = new osg.BoundingBox();
        bb.init();
        bsphere.init();
	for (var i = 0, l = this.children.length; i < l; i++) {
	    var child = this.children[i];
            if (child.referenceFrame === undefined || child.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bb.expandBySphere(child.getBound());
            }
	}
        if (!bb.valid()) {
            return bsphere;
        }
        bsphere._center = bb.center();
        bsphere._radius = 0.0;
	for (var j = 0, l2 = this.children.length; j < l2; j++) {
	    var cc = this.children[j];
            if (cc.referenceFrame === undefined || cc.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bsphere.expandRadiusBySphere(cc.getBound());
            }
	}
            
	return bsphere;
    },

    getWorldMatrices: function(halt) {
        var CollectParentPaths = function(halt) {
            this.nodePaths = [];
            this.halt = halt;
            osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_PARENTS);
        };
        CollectParentPaths.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
            apply: function(node) {
                if (node.parents.length === 0 || node === this.halt) {
                    // copy
                    this.nodePaths.push(this.nodePath.slice(0));
                } else {
                    this.traverse(node);
                }
            }
        });
        var collected = new CollectParentPaths(halt);
        this.accept(collected);
        var matrixList = [];

        for(var i = 0, l = collected.nodePaths.length; i < l; i++) {
            var np = collected.nodePaths[i];
            if (np.length === 0) {
                matrixList.push(osg.Matrix.makeIdentity());
            } else {
                matrixList.push(osg.computeLocalToWorld(np));
            }
        }
        return matrixList;
    }
    

};
osg.Node.prototype.objectType = osg.objectType.generate("Node");
