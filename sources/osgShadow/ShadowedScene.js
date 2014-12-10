define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Vec4',
    'osg/Matrix',
    'osg/Uniform',
    'osg/StateSet',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/CullVisitor'
], function ( Notify, MACROUTILS, Vec4, Matrix, Uniform, StateSet, Node, NodeVisitor, CullVisitor ) {
    'use strict';
    /**
     *  ShadowedScene provides a mechanism for decorating a scene that the needs to have shadows cast upon it.
     *  @class ShadowedScene
     *  @{@link [http://trac.openscenegraph.org/projects/osg//wiki/Support/ProgrammingGuide/osgShadow]}
     *  @{@link [http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf]};
     */
    var ShadowedScene = function () {
        Node.call( this );

        // TODO: all  techniques
        this._shadowTechniques = [];

        this._dirty = true;

        this._shadowSettings = undefined;

        this._optimizedFrustum = false;

        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];

        this._tmpMat = Matrix.create();
    };

    /** @lends ShadowedScene.prototype */
    ShadowedScene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {

        getShadowTechniques: function () {
            return this._shadowTechniques;
        },
        addShadowTechnique: function ( technique ) {
            if ( this._shadowTechniques.length > 0 ) {
                if ( this._shadowTechniques.indexOf( technique ) !== -1 ) return;
            }

            this._shadowTechniques.push( technique );

            if ( technique.valid() ) {
                technique.setShadowedScene( this );
                technique.dirty();
            }
        },
        removeShadowTechnique: function ( technique ) {
            if ( this._shadowTechniques.length > 0 ) {
                var idx = this._shadowTechniques.indexOf( technique );
                if ( idx !== -1 ) {
                    if ( this._shadowTechniques[ idx ].valid() ) {
                        this._shadowTechniques[ idx ].cleanSceneGraph();
                        this._shadowTechniques[ idx ]._shadowedScene = 0;
                    }
                    this._shadowTechniques.splice( idx, 1 );
                }
            }
        },
        /* Gets Default shadowSettings
         * if it's shared between techniques
         */
        getShadowSettings: function () {
            return this._shadowSettings;
        },
        /* Sets Default shadowSettings
         * if it's shared between techniques
         */
        setShadowSettings: function ( ss ) {
            this._shadowSettings = ss;
        },
        /** Clean scene graph from any shadow technique specific nodes, state and drawables.*/
        cleanSceneGraph: function () {
            for ( var i = 0, lt = this._shadowTechniques.length; i < lt; i++ ) {
                if ( this._shadowTechniques[ i ] && this._shadowTechniques[ i ].valid() ) {
                    this._shadowTechniques[ i ].cleanSceneGraph();
                }
            }
        },
        /** Dirty any cache data structures held in the attached ShadowTechnique.*/
        dirty: function () {
            this._dirty = false;
            for ( var i = 0, lt = this._shadowTechniques.length; i < lt; i++ ) {
                if ( this._shadowTechniques[ i ] && this._shadowTechniques[ i ].valid() ) {
                    this._shadowTechniques[ i ].dirty();
                }
            }

        },
        nodeTraverse: function ( /*nv*/) {
            Node.prototype.traverse.apply( this, arguments );
        },
        traverse: function ( nodeVisitor ) {

            CullVisitor = CullVisitor || require( 'osg/CullVisitor' );
            var i, lt = this._shadowTechniques.length;

            if ( nodeVisitor.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {

                // init
                // TODO: all  techniques
                var allDirty = this._dirty || ( this.getShadowSettings() && this.getShadowSettings()._dirty );
                if ( allDirty ) {
                    this.init();
                } else {
                    for ( i = 0; i < lt; i++ ) {
                        var st = this._shadowTechniques[ i ];
                        if ( st && st.valid() && ( st._dirty || st.getShadowSettings()._dirty ) ) {
                            this._shadowTechniques[ i ].init();
                        }
                    }
                }

                this.nodeTraverse( nodeVisitor );

            } else if ( nodeVisitor.getVisitorType() === NodeVisitor.CULL_VISITOR ) {

                var cullVisitor = nodeVisitor;

                if ( cullVisitor instanceof CullVisitor ) {
                    // cull Shadowed Scene
                    this.cullShadowReceivingScene( nodeVisitor );

                    // cull Casters
                    for ( i = 0; i < lt; i++ ) {
                        if ( this._shadowTechniques[ i ] && this._shadowTechniques[ i ].valid() ) {
                            this._shadowTechniques[ i ].cullShadowCastingScene( cullVisitor );
                        }
                    }

                }
            } else {
                this.nodeTraverse( nodeVisitor );
            }



        },
        setGLContext: function ( gl ) {
            this._glContext = gl;
        },
        getGLContext: function () {
            return this._glContext;
        },
        init: function () {

            ////////////////
            // RECEIVERS stateSet
            if ( this._receivingStateset ) {
                this._receivingStateset.releaseGLObjects();
            }
            var receiverStateSet = new StateSet(); //this.getReceivingStateSet();

            // NOW USING NODE SHADERS
            this._receivingStateset = receiverStateSet;

            // Camera/Eye Position
            // TODO: add positioned uniform
            var myuniform = Uniform.createFloat4( [ 0.0, 0.0, 0.0, 0.0 ], 'Camera_uniform_position' );
            this._receivingStateset.addUniform( myuniform );

            for ( var i = 0, lt = this._shadowTechniques.length; i < lt; i++ ) {
                if ( this._shadowTechniques[ i ] && this._shadowTechniques[ i ].valid() ) {
                    this._shadowTechniques[ i ].init();
                }
            }
            if ( this.getShadowSettings() ) this.getShadowSettings()._dirty = false;
            this._dirty = false;
        },

        setReceivesShadowTraversalMask: function ( mask ) {
            this._receivesShadowTraversalMask = mask;
        },
        getReceivesShadowTraversalMask: function () {
            return this._receivesShadowTraversalMask;
        },
        getReceivingStateSet: function () {
            if ( !this._receivingStateset ) {
                this._receivingStateset = new StateSet(); //this.getOrCreateStateSet();
            }
            return this._receivingStateset;
        },
        setReceivingStateSet: function ( rs ) {
            this._receivingStateset = rs;
        },
        /*receiving shadows, cull normally, but with receiving shader/state set/texture*/
        cullShadowReceivingScene: function ( cullVisitor ) {

            // WARNING: only works if there is a camera as ancestor
            // TODO: Better (Multi)Camera detection handling
            this._cameraShadowed = cullVisitor.getCurrentCamera();


            //var receivingUniforms = this.getReceivingStateSet().getUniformList();

            // TODO: get camera position as positioned uniform ?
            var pos = this._camPos || Vec4.create();
            this._camPos = pos;
            //Matrix.getTrans( this._cameraShadowed.getViewMatrix(), pos );
            //receivingUniforms[ 'Camera_uniform_position' ].getUniform().set( pos );
            // What to do here... we want to draw all scene object, not only receivers ?
            // so no mask for now
            var traversalMask = cullVisitor.getTraversalMask();
            //cullVisitor.setTraversalMask( this.getReceivesShadowTraversalMask() );

            if ( !this._optimizedFrustum ) {

                cullVisitor.pushStateSet( this._receivingStateset );
                this.nodeTraverse( cullVisitor );
                cullVisitor.popStateSet();

            } else {
                var frustumCulling = cullVisitor._enableFrustumCulling;
                cullVisitor.setEnableFrustumCulling( true );

                // compute frustum prior to culling, without near/far
                var mvp = this._tmpMat;
                Matrix.mult( this._cameraShadowed.getProjectionMatrix(), this._cameraShadowed.getViewMatrix(), mvp );
                cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, true );

                cullVisitor.pushStateSet( this._receivingStateset );
                this.nodeTraverse( cullVisitor );
                cullVisitor.popStateSet();


                var epsilon = 1e-6;
                if ( cullVisitor._computedFar < cullVisitor._computedNear - epsilon ) {
                    Notify.log( 'empty shadowed scene' );
                    for ( var l = 0; l < 6; l++ ) {
                        this._frustumReceivers[ l ][ 0 ] = -1.0;
                        this._frustumReceivers[ l ][ 1 ] = 1.01;
                        this._frustumReceivers[ l ][ 2 ] = -1.0;
                        this._frustumReceivers[ l ][ 3 ] = 1.01;
                    }
                    this._farReceivers = 1;
                    this._nearReceivers = 0.001;
                    return;
                } else {
                    // VFC with computed near / far from scene
                    var m = cullVisitor.getCurrentProjectionMatrix();
                    cullVisitor.clampProjectionMatrix( m, cullVisitor._computedNear, cullVisitor._computedFar, cullVisitor._nearFarRatio );
                    Matrix.mult( m, this._cameraShadowed.getViewMatrix(), mvp );
                    cullVisitor.getFrustumPlanes( mvp, cullVisitor._frustum, true, false );
                    for ( var i = 0; i < 6; i++ ) {
                        Vec4.copy( cullVisitor._frustum[ i ], this._frustumReceivers[ i ] );
                    }
                }
                this._nearReceivers = cullVisitor._computedNear;
                this._farReceivers = cullVisitor._computedFar;


                // reapply the original traversal mask
                cullVisitor.setTraversalMask( traversalMask );
                if ( frustumCulling === false || frustumCulling === undefined ) {
                    cullVisitor.setEnableFrustumCulling( false );
                }
            }

        },


    } ), 'osg', 'ShadowedScene' );
    MACROUTILS.setTypeID( ShadowedScene );

    return ShadowedScene;
} );
