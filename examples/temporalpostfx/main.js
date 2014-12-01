'use strict';

window.OSG.globalify();

var osg = window.osg;
//var osgUtil = window.osgUtil;
var osgViewer = window.osgViewer;
var osgShader = window.osgShader;
var $ = window.$;
var viewer;
var canvas;
//var visitor;
var shaderProcessor;

var doAnimate = true;
var doSync = true;

var addScene = function () {

    var NbItems = 3;
    var Deep = 2;
    var QuadSizeX = 1;
    var QuadSizeY = QuadSizeX * 9 / 16.0;
    var NbTotalItems = 0;
    var NbTotalNodes = 0;
    var Item;

    function getOrCreateItem() {
        if ( Item === undefined ) {
            var rq = osg.createTexturedQuadGeometry( -QuadSizeX / 2.0, -QuadSizeY / 2.0, 0,
                QuadSizeX, 0, 0,
                0, QuadSizeY, 0 );

            rq.setName( 'quad' );
            Item = rq;
        }
        return Item;
    }


    function createItems( deep ) {
        var scale = Math.pow( 2, deep - 1 );

        var root = new osg.MatrixTransform();
        root.setName( 'rootItems' );
        var nbx = NbItems;
        var nby = Math.floor( nbx * 9 / 16.0 );
        if ( deep === 0 ) {
            NbTotalItems += nbx * nby;
        }
        NbTotalNodes += nbx * nby;

        for ( var i = 0, l = nbx; i < l; i++ ) {
            for ( var j = 0, m = nby; j < m; j++ ) {
                var mt = new osg.MatrixTransform();
                mt.setName( 'rootItemsTransform' );
                var x, y, m2;
                if ( deep === 0 ) {
                    x = ( -nbx * 0.5 + 0.5 + i ) * 1.1;
                    y = ( -nby * 0.5 + 0.5 + j ) * 1.1;
                    m2 = osg.Matrix.create();
                    osg.Matrix.makeTranslate( x, y, 0, m2 );
                    mt.setMatrix( m2 );
                    if ( i % 2 === 0 ) {
                        mt.addChild( getOrCreateItem() );
                    } else {
                        mt.addChild( getOrCreateItem() );
                    }
                } else {
                    var s = nbx * deep * scale * 1.1;
                    x = ( -nbx * 0.5 + 0.5 + i ) * ( s );
                    y = ( -nby * 0.5 + 0.5 + j ) * ( s * 9 / 16.0 );
                    //osg.log([x,y]);
                    m2 = osg.Matrix.create();
                    osg.Matrix.makeTranslate( x, y, 0, m2 );
                    mt.setMatrix( m2 );
                    mt.addChild( createItems( deep - 1 ) );
                }
                root.addChild( mt );
            }
        }
        root.setName( 'model quads' );
        return root;
    }


    function createAliasedScene() {
        var root = createItems( Deep );
        var ss = root.getOrCreateStateSet();
        var material = new osg.Material();
        material.setDiffuse( [ 0, 1, 1, 1 ] );
        material.setAmbient( [ 0, 0, 1, 1 ] );
        ss.setAttributeAndMode( material );
        return root;
    }
    var newScene = createAliasedScene();
    return newScene;
};

var currentTime = 0;

function addModel() {

    //var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
    var model = addScene();

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.setName( 'rootModel' );
    rootModel.addChild( model );


    rootModel._name = 'UPDATED MODEL NODE';
    return rootModel;
}

function commonScene( rttSize, order, rootModel ) {

    var near = 0.1;
    var far = 100;

    var quadSize = [ 16 / 9, 1 ];


    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName( 'scene' );
    camera.setProjectionMatrix( osg.Matrix.makePerspective( 50, quadSize[ 0 ], near, far, [] ) );
    camera.setViewMatrix( osg.Matrix.makeLookAt( [ 0, 10, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ], [] ) );
    camera.setRenderOrder( order, 0 );
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

    // better view
    osg.Matrix.copy( [ 1.3408910815142607, 0, 0, 0, 0, 1.920982126971166, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0 ], camera.getProjectionMatrix() );
    osg.Matrix.copy( [ -1, 0, -0, 0, 0, 1, -0, 0, 0, -0, -1, 0, 0, 0, -10, 1 ], camera.getViewMatrix() );

    // attach camera to root
    var root = new osg.MatrixTransform();
    root.setName( 'CameraRTTFather' );
    root.addChild( camera );

    return [ root, sceneTexture, camera, rootModel ];
}

