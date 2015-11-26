( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;

    /*
        This filter makes the image look more sharp and defined.
        It is useful on blurred images to regain details
        It works by increasing the difference between near pixels
    */
    window.getPostSceneSharpen = function () {

        // Discrete Laplace convolution kernels from
        // http://en.wikipedia.org/wiki/Laplace_filter#Implementation_in_Image_Processing
        function laplace( x ) {
            return [ 0, -x, 0, -x, x * 4, -x, 0, -x, 0 ];
        }

        function laplaceDiagonal( x ) {
            return [ -0.5 * x, -x, -0.5 * x, -x, x * 6, -x, -0.5 * x, -x, -0.5 * x ];
        }

        var inputTexture = osg.Texture.createFromURL( 'Medusa.png' );

        var kernel = osg.Uniform.createMatrix3( laplace( 1 ), 'kernel' );
        var useDiagonal = false;
        var factor = 0;

        function updateKernel() {

            if ( useDiagonal )
                kernel.setMatrix3( laplaceDiagonal( factor ) );
            else
                kernel.setMatrix3( laplace( factor ) );
        }

        // 3x3 tap, 9 textures fetches
        // For each texel, we sum the difference with its neighboors
        // and add this computed difference to the original texel
        // which produce a 'sharpened' look
        // TODO: decides if we keep the diagonal one
        // If yes, optimize the path witout diagonals
        var sharpenFilter = new osgUtil.Composer.Filter.Custom(
            [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'varying vec2 FragTexCoord0;',
                'uniform sampler2D inputTexture;',
                'uniform vec2 RenderSize;',
                'uniform mat3 kernel;',

                'float stepX = 1.0/RenderSize.x;',
                'float stepY = 1.0/RenderSize.y;',

                'void main() {',

                '	vec4 color = texture2D(inputTexture, FragTexCoord0);',

                '	vec2 uv = FragTexCoord0;',
                '	vec2 offset = vec2(0.0);',
                '',
                '	for (int i=0; i < 3; i++) {',
                '		offset.x = (1.0 - float(i)) * stepX;',
                '		for (int j=0; j < 3; j++) {',
                '			offset.y = (1.0 - float(j)) * stepY;',
                '			color += kernel[i][j] * texture2D(inputTexture, FragTexCoord0 + offset);',
                '		}',
                '	}',

                '	gl_FragColor = color;',
                '}',
            ].join( '\n' ), {
                'kernel': kernel,
                'inputTexture': inputTexture
            }
        );

        var effect = {

            name: 'Sharpen',
            needCommonCube: false,

            buildComposer: function ( finalTexture ) {

                var composer = new osgUtil.Composer();
                composer.addPass( sharpenFilter, finalTexture );
                composer.build();

                return composer;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( this.name );
                folder.open();

                var kernel = {
                    kernel: 0,
                    'sample diagonal': false
                };

                var kernelCtrl = folder.add( kernel, 'kernel', 0, 5.0 );
                var diagonalCtrl = folder.add( kernel, 'sample diagonal' );

                kernelCtrl.onChange( function ( value ) {
                    factor = value;
                    updateKernel();
                } );
                diagonalCtrl.onChange( function ( bool ) {
                    useDiagonal = bool;
                    updateKernel();
                } );
            }
        };

        return effect;
    };
} )();
