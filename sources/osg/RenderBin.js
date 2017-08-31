'use strict';
var MACROUTILS = require('osg/Utils');
var Notify = require('osg/notify');
var Object = require('osg/Object');
var osgMath = require('osg/math');
var PooledResource = require('osg/PooledResource');
var PooledArray = require('osg/PooledArray');
var PooledMap = require('osg/PooledMap');

var createPositionAttribute = function() {
    return new Array(2);
};

/**
 * RenderBin base class. Renderbin contains geometries to be rendered as a group,
 * renderbins are rendered once each.  They can improve efficiency or
 * use different rendering algorithms.
 * A renderBin can contain further renderBins producing a tree hierarchy of renderBins.
 *
 * https://github.com/openscenegraph/osg/blob/master/include/osgUtil/RenderBin#L27-L32
 */
var RenderBin = function(sortMode) {
    Object.call(this);

    this._renderStage = undefined;
    this._parent = undefined;
    this._binNum = 0;
    this._sorted = false;
    this._sortMode = sortMode !== undefined ? sortMode : RenderBin.defaultSortMode;
    this._drawCallback = undefined;
    this._leafs = [];
    this._pooledPositionedAttribute = new PooledResource(createPositionAttribute);
    this._positionedAttribute = new PooledArray();
    this._stateGraphList = new PooledArray();
    this._bins = new PooledMap();
    RenderBin.prototype.init.call(this, sortMode);
};

RenderBin.SORT_BY_STATE = 0;
RenderBin.SORT_BACK_TO_FRONT = 1;
RenderBin.SORT_FRONT_TO_BACK = 2;

// change it at runtime for default RenderBin if needed
RenderBin.defaultSortMode = RenderBin.SORT_BY_STATE;

var createRenderBin = function() {
    return new RenderBin();
};
var pooledRenderBin = new PooledResource(createRenderBin);

RenderBin.BinPrototypes = {
    RenderBin: function() {
        return pooledRenderBin.getOrCreateObject().init();
    },
    DepthSortedBin: function() {
        return pooledRenderBin.getOrCreateObject().init(RenderBin.SORT_BACK_TO_FRONT);
    }
};

var sortBackToFrontFunction = function(a, b) {
    return b._depth - a._depth;
};

var sortFrontToBackFunction = function(a, b) {
    return a._depth - b._depth;
};

var sortBinNumberFunction = function(a, b) {
    return a._binNum - b._binNum;
};

