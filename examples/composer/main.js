'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgViewer = window.osgViewer;
var osgUtil = window.osgUtil;

function getTextureShader() {

    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D Texture0;',

        '',
        'void main (void)',
        '{',
        '  vec2 uv = FragTexCoord0;',
        '  gl_FragColor = vec4(texture2D(Texture0, uv));',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
}

var stitchingSize = osg.Uniform.createFloat1( 84, 'stitchingSize' );
var invert = osg.Uniform.createInt1( true, 'invert' );

function createPostSceneStitching( sceneTexture, textureSize ) {

    var scene = new osg.MatrixTransform();

    // create a texture to render the final texture to
    var finalTexture = new osg.Texture();
    finalTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
    finalTexture.setMinFilter( 'NEAREST' );
    finalTexture.setMagFilter( 'NEAREST' );

    // create a textured quad on which is applied the final texture
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry(  -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                                                quadSize[ 0 ]       , 0, 0,
                                                0                   , 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getTextureShader() );
    quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );


    var stichingShader = new osgUtil.Composer.Filter.Custom(
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
        }
    );

    // Apply the stitching_shader on sceneTexture and render to final texture
    var composer = new osgUtil.Composer();
    composer.addPass( stichingShader, finalTexture );

    composer.build(); // if you dont build manually it will be done in the scenegraph while upading

    scene.addChild( composer );
    scene.addChild( quad );

    return scene;
}

var lensRadius = osg.Uniform.createFloat2( [0.5, 0.25], 'lensRadius');

function createPostSceneVignette( sceneTexture, textureSize ) {

    var scene = new osg.MatrixTransform();

    // create a texture to render the effect to
    var finalTexture = new osg.Texture();
    finalTexture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
    finalTexture.setMinFilter( 'NEAREST' );
    finalTexture.setMagFilter( 'NEAREST' );

    // create a textured quad on which is applied the final texture
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry(  -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                                                quadSize[ 0 ]       , 0, 0,
                                                0                   , 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getTextureShader() );
    quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );


    var vignetteShader = new osgUtil.Composer.Filter.Custom(
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

    // Apply the stitching_shader on sceneTexture and render to final texture
    var composer = new osgUtil.Composer();
    composer.addPass( vignetteShader, finalTexture );

    composer.build(); // if you dont build manually it will be done in the scenegraph while upading

    scene.addChild( composer );
    scene.addChild( quad );

    return scene;
}

var threshold = osg.Uniform.createFloat1( 0.5, 'threshold');
var setSceneTexture;

/// General idea for the bloom's algorithm:
// - Apply a brightpass to the scene texture to keep only the bright areas
// - Downsample the bright texture
// - Blur the bright texture to have a "glow" effect
// - Apply the blurred texture on the original scene texture
// (the downsample helps to reduce the cost of the blur)
function createPostSceneBloom( sceneTexture, textureSize, bloomTextureFactor ) {
   
    if (bloomTextureFactor === undefined) 
        bloomTextureFactor = 8;

    var currentSceneTexture = osg.Texture.createFromURL('Budapest.jpg');
    var cached_scenes = [];

    setSceneTexture = function(scene_file) {

    	// On met en cache lors du premier chargement
        if (cached_scenes[scene_file] === undefined)
            cached_scenes[scene_file] = osg.Texture.createFromURL(scene_file);

        currentSceneTexture = cached_scenes[scene_file];
        additiveShader.getStateSet().setTextureAttributeAndMode(0, currentSceneTexture);
        brightPass.getStateSet().setTextureAttributeAndMode(0, currentSceneTexture);
    };

    var scene = new osg.MatrixTransform();

    // create a downsized texture to render the bloom to
    var bloomTexture = new osg.Texture();
    bloomTexture.setTextureSize( textureSize[ 0 ] / bloomTextureFactor, textureSize[ 1 ] / bloomTextureFactor);
    bloomTexture.setMinFilter( 'LINEAR' );
    bloomTexture.setMagFilter( 'LINEAR' );    
   
    // create a texture to render the effect to
    var final_texture = new osg.Texture();
    final_texture.setTextureSize( textureSize[ 0 ], textureSize[ 1 ] );
    final_texture.setMinFilter( 'LINEAR' );
    final_texture.setMagFilter( 'LINEAR' );

    // create a textured quad on which is applied the final texture
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry(  -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                                                quadSize[ 0 ]       , 0, 0,
                                                0                   , 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getTextureShader() );
    quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, final_texture );

    var brightPass = new osgUtil.Composer.Filter.Custom(
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

            '}',
        ].join('\n'), 
        {
            'Texture0' : currentSceneTexture,
            'threshold' : threshold,
        }
    );

    var additiveShader = new osgUtil.Composer.Filter.Custom(
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

    var composer = new osgUtil.Composer();

    // Keep only the bright pixels and downsize the scene texture
    composer.addPass(brightPass, bloomTexture);

   // Blur the bright downsized sceneTexture
    composer.addPass(new osgUtil.Composer.Filter.HBlur(16));
    composer.addPass(new osgUtil.Composer.Filter.VBlur(16));
    composer.addPass(new osgUtil.Composer.Filter.HBlur(16));
    composer.addPass(new osgUtil.Composer.Filter.VBlur(16), bloomTexture);
    
    // Add the original scene texture and the bloom texture and render into final texture
    composer.addPass(additiveShader, final_texture);

    composer.build(); 

    scene.addChild( composer );
    scene.addChild( quad );

    return scene;
}


