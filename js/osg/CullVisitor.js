/** 
 * CullVisitor traverse the tree and collect Matrix/State for the rendering traverse 
 * @class CullVisitor
 */
osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this._rootStateGraph = undefined;
    this._currentStateGraph = undefined;
    this._currentRenderBin = undefined;
    this._currentRenderStage = undefined;
    this._rootRenderStage = undefined;

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this._bbCornerNear = (~this._bbCornerFar)&7;


    // keep a matrix in memory to avoid to create matrix
    this._reserveMatrixStack = [[]];
    this._reserveMatrixStack.current = 0;

    this._reserveLeafStack = [{}];
    this._reserveLeafStack.current = 0;

    this._renderBinStack = [];
};

/** @lends osg.CullVisitor.prototype */
osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {
    distance: function(coord, matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },

    handleCullCallbacksAndTraverse: function(node) {
        var ccb = node.getCullCallback();
        if (ccb) {
            if (!ccb.cull(node, this)) {
                return;
            }
        }
        this.traverse(node);
    },

    updateCalculatedNearFar: function( matrix, drawable) {

        var bb = drawable.getBoundingBox();
        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this._bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this._bbCornerFar),matrix);
        
        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }

        if (d_near<this._computedNear) {
            this._computedNear = d_near;
        }

        if (d_far>this._computedFar) {
            this._computedFar = d_far;
        }

        return true;
    },

    clampProjectionMatrix: function(projection, znear, zfar, nearFarRatio, resultNearFar) {
        var epsilon = 1e-6;
        if (zfar<znear-epsilon) {
            osg.log("clampProjectionMatrix not applied, invalid depth range, znear = " + znear + "  zfar = " + zfar);
            return false;
        }
        
        var desired_znear, desired_zfar;
        if (zfar<znear+epsilon) {
            // znear and zfar are too close together and could cause divide by zero problems
            // late on in the clamping code, so move the znear and zfar apart.
            var average = (znear+zfar)*0.5;
            znear = average-epsilon;
            zfar = average+epsilon;
            // OSG_INFO << "_clampProjectionMatrix widening znear and zfar to "<<znear<<" "<<zfar<<std::endl;
        }

        if (Math.abs(osg.Matrix.get(projection,0,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,1,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,2,3))<epsilon ) {
            // OSG_INFO << "Orthographic matrix before clamping"<<projection<<std::endl;

            var delta_span = (zfar-znear)*0.02;
            if (delta_span<1.0) {
                delta_span = 1.0;
            }
            desired_znear = znear - delta_span;
            desired_zfar = zfar + delta_span;

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;

            osg.Matrix.set(projection,2,2, -2.0/(desired_zfar-desired_znear));
            osg.Matrix.set(projection,3,2, -(desired_zfar+desired_znear)/(desired_zfar-desired_znear));

            // OSG_INFO << "Orthographic matrix after clamping "<<projection<<std::endl;
        } else {

            // OSG_INFO << "Persepective matrix before clamping"<<projection<<std::endl;
            //std::cout << "_computed_znear"<<_computed_znear<<std::endl;
            //std::cout << "_computed_zfar"<<_computed_zfar<<std::endl;

            var zfarPushRatio = 1.02;
            var znearPullRatio = 0.98;

            //znearPullRatio = 0.99; 

            desired_znear = znear * znearPullRatio;
            desired_zfar = zfar * zfarPushRatio;

            // near plane clamping.
            var min_near_plane = zfar*nearFarRatio;
            if (desired_znear<min_near_plane) {
                desired_znear=min_near_plane;
            }

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;
            
            var m22 = osg.Matrix.get(projection,2,2);
            var m32 = osg.Matrix.get(projection,3,2);
            var m23 = osg.Matrix.get(projection,2,3);
            var m33 = osg.Matrix.get(projection,3,3);
            var trans_near_plane = (-desired_znear*m22 + m32)/(-desired_znear*m23+m33);
            var trans_far_plane = (-desired_zfar*m22+m32)/(-desired_zfar*m23+m33);

            var ratio = Math.abs(2.0/(trans_near_plane-trans_far_plane));
            var center = -(trans_near_plane+trans_far_plane)/2.0;

            var matrix = [1.0,0.0,0.0,0.0,
                          0.0,1.0,0.0,0.0,
                          0.0,0.0,ratio,0.0,
                          0.0,0.0,center*ratio,1.0];
            osg.Matrix.postMult(matrix, projection);
            // OSG_INFO << "Persepective matrix after clamping"<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    setStateGraph: function(sg) {
        this._rootStateGraph = sg;
        this._currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this._rootRenderStage = rg;
        this._currentRenderBin = rg;
    },
    reset: function () {
        //this._modelviewMatrixStack.length = 0;
        this._modelviewMatrixStack.splice(0, this._modelviewMatrixStack.length);
        //this._projectionMatrixStack.length = 0;
        this._projectionMatrixStack.splice(0, this._projectionMatrixStack.length);
        this._reserveMatrixStack.current = 0;
        this._reserveLeafStack.current = 0;

        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
    },
    getCurrentRenderBin: function() { return this._currentRenderBin; },
    setCurrentRenderBin: function(rb) { this._currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
        var matrix = this._modelviewMatrixStack[this._modelviewMatrixStack.length - 1];
        this._currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },

    pushStateSet: function (stateset) {
        this._currentStateGraph = this._currentStateGraph.findOrInsert(stateset);
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            var currentRenderBin = this._currentRenderBin;
            renderBinStack.push(currentRenderBin);
            this._currentRenderBin = currentRenderBin.getStage().findOrInsert(stateset.getBinNumber(),stateset.getBinName());
        }
    },

    /** Pop the top state set and hence associated state group.
     * Move the current state group to the parent of the popped
     * state group.
     */
    popStateSet: function () {
        var currentStateGraph = this._currentStateGraph;
        var stateset = currentStateGraph.getStateSet();
        this._currentStateGraph = currentStateGraph.parent;
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            if (renderBinStack.length === 0) {
                this._currentRenderBin = this._currentRenderBin.getStage();
            } else {
                this._currentRenderBin = renderBinStack.pop();
            }
        }
    },

    popProjectionMatrix: function () {
        if (this._computeNearFar === true && this._computedFar >= this._computedNear) {
            var m = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
            this.clampProjectionMatrix(m, this._computedNear, this._computedFar, this._nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
    },

    apply: function( node ) {
        this[node.objectType].call(this, node);
    },

    _getReservedMatrix: function() {
        var m = this._reserveMatrixStack[this._reserveMatrixStack.current++];
        if (this._reserveMatrixStack.current === this._reserveMatrixStack.length) {
            this._reserveMatrixStack.push(osg.Matrix.makeIdentity([]));
        }
        return m;
    },
    _getReservedLeaf: function() {
        var l = this._reserveLeafStack[this._reserveLeafStack.current++];
        if (this._reserveLeafStack.current === this._reserveLeafStack.length) {
            this._reserveLeafStack.push({});
        }
        return l;
    }
})));

