


function getPostSceneSharpen(sceneTexture) {

    var input_texture = osg.Texture.createFromURL('Medusa.png');

    //SET FINAL8TEXTURE LINEAR

    var kernel = osg.Uniform.createMatrix3(laplace(1), 'kernel');
    var use_diagonal = false;
    var factor = 0;

    function updateKernel() {

        if (use_diagonal)
            kernel.set(laplace(factor));
        else
            kernel.set(laplace_diagonal(factor));
    }   

    // Discrete Laplace convolution kernels from 
    // http://en.wikipedia.org/wiki/Laplace_filter#Implementation_in_Image_Processing
    function laplace(x) {return [0, -x, 0, -x, x*4, -x, 0, -x, 0]; }

    function laplace_diagonal(x) {return [-0.5*x, -x, -0.5*x, -x, x*6, -x, -0.5*x, -x, -0.5*x]; }

    // For each texel, we sum the difference with its neighboors
    // and add this computed difference to the original texel
    // which produce a 'sharpened' look
    var sharpenFilter = new osgUtil.Composer.Filter.Custom(
        [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'varying vec2 FragTexCoord0;',
        'uniform sampler2D input_texture;',
        'uniform vec2 RenderSize;',
        'uniform mat3 kernel;',

        'float stepX = 1.0/RenderSize.x;',
        'float stepY = stepX;',

        'void main() {',

            'vec4 color = texture2D(input_texture, FragTexCoord0);',

            'vec2 uv = FragTexCoord0;',
            'vec2 offset = vec2(0.0);',

            'for (int i=0; i < 3; i++)',
            '{',
                'offset.x = (1.0 - float(i)) * stepX;',
                'for (int j = 0; j < 3; j++)',
                '{',
                    'offset.y = (1.0 - float(j)) * stepY;',

                    'color += kernel[i][j] * texture2D(input_texture, FragTexCoord0 + offset);',
                '}',
            '}',

        'gl_FragColor = color;',
        '}',
        ].join('\n'),
        {
            'kernel': kernel,
            'input_texture': input_texture
        }
    );

    var effect = {

        name: 'Sharpen',

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();
            composer.addPass(sharpenFilter, finalTexture);
            composer.build();

            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder(this.name);

            var kernel = {
                'kernel': 0,
                'sample diagonal': false
            };

            var kernel_controller = folder.add(kernel, 'kernel', 0, 5.0);
            var diagonal_controller = folder.add(kernel, 'sample diagonal');

            kernel_controller.onChange(function ( value ) {
                factor = value;
                updateKernel();
            });
            diagonal_controller.onChange(function ( bool ) {
                use_diagonal = bool;
                updateKernel();
            });
        }
    };

    return effect;
}