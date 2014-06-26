
function getPostSceneToneMapping() {

    var inputTexture = osg.Texture.createFromURL('Chess20.png');

    var factor = osg.Uniform.createFloat1(0.01, 'factor');

    var toneMappingFilter = new osgUtil.Composer.Filter.Custom(
        [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'varying vec2 FragTexCoord0;',
        'uniform sampler2D input_texture;',
        'uniform float factor;',

        'void main() {',

            'vec4 texel = texture2D(input_texture, FragTexCoord0);',
            
            'gl_FragColor = texel;',
            
        '}',
        ].join('\n'),
        {
            'input_texture': inputTexture,
            'factor': factor,
        });

    var effect = {

        name: 'Tone Mapping',

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();
            composer.addPass(toneMappingFilter, finalTexture);
            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder(this.name);

            var param = {
                'factor': factor.get()[0],
            };

            var factor_controller = folder.add(param, 'factor', 0, 0.05);

            factor_controller.onChange(function (value) { factor.set(value) } );
        }
    };

    return effect;
}
