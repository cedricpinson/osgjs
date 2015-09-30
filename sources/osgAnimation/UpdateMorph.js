define( [
    'osg/Utils',
    'osgAnimation/RigGeometry',
    'osgAnimation/AnimationUpdateCallback',
    'osgAnimation/Target',
    'osgAnimation/MorphGeometry'
], function ( MACROUTILS, RigGeometry, AnimationUpdateCallback, Target, MorphGeometry ) {
    'use strict';

    var UpdateMorph = function () {
        AnimationUpdateCallback.call( this );

        this._isInitialized = false;
        this._targets = {};
        this._targetName = [];
    };

    UpdateMorph.prototype = MACROUTILS.objectInherit( AnimationUpdateCallback.prototype, {

        init: function ( node ) {
            //Find the morph geometry & init it
            var children = node.getChildren();
            for ( var i = 0, l = children.length; i < l; i++ ) {

                var geom = children[ i ];
                var morph;
                if ( geom instanceof MorphGeometry ) {
                    morph = geom;
                } else if ( geom instanceof RigGeometry && geom.getSourceGeometry() instanceof MorphGeometry ) {
                    morph = geom.getSourceGeometry();
                }

                if ( !morph ) continue;

                if ( morph.getName() === this.getName() ) {
                    if ( !morph.isInitialized() )
                        morph.init();

                    this._morphGeometry = morph;
                    this._isInitialized = true;
                    break;
                }
            }
        },

        isInitialized: function () {
            return this._isInitialized;
        },

        getTarget: function ( index ) {
            return this._targets[ index ];
        },

        getNumTarget: function () {
            return this._targetName.length;
        },

        getTargetName: function ( index ) {
            return this._targetName[ index ];
        },

        addTarget: function ( name, index ) {
            this._targets[ index ] = Target.createFloatTarget( 0 );
            this._targetName[ index ] = name;
        },

        update: function ( node /*, nv*/ ) {
            if ( !this.isInitialized() )
                this.init( node );

            var morph = this._morphGeometry;
            if ( morph ) {
                var array = morph.getTargetsWeight();

                var targets = Object.keys( this._targets );
                for ( var i = 0, l = targets.length; i < l; i++ ) {
                    var key = parseInt( targets[ i ], 10 );
                    var target = this._targets[ key ];
                    if ( target )
                        array[ key ] = target.value;
                }
            }
            return true;
        }
    } );
    return UpdateMorph;

} );