function readShaders() {
    var defer = Q.defer();
    shaderProcessor = new osgShader.ShaderProcessor();

    var shaders = [
        'baseVert',
        'baseFrag',
        'fxaa',
        'depthVert',
        'depthFrag',
        'reconstVert',
        'reconstFrag',
        'temporalDiffVert',
        'temporalDiffFrag',
        'temporalReprojectVert',
        'temporalReprojectFrag'
    ];

    var promises = [];
    var shadersLib = {};
    shaders.forEach( function ( shader ) {
        var promise = Q( $.get( 'shaders/' + shader + '.glsl?' + Math.random() ) );
        promise.then( function ( shaderText ) {
            if ( shader && shaderText ) {
                shadersLib[ shader ] = shaderText;
            }
        } );


        promises.push( promise );
    } );


    Q.all( promises ).then( function () {
        shaderProcessor.addShaders( shadersLib );
        defer.resolve();
    } );

    return defer.promise;
}

var shaderProcessor;

var getShaderProgram = function ( vs, ps, defines ) {

    var vertexshader = shaderProcessor.getShader( vs, defines );
    var fragmentshader = shaderProcessor.getShader( ps, defines );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ), new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

    return program;
};

var _rttDebugNode;
var _rtt = [];

// show the shadowmap as ui quad on left bottom screen
// in fact show all texture inside this._rtt
function showFrameBuffers( optionalArgs ) {

    var _ComposerdebugNode = new osg.Node();
    _ComposerdebugNode.setName( 'debugComposerNode' );
    _ComposerdebugNode.setCullingActive( false );
    var _ComposerdebugCamera = new osg.Camera();
    _ComposerdebugCamera.setName( '_ComposerdebugCamera' );
    _rttDebugNode.addChild( _ComposerdebugCamera );

    var optionsDebug = {
        x: 0,
        y: 100,
        w: 100,
        h: 80,
        horizontal: true,
        screenW: 1024,
        screenH: 768,
        fullscreen: false
    };
    if ( optionalArgs )
        osg.extend( optionsDebug, optionalArgs );


    var matrixDest = _ComposerdebugCamera.getProjectionMatrix();
    osg.Matrix.makeOrtho( 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5, matrixDest );
    _ComposerdebugCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

    matrixDest = _ComposerdebugCamera.getViewMatrix();
    osg.Matrix.makeTranslate( 0, 0, 0, matrixDest );
    _ComposerdebugCamera.setViewMatrix( matrixDest );
    _ComposerdebugCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
    _ComposerdebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    _ComposerdebugCamera.addChild( _ComposerdebugNode );

    var texture;
    var xOffset = optionsDebug.x;
    var yOffset = optionsDebug.y;
    _ComposerdebugNode.removeChildren();

    var stateset;
    var program = getShaderProgram( 'baseVert', 'baseFrag' );
    stateset = _ComposerdebugNode.getOrCreateStateSet();
    if ( !optionsDebug.fullscreen )
        stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
    stateset.setAttributeAndModes( program );
    for ( var i = 0, l = _rtt.length; i < l; i++ ) {
        texture = _rtt[ i ];
        if ( texture ) {
            var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

            stateset = quad.getOrCreateStateSet();

            quad.setName( 'debugCompoGeom' );

            stateset.setTextureAttributeAndMode( 0, texture );
            stateset.setAttributeAndModes( program );
            // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

            _ComposerdebugNode.addChild( quad );

            if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
            else yOffset += optionsDebug.h + 2;
        }
    }
}

