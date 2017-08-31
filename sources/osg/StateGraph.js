'use strict';
var MACROUTILS = require('osg/Utils');
var PooledArray = require('osg/PooledArray');
var PooledMap = require('osg/PooledMap');
var PooledResource = require('osg/PooledResource');

var StateGraph = function() {
    this._depth = 0;
    this._children = new PooledMap();
    this._leafs = new PooledArray();
    this._stateset = undefined;
    this._parent = undefined;
};

var createStateGraph = function() {
    return new StateGraph();
};

StateGraph.pooledStateGraph = new PooledResource(createStateGraph);
StateGraph.statsNbMoveStateGraph = 0;

StateGraph.reset = function() {
    StateGraph.pooledStateGraph.reset();
    StateGraph.statsNbMoveStateGraph = 0;
};

MACROUTILS.createPrototypeObject(
    StateGraph,
    {
        clean: function() {
            this._leafs.reset();
            this._children.reset();
            this._depth = 0;
            this._stateset = undefined;
            this._parent = undefined;
        },
        getStateSet: function() {
            return this._stateset;
        },
        getLeafs: function() {
            return this._leafs;
        },
        getParent: function() {
            return this._parent;
        },
        findOrInsert: function(stateset) {
            // nb call per frame as example: 22 (shadowmap) 55 (pbr) to 512 (performance)
            // it's called by node that have a stateSet
            var stateSetID = stateset.getInstanceID();
            var childrenMap = this._children.getMap();
            var sg = childrenMap[stateSetID];
            if (!sg) {
                sg = StateGraph.pooledStateGraph.getOrCreateObject();
                sg.clean();

                sg._parent = this;
                sg._depth = this._depth + 1;
                sg._stateset = stateset;
                this._children.set(stateSetID, sg);
            }

            return sg;
        }
    },
    'osg',
    'StateGraph'
);

StateGraph.moveStateGraph = (function() {
    var stack = new PooledArray();
    var stackArray = stack.getArray();
    return function(state, sgCurrentArg, sgNewArg) {
        StateGraph.statsNbMoveStateGraph++;
        // nb call per frame: 3 (pbr) 10 (shadowmap) 1(performance)

        stack.reset();
        var sgNew = sgNewArg;
        var sgCurrent = sgCurrentArg;
        var i, l;
        if (sgNew === sgCurrent || sgNew === undefined) return;

        if (sgCurrent === undefined) {
            // push stateset from sgNew to root, and apply
            // stateset from root to sgNew
            do {
                if (sgNew._stateset !== undefined) {
                    stack.push(sgNew._stateset);
                }
                sgNew = sgNew._parent;
            } while (sgNew);

            for (i = stack._length - 1, l = 0; i >= l; --i) {
                state.pushStateSet(stackArray[i]);
            }
            return;
        } else if (sgCurrent._parent === sgNew._parent) {
            // first handle the typical case which is two state groups
            // are neighbours.

            // state has changed so need to pop old state.
            if (sgCurrent._stateset !== undefined) {
                state.popStateSet();
            }
            // and push new state.
            if (sgNew._stateset !== undefined) {
                state.pushStateSet(sgNew._stateset);
            }
            return;
        }

        // need to pop back up to the same depth as the new state group.
        while (sgCurrent._depth > sgNew._depth) {
            if (sgCurrent._stateset !== undefined) {
                state.popStateSet();
            }
            sgCurrent = sgCurrent._parent;
        }

        // use return path to trace back steps to sgNew.
        stack.reset();

        // need to pop back up to the same depth as the curr state group.
        while (sgNew._depth > sgCurrent._depth) {
            if (sgNew._stateset !== undefined) {
                stack.push(sgNew._stateset);
            }
            sgNew = sgNew._parent;
        }

        // now pop back up both parent paths until they agree.

        // DRT - 10/22/02
        // should be this to conform with above case where two StateGraph
        // nodes have the same parent
        while (sgCurrent !== sgNew) {
            if (sgCurrent._stateset !== undefined) {
                state.popStateSet();
            }
            sgCurrent = sgCurrent._parent;

            if (sgNew._stateset !== undefined) {
                stack.push(sgNew._stateset);
            }
            sgNew = sgNew._parent;
        }

        for (i = stack._length - 1, l = 0; i >= l; --i) {
            state.pushStateSet(stackArray[i]);
        }
    };
})();

module.exports = StateGraph;
