'use strict';
var CullVisitor = require( 'osg/CullVisitor' );
var mat4 = require( 'osg/glMatrix' ).mat4;
var Node = require( 'osg/Node' );
var NodeVisitor = require( 'osg/NodeVisitor' );
var StateSet = require( 'osg/StateSet' );
var MACROUTILS = require( 'osg/Utils' );
var vec4 = require( 'osg/glMatrix' ).vec4;
var ComputeBoundsVisitor = require( 'osg/ComputeBoundsVisitor' );
var ShadowCasterVisitor = require( 'osgShadow/ShadowCasterVisitor' );

/**
 *  ShadowedScene provides a mechanism for decorating a scene that the needs to have shadows cast upon it.
 *  @class ShadowedScene
 *  @{@link [http://trac.openscenegraph.org/projects/osg//wiki/Support/ProgrammingGuide/osgShadow]}
 *  @{@link [http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf]};
 */
var ShadowedScene = function ( settings ) {
    Node.call( this );

    // TODO: all  techniques (stencil/projTex/map/vol)
    this._shadowTechniques = [];

    this._optimizedFrustum = false;

    this._frustumReceivers = [ vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create() ];

    this._tmpMat = mat4.create();

    this._receivingStateset = new StateSet();

    this._computeBoundsVisitor = new ComputeBoundsVisitor();

    this._castsShadowDrawTraversalMask = 0xffffffff;
    this._castsShadowBoundsTraversalMask = 0xffffffff;
    if ( settings ) this.setShadowSettings( settings );

};

/** @lends ShadowedScene.prototype */
MACROUTILS.createPrototypeNode( ShadowedScene, MACROUTILS.objectInherit( Node.prototype, {

    getReceivingStateSet: function () {

        return this._receivingStateset;

    },

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

    nodeTraverse: function ( nv ) {
        Node.prototype.traverse.call( this, nv );
    },

    setShadowSettings: function ( shadowSettings ) {

        this._settings = shadowSettings;

        this.setCastsShadowDrawTraversalMask( shadowSettings.castsShadowDrawTraversalMask );
        this.setCastsShadowBoundsTraversalMask( shadowSettings.castsShadowBoundsTraversalMask );

        // Overridable Visitor so that user can override the visitor to enable disable
        // in its own shadowmap implementation
        // settings.userShadowCasterVisitor:
        // - undefined means using default
        // - false means no removal visitor needed
        // - otherwise must be an instance of a class inherited from shadowCaster
        if ( shadowSettings.userShadowCasterVisitor !== false ) {

            this._removeNodesNeverCastingVisitor = shadowSettings.userShadowCasterVisitor || new ShadowCasterVisitor( this._castsShadowTraversalMask );

        }

    },

    setCastsShadowDrawTraversalMask: function ( mask ) {
        this._castsShadowDrawTraversalMask = mask;
    },

    getCastsShadowDrawTraversalMask: function () {
        return this._castsDrawShadowTraversalMask;
    },

    setCastsShadowBoundsTraversalMask: function ( mask ) {
        this._castsShadowBoundsTraversalMask = mask;
    },

    getCastsShadowBoundsTraversalMask: function () {
        return this._castsShadowBoundsTraversalMask;
    },

    computeShadowedSceneBounds: function () {

        if ( this._removeNodesNeverCastingVisitor ) {

            this._removeNodesNeverCastingVisitor.setNoCastMask( ~( this._castsShadowBoundsTraversalMask | this._castsShadowDrawTraversalMask ) );
            this._removeNodesNeverCastingVisitor.reset();
            this.accept( this._removeNodesNeverCastingVisitor );

        }

        this._computeBoundsVisitor.setTraversalMask( this._castsShadowBoundsTraversalMask );
        this._computeBoundsVisitor.reset();
        this.accept( this._computeBoundsVisitor );
        var bbox = this._computeBoundsVisitor.getBoundingBox();

        if ( !bbox.valid() ) {

            // nothing to draw Early out.
            this.noDraw();

            if ( this._removeNodesNeverCastingVisitor ) {

                // remove our flags changes on any bitmask
                // not to break things
                this._removeNodesNeverCastingVisitor.restore();

            }

            return false;

        }

        return true;
    },

    traverse: function ( nv ) {

        // update the scene
        if ( nv.getVisitorType() === NodeVisitor.CULL_VISITOR ) {

            var i, st, lt = this._shadowTechniques.length;

            // cull Shadowed Scene
            if ( lt ) nv.pushStateSet( this._receivingStateset );
            this.nodeTraverse( nv );
            if ( lt ) nv.popStateSet();

            var isDirty = false;
            for ( i = 0; i < lt; i++ ) {

                st = this._shadowTechniques[ i ];

                // dirty check for user playing with shadows inside update traverse
                if ( !st || !st.valid() ) continue;

                if ( st.isDirty() ) {
                    isDirty = true;
                    st.init();
                }

                if ( st.isEnabled() || !st.isFilledOnce() ) isDirty = true;


            }
            if ( !isDirty ) return;

            var hasCastingScene = this.computeShadowedSceneBounds( nv );
            if ( !hasCastingScene ) {

                // no shadow but still may need to clear
                for ( i = 0; i < lt; i++ ) {
                    st = this._shadowTechniques[ i ];
                    st.noDraw();
                }

                if ( this._removeNodesNeverCastingVisitor ) {

                    // remove our flags changes on any bitmask
                    // not to break things
                    this._removeNodesNeverCastingVisitor.restore();

                }

                return;
            }

            var bbox = this._computeBoundsVisitor.getBoundingBox();

            // HERE we get the shadowedScene Current World Matrix
            // to get any world transform ABOVE the shadowedScene
            var worldMatrix = nv.getCurrentModelMatrix();
            bbox.transformMat4( bbox, worldMatrix );

            // cull Casters
            for ( i = 0; i < lt; i++ ) {

                st = this._shadowTechniques[ i ];
                if ( st.isEnabled() || !st.isFilledOnce() ) {
                    st.updateShadowTechnique( nv );
                    st.cullShadowCasting( nv, bbox );
                }
            }

            if ( this._removeNodesNeverCastingVisitor ) {

                // remove our flags changes on any bitmask
                // not to break things
                this._removeNodesNeverCastingVisitor.restore();

            }

        } else {
            this.nodeTraverse( nv );
        }
    }


} ), 'osgShadow', 'ShadowedScene' );

// same code like Node
CullVisitor.registerApplyFunction( ShadowedScene.nodeTypeID, CullVisitor.getApplyFunction( Node.nodeTypeID ) );

module.exports = ShadowedScene;
