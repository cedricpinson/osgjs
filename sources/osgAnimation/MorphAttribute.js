define( [
    'osg/Hash',
    'osg/Utils',
    'osg/Map',
    'osg/Vec4',
    'osg/StateAttribute',
    'osg/Uniform'
], function ( Hash, MACROUTILS, Map, Vec4, StateAttribute, Uniform ) {

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

        this._targetNames = {};
        this._hashNames = ''; // compute only once target hash names

        this._hash = Hash.hashComputeCodeFromString( this.getHashString() );
    };

    MorphAttribute.uniforms = {};

    MorphAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'Morph',
        cloneType: function () {
            return new MorphAttribute( undefined, true );
        },

        hasTarget: function ( name ) {
            return !!this._targetNames[ name ];
        },

        copyTargetNames: function ( names ) {
            var tNames = this._targetNames;
            var hash = '';
            var nbNames = tNames.length = names.length;

            for ( var i = 0; i < nbNames; ++i ) {
                var att = names[ i ];
                tNames[ att ] = true;
                hash += att;
            }

            this._hashNames = hash;
            this.dirty();

        },

        getOrCreateUniforms: function () {
            var obj = MorphAttribute;
            var unifHash = this.getNumTargets();

            if ( obj.uniforms[ unifHash ] ) return obj.uniforms[ unifHash ];

            var uniforms = {};
            uniforms[ 'uTargetWeights' ] = new Uniform.createFloat4( 'uTargetWeights' );
            obj.uniforms[ unifHash ] = new Map( uniforms );

            return obj.uniforms[ unifHash ];
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
        getHashString: function () {
            return this.getTypeMember() + this._hashNames + this.getNumTargets() + this.isEnabled();
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