MACROUTILS.createPrototypeObject(
    RenderBin,
    MACROUTILS.objectInherit(Object.prototype, {
        init: function(sortMode) {
            this._renderStage = undefined;
            this._parent = undefined;
            this._binNum = 0;
            this._sortMode = sortMode !== undefined ? sortMode : RenderBin.defaultSortMode;
            this._drawCallback = undefined;
            RenderBin.prototype._initInternal.call(this);
            return this;
        },
        _initInternal: function() {
            this._bins.reset();
            this._stateGraphList.reset();
            this._positionedAttribute.reset();
            this._pooledPositionedAttribute.reset();
            this._leafs.length = 0;
            this._sorted = false;
        },
        _createRenderBin: function(binName) {
            // default render bin constructor
            var renderBinConstructor = RenderBin.BinPrototypes.RenderBin;

            if (binName && RenderBin.BinPrototypes[binName])
                renderBinConstructor = RenderBin.BinPrototypes[binName];

            return renderBinConstructor();
        },

        addPositionAttribute: function(m, attribute) {
            var pa = this._pooledPositionedAttribute.getOrCreateObject();
            pa[0] = m;
            pa[1] = attribute;
            this._positionedAttribute.push(pa);
        },

        getStateGraphList: function() {
            return this._stateGraphList;
        },

        getPositionedAttribute: function() {
            return this._positionedAttribute;
        },

        copyLeavesFromStateGraphListToRenderLeafList: function() {
            this._leafs.length = 0;
            var detectedNaN = false;

            var stateGraphList = this._stateGraphList.getArray();
            var stateGraphListLength = this._stateGraphList.getLength();
            for (var i = 0; i < stateGraphListLength; i++) {
                var leafs = stateGraphList[i]._leafs;
                var leafsArray = leafs.getArray();
                var leafsArrayLength = leafs.getLength();
                for (var j = 0; j < leafsArrayLength; j++) {
                    var leaf = leafsArray[j];
                    if (osgMath.isNaN(leaf._depth)) {
                        detectedNaN = true;
                    } else {
                        this._leafs.push(leaf);
                    }
                }
            }

            if (detectedNaN) {
                Notify.debug(
                    'warning: RenderBin::copyLeavesFromStateGraphListToRenderLeafList() detected NaN depth values, database may be corrupted.'
                );
            }
            // empty the render graph list to prevent it being drawn along side the render leaf list (see drawImplementation.)
            this._stateGraphList.reset();
        },

        getSortMode: function() {
            return this._sortMode;
        },

        sortBackToFront: function() {
            this.copyLeavesFromStateGraphListToRenderLeafList();
            this._leafs.sort(sortBackToFrontFunction);
        },

        sortFrontToBack: function() {
            this.copyLeavesFromStateGraphListToRenderLeafList();
            this._leafs.sort(sortFrontToBackFunction);
        },

        sortImplementation: function() {
            var SortMode = RenderBin;
            switch (this._sortMode) {
                case SortMode.SORT_BACK_TO_FRONT:
                    this.sortBackToFront();
                    break;
                case SortMode.SORT_FRONT_TO_BACK:
                    this.sortFrontToBack();
                    break;
                case SortMode.SORT_BY_STATE:
                    // do nothing
                    break;
            }
        },

        sort: function() {
            if (this._sorted) return;

            var binsKeys = this._bins.getKeys();
            var binsMap = this._bins.getMap();
            var binsKeysArray = binsKeys.getArray();
            var binsKeysArrayLength = binsKeys.getLength();
            for (var i = 0; i < binsKeysArrayLength; i++) {
                var keyBin = binsKeysArray[i];
                binsMap[keyBin].sort();
            }
            this.sortImplementation();

            this._sorted = true;
        },

        setParent: function(parent) {
            this._parent = parent;
        },

        getParent: function() {
            return this._parent;
        },

        getBinNumber: function() {
            return this._binNum;
        },

        findOrInsert: function(binNum, binName) {
            var bins = this._bins.getMap();
            var bin = bins[binNum];

            if (!bin) {
                bin = this._createRenderBin(binName);
                bin._parent = this;
                bin._binNum = binNum;
                bin._renderStage = this._renderStage;
                this._bins.set(binNum, bin);
            }
            return bin;
        },

        getStage: function() {
            return this._renderStage;
        },

        addStateGraph: function(sg) {
            this._stateGraphList.push(sg);
        },

        reset: function() {
            RenderBin.prototype._initInternal.call(this);
        },

        draw: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;
            // use callback drawImplementation if exist
            if (this._drawCallback && this._drawCallback.drawImplementation) {
                previousLeaf = this._drawCallback.drawImplementation(this, state, previousLeaf);
            } else {
                previousLeaf = this.drawImplementation(state, previousLeaf);
            }

            return previousLeaf;
        },

        applyPositionedAttribute: function(state, positionedAttributes) {
            // the idea is to set uniform 'globally' in uniform map.
            var elements = positionedAttributes.getArray();
            var length = positionedAttributes.getLength();
            for (var index = 0, l = length; index < l; index++) {
                var element = elements[index];
                // add or set uniforms in state
                var stateAttribute = element[1];
                var matrix = element[0];
                state.setGlobalDefaultAttribute(stateAttribute);
                stateAttribute.apply(state);
                stateAttribute.applyPositionedUniform(matrix, state);
                state.haveAppliedAttribute(stateAttribute);
            }
        },

        drawImplementation: function(state, previousRenderLeaf) {
            var previousLeaf = previousRenderLeaf;

            var binsArray = [];

            var bins = this._bins.getMap();
            var binsKeys = this._bins.getKeys();
            var binsKeysLength = binsKeys.getLength();
            var binsKeysArray = binsKeys.getArray();
            for (var i = 0; i < binsKeysLength; i++) {
                var keyBin = binsKeysArray[i];
                binsArray.push(bins[keyBin]);
            }
            binsArray.sort(sortBinNumberFunction);

            var current = 0;
            var end = binsArray.length;

            var bin;
            // draw pre bins
            for (; current < end; current++) {
                bin = binsArray[current];
                if (bin.getBinNumber() > 0) {
                    break;
                }
                previousLeaf = bin.draw(state, previousLeaf);
            }

            // draw leafs
            previousLeaf = this.drawLeafs(state, previousLeaf);

            // draw post bins
            for (; current < end; current++) {
                bin = binsArray[current];
                previousLeaf = bin.draw(state, previousLeaf);
            }
            return previousLeaf;
        },

        drawLeafs: function(state, previousRenderLeaf) {
            var stateList = this._stateGraphList.getArray();
            var stateListLength = this._stateGraphList.getLength();
            var leafs = this._leafs;
            var previousLeaf = previousRenderLeaf;
            var leaf;

            // draw fine grained ordering.
            for (var d = 0, dl = leafs.length; d < dl; d++) {
                leaf = leafs[d];
                leaf.render(state, previousLeaf);
                previousLeaf = leaf;
            }

            // draw coarse grained ordering.
            for (var i = 0, l = stateListLength; i < l; i++) {
                var sg = stateList[i];
                var leafArray = sg._leafs.getArray();
                var leafArrayLength = sg._leafs.getLength();
                for (var j = 0; j < leafArrayLength; j++) {
                    leaf = leafArray[j];
                    leaf.render(state, previousLeaf);
                    previousLeaf = leaf;
                }
            }
            return previousLeaf;
        }
    }),
    'osg',
    'RenderBin'
);

RenderBin.reset = function() {
    pooledRenderBin.reset();
};

module.exports = RenderBin;
