define( [
        'osg/Notify',
        'osg/Utils',
        'osg/Object',
        'osg/Node',
        'osg/NodeVisitor',
        'osg/CullVisitor'
    ],
    function( Notify, MACROUTILS, Object, Node, NodeVisitor, CullVisitor ) {
        'use strict';

        // cull callback interception
        var CameraCullCallback = function( shadowTechnique ) {
            this._shadowTechnique = shadowTechnique;
        };
        CameraCullCallback.prototype = {
            cull: function( node, nodeVisitor ) {
                this._shadowTechnique.enterCullCaster( nodeVisitor );
                this._shadowTechnique.getShadowedScene().nodeTraverse( nodeVisitor );
                this._shadowTechnique.exitCullCaster( nodeVisitor );
                return false;
            }
        };

        /**
         *  ShadowTechnique provides an implementation interface of shadow techniques.
         *  @class ShadowTechnique
         */
        var ShadowTechnique = function() {
            Object.call( this );


            this._shadowedScene = undefined;
            this._dirty = false;

        };

        /** @lends ShadowTechnique.prototype */
        ShadowTechnique.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Object.prototype, {
            dirty: function() {
                this._dirty = true;
            },

            setCameraCullCallback: function( camera ) {
                camera.setCullCallback( new CameraCullCallback( this ) );
            },
            getShadowedScene: function() {
                return this._shadowedScene;
            },

            setShadowedScene: function( shadowedScene ) {
                this._shadowedScene = shadowedScene;
            },


            init: function() {
                // well shouldn't be called
                Notify.log( 'No ShadowTechnique activated: normal rendering activated' );

            },

            valid: function() {
                // make sure abstract class not used.
                return false;
            },

            update: function( nodeVisitor ) {
                this.getShadowedScene().nodeTraverse( nodeVisitor );
            },

            cull: function( cullVisitor ) {
                this.getShadowedScene().nodeTraverse( cullVisitor );
                return false;
            },

            cleanSceneGraph: function() {
                // well shouldn't be called
                Notify.log( 'No ShadowTechnique activated: normal rendering activated' );
            },

            enterCullCaster: function( /*cullVisitor*/) {
                // well shouldn't be called
            },

            exitCullCaster: function( /*cullVisitor*/) {
                // well shouldn't be called
            },
            traverse: function( nodeVisitor ) {
                if ( !this._shadowedScene ) return;
                if ( nodeVisitor.getVisitorType() === NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._dirty ) this.init();

                    this.update( nodeVisitor );
                } else if ( nodeVisitor.getVisitorType() === NodeVisitor.CULL_VISITOR ) {
                    var cullVisitor = nodeVisitor;
                    if ( cullVisitor instanceof CullVisitor ) { // TODO: Have to find how to get if cull or node
                        this.cull( cullVisitor );
                    } else {
                        this.getShadowedScene().nodeTraverse( nv );
                    }
                } else {
                    this.getShadowedScene().nodeTraverse( nv );
                }
            },

        } ), 'osg', 'ShadowTechnique' );


        MACROUTILS.setTypeID( ShadowTechnique );

        return ShadowTechnique;
    } );