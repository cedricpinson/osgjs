'use strict';

var UpdateRttCameraCallback = function ( rootView, offsetView ) {
    this._rootView = rootView;
    this._offsetView = offsetView;
};

UpdateRttCameraCallback.prototype = {
    update: function ( node, nv ) {
        var nodeView = node.getViewMatrix();
        osg.Matrix.mult( this._offsetView, this._rootView, nodeView );
        return true;
    }
};

function setupOculus( worldFactor, HMD, oculusUniforms, oculusMatrices ) {
    var aspect = HMD.hResolution / ( 2.0 * HMD.vResolution );
    var r = -1.0 - ( 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize );
    var distScale = ( HMD.distortionK[ 0 ] + HMD.distortionK[ 1 ] * Math.pow( r, 2 ) + HMD.distortionK[ 2 ] * Math.pow( r, 4 ) + HMD.distortionK[ 3 ] * Math.pow( r, 6 ) );
    var fov = ( 180.0 / Math.PI ) * 2.0 * Math.atan2( HMD.vScreenSize * distScale, 2.0 * HMD.eyeToScreenDistance );

    var proj = osg.Matrix.makePerspective( fov, aspect, 0.3, 10000.0 );
    var hOffset = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.interpupillaryDistance * 0.5 ) / HMD.hScreenSize;
    var lensShift = 4.0 * ( HMD.hScreenSize * 0.25 - HMD.lensSeparationDistance * 0.5 ) / HMD.hScreenSize;

    oculusMatrices.projectionLeft = osg.Matrix.preMult( osg.Matrix.makeTranslate( hOffset, 0.0, 0.0 ), proj );
    oculusMatrices.projectionRight = osg.Matrix.preMult( osg.Matrix.makeTranslate( -hOffset, 0.0, 0.0 ), proj );
    oculusMatrices.viewLeft = osg.Matrix.makeTranslate( worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0 );
    oculusMatrices.viewRight = osg.Matrix.makeTranslate( -worldFactor * HMD.interpupillaryDistance * 0.5, 0.0, 0.0 );

    oculusUniforms.lensCenterLeft = [ lensShift, 0.0 ];
    oculusUniforms.lensCenterRight = [ -lensShift, 0.0 ];
    oculusUniforms.hmdWarpParam = HMD.distortionK;
    oculusUniforms.chromAbParam = HMD.chromaAbParameter;
    oculusUniforms.scaleIn = [ 1.0, 1.0 / aspect ];
    oculusUniforms.scale = [ 1.0 / distScale, 1.0 * aspect / distScale ];
};

function getOculusShader() {
    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'attribute vec2 TexCoord0;',

        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',

        'varying vec2 vTexCoord;',

        'void main(void) {',
        '  vTexCoord = TexCoord0;',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'uniform vec2 uScale;',
        'uniform vec2 uScaleIn;',
        'uniform vec2 uLensCenter;',
        'uniform vec4 uHmdWarpParam;',
        'uniform vec4 uChromAbParam;',
        'uniform sampler2D Texture0;',

        'varying vec2 vTexCoord;',

        // from http://paradise.untergrund.net/tmp/demoshit/examples/js/effects/OculusRiftEffect.js
        'void main(void) {',
        '  vec2 uv = (vTexCoord * 2.0) - 1.0;', // range from [0,1] to [-1,1]
        '  vec2 theta = (uv - uLensCenter) * uScaleIn;',
        '  float rSq = theta.x * theta.x + theta.y * theta.y;',
        '  vec2 rvector = theta * (uHmdWarpParam.x + uHmdWarpParam.y * rSq + uHmdWarpParam.z * rSq * rSq + uHmdWarpParam.w * rSq * rSq * rSq);',
        '  vec2 rBlue = rvector * (uChromAbParam.z + uChromAbParam.w * rSq);',
        '  vec2 tcBlue = (uLensCenter + uScale * rBlue);',
        '  tcBlue = (tcBlue + 1.0) * 0.5;', // range from [-1,1] to [0,1]
        '  if (any(bvec2(clamp(tcBlue, vec2(0.0, 0.0), vec2(1.0, 1.0)) - tcBlue))) {',
        '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
        '    return;',
        '  }',
        '  vec2 tcGreen = uLensCenter + uScale * rvector;',
        '  tcGreen = (tcGreen + 1.0) * 0.5;', // range from [-1,1] to [0,1]
        '  vec2 rRed = rvector * (uChromAbParam.x + uChromAbParam.y * rSq);',
        '  vec2 tcRed = uLensCenter + uScale * rRed;',
        '  tcRed = (tcRed + 1.0) * 0.5;', // range from [-1,1] to [0,1]
        '  gl_FragColor = vec4(texture2D(Texture0, tcRed).r, texture2D(Texture0, tcGreen).g, texture2D(Texture0, tcBlue).b, 1);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( osg.Shader.VERTEX_SHADER, vertexshader ),
        new osg.Shader( osg.Shader.FRAGMENT_SHADER, fragmentshader ) );

    return program;
};