function updateDebugRtt() {
    // show the shadowmap as ui quad on left bottom screen

    if ( _rttDebugNode ) {
        _rttDebugNode.removeChildren();
    } else {
        _rttDebugNode = new osg.Node();
        _rttDebugNode.setName( '_rttDebugNode' );
    }

    showFrameBuffers( {
        screenW: canvas.width,
        screenH: canvas.height
    } );
}

function createScene( width, height, gui ) {

    var rttSize = [ width, height ];
    // cannot add same model multiple in same grap
    // it would break previousframe matrix saves

    var model = addModel(); // "current frame model" added twise if no model2
    //   var model2 = addModel(  ); // "previous frame model", making it different
    //////////////////////////////
    // store depth for next frame
    var result2 = commonScene( rttSize, osg.Camera.POST_RENDER, model );
    var commonNode2 = result2[ 0 ];
    var sceneTexture2 = result2[ 1 ];
    var cameraRTT2 = result2[ 2 ];

    //////////////////////////////////////////////
    // write depth into texture using that depth shader.
    var st = cameraRTT2.getOrCreateStateSet();
    var prg = getShaderProgram( 'depthVert', 'depthFrag' );
    st.setAttributeAndMode( prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE );

    //////////////////////////////////////////////
    // render current Scene using last depth as texture for all input
    var result = commonScene( rttSize, osg.Camera.PRE_RENDER, model );
    var commonNode = result[ 0 ];
    var sceneTexture = result[ 1 ];
    var cameraRTT = result[ 2 ];

    var root = new osg.Node();
    root.setName( 'rootcreateScene' );

    var texW = osg.Uniform.createFloat1( rttSize[ 0 ], 'tex_w' );
    var texH = osg.Uniform.createFloat1( rttSize[ 1 ], 'tex_h' );

    root.getOrCreateStateSet().addUniform( texW );
    root.getOrCreateStateSet().addUniform( texH );

    // create a quad on which will be applied the postprocess effects
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry( -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
        quadSize[ 0 ], 0, 0,
        0, 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getShaderProgram( 'baseVert', 'baseFrag' ) );
    quad.setName( 'TextureFinalTV' );
    var scene = new osg.MatrixTransform();
    scene.setName( 'sceneFinalTV' );

    // create a texture to render the effect to
    var finalTexture = new osg.Texture();
    finalTexture.setTextureSize( width, height );
    finalTexture.setMinFilter( osg.Texture.LINEAR );
    finalTexture.setMagFilter( osg.Texture.LINEAR );

    // Set the final texture on the quad
    quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );

    var postScenes = [
        getTemporalReproject(),
        getFxaa()
    ];

    var effects = [];
    for ( var i = 0; i < postScenes.length; i++ )
        effects[ postScenes[ i ].name ] = postScenes[ i ];

    var globalGui = {
        'filter': postScenes[ 0 ].name,
        'factor': 1.0,
        'animate': function () {
            doAnimate = !doAnimate;
        },
        'sync': function () {
            doSync = !doSync;
        },
        'reload': function () {
            readShaders().then( function () {
                if ( console.clear ) console.clear();
                setComposer( globalGui.filter, parseFloat( globalGui.factor ) );
            } );
        }
    };

    function addSceneController() {
        gui.add( globalGui, 'filter', Object.keys( effects ) ).onChange( function ( value ) {
            setComposer( value, parseFloat( globalGui.factor ) );
        } );
        gui.add( globalGui, 'factor', 0.125, 3.0 ).onChange( function ( value ) {
            setComposer( globalGui.filter, parseFloat( value ) );
        } );

        gui.add( globalGui, 'animate' );
        gui.add( globalGui, 'sync' );

        gui.add( globalGui, 'reload' );
    }

    if ( postScenes[ 0 ].getSceneProgram ) {
        cameraRTT = result[ 2 ];
        st = cameraRTT.getOrCreateStateSet();
        prg = postScenes[ 0 ].getSceneProgram();
        st.setAttributeAndMode( prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE );
        st.setTextureAttributeAndMode( 0, sceneTexture2, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
        st.addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
    }

    var currentComposer = postScenes[ 0 ].buildComposer( sceneTexture, finalTexture, quad, scene );
    addSceneController();
    postScenes[ 0 ].buildGui( gui );

    var cachedComposers = [];
    cachedComposers[ postScenes[ 0 ].name ] = currentComposer;

    function setComposer( effectName, textureScale ) {

        // recreate the rtt
        //
        root.removeChild( commonNode );
        //if ( rttSize[ 0 ] !== width * textureScale || rttSize[ 1 ] !== height * textureScale ) {

        rttSize = [ width * textureScale, height * textureScale ];

        // new scene Texture
        result = commonScene( rttSize, osg.Camera.PRE_RENDER, model );
        commonNode = result[ 0 ];
        sceneTexture = result[ 1 ];

        if ( effects[ effectName ].getSceneProgram ) {
            cameraRTT = result[ 2 ];

            var st = cameraRTT.getOrCreateStateSet();
            //var st = modelRTT.getOrCreateStateSet();
            var prg = effects[ effectName ].getSceneProgram();
            st.setAttributeAndMode( prg, osg.StateAttribute.ON || osg.StateAttribute.OVERRIDE );
            st.setTextureAttributeAndMode( 0, sceneTexture2, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );

        }

        // new final Texture
        finalTexture = new osg.Texture();
        finalTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
        texW.set( rttSize[ 0 ] );
        texH.set( rttSize[ 1 ] );
        finalTexture.setMinFilter( osg.Texture.LINEAR );
        finalTexture.setMagFilter( osg.Texture.LINEAR );
        quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );
        //}

        //
        //
        // Put the composer in cache at first utilization
        //if ( cachedComposers[ effectName ] === undefined ) {
        cachedComposers[ effectName ] = effects[ effectName ].buildComposer( sceneTexture, finalTexture, quad, scene );
        //}


        // Recreate the whole gui
        gui.destroy();
        gui = new dat.GUI();
        addSceneController();
        effects[ effectName ].buildGui( gui );

        // Change the composer
        scene.removeChild( currentComposer );
        currentComposer = cachedComposers[ effectName ];
        scene.addChild( currentComposer );

        if ( effects[ effectName ].needCommonCube ) {
            root.addChild( commonNode );
        }

        _rtt = [];
        _rtt.push( sceneTexture2 );
        _rtt.push( sceneTexture );
        _rtt.push( finalTexture );
        updateDebugRtt();

    }

    scene.addChild( quad );
    scene.addChild( currentComposer );


    _rtt = [];
    _rtt.push( sceneTexture2 );
    _rtt.push( sceneTexture );
    _rtt.push( finalTexture );
    updateDebugRtt();

    scene.addChild( _rttDebugNode );


    root.addChild( scene );
    root.addChild( commonNode );
    root.addChild( commonNode2 );

    // update once a frame
    var UpdateCallback = function () {
        this.update = function ( node, nv ) {
            if ( doAnimate ) {
                currentTime = nv.getFrameStamp().getSimulationTime();
                var x = Math.cos( currentTime );
                osg.Matrix.makeRotate( x, 0, 0, 1, model.getMatrix() );
            }

            // making sure here.
            osg.Matrix.copy( cameraRTT.getProjectionMatrix(), cameraRTT2.getProjectionMatrix() );
            osg.Matrix.copy( cameraRTT.getViewMatrix(), cameraRTT2.getViewMatrix() );

            node.traverse( nv );
        };
    };
    root.setUpdateCallback( new UpdateCallback() );

    return root;
}

var main = function () {

    // osg.ReportWebGLError = true;

    canvas = document.getElementById( 'View' );
    canvas.style.width = canvas.width = window.innerWidth;
    canvas.style.height = canvas.height = window.innerHeight;

    var gui = new dat.GUI();
    viewer = new osgViewer.Viewer( canvas );
    viewer.init();

    readShaders().then( function () {
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene( canvas.width, canvas.height, gui ) );
        rotate.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( 'DISABLE' ) );
        viewer.setSceneData( rotate );
        /*
        visitor = new osgUtil.DisplayNodeGraphVisitor();
        rotate.accept( visitor );
        visitor.createGraph();
*/
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.run();
    } );
};




window.addEventListener( 'load', main, true );