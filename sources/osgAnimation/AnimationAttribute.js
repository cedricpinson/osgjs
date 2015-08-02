define( [
    'osg/Map',
    'osg/Utils',
    'osg/StateAttribute'
], function ( Map, MACROUTILS, StateAttribute ) {

    'use strict';

    /**
     * AnimationAttribute encapsulate Animation State
     * @class AnimationAttribute
     * @inherits StateAttribute
     */
    var AnimationAttribute = function ( boneSize, animationID, disable ) {
        StateAttribute.call( this );
        this._boneSize = boneSize;
        this._enable = !disable;

        this._animationID = animationID;
        if ( !animationID ) this._animationID = this.getInstanceID();

    };


    AnimationAttribute.uniforms = {};
    AnimationAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'AnimationAttribute',
        getAnimationID: function () {
            return this._animationID;
        },
        cloneType: function () {
            return new AnimationAttribute( this._boneSize, this._animationID, true );
        },
        getBoneSize: function () {
            return this._boneSize;
        },

        getTypeMember: function () {
            return this.attributeType + '_' + this.getBoneSize() + '_' + this.getAnimationID();
        },

        getOrCreateUniforms: function () {
            // uniform are once per CLASS attribute, not per instance
            var obj = AnimationAttribute;
            var typeMember = this.getTypeMember();

            if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

            var uniforms = {};

            uniforms[ 'uBones' ] = this._matrixPalette;
            obj.uniforms[ typeMember ] = new Map( uniforms );

            return obj.uniforms[ typeMember ];
        },
        setMatrixPalette: function ( matrixPalette ) {
            this._matrixPalette = matrixPalette;
        },
        getMatrixPalette: function () {
            return this._matrixPalette;
        },
        // need a isEnabled to let the ShaderGenerator to filter
        // StateAttribute from the shader compilation
        isEnabled: function () {
            return this._enable;
        },
        getHash: function () {
            // bonesize is important, as the shader itself
            // has a different code and uniform are not shared
            // geoms have each their own bones matrix palette
            // it's up to rigGeometry to use same anim Attrib per
            // same bone matrix palette
            // as uniform array size must be statically declared
            // in shader code
            return this.getTypeMember() + this.isEnabled();

        }

    } ), 'osgShadow', 'AnimationAttribute' );

    MACROUTILS.setTypeID( AnimationAttribute );

    return AnimationAttribute;
} );