function createTextureRtt( rttSize ) {
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
    rttTexture.setMinFilter( 'LINEAR' );
    rttTexture.setMagFilter( 'LINEAR' );
    return rttTexture;
};

function createQuadRtt( isLeftCam, texture, ocUnifs ) {
    var quad = osg.createTexturedQuad( -0.5, -0.5, 0, 1, 0, 0, 0, 1, 0 );
    var orStateSet = quad.getOrCreateStateSet();
    orStateSet.setTextureAttributeAndMode( 0, texture );
    orStateSet.setAttributeAndMode( getOculusShader() );
    orStateSet.addUniform( new osg.Uniform.createFloat2( ocUnifs.scale, 'uScale' ) );
    orStateSet.addUniform( new osg.Uniform.createFloat2( ocUnifs.scaleIn, 'uScaleIn' ) );
    orStateSet.addUniform( new osg.Uniform.createFloat2( isLeftCam ? ocUnifs.lensCenterLeft : ocUnifs.lensCenterRight, 'uLensCenter' ) );
    orStateSet.addUniform( new osg.Uniform.createFloat4( ocUnifs.hmdWarpParam, 'uHmdWarpParam' ) );
    orStateSet.addUniform( new osg.Uniform.createFloat4( ocUnifs.chromAbParam, 'uChromAbParam' ) );
    return quad;
};

function createOrthoRtt( left, viewportSize, canvasSize ) {
    var orthoCamera = new osg.Camera();
    var vw = viewportSize[ 0 ];
    var vh = viewportSize[ 1 ];
    var cw = canvasSize[ 0 ];
    var ch = canvasSize[ 1 ];
    if ( left )
        orthoCamera.setViewport( new osg.Viewport( 0.5 * cw - vw, 0.5 * ( ch - vh ), vw, vh ) );
    else
        orthoCamera.setViewport( new osg.Viewport( 0.5 * cw, 0.5 * ( ch - vh ), vw, vh ) );
    orthoCamera.setProjectionMatrix( osg.Matrix.makeOrtho( -0.5, 0.5, -0.5, 0.5, -5, 5 ) );
    orthoCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
    orthoCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    return orthoCamera;
};

function createCameraRtt( texture, projMatrix ) {
    var camera = new osg.Camera();
    camera.setName( 'rtt camera' );
    camera.setViewport( new osg.Viewport( 0, 0, texture.getWidth(), texture.getHeight() ) );
    camera.setProjectionMatrix( projMatrix );
    camera.setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
    camera.setRenderOrder( osg.Camera.POST_RENDER, 0 );
    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );
    camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    return camera;
};

