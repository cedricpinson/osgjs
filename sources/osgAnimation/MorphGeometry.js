define( [
    'osg/Utils',
    'osg/Geometry',
    'osg/StateSet',
    'osgAnimation/MorphAttribute',
    'osg/StateAttribute',
    'osgAnimation/Target'
], function ( MACROUTILS, Geometry, StateSet, MorphAttribute, StateAttribute ) {

    'use strict';

    /**
     * MorphGeometry manage up to 4 morphTargets
     * @class MorphGeometry
     * @inherits Geometry
     */

    var MorphGeometry = function () {
        Geometry.call( this );

        this._targets = []; // Target list (Geometry)
        this._stateSetAnimation = new StateSet(); // StateSet to handle morphAttribute
        this._targetWeights = new Float32Array( 4 ); // Fixed length array feed by UpdateMorph

        this._isInitialized = false;
    };

    MorphGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {

        init: function () {
            var st = this.getStateSetAnimation();
            var animAttrib = new MorphAttribute( this.getMorphTargets().length );
            st.setAttributeAndModes( animAttrib, StateAttribute.ON );
            animAttrib.setTargetWeights( this.getTargetsWeight() );

            this._isInitialized = true;
            return true;
        },

        getStateSetAnimation: function () {
            return this._stateSetAnimation;
        },

        getMorphTargets: function () {
            return this._targets;
        },

        isInitialized: function () {
            return this._isInitialized;
        },

        getTargetsWeight: function () {
            return this._targetWeights;
        },

        mergeChildrenVertexAttributeList: function () {

            var target;

            for ( var i = 0, l = this._targets.length; i < l; i++ ) {

                target = this._targets[ i ];
                Geometry.appendVertexAttributeToList( target.getVertexAttributeList(), this.getVertexAttributeList(), i );

            }

        }


    } ), 'osgAnimation', 'MorphGeometry' );

    MACROUTILS.setTypeID( MorphGeometry );

    return MorphGeometry;
} );
