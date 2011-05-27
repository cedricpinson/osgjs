osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this.rootStateGraph = undefined;
    this.currentStateGraph = undefined;
    this.currentRenderBin = undefined;
    this.currentRenderStage = undefined;
    this.rootRenderStage = undefined;

    this.computeNearFar = true;
    this.computedNear = Number.POSITIVE_INFINITY;
    this.computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;


    // keep a matrix in memory to avoid to create matrix
    this.reserveMatrixStack = [[]];
    this.reserveMatrixStack.current = 0;

    this.reserveLeafStack = [{}];
    this.reserveLeafStack.current = 0;
};

osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {
    distance: function(coord,matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },
    updateCalculatedNearFar: function( matrix, drawable) {

        var bb = drawable.getBoundingBox();
        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this.bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this.bbCornerFar),matrix);
        
        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }

        if (d_near<this.computedNear) {
            this.computedNear = d_near;
        }

        if (d_far>this.computedFar) {
            this.computedFar = d_far;
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
        this.rootStateGraph = sg;
        this.currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this.rootRenderStage = rg;
        this.currentRenderBin = rg;
    },
    reset: function () {
        this.modelviewMatrixStack.length = 1;
        this.projectionMatrixStack.length = 1;
        this.reserveMatrixStack.current = 0;
        this.reserveLeafStack.current = 0;
    },
    getCurrentRenderBin: function() { return this.currentRenderBin; },
    setCurrentRenderBin: function(rb) { this.currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
        var matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length - 1];
        this.currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },
    pushStateSet: function (stateset) {
        this.currentStateGraph = this.currentStateGraph.findOrInsert(stateset);
    },
    popStateSet: function () {
        this.currentStateGraph = this.currentStateGraph.parent;
    },

    popProjectionMatrix: function () {
        if (this.computeNearFar === true && this.computedFar >= this.computedNear) {
            var m = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
            this.clampProjectionMatrix(m, this.computedNear, this.computedFar, this.nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
    },

    apply: function( node ) {
        this[node.objectType].call(this, node);
    },

    getReservedMatrix: function() {
        var m = this.reserveMatrixStack[this.reserveMatrixStack.current++];
        if (this.reserveMatrixStack.current === this.reserveMatrixStack.length) {
            this.reserveMatrixStack.push(osg.Matrix.makeIdentity());
        }
        return m;
    },
    getReservedLeaf: function() {
        var l = this.reserveLeafStack[this.reserveLeafStack.current++];
        if (this.reserveLeafStack.current === this.reserveLeafStack.length) {
            this.reserveLeafStack.push({});
        }
        return l;
    }
})));

osg.CullVisitor.prototype[osg.Camera.prototype.objectType] = function( camera ) {
    if (camera.stateset) {
        this.pushStateSet(camera.stateset);
    }

    if (camera.light) {
        this.addPositionedAttribute(camera.light);
    }

    var originalModelView = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];

    var modelview = this.getReservedMatrix();
    var projection = this.getReservedMatrix();

    if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastProjectionMatrix = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
        osg.Matrix.mult(lastProjectionMatrix, camera.getProjectionMatrix(), projection);
        var lastViewMatrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
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
    var previous_znear = this.computedNear;
    var previous_zfar = this.computedFar;
    var previous_cullsettings = new osg.CullSettings();
    previous_cullsettings.setCullSettings(this);

    this.computedNear = Number.POSITIVE_INFINITY;
    this.computedFar = Number.NEGATIVE_INFINITY;
    this.setCullSettings(camera);

    // nested camera
    if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER) {
        
        if (camera.traverse) {
            this.traverse(camera);
        }
        
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

        if (camera.traverse) {
            camera.traverse(this);
        }

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
    this.computedNear = previous_znear;
    this.computedFar = previous_zfar;

    if (camera.stateset) {
        this.popStateSet();
    }

};


osg.CullVisitor.prototype[osg.MatrixTransform.prototype.objectType] = function (node) {

    var lastMatrixStack = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];

    var matrix = this.getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getMatrix(), matrix);
    this.pushModelviewMatrix(matrix);

    if (node.stateset) {
        this.pushStateSet(node.stateset);
    }

    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (node.stateset) {
        this.popStateSet();
    }
    
    this.popModelviewMatrix();

};

osg.CullVisitor.prototype[osg.Projection.prototype.objectType] = function (node) {
    lastMatrixStack = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
    var matrix = this.getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix(), matrix);
    this.pushProjectionMatrix(matrix);

    if (node.stateset) {
        this.pushStateSet(node.stateset);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (node.stateset) {
        this.popStateSet();
    }

    this.popProjectionMatrix();
};

osg.CullVisitor.prototype[osg.Node.prototype.objectType] = function (node) {

    if (node.stateset) {
        this.pushStateSet(node.stateset);
    }
    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (node.stateset) {
        this.popStateSet();
    }
};
osg.CullVisitor.prototype[osg.Geometry.prototype.objectType] = function (node) {
    matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
    var bb = node.getBoundingBox();
    if (this.computeNearFar && bb.valid()) {
        if (!this.updateCalculatedNearFar(matrix,node)) {
            return;
        }
    }

    if (node.stateset) {
        this.pushStateSet(node.stateset);
    }

    var leafs = this.currentStateGraph.leafs;
    if (leafs.length === 0) {
        this.currentRenderBin.addStateGraph(this.currentStateGraph);
    }

    var leaf = this.getReservedLeaf();
    leaf.parent = this.currentStateGraph;
    leaf.modelview = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
    leaf.projection = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
    leaf.geometry = node;
    leafs.push(leaf);

    if (node.stateset) {
        this.popStateSet();
    }
};
