( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var Object = window.Object;

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
                osg.mat4.fromRotation( node.getMatrix(), -x, [ 0, 0, 1 ] );
                node.traverse( nv );
            };
        };
        rootModel.addUpdateCallback( new UpdateCallback() );

        // create the camera that render the scene
        var camera = new osg.Camera();
        camera.setName( 'scene' );
        camera.setProjectionMatrix( osg.mat4.perspective( osg.mat4.create(), Math.PI / 180 * 50, quadSize[ 0 ], near, far ) );

        camera.setViewMatrix( osg.mat4.lookAt( osg.mat4.create(), [ 0, -10, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ] ) );
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

    function getTextureShader() {

        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec2 TexCoord0;',
            'varying vec2 vTexCoord0;',
            'uniform mat4 uModelViewMatrix;',
            'uniform mat4 uProjectionMatrix;',
            'void main(void) {',
            '  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(Vertex,1.0);',
            '  vTexCoord0 = TexCoord0;',
            '}',
            ''
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 vTexCoord0;',
            'uniform sampler2D Texture0;',

            '',
            'void main (void)',
            '{',
            '  vec2 uv = vTexCoord0;',
            '  gl_FragColor = vec4(texture2D(Texture0, uv));',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
        return program;
    }

    function createScene( width, height, gui ) {

        var rttSize = [ 2048, 2048 ];

        var result = commonScene( rttSize );
        var commonNode = result[ 0 ];
        var sceneTexture = result[ 1 ];

        var root = new osg.Node();

        var texW = osg.Uniform.createFloat1( rttSize[ 0 ], 'tex_w' );
        var texH = osg.Uniform.createFloat1( rttSize[ 1 ], 'tex_h' );

        root.getOrCreateStateSet().addUniform( texW );
        root.getOrCreateStateSet().addUniform( texH );

        // create a quad on which will be applied the postprocess effects
        var quadSize = [ 16 / 9, 1 ];
        var quad = osg.createTexturedQuadGeometry( -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
            quadSize[ 0 ], 0, 0,
            0, 0, quadSize[ 1 ] );
        quad.getOrCreateStateSet().setAttributeAndModes( getTextureShader() );

        var scene = new osg.MatrixTransform();

        // create a texture to render the effect to
        var finalTexture = new osg.Texture();
        finalTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        finalTexture.setMinFilter( osg.Texture.LINEAR );
        finalTexture.setMagFilter( osg.Texture.LINEAR );

        // Set the final texture on the quad
        quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, finalTexture );

        var postScenes = [
            window.getPostSceneVignette( sceneTexture ),
            window.getPostSceneToneMapping(),
            window.getPostSceneBlur( sceneTexture ),
            window.getPostSceneBloom( sceneTexture ),
            window.getPostSceneSharpen( sceneTexture ),
            window.getPostSceneChromaticAberration()
        ];

        var effects = [];
        for ( var i = 0; i < postScenes.length; i++ )
            effects[ postScenes[ i ].name ] = postScenes[ i ];

        var globalGui = {
            'filter': postScenes[ 0 ].name
        };

        var setComposer;

        function addSceneController() {
            gui.add( globalGui, 'filter', Object.keys( effects ) ).onChange( function ( value ) {
                setComposer( value );
            } );
        }

        var currentComposer = postScenes[ 0 ].buildComposer( finalTexture );
        addSceneController();
        postScenes[ 0 ].buildGui( gui );

        var cachedComposers = [];
        cachedComposers[ postScenes[ 0 ].name ] = currentComposer;

        setComposer = function setComposer( effectName ) {

            // Put the composer in cache at first utilisation
            if ( cachedComposers[ effectName ] === undefined ) {
                cachedComposers[ effectName ] = effects[ effectName ].buildComposer( finalTexture );
            }

            // Recreate the whole gui
            gui.destroy();
            gui = new window.dat.GUI();
            addSceneController();
            effects[ effectName ].buildGui( gui );

            // Change the composer
            scene.removeChild( currentComposer );
            currentComposer = cachedComposers[ effectName ];
            scene.addChild( currentComposer );

            if ( effects[ effectName ].needCommonCube )
                root.addChild( commonNode );
            else
                root.removeChild( commonNode );

        };

        scene.addChild( quad );
        scene.addChild( currentComposer );

        root.addChild( scene );
        root.addChild( commonNode );

        return root;
    }

    var main = function () {

        // osg.ReportWebGLError = true;

        var canvas = document.getElementById( 'View' );
        canvas.style.width = canvas.width = window.innerWidth;
        canvas.style.height = canvas.height = window.innerHeight;

        var gui = new window.dat.GUI();

        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene( canvas.width, canvas.height, gui ) );
        rotate.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.run();

    };

    window.addEventListener( 'load', main, true );
} )();
