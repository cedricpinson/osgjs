define( [
    'osg/CullVisitor',
    'osg/Matrix',
    'osg/Node',
    'osg/NodeVisitor',
    'osg/Utils',
    'osg/Vec4',
], function ( CullVisitor, Matrix, Node, NodeVisitor, MACROUTILS, Vec4 ) {

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

        this._optimizedFrustum = false;

        this._frustumReceivers = [ Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create(), Vec4.create() ];

        this._tmpMat = Matrix.create();
    };

    /** @lends ShadowedScene.prototype */
    ShadowedScene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Node.prototype, {

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
                    }
                    this._shadowTechniques.splice( idx, 1 );
                }
            }
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
            for ( var i = 0; i < this._shadowTechniques.length; i++ )
                this._shadowTechniques[ i ].dirty();
        },

        nodeTraverse: function ( /*nv*/) {
            Node.prototype.traverse.apply( this, arguments );
        },
        traverse: function ( nv ) {


            if ( nv.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {

                // update the scene
                this.nodeTraverse( nv );

            } else if ( nv.getVisitorType() === NodeVisitor.CULL_VISITOR ) {

                // cull Shadowed Scene
                this.cullShadowReceivingScene( nv );

                var i, st, lt = this._shadowTechniques.length;
                // cull Casters
                for ( i = 0; i < lt; i++ ) {
                    st = this._shadowTechniques[ i ];
                    // dirty check for user playing with shadows inside update traverse
                    if ( st && st.valid() ) {

                        // those two checks
                        // here
                        // in case people update it from
                        // any update/cull/callback
                        if ( st.isDirty() )
                            st.init();

                        if ( st.getEnable() || !st.isFilledOnce() ) {
                            st.updateShadowTechnic( nv );
                            st.cullShadowCasting( nv );
                        }
                    }
                }

            } else {
                this.nodeTraverse( nv );
            }
        },

        /*receiving shadows, cull normally, but with receiving shader/state set/texture*/
        cullShadowReceivingScene: function ( cullVisitor ) {


            // not used any where ???

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

        }


    } ), 'osgShadow', 'ShadowedScene' );
    MACROUTILS.setTypeID( ShadowedScene );

    // same code like Node
    CullVisitor.prototype[ ShadowedScene.typeID ] = CullVisitor.prototype[ Node.typeID ];

    return ShadowedScene;
} );
