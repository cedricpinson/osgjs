define( [
    'osg/Utils',
    'osg/Node'
], function( MACROUTILS, Node ) {
    'use strict';
    /**
     *  ShadowedScene provides a mechanism for decorating a scene that the needs to have shadows cast upon it.
     *  @class ShadowedScene
     *  @{@link [http://trac.openscenegraph.org/projects/osg//wiki/Support/ProgrammingGuide/osgShadow]}
     *  @{@link [http://developer.download.nvidia.com/presentations/2008/GDC/GDC08_SoftShadowMapping.pdf]};
     */
    var ShadowedScene = function() {
        Node.call( this );
        this._shadowTechnique = undefined;
        this._shadowSettings = undefined;
    };

    /** @lends ShadowedScene.prototype */
    ShadowedScene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Node.prototype, {
        getShadowTechnique: function() {
            return this._shadowTechnique;
        },
        setShadowTechnique: function( technique ) {
            if ( this._shadowTechnique ) {
                if ( this._shadowTechnique === technique ) return;

                if ( this._shadowTechnique.valid() ) {
                    this._shadowTechnique.cleanSceneGraph();
                    this._shadowTechnique._shadowedScene = 0;
                }
            }
            this._shadowTechnique = technique;

            if ( this._shadowTechnique.valid() ) {
                this._shadowTechnique._shadowedScene = this;
                this._shadowTechnique.dirty();
            }
        },
        getShadowSettings: function() {
            return this._shadowSettings;
        },
        setShadowSettings: function( ss ) {
            this._shadowSettings = ss;
        },
        /** Clean scene graph from any shadow technique specific nodes, state and drawables.*/
        cleanSceneGraph: function() {
            if ( this._shadowTechnique.valid() ) {
                this._shadowTechnique.cleanSceneGraph();
            }
        },
        /** Dirty any cache data structures held in the attached ShadowTechnqiue.*/
        dirty: function() {
            if ( this._shadowTechnique.valid() ) {
                this._shadowTechnique.dirty();
            }
        },
        nodeTraverse: function( nv ) {
            Node.prototype.traverse.apply( this, arguments );
        },
        traverse: function( nv ) {
            if ( this._shadowTechnique.valid() ) {
                this._shadowTechnique.traverse( nv );
            } else {
                this.nodeTraverse( nv );
            }
        },
        setGLContext: function( gl ) {
            this._glContext = gl;
        },
        getGLContext: function() {
            return this._glContext;
        }

    } ), 'osg', 'ShadowedScene' );
    MACROUTILS.setTypeID( ShadowedScene );

    return ShadowedScene;
} );