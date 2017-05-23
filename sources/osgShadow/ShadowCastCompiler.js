'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Compiler = require( 'osgShader/Compiler' );


var CompilerShadowCast = function () {
    Compiler.apply( this, arguments );
};

CompilerShadowCast.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
    getCompilerName: function () {
        return 'ShadowCast';
    },

    initAttributes: function () {
        var attributes = this._attributes;

        for ( var i = 0, l = attributes.length; i < l; i++ ) {

            var type = attributes[ i ].className();

            if ( type === 'ShadowCastAttribute' ) {
                this._shadowCastAttribute = attributes[ i ];
            } else if ( type === 'Billboard' ) {
                this._isBillboard = !!attributes[ i ];
            } else if ( type === 'SkinningAttribute' ) {
                this._skinningAttribute = attributes[ i ];
            } else if ( type === 'MorphAttribute' ) {
                this._morphAttribute = attributes[ i ];
            } else if ( type === 'PointSizeAttribute' ) {
                this._pointSizeAttribute = attributes[ i ];
            }
        }
    },

    registerTextureAttributes: function () {},

    // Depth Shadow Map Casted from Light POV Depth encoded in color buffer
    createShadowCastDepth: function ( out ) {

        var inputs = {

            shadowDepthRange: this.getOrCreateUniform( 'vec4', 'uShadowDepthRange' ),
            fragEye: this.getOrCreateVarying( 'vec4', 'vViewVertex' ),

        };

        if ( this._shadowCastAttribute.getReceiveAttribute().getAtlas() && !this._shadowCastAttribute.getScissor() ) {

            inputs.shadowTextureMapSize = this.getOrCreateUniform( 'vec4', 'uShadowMapSize' );

        }

        this.getNode( 'ShadowCast' ).setShadowCastAttribute( this._shadowCastAttribute ).inputs( inputs ).outputs( {

            color: out

        } );

        return out;
    },

    // encapsulate for easier overwrite by user defined compiler
    // that would inherint from this compiler Do not merge with above method
    createFragmentShaderGraph: function () {
        var frag = this.getNode( 'glFragColor' );
        return [ this.createShadowCastDepth( frag ) ];
    }

} );

module.exports = CompilerShadowCast;
