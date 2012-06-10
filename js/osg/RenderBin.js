osg.RenderBin = function () {
    this._leafs = [];
    this.positionedAttribute = [];
    this._renderStage = undefined;
    this._bins = {};
    this.stateGraphList = [];
    this._parent = undefined;
    this._binNum = 0;

    this._sorted = false;
    this._sortMode = osg.RenderBin.SORT_BY_STATE;

};
osg.RenderBin.SORT_BY_STATE = 0;
osg.RenderBin.SORT_BACK_TO_FRONT = 1;
osg.RenderBin.BinPrototypes = {
    RenderBin: function() {
        return new osg.RenderBin();
    },
    DepthSortedBin: function() {
        var rb = new osg.RenderBin();
        rb._sortMode = osg.RenderBin.SORT_BACK_TO_FRONT;
        return rb;
    }
};

osg.RenderBin.prototype = {
    _createRenderBin: function(binName) {
        if (binName === undefined || osg.RenderBin.BinPrototypes[binName] === undefined) {
            return osg.RenderBin.BinPrototypes.RenderBin();
        }
        return osg.RenderBin.BinPrototypes[binName]();
    },
    getStateGraphList: function() { return this.stateGraphList; },
    copyLeavesFromStateGraphListToRenderLeafList: function() {

        this._leafs.splice(0, this._leafs.length);
        var detectedNaN = false;

        for (var i = 0, l = this.stateGraphList.length; i < l; i++) {
            var leafs = this.stateGraphList[i].leafs;
            for (var j = 0, k = leafs.length; j < k; j++) {
                var leaf = leafs[j];
                if (isNaN(leaf.depth)) {
                    detectedNaN = true;
                } else {
                    this._leafs.push(leaf);
                }
            }
        }

        if (detectedNaN) {
            osg.debug("warning: RenderBin::copyLeavesFromStateGraphListToRenderLeafList() detected NaN depth values, database may be corrupted.");
        }        
        // empty the render graph list to prevent it being drawn along side the render leaf list (see drawImplementation.)
        this.stateGraphList.splice(0, this.stateGraphList.length);
    },
    
    sortBackToFront: function() {
        this.copyLeavesFromStateGraphListToRenderLeafList();
        var cmp = function(a, b) {
            return b.depth - a.depth;
        };
        this._leafs.sort(cmp);
    },

    sortImplementation: function() {
        var SortMode = osg.RenderBin;
        switch(this._sortMode) {
        case SortMode.SORT_BACK_TO_FRONT:
            this.sortBackToFront();
            break;
        case SortMode.SORT_BY_STATE:
            // do nothing
            break;
        }
    },

    sort: function() {
        if (this._sorted) {
            return;
        }

        var bins = this._bins;
        var keys = Object.keys(bins);
        for (var i = 0, l = keys.length; i < l; i++) {
            bins[keys[i]].sort();
        }
        this.sortImplementation();

        _sorted = true;
    },

    setParent: function(parent) { this._parent = parent; },
    getParent: function() { return this._parent; },
    getBinNumber: function() { return this._binNum; },
    findOrInsert: function(binNum, binName) {
        var bin = this._bins[binNum];
        if (bin === undefined) {
            bin = this._createRenderBin(binName);
            bin._parent = this;
            bin._binNum = binNum;
            bin._renderStage = this._renderStage;
            this._bins[binNum] = bin;
        }
        return bin;
    },
    getStage: function() { return this._renderStage; },
    addStateGraph: function(sg) { this.stateGraphList.push(sg); },
    reset: function() {
        this.stateGraphList.length = 0;
        this._bins = {};
        this.positionedAttribute.length = 0;
        this._leafs.length = 0;
        this._sorted = false;
    },
    applyPositionedAttribute: function(state, positionedAttibutes) {
        // the idea is to set uniform 'globally' in uniform map.
        for (var index = 0, l = positionedAttibutes.length; index < l; index++) {
            var element = positionedAttibutes[index];
            // add or set uniforms in state
            var stateAttribute = element[1];
            var matrix = element[0];
            state.setGlobalDefaultValue(stateAttribute);
            stateAttribute.apply(state);
            stateAttribute.applyPositionedUniform(matrix, state);
            state.haveAppliedAttribute(stateAttribute);
        }
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        var binsKeys = Object.keys(this._bins);
        var bins = this._bins;
        var binsArray = [];
        for (var i = 0, l = binsKeys.length; i < l; i++) {
            var k = binsKeys[i];
            binsArray.push(bins[k]);
        }
        var cmp = function(a, b) {
            return a._binNum - b._binNum;
        };
        binsArray.sort(cmp);

        var current = 0;
        var end = binsArray.length;

        var bin;
        // draw pre bins
        for (; current < end; current++) {
            bin = binsArray[current];
            if (bin.getBinNumber() > 0) {
                break;
            }
            previous = bin.drawImplementation(state, previous);
        }
        
        // draw leafs
        previous = this.drawLeafs(state, previous);

        // draw post bins
        for (; current < end; current++) {
            bin = binsArray[current];
            previous = bin.drawImplementation(state, previous);
        }
        return previous;
    },

    drawLeafs: function(state, previousRenderLeaf) {

        var stateList = this.stateGraphList;
        var leafs = this._leafs;
        var normalUniform;
        var modelViewUniform;
        var projectionUniform;
        var program;
        var stateset;
        var previousLeaf = previousRenderLeaf;
        var normal = [];
        var normalTranspose = [];

        var Matrix = osg.Matrix;

        if (previousLeaf) {
            osg.StateGraph.prototype.moveToRootStateGraph(state, previousRenderLeaf.parent);
        }

        var leaf, push;
        var prev_rg, prev_rg_parent, rg;

        // draw fine grained ordering.
        for (var d = 0, dl = leafs.length; d < dl; d++) {
            leaf = leafs[d];
            push = false;
            if (previousLeaf !== undefined) {

                // apply state if required.
                prev_rg = previousLeaf.parent;
                prev_rg_parent = prev_rg.parent;
                rg = leaf.parent;
                if (prev_rg_parent !== rg.parent)
                {
                    rg.moveStateGraph(state, prev_rg_parent, rg.parent);

                    // send state changes and matrix changes to OpenGL.
                    state.pushStateSet(rg.stateset);
                    push = true;
                }
                else if (rg !== prev_rg)
                {
                    // send state changes and matrix changes to OpenGL.
                    state.pushStateSet(rg.stateset);
                    push = true;
                }

            } else {
                leaf.parent.moveStateGraph(state, undefined, leaf.parent.parent);
                state.pushStateSet(leaf.parent.stateset);
                push = true;
            }

            if (push === true) {
                //state.pushGeneratedProgram();
                state.apply();
                program = state.getLastProgramApplied();

                modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
                projectionUniform = program.uniformsCache[state.projectionMatrix.name];
                normalUniform = program.uniformsCache[state.normalMatrix.name];
            }


            if (modelViewUniform !== undefined) {
                state.modelViewMatrix.set(leaf.modelview);
                state.modelViewMatrix.apply(modelViewUniform);
            }
            if (projectionUniform !== undefined) {
                state.projectionMatrix.set(leaf.projection);
                state.projectionMatrix.apply(projectionUniform);
            }
            if (normalUniform !== undefined) {
                Matrix.copy(leaf.modelview, normal);
                //Matrix.setTrans(normal, 0, 0, 0);
                normal[12] = 0;
                normal[13] = 0;
                normal[14] = 0;

                Matrix.inverse(normal, normal);
                Matrix.transpose(normal, normal);
                state.normalMatrix.set(normal);
                state.normalMatrix.apply(normalUniform);
            }

            leaf.geometry.drawImplementation(state);

            if (push === true) {
                state.popGeneratedProgram();
                state.popStateSet();
            }

            previousLeaf = leaf;
        }

        
        // draw coarse grained ordering.
        for (var i = 0, l = stateList.length; i < l; i++) {
            var sg = stateList[i];
            for (var j = 0, ll = sg.leafs.length; j < ll; j++) {

                leaf = sg.leafs[j];
                push = false;
                if (previousLeaf !== undefined) {

                    // apply state if required.
                    prev_rg = previousLeaf.parent;
                    prev_rg_parent = prev_rg.parent;
                    rg = leaf.parent;
                    if (prev_rg_parent !== rg.parent)
                    {
                        rg.moveStateGraph(state, prev_rg_parent, rg.parent);

                        // send state changes and matrix changes to OpenGL.
                        state.pushStateSet(rg.stateset);
                        push = true;
                    }
                    else if (rg !== prev_rg)
                    {
                        // send state changes and matrix changes to OpenGL.
                        state.pushStateSet(rg.stateset);
                        push = true;
                    }

                } else {
                    leaf.parent.moveStateGraph(state, undefined, leaf.parent.parent);
                    state.pushStateSet(leaf.parent.stateset);
                    push = true;
                }

                if (push === true) {
                    //state.pushGeneratedProgram();
                    state.apply();
                    program = state.getLastProgramApplied();

                    modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
                    projectionUniform = program.uniformsCache[state.projectionMatrix.name];
                    normalUniform = program.uniformsCache[state.normalMatrix.name];
                }


                if (modelViewUniform !== undefined) {
                    state.modelViewMatrix.set(leaf.modelview);
                    state.modelViewMatrix.apply(modelViewUniform);
                }
                if (projectionUniform !== undefined) {
                    state.projectionMatrix.set(leaf.projection);
                    state.projectionMatrix.apply(projectionUniform);
                }
                if (normalUniform !== undefined) {
                    Matrix.copy(leaf.modelview, normal);
                    //Matrix.setTrans(normal, 0, 0, 0);
                    normal[12] = 0;
                    normal[13] = 0;
                    normal[14] = 0;

                    Matrix.inverse(normal, normal);
                    Matrix.transpose(normal, normal);
                    state.normalMatrix.set(normal);
                    state.normalMatrix.apply(normalUniform);
                }

                leaf.geometry.drawImplementation(state);

                if (push === true) {
                    state.popGeneratedProgram();
                    state.popStateSet();
                }

                previousLeaf = leaf;
            }
        }
        return previousLeaf;
    }
};
