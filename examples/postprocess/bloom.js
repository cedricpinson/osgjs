/*
    This filter simulate a property of lenses which tends to make
    highly lit areas bleed along its normal borders
*/
function getPostSceneBloom(sceneTexture, bloomTextureFactor) {

    var threshold = osg.Uniform.createFloat1( 0.8, 'threshold');

    if (bloomTextureFactor === undefined) 
        bloomTextureFactor = 8;

    var currentSceneTexture = osg.Texture.createFromURL('Budapest.jpg');
    var cached_scenes = [];

    var setSceneTexture = function(scene_file) {

        // On met en cache lors du premier chargement
        if (cached_scenes[scene_file] === undefined)
            cached_scenes[scene_file] = osg.Texture.createFromURL(scene_file);

        currentSceneTexture = cached_scenes[scene_file];
        additiveFilter.getStateSet().setTextureAttributeAndMode(0, currentSceneTexture);
        brightFilter.getStateSet().setTextureAttributeAndMode(0, currentSceneTexture);
    };

    // create a downsized texture to render the bloom to
    var bloomTexture = new osg.Texture();
    bloomTexture.setTextureSize( sceneTexture.getWidth() / bloomTextureFactor, sceneTexture.getHeight() / bloomTextureFactor);
    bloomTexture.setMinFilter( 'LINEAR' );
    bloomTexture.setMagFilter( 'LINEAR' );   

    var brightFilter = new osgUtil.Composer.Filter.Custom(
        [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            '#define USE_LINEAR_SPACE 1',

            'varying vec2 FragTexCoord0;',
            'uniform sampler2D Texture0;',
            'uniform float threshold;',

            // Definition of luminance from http://en.wikipedia.org/wiki/Luma_%28video%29
            'float calcLuminance(vec3 pixel) {',
                '#ifdef USE_LINEAR_SPACE',
                    'pixel = pow(pixel, vec3(2.2));',
                    'return pow(max(dot(pixel, vec3(0.2126, 0.7152, 0.0722)), 0.001), 1.0/2.2);',
                '#else',
                    'return max(dot(pixel, vec3(0.2126, 0.7152, 0.0722)), 0.001);',
                '#endif',
            '}',

            'void main(void) {',
            '  vec4 color = texture2D( Texture0, FragTexCoord0);',

                // Keep only the pixels whose luminance is above threshold
                'if (calcLuminance(color.rgb) > threshold)',
                    'gl_FragColor = color;',
                'else',
                    'gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',

            '}',
        ].join('\n'), 
        {
            'Texture0' : currentSceneTexture,
            'threshold' : threshold,
        }
    );

    var additiveFilter = new osgUtil.Composer.Filter.Custom(
        [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 FragTexCoord0;',
            'uniform sampler2D Texture0;',
            'uniform sampler2D Texture1;',

            'void main(void) {',
            '  vec4 color_a = texture2D( Texture0, FragTexCoord0);',
            '  vec4 color_b = texture2D( Texture1, FragTexCoord0);',

            '  gl_FragColor = color_a + color_b;',
            '}',
        ].join('\n'),
        {
            'Texture0': currentSceneTexture,
            'Texture1': bloomTexture,
        }
    );

    var AvgVBlurFilter = new osgUtil.Composer.Filter.AverageVBlur(4);
    var AvgHBlurFilter = new osgUtil.Composer.Filter.AverageHBlur(4);

    /* General idea for the bloom's algorithm:
        - Apply a brightpass to the scene texture to keep only the bright areas
        - Downsample the bright texture
        - Blur the bright texture to have a "glow" effect
        - Apply the blurred texture on the original scene texture
        (the downsampling helps to reduce the cost of the blur) 
    */
    var effect = {
        
        name: 'Bloom',
        needCommonCube: false,

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();

            // Keep only the bright pixels and downsize the scene texture
            composer.addPass(brightFilter, bloomTexture);

           // Blur the bright downsized sceneTexture
            composer.addPass(AvgVBlurFilter);
            composer.addPass(AvgHBlurFilter);
            composer.addPass(AvgVBlurFilter);
            composer.addPass(AvgHBlurFilter, bloomTexture);
            
            // Add the original scene texture and the bloom texture and render into final texture
            composer.addPass(additiveFilter, finalTexture);

            composer.build(); 

            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder('Bloom');
            folder.open();
            
            var bloom = {
                scene : ['Budapest.jpg', 'Beaumaris.jpg', 'Seattle.jpg'],
                threshold : threshold.get()[0],
            };

            var scene_controller = folder.add(bloom, 'scene', bloom.scene);
            var threshold_controller = folder.add(bloom, 'threshold', 0.001, 0.99);

            threshold_controller.onChange(function ( value ) {
                threshold.set(value);
            });

            scene_controller.onChange(function(value) {
                setSceneTexture(value);
            });           
        }
    };

    return effect;

}
