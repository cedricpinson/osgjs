
function getPostSceneVignette(sceneTexture) {

    var lensRadius = osg.Uniform.createFloat2( [0.8, 0.25], 'lensRadius');

    var vignetteFilter = new osgUtil.Composer.Filter.Custom(
        [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 FragTexCoord0;',
            'uniform sampler2D Texture0;',
            'uniform vec2 lensRadius;', // 0.45, 0.38

            'void main(void) {',
            '  vec4 color = texture2D( Texture0, FragTexCoord0);',
            '  float dist = distance(FragTexCoord0.xy, vec2(0.5,0.5));',
            '  color.rgb *= smoothstep(lensRadius.x, lensRadius.y, dist);',
            '  gl_FragColor = color;',
            '}',
        ].join('\n'), 
        {
            'Texture0': sceneTexture,
            'lensRadius': lensRadius,
        }
    );

    var effect = {

        name: 'Vignette',

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();
            composer.addPass(vignetteFilter, finalTexture);
            composer.build();
            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder(this.name);
            folder.open();
            
            var vignette = {
                inner_radius : lensRadius.get()[1],
                outer_radius : lensRadius.get()[0]
            };

            var inner_controller = folder.add(vignette, 'inner_radius', 0, 1);
            var outer_controller = folder.add(vignette, 'outer_radius', 0, 1);

            inner_controller.onChange(function ( value ) {
                lensRadius.get()[1] = value;
                lensRadius.dirty();
            });

            outer_controller.onChange(function ( value ) {
                lensRadius.get()[0] = value;
                lensRadius.dirty();
            });
        }
    };

    return effect;

}