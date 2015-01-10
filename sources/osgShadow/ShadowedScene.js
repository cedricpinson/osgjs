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

        // TODO: all  techniques (stencil/projTex/map/vol)
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

            var i, st, lt = this._shadowTechniques.length;

            if ( nodeVisitor.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {
                // init
                var allDirty = this._dirty || ( this.getShadowSettings() && this.getShadowSettings()._dirty );
                if ( allDirty ) {
                    this.init();
                } else {
                    for ( i = 0; i < lt; i++ ) {
                        st = this._shadowTechniques[ i ];
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
                        st = this._shadowTechniques[ i ];
                        if ( st && st.getEnabled() && st.valid() ) {
                            st.cullShadowCastingScene( cullVisitor );
                        }
                    }

                }
            } else {
                this.nodeTraverse( nodeVisitor );
            }
        },
        init: function () {
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
        /*receiving shadows, cull normally, but with receiving shader/state set/texture*/
        cullShadowReceivingScene: function ( cullVisitor ) {

            // WARNING: only works if there is a camera as ancestor
            // TODO: Better (Multi)Camera detection handling
            this._cameraShadowed = cullVisitor.getCurrentCamera();

            // What to do here... we want to draw all scene object, not only receivers ?
            // so no mask for now
            //var traversalMask = cullVisitor.getTraversalMask();
            //cullVisitor.setTraversalMask( this.getReceivesShadowTraversalMask() );

            if ( this.stateset ) cullVisitor.pushStateSet( this.stateset );
            this.nodeTraverse( cullVisitor );
            if ( this.stateset ) cullVisitor.popStateSet();


        },


    } ), 'osgShadow', 'ShadowedScene' );
    MACROUTILS.setTypeID( ShadowedScene );

    // same code like Node
    CullVisitor.prototype[ ShadowedScene.typeID ] = CullVisitor.prototype[ Node.typeID ];

    return ShadowedScene;
} );