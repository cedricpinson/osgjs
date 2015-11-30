( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;

    /*
        This effect simulate the visual effect produced by camera lens.
        Lens used in optics have a different indice of refraction for different wavelengths
        As wavelengths are what we perceive as colors, we can see "fringes" of color along
        boundaries that separate dark and bright parts.
    */
    window.getPostSceneChromaticAberration = function () {

        var inputTexture = osg.Texture.createFromURL( 'Chess20.png' );

        var factor = osg.Uniform.createFloat1( 0.01, 'factor' );

        // TODO: Add a (radial?) blur because sharp red and blue aberrations are not realistic
        var chromaticAbberationFilter = new osgUtil.Composer.Filter.Custom(
            [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'varying vec2 FragTexCoord0;',
                'uniform sampler2D input_texture;',
                'uniform float factor;',

                'void main() {',

                // Texel to center vector
                // This vector gives the direction and a linear
                // scaling component for the offset
                '   vec2 dist = FragTexCoord0 - 0.5;',

                // If we just linearly offset the fetch, the result would just look uniformly scaled
                // So we apply another factor based on the distance to have an offset which changes
                // quadratically to reproduce the distortion of a lens that scales along the curve
                '   float dist_length = length(dist);',

                '   vec2 offset = factor * dist * dist_length;',

                // For the texel, we sample each component separately
                // The red is sampled towards the center
                // The blue is sampled in the opposite direction
                // The green sampling location is untouched
                '   float r = texture2D(input_texture, FragTexCoord0 - offset).r;',
                '   float g = texture2D(input_texture, FragTexCoord0).g;',
                '   float b = texture2D(input_texture, FragTexCoord0 + offset).b;',

                '   gl_FragColor = vec4(r, g, b, 1.0);',

                '}'
            ].join( '\n' ), {
                input_texture: inputTexture,
                factor: factor
            } );

        var effect = {

            name: 'Chromatic abberation',
            needCommonCube: false,

            buildComposer: function ( finalTexture ) {

                var composer = new osgUtil.Composer();
                composer.addPass( chromaticAbberationFilter, finalTexture );
                return composer;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( this.name );
                folder.open();

                var param = {
                    factor: factor.getInternalArray()[ 0 ]
                };

                var factorCtrl = folder.add( param, 'factor', 0, 0.05 );

                factorCtrl.onChange( function ( value ) {
                    factor.setFloat( value );
                } );
            }
        };

        return effect;
    };
} )();
