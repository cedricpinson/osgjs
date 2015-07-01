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
    var AnimationAttribute = function ( disable ) {
        StateAttribute.call( this );
        this._enable = !disable;
    };

    AnimationAttribute.uniforms = {};
    AnimationAttribute.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'AnimationAttribute',

        cloneType: function () {
            return new AnimationAttribute( true );
        },
        setBoneSize: function ( boneSize ) {
            this._boneSize = boneSize;
        },
        getBoneSize: function () {
            return this._boneSize;
        },

        getTypeMember: function () {
            return this.attributeType + this.getBoneSize() + '_' + this.getInstanceID();
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
