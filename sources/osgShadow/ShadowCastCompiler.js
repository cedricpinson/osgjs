define( [
    'osg/Utils',
    'osgShader/Compiler',


], function ( MACROUTILS, Compiler ) {

    'use strict';

    var CompilerShadowCast = function () {
        Compiler.apply( this, arguments );
        this._isVertexColored = false;
        this._isLighted = false;
    };

    CompilerShadowCast.prototype = MACROUTILS.objectInherit( Compiler.prototype, {
        getCompilerName: function () {
            return 'ShadowCast';
        },
        getFragmentShaderName: function () {
            return this.getCompilerName();
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
                }
            }
        },
        registerTextureAttributes: function () {},
        registerTextureShadow: function () {},

        // Fast Path, only Depth
        declareVertexTransforms: function ( glPosition ) {
            this.declareTransformWithEyeSpace( glPosition );
        },

        // Depth Shadow Map Casted from Light POV
        // Depth encoded in color buffer
        createShadowCastDepth: function () {

            var frag = this.createVariable( 'vec4' );

            this.getNode( 'ShadowCast' ).setShadowCastAttribute( this._shadowCastAttribute ).inputs( {

                exponent0: this.getOrCreateUniform( 'float', 'exponent0' ),
                exponent1: this.getOrCreateUniform( 'float', 'exponent1' ),
                shadowDepthRange: this.getOrCreateUniform( 'vec4', 'Shadow_DepthRange' ),
                fragEye: this.getOrCreateInputPosition()

            } ).outputs( {

                color: frag

            } );

            return frag;
        },

        // encapsulate for easier overwrite by user defined compiler
        // that would inherint from this compiler
        // Do not merge with above method
        createFragmentShaderGraph: function () {

            var depthFrag = this.createShadowCastDepth();
            var frag = this.getNode( 'glFragColor' );
            this.getNode( 'SetFromNode' ).inputs( depthFrag ).outputs( frag );
            return [ frag ];
        }

    } );

    return CompilerShadowCast;

} );