osg.CullVisitor.prototype[osg.Camera.prototype.objectType] = function( camera ) {

    var stateset = camera.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (camera.light) {
        this.addPositionedAttribute(camera.light);
    }

    var originalModelView = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];

    var modelview = this._getReservedMatrix();
    var projection = this._getReservedMatrix();

    if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastProjectionMatrix = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
        osg.Matrix.mult(lastProjectionMatrix, camera.getProjectionMatrix(), projection);
        var lastViewMatrix = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
        osg.Matrix.mult(lastViewMatrix, camera.getViewMatrix(), modelview);
    } else {
        // absolute
        osg.Matrix.copy(camera.getViewMatrix(), modelview);
        osg.Matrix.copy(camera.getProjectionMatrix(), projection);
    }
    this.pushProjectionMatrix(projection);
    this.pushModelviewMatrix(modelview);

    if (camera.getViewport()) {
        this.pushViewport(camera.getViewport());
    }

    // save current state of the camera
    var previous_znear = this._computedNear;
    var previous_zfar = this._computedFar;
    var previous_cullsettings = new osg.CullSettings();
    previous_cullsettings.setCullSettings(this);

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;
    this.setCullSettings(camera);

    // nested camera
    if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER) {
        
        this.handleCullCallbacksAndTraverse(camera);
        
    } else {
        // not tested

        var previous_stage = this.getCurrentRenderBin().getStage();

        // use render to texture stage
        var rtts = new osg.RenderStage();
        rtts.setCamera(camera);
        rtts.setClearDepth(camera.getClearDepth());
        rtts.setClearColor(camera.getClearColor());

        rtts.setClearMask(camera.getClearMask());
        
        var vp;
        if (camera.getViewport() === undefined) {
            vp = previous_stage.getViewport();
        } else {
            vp = camera.getViewport();
        }
        rtts.setViewport(vp);
        
        // skip positional state for now
        // ...

        var previousRenderBin = this.getCurrentRenderBin();

        this.setCurrentRenderBin(rtts);

        this.handleCullCallbacksAndTraverse(camera);

        this.setCurrentRenderBin(previousRenderBin);

        if (camera.getRenderOrder() === osg.Camera.PRE_RENDER) {
            this.getCurrentRenderBin().getStage().addPreRenderStage(rtts,camera.renderOrderNum);
        } else {
            this.getCurrentRenderBin().getStage().addPostRenderStage(rtts,camera.renderOrderNum);
        }
    }

    this.popModelviewMatrix();
    this.popProjectionMatrix();

    if (camera.getViewport()) {
        this.popViewport();
    }

    // restore previous state of the camera
    this.setCullSettings(previous_cullsettings);
    this._computedNear = previous_znear;
    this._computedFar = previous_zfar;

    if (stateset) {
        this.popStateSet();
    }

};


