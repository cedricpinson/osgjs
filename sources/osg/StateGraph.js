define( [
    'osgUtil/osgPool'
], function ( osgPool ) {

    'use strict';

    var StateGraph = function () {
        this.depth = 0;
        this.children = {};
        this.children.keys = [];
        this.leafs = [];
        this.stateset = undefined;
        this.parent = undefined;
    };

    StateGraph.prototype = {
        clean: function () {
            this.leafs.splice( 0, this.leafs.length );
            this.stateset = undefined;
            this.parent = undefined;
            this.depth = 0;
            var key, keys = this.children.keys;
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                key = keys[ i ];
                this.children[ key ].clean();
                osgPool.memoryPools.stateGraph.put( this.children[ key ] );
            }
            this.children = {};
            keys.splice( 0, keys.length );
            this.children.keys = keys;
        },
        getStateSet: function () {
            return this.stateset;
        },

        findOrInsert: function ( stateset ) {
            var sg;
            var stateSetID = stateset.getInstanceID();
            if ( !this.children[ stateSetID ] ) {

                //sg = new StateGraph();
                sg = osgPool.memoryPools.stateGraph.get();

                sg.parent = this;
                sg.depth = this.depth + 1;
                sg.stateset = stateset;
                this.children[ stateSetID ] = sg;
                this.children.keys.push( stateSetID );
            } else {
                sg = this.children[ stateSetID ];
            }
            return sg;
        },
        moveToRootStateGraph: function ( state, sgCurrent ) {
            // need to pop back all statesets and matrices.
            while ( sgCurrent ) {
                if ( sgCurrent.stateSet ) {
                    state.popStateSet();
                }
                sgCurrent = sgCurrent.parent;
            }
        },
        moveStateGraph: function ( state, sgCurrent, sgNew ) {
            var stack = [];
            var i, l;
            if ( sgNew === sgCurrent || sgNew === undefined ) {
                return;
            }

            if ( sgCurrent === undefined ) {
                // push stateset from sgNew to root, and apply
                // stateset from root to sgNew
                do {
                    if ( sgNew.stateset !== undefined ) {
                        stack.push( sgNew.stateset );
                    }
                    sgNew = sgNew.parent;
                } while ( sgNew );

                for ( i = stack.length - 1, l = 0; i >= l; --i ) {
                    state.pushStateSet( stack[ i ] );
                }
                return;
            } else if ( sgCurrent.parent === sgNew.parent ) {
                // first handle the typical case which is two state groups
                // are neighbours.

                // state has changed so need to pop old state.
                if ( sgCurrent.stateset !== undefined ) {
                    state.popStateSet();
                }
                // and push new state.
                if ( sgNew.stateset !== undefined ) {
                    state.pushStateSet( sgNew.stateset );
                }
                return;
            }

            // need to pop back up to the same depth as the new state group.
            while ( sgCurrent.depth > sgNew.depth ) {
                if ( sgCurrent.stateset !== undefined ) {
                    state.popStateSet();
                }
                sgCurrent = sgCurrent.parent;
            }

            // use return path to trace back steps to sgNew.
            stack = [];

            // need to pop back up to the same depth as the curr state group.
            while ( sgNew.depth > sgCurrent.depth ) {
                if ( sgNew.stateset !== undefined ) {
                    stack.push( sgNew.stateset );
                }
                sgNew = sgNew.parent;
            }

            // now pop back up both parent paths until they agree.

            // DRT - 10/22/02
            // should be this to conform with above case where two StateGraph
            // nodes have the same parent
            while ( sgCurrent !== sgNew ) {
                if ( sgCurrent.stateset !== undefined ) {
                    state.popStateSet();
                }
                sgCurrent = sgCurrent.parent;

                if ( sgNew.stateset !== undefined ) {
                    stack.push( sgNew.stateset );
                }
                sgNew = sgNew.parent;
            }

            for ( i = stack.length - 1, l = 0; i >= l; --i ) {
                state.pushStateSet( stack[ i ] );
            }
        }
    };

    return StateGraph;
} );
