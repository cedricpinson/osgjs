define( [
    'osg/Matrix',
], function ( Matrix ) {

    'use strict';

    var RenderLeaf = function () {

        this._parent = undefined;
        this._geometry = undefined;
        this._depth = 0.0;

        this._projection = undefined;
        this._view = undefined;
        this._modelWorld = undefined;
        this._modelView = undefined;
    };

    RenderLeaf.prototype = {

        reset: function () {
            this._parent = undefined;
            this._geometry = undefined;
            this._depth = 0.0;

            this._projection = undefined;
            this._view = undefined;
            this._modelWorld = undefined;
            this._modelView = undefined;
        },

        init: function ( parent, geom, projection, view, modelView, modelWorld, depth ) {

            this._parent = parent;
            this._geometry = geom;
            this._depth = depth;

            this._projection = projection;
            this._view = view;
            this._modelWorld = modelWorld;
            this._modelView = modelView;

        },


        drawGeometry: ( function () {

            var tempMatrice = Matrix.create();
            var modelViewUniform, viewUniform, modelWorldUniform, projectionUniform, normalUniform, program;

            return function ( state ) {

                var gl = state.getGraphicContext();

                program = state.getLastProgramApplied();

                modelViewUniform = program._uniformsCache[ state.modelViewMatrix.name ];
                modelWorldUniform = program._uniformsCache[ state.modelWorldMatrix.name ];
                viewUniform = program._uniformsCache[ state.viewMatrix.name ];
                projectionUniform = program._uniformsCache[ state.projectionMatrix.name ];
                normalUniform = program._uniformsCache[ state.normalMatrix.name ];

                if ( modelViewUniform !== undefined ) {
                    state.modelViewMatrix.set( this._modelView );
                    state.modelViewMatrix.apply( gl, modelViewUniform );
                }

                if ( modelWorldUniform !== undefined ) {
                    state.modelWorldMatrix.set( this._modelWorld );
                    state.modelWorldMatrix.apply( gl, modelWorldUniform );
                }

                if ( viewUniform !== undefined ) {
                    state.viewMatrix.set( this._view );
                    state.viewMatrix.apply( gl, viewUniform );
                }

                if ( projectionUniform !== undefined ) {
                    state.projectionMatrix.set( this._projection );
                    state.projectionMatrix.apply( gl, projectionUniform );
                }

                if ( normalUniform !== undefined ) {

                    // TODO: optimize the uniform scaling case
                    // where inversion is simpler/faster/shared
                    // but profile before
                    Matrix.copy( this._modelView, tempMatrice );
                    var normal = tempMatrice;
                    normal[ 12 ] = 0.0;
                    normal[ 13 ] = 0.0;
                    normal[ 14 ] = 0.0;

                    Matrix.inverse( normal, normal );
                    Matrix.transpose( normal, normal );
                    state.normalMatrix.set( normal );
                    state.normalMatrix.apply( gl, normalUniform );
                }

                this._geometry.drawImplementation( state );

            };
        } )(),

        render: function ( state, previousLeaf ) {

            var push = false;
            var prevRenderGraph;
            var prevRenderGraphParent;
            var rg;

            if ( previousLeaf !== undefined ) {

                // apply state if required.
                prevRenderGraph = previousLeaf._parent;
                prevRenderGraphParent = prevRenderGraph.parent;
                rg = this._parent;

                if ( prevRenderGraphParent !== rg.parent ) {

                    rg.moveStateGraph( state, prevRenderGraphParent, rg.parent );

                    // send state changes and matrix changes to OpenGL.

                    state.applyStateSet( rg.stateset );

                } else if ( rg !== prevRenderGraph ) {

                    // send state changes and matrix changes to OpenGL.
                    state.applyStateSet( rg.stateset );

                }

            } else {

                this._parent.moveStateGraph( state, undefined, this._parent.parent );
                state.applyStateSet( this._parent.stateset );

            }

            this.drawGeometry( state, push );

        }

    };

    return RenderLeaf;

} );
