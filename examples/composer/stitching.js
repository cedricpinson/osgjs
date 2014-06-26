function getPostSceneStitching(sceneTexture) {

    var stitchingSize = osg.Uniform.createFloat1( 84, 'stitchingSize' );
    var invert = osg.Uniform.createInt1( true, 'invert' );

    var stichingFilter = new osgUtil.Composer.Filter.Custom(
        [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 FragTexCoord0;',
            'uniform sampler2D Texture0;',
            'uniform float tex_w; // GeeXLab built-in',
            'uniform float tex_h; // GeeXLab built-in',
            'uniform float stitchingSize;',
            'uniform int invert;',

            'vec4 PostFX(sampler2D tex, vec2 uv)',
            '{',
            '  vec4 c = vec4(0.0);',
            '  float size = stitchingSize;',
            '  vec2 cPos = uv * vec2(tex_w, tex_h);',
            '  vec2 tlPos = floor(cPos / vec2(size, size));',
            '  tlPos *= size;',
            '  int remX = int(mod(cPos.x, size));',
            '  int remY = int(mod(cPos.y, size));',
            '  if (remX == 0 && remY == 0)',
            '    tlPos = cPos;',
            '  vec2 blPos = tlPos;',
            '  blPos.y += (size - 1.0);',
            '  if ((remX == remY) ||',
            '     (((int(cPos.x) - int(blPos.x)) == (int(blPos.y) - int(cPos.y)))))',
            '  {',
            '    if (invert == 1)',
            '      c = vec4(0.2, 0.15, 0.05, 1.0);',
            '    else',
            '      c = texture2D(tex, tlPos * vec2(1.0/tex_w, 1.0/tex_h)) * 1.4;',
            '  }',
            '  else',
            '  {',
            '    if (invert == 1)',
            '      c = texture2D(tex, tlPos * vec2(1.0/tex_w, 1.0/tex_h)) * 1.4;',
            '    else',
            '      c = vec4(0.0, 0.0, 0.0, 1.0);',
            '  }',
            '  return c;',
            '}',
            '',
            'void main (void)',
            '{',
            '  vec2 uv = FragTexCoord0.st;',
            '  gl_FragColor = PostFX(Texture0, uv);',
            '}',
        ].join( '\n' ), 
        {
            'Texture0': sceneTexture,
            'stitchingSize': stitchingSize,
            'invert': invert,
        });

    var effect = {
        
        name: 'Stitching',

        buildComposer: function(finalTexture) {

            var composer = new osgUtil.Composer();
            composer.addPass(stichingFilter, finalTexture);
            composer.build();

            return composer;
        },

        buildGui: function(mainGui) {

            var folder = mainGui.addFolder(this.name);

            var stitching = {
                sizeValue: stitchingSize.get()[ 0 ],
                invertValue: invert.get()[ 0 ],
            };

            var sizeController = folder.add( stitching, 'sizeValue', 1, 128 );
            var invertController = folder.add( stitching, 'invertValue' );

            sizeController.onChange( function ( value ) {
                stitchingSize.set( value );
            } );
            invertController.onFinishChange( function ( value ) {
                invert.set( value );
            } );
        }
    };

    return effect;
}