osg.CullVisitor.prototype[osg.MatrixTransform.prototype.objectType] = function (node) {
    var matrix = this._getReservedMatrix();

    if (node.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastMatrixStack = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
        osg.Matrix.mult(lastMatrixStack, node.getMatrix(), matrix);
    } else {
        // absolute
        osg.Matrix.copy(node.getMatrix(), matrix);
    }
    this.pushModelviewMatrix(matrix);


    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }
    
    this.popModelviewMatrix();

};

osg.CullVisitor.prototype[osg.Projection.prototype.objectType] = function (node) {
    lastMatrixStack = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
    var matrix = this._getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix(), matrix);
    this.pushProjectionMatrix(matrix);

    var stateset = node.getStateSet();

    if (stateset) {
        this.pushStateSet(stateset);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }

    this.popProjectionMatrix();
};

osg.CullVisitor.prototype[osg.Node.prototype.objectType] = function (node) {

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }
    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }
};
osg.CullVisitor.prototype[osg.LightSource.prototype.objectType] = function (node) {

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    var light = node.getLight();
    if (light) {
        this.addPositionedAttribute(light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }
};

osg.CullVisitor.prototype[osg.Geometry.prototype.objectType] = function (node) {
    var modelview = this._modelviewMatrixStack[this._modelviewMatrixStack.length-1];
    var bb = node.getBoundingBox();
    if (this._computeNearFar && bb.valid()) {
        if (!this.updateCalculatedNearFar(modelview,node)) {
            return;
        }
    }

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    this.handleCullCallbacksAndTraverse(node);

    var leafs = this._currentStateGraph.leafs;
    if (leafs.length === 0) {
        this._currentRenderBin.addStateGraph(this._currentStateGraph);
    }

    var leaf = this._getReservedLeaf();
    var depth = 0;    
    if (bb.valid()) {
        depth = this.distance(bb.center(), modelview);
    }
    if (isNaN(depth)) {
        osg.warn("warning geometry has a NaN depth, " + modelview + " center " + bb.center());
    } else {
        //leaf.id = this._reserveLeafStack.current;
        leaf.parent = this._currentStateGraph;
        leaf.projection = this._projectionMatrixStack[this._projectionMatrixStack.length-1];
        leaf.geometry = node;
        leaf.modelview = modelview;
        leaf.depth = depth;
        leafs.push(leaf);
    }

    if (stateset) {
        this.popStateSet();
    }
};