function commonScene( rttSize ) {

    var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );

    var near = 0.1;
    var far = 100;
    var root = new osg.MatrixTransform();

    var quadSize = [ 16 / 9, 1 ];

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.addChild( model );

    var UpdateCallback = function () {
        this.update = function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            var x = Math.cos( currentTime );
            osg.Matrix.makeRotate( x, 0, 0, 1, node.getMatrix() );
            node.traverse( nv );
        };
    };
    rootModel.setUpdateCallback( new UpdateCallback() );

    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName( 'scene' );
    camera.setProjectionMatrix( osg.Matrix.makePerspective( 50, quadSize[ 0 ], near, far, [] ) );
    camera.setViewMatrix( osg.Matrix.makeLookAt( [ 0, -10, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ], [] ) );
    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    camera.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
    camera.setClearColor( [ 0.5, 0.5, 0.5, 1 ] );

    // attach a texture to the camera to render the scene on
    var sceneTexture = new osg.Texture();
    sceneTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
    sceneTexture.setMinFilter( 'LINEAR' );
    sceneTexture.setMagFilter( 'LINEAR' );
    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, sceneTexture, 0 );
    camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
    // add the scene to the camera
    camera.addChild( rootModel );

    // attach camera to root
    root.addChild( camera );
    return [ root, sceneTexture ];
}

function createScene() {

    var rttSize = [ 1024, 1024 ];

    var result = commonScene( rttSize );
    var commonNode = result[ 0 ];
    var sceneTexture = result[ 1 ];

    var root = new osg.Node();

    var texW = osg.Uniform.createFloat1( rttSize[ 0 ], 'tex_w' );
    var texH = osg.Uniform.createFloat1( rttSize[ 1 ], 'tex_h' );

    root.getOrCreateStateSet().addUniform( texW );
    root.getOrCreateStateSet().addUniform( texH );

    root.addChild( commonNode );
    var scene;

    if ( true ) {
        scene = createPostSceneStitching( sceneTexture, rttSize );
        scene.setMatrix( osg.Matrix.makeTranslate( -2.0, 0.0, 0.0, [] ) );
        root.addChild( scene );
    }

    if (true) {
        scene = createPostSceneVignette(sceneTexture, rttSize);
        scene.setMatrix(osg.Matrix.makeTranslate(0.0, 0.0, 0.0, []));
        root.addChild(scene);
    }

    if (true) {
        scene = createPostSceneBloom(sceneTexture, rttSize);
        scene.setMatrix(osg.Matrix.makeTranslate(2.0, 0.0, 0.0, []));
        root.addChild(scene);
    }

    return root;
}


function buildStitchingGui(mainGui) {

    var folder = mainGui.addFolder('Stitching');

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

function buildVignettegGui(mainGui) {

    var folder = mainGui.addFolder('Vignette');

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
function buildBloomGui(mainGui) {

    var folder = mainGui.addFolder('Bloom');

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

var main = function () {

    // osg.ReportWebGLError = true;

    var canvas = document.getElementById( '3DView' );
    canvas.style.width = canvas.width = window.innerWidth;
    canvas.style.height = canvas.height = window.innerHeight;

    var gui = new dat.GUI();
    
    buildStitchingGui(gui);
    buildVignettegGui(gui);
    buildBloomGui(gui);

    document.getElementById( 'gui' ).appendChild( gui.domElement );

    var rotate = new osg.MatrixTransform();
    rotate.addChild( createScene( canvas.width, canvas.height ) );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    viewer.setSceneData( rotate );
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();
    viewer.run();

};

window.addEventListener( 'load', main, true );