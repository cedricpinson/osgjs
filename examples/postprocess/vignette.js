( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;

    /*
        This filter simulate the reduction of an image's brightness at the periphery compared to the image center.
        It can be used as an artistic effect or to reproduce the look of old photo and films
    */
    window.getPostSceneVignette = function ( sceneTexture ) {

        var lensRadius = osg.Uniform.createFloat2( [ 0.8, 0.25 ], 'lensRadius' );

        /*
            2 radiuses are used:
            Pixels which are inside  the circle defined by the inner radius are not altered
            Pixels which are outside the circle defined by the outer radius are set to black
            Pixels which are in between these two circles are progressively darkened towards the exterior
        */
        var vignetteFilter = new osgUtil.Composer.Filter.Custom(
            [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',
                'varying vec2 FragTexCoord0;',
                'uniform sampler2D Texture0;',
                'uniform vec2 lensRadius;',

                'void main(void) {',
                '  vec4 color = texture2D( Texture0, FragTexCoord0);',
                '  float dist = distance(FragTexCoord0.xy, vec2(0.5,0.5));',
                '  color.rgb *= smoothstep(lensRadius.x, lensRadius.y, dist);',
                '  gl_FragColor = color;',
                '}',
            ].join( '\n' ), {
                'Texture0': sceneTexture,
                'lensRadius': lensRadius,
            }
        );

        var effect = {

            name: 'Vignette',
            needCommonCube: true,

            buildComposer: function ( finalTexture ) {

                var composer = new osgUtil.Composer();
                composer.addPass( vignetteFilter, finalTexture );
                composer.build();
                return composer;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( this.name );
                folder.open();

                var vignette = {
                    innerRadius: lensRadius.getInternalArray()[ 1 ],
                    outerRadius: lensRadius.getInternalArray()[ 0 ]
                };

                var innerCtrl = folder.add( vignette, 'innerRadius', 0, 1 );
                var outerCtrl = folder.add( vignette, 'outerRadius', 0, 1 );

                innerCtrl.onChange( function ( value ) {
                    lensRadius.getInternalArray()[ 1 ] = value;
                } );

                outerCtrl.onChange( function ( value ) {
                    lensRadius.getInternalArray()[ 0 ] = value;
                } );
            }
        };

        return effect;

    };
} )();
