define( [
    'osg/Utils',
    'osg/Map',
    'osg/Vec4',
    'osg/StateAttribute',
    'osg/Uniform'
], function ( MACROUTILS, Map, Vec4, StateAttribute, Uniform ) {

    'use strict';

    /**
     * MorphAttribute encapsulate Animation State
     * @class MorphAttribute
     * @inherits StateAttribute
     */
    var MorphAttribute = function ( nbTarget, disable ) {
        StateAttribute.call( this );
        this._nbTarget = nbTarget;
        this._enable = !disable;
    };

    MorphAttribute.uniforms = {};

    MorphAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'Morph',
        cloneType: function () {
            return new MorphAttribute( this._nbTarget, true );
        },

        getTypeMember: function () {
            return this.attributeType + '_' + this.getNumTargets();
        },

        getOrCreateUniforms: function () {
            // uniform are once per CLASS attribute, not per instance
            var obj = MorphAttribute;
            var typeMember = this.getTypeMember();

            if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

            var uniforms = {};
            uniforms[ 'uTargetWeights' ] = new Uniform.createFloat4( 'uTargetWeights' );
            obj.uniforms[ typeMember ] = new Map( uniforms );

            return obj.uniforms[ typeMember ];
        },
        getNumTargets: function () {
            return this._nbTarget;
        },
        setTargetWeights: function ( targetWeight ) {
            this._targetWeights = targetWeight;
        },
        getTargetWeights: function () {
            return this._targetWeights;
        },
        isEnabled: function () {
            return this._enable;
        },
        getHash: function () {
            return this.getTypeMember() + this.isEnabled();
        },

        apply: function () {
            if ( !this._enable )
                return;

            var uniformMap = this.getOrCreateUniforms();
            Vec4.copy( this._targetWeights, uniformMap.uTargetWeights.get() );
            uniformMap.uTargetWeights.dirty();

            this.setDirty( false );
        }

    } ), 'osgAnimation', 'MorphAttribute' );

    MACROUTILS.setTypeID( MorphAttribute );

    return MorphAttribute;
} );