function loadUrl( url, viewer, rttCamLeft, rttCamRight ) {
    osg.log( 'loading ' + url );
    var req = new XMLHttpRequest();
    req.open( 'GET', url, true );
    req.onload = function ( aEvt ) {
        loadModel( JSON.parse( req.responseText ), viewer, rttCamLeft, rttCamRight )
        osg.log( 'success ' + url );
    };
    req.onerror = function ( aEvt ) {
        osg.log( 'error ' + url );
    };
    req.send( null );
};

function loadModel( data, viewer, rttCamLeft, rttCamRight ) {
    Q.when( osgDB.parseSceneGraph( data ) ).then( function ( child ) {
        rttCamLeft.addChild( child );
        rttCamRight.addChild( child );
        viewer.getManipulator().computeHomePosition();
    } );
};

function createScene( viewer, HMD ) {
    var canvas = document.getElementById( '3DView' );
    // XXX can be tweeked
    var rttSize = [ HMD.hResolution, HMD.vResolution ];
    var viewportSize = [ HMD.hResolution * 0.5, HMD.vResolution ];
    var canvasSize = [ canvas.width, canvas.height ];

    var worldFactor = 1.0; //world unit
    var oculusUniforms = {};
    var oculusMatrices = {};
    setupOculus( worldFactor, HMD, oculusUniforms, oculusMatrices );

    var rootViewMatrix = viewer.getCamera().getViewMatrix();

    var root = new osg.Node();

    var rttTextureLeft = createTextureRtt( rttSize );
    var rttCamLeft = createCameraRtt( rttTextureLeft, oculusMatrices.projectionLeft );
    var quadTextLeft = createQuadRtt( true, rttTextureLeft, oculusUniforms );
    var orthoCameraLeft = createOrthoRtt( true, viewportSize, canvasSize );
    rttCamLeft.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, oculusMatrices.viewLeft ) );

    var rttTextureRight = createTextureRtt( rttSize );
    var rttCamRight = createCameraRtt( rttTextureRight, oculusMatrices.projectionRight );
    var quadTextRight = createQuadRtt( false, rttTextureRight, oculusUniforms );
    var orthoCameraRight = createOrthoRtt( false, viewportSize, canvasSize );
    rttCamRight.setUpdateCallback( new UpdateRttCameraCallback( rootViewMatrix, oculusMatrices.viewRight ) );

    // loadUrl( 'models/ogre.osgjs', viewer, rttCamLeft, rttCamRight );
    loadModel( getPokerScene(), viewer, rttCamLeft, rttCamRight );

    orthoCameraLeft.addChild( quadTextLeft );
    orthoCameraRight.addChild( quadTextRight );

    root.addChild( rttCamLeft );
    root.addChild( rttCamRight );

    root.addChild( orthoCameraLeft );
    root.addChild( orthoCameraRight );

    return root;
};

window.addEventListener( 'load',
    function () {
        OSG.globalify();

        var HMD = {
            // Parameters from the Oculus Rift DK1
            hResolution: 1280,
            vResolution: 800,
            hScreenSize: 0.14976,
            vScreenSize: 0.0936,
            interpupillaryDistance: 0.064,
            lensSeparationDistance: 0.064,
            eyeToScreenDistance: 0.041,
            distortionK: [ 1.0, 0.22, 0.24, 0.0 ],
            chromaAbParameter: [ 0.996, -0.004, 1.014, 0.0 ]
        };

        if ( !vr.isInstalled() ) {
            alert( 'NPVR plugin not installed!' );
        }
        vr.load( function ( error ) {
            if ( error ) {
                alert( 'Plugin load failed: ' + error.toString() );
            }

            try {
                var canvas = document.getElementById( '3DView' );
                canvas.style.width = canvas.width = window.innerWidth;
                canvas.style.height = canvas.height = window.innerHeight;

                var viewer = new osgViewer.Viewer( canvas );
                viewer.init();
                viewer.setSceneData( createScene( viewer, HMD ) );
                viewer.setupManipulator( new osgGA.FirstPersonManipulator() );
                viewer.run();
            } catch ( e ) {
                console.log( e );
            }
        } );
    }, true );
