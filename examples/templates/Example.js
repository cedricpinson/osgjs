( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;
    var Object = window.Object;

    var $ = window.$;


    var Example = function () {
        // documented here for classes that will inherits
        // so that we have a shared common set of variables


        // user Config:
        // - overriden by user param on url: see setConfigFromOptionsURL
        // - used for the GUI tweak: see initDatGui
        this._config = {

        };

        // resources to load prior calling Example:run
        this._texturesNames = [];
        this._meshNames = [];
        this._shaderNames = [];

        // defines
        this._mediaPath = '../media/';

        // main variables

        this._viewer = undefined;
        this._gui = undefined;
        this._shaderProcessor = undefined;
        this._canvas = undefined;

        this._root = new osg.Node();
        this._root.setName( 'root' );

        this._debugNodeRTT = new osg.Node();
        this._debugNodeRTT.setName( 'debugNodeRTT' );
        this._debugNodeRTT.getOrCreateStateSet().setRenderBinDetails( 1000, 'RenderBin' );
        this._root.addChild( this._debugNodeRTT );

    };

    Example.prototype = {

        run: function ( options ) {

            // get url parameter to override default _config values
            this.setConfigFromOptionsURL();
            //
            this._canvas = document.getElementById( 'View' );

            this._viewer = new osgViewer.Viewer( this._canvas, options );
            this._viewer.init();
            this._viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            this._viewer.setupManipulator();

            // add all nodes under this._root
            this.createScene();
            // add a Gui and its controller
            this.initDatGUI();

            // basic setup
            this._viewer.setSceneData( this._root );
            this._viewer.getManipulator().computeHomePosition();


            // TODO: only run after textures and shaders loaded ?
            this._viewer.run();
        },

        initDatGUI: function () {
            this._gui = new window.dat.GUI();
        },

        getRootNode: function () {
            return this._root;
        },

        setConfigFromOptionsURL: function () {

            // default & change config with URL params
            var queryDict = {};
            window.location.search.substr( 1 ).split( '&' ).forEach( function ( item ) {
                queryDict[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ];
            } );
            var keys = Object.keys( queryDict );
            for ( var i = 0; i < keys.length; i++ ) {
                var property = keys[ i ];
                try {

                    var n = JSON.parse( queryDict[ property ] );
                    if ( !isNaN( parseFloat( n ) ) && isFinite( n ) ) {
                        n = parseFloat( n );
                    }
                    this._config[ property ] = n;

                } catch ( e ) {
                    console.log( 'cannot parse url option: ' + property );
                }
            }
        },

        readTextures: function ( textures ) {

            var textureNames = textures || this._textureNames;
            var path = this._mediaPath + 'textures/';

            // generate array of paths
            var paths = textureNames.map( function ( name ) {
                return path + name;
            } );

            // generate array of promise
            var images = paths.map( function ( path ) {
                return osgDB.readImageURL( path );
            } );

            return images;

            // wait for all images
            //P.all( images ).then( function ( args ) {}

        },

        readShaders: function ( shadersFilenames ) {

            this._shaderProcessor = new osgShader.ShaderProcessor();

            var defer = P.defer();
            var shaderNames = shadersFilenames || this._shaderNames;
            var shaders = shaderNames.map( function ( arg ) {
                return arg;
            }.bind( this ) );


            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( P.resolve( $.get( shader ) ) );
            }.bind( this ) );

            P.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );

                this._shaderProcessor.addShaders( shaderNameContent );

                defer.resolve();

            }.bind( this ) );

            return defer.promise;

            // wait for shaders:
            // this.readShaders.then(function(){ this.run(); }.bind(this))
        },

        // create a shader program from both VS and FS fetched inside shaderprocessor
        createShader: function ( vName, vDefines, fName, fDefines ) {

            var vertexshader = this._shaderProcessor.getShader( vName, vDefines );
            var fragmentshader = this._shaderProcessor.getShader( fName, fDefines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
            return program;
        },

        hideDebugTextureList: function () {
            this._debugNodeRTT.setNodeMask( 0x0 );
        },

        showDebugTextureList: function () {
            this._debugNodeRTT.setNodeMask( ~0x0 );
        },

        toggleShowHideDebugTextureList: function () {
            if ( this._debugNodeRTT.getNodeMask() === 0 ) {
                this.showDebugTextureList();
            } else
                this.hideDebugTextureList();
        },

        // show the renderTexture as ui quad on left bottom screen
        // in fact show all texture inside this._rtt
        createDebugTextureList: function ( textureList, optionalArgs ) {

            // 20% of the resolution size
            var defaultRatio = 0.3;
            var screenRatio = this._canvas.width / this._canvas.height;
            var defaultWidth = Math.floor( this._canvas.width * defaultRatio );
            var defaultHeight = Math.floor( defaultWidth / screenRatio );

            var optionsDebug = {
                x: 0,
                y: 100,
                w: defaultWidth,
                h: defaultHeight,
                horizontal: true,
                screenW: this._canvas.width,
                screenH: this._canvas.height
            };

            if ( optionalArgs )
                osg.extend( optionsDebug, optionalArgs );

            if ( !this._programRTT ) {


                var vertexShader = [
                    '',
                    'attribute vec3 Vertex;',
                    'attribute vec2 TexCoord0;',
                    'varying vec2 vTexCoord0;',
                    'uniform mat4 uModelViewMatrix;',
                    'uniform mat4 uProjectionMatrix;',
                    'void main(void) {',
                    '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex,1.0));',
                    '  vTexCoord0 = TexCoord0;',
                    '}',
                    ''
                ].join( '\n' );

                var fgt = [
                    osgUtil.Composer.Filter.defaultFragmentShaderHeader, 'void main (void)', '{', '  gl_FragColor = texture2D(Texture0, vTexCoord0);', '}', ''
                ].join( '\n' );
                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexShader ), new osg.Shader( 'FRAGMENT_SHADER', fgt ) );

                this._programRTT = program;
            }

            var debugNodeRTT = this._debugNodeRTT;
            debugNodeRTT.setNodeMask( ~0x0 );
            debugNodeRTT.removeChildren();

            var debugComposerNode = new osg.Node();
            debugComposerNode.setName( 'debugComposerNode' );
            debugComposerNode.setCullingActive( false );

            // camera
            var debugComposerCamera = new osg.Camera();
            debugComposerCamera.setName( 'composerDebugCamera' );
            debugNodeRTT.addChild( debugComposerCamera );

            // create camera to setup RTT in overlay
            var cameraProjection = debugComposerCamera.getProjectionMatrix();
            osg.mat4.ortho( cameraProjection, 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5 );

            var cameraView = debugComposerCamera.getViewMatrix();
            osg.mat4.fromTranslation( cameraView, [ 0, 0, 0 ] );

            debugComposerCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
            debugComposerCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            debugComposerCamera.addChild( debugComposerNode );

            var xOffset = optionsDebug.x;
            var yOffset = optionsDebug.y;


            // why if no in fullscreen we would need to disable depth ?
            debugComposerNode.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

            // iterate on each texture to add them as thumbnails
            for ( var i = 0, l = textureList.length; i < l; i++ ) {
                var texture = textureList[ i ];

                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    var stateSet = quad.getOrCreateStateSet();
                    quad.setName( 'debugComposerGeometry' + i );

                    stateSet.setTextureAttributeAndModes( 0, texture );
                    stateSet.setAttributeAndModes( this._programRTT );
                    debugComposerNode.addChild( quad );

                    if ( optionsDebug.horizontal ) {
                        xOffset += optionsDebug.w + 2;
                    } else {
                        yOffset += optionsDebug.h + 2;
                    }
                }
            }

        },

        // get the model
        createModel: function ( modelName ) {

            var model = new osg.MatrixTransform();

            if ( modelName ) {

                // TODO: a generic model loader that fills also the Dat.gui

                // ../media/models/animation/' + modelName ?
                var request = osgDB.readNodeURL( modelName );
                request.then( function ( node ) {

                    model.addChild( node );

                } );

            } else {

                var size = 10;
                var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
                    size, size, size );
                model.addChild( geom );

            }

            return model;
        },

        // get the model
        getOrCreateModel: function ( modelName ) {

            if ( !this._model ) {
                this._model = new osg.MatrixTransform();
            } else {
                this._model.removeChildren();
            }

            this._model.addChild( this.createModel( modelName ) );
            return this._model;
        },


        createScene: function () {

            // create the model
            this._root.addChild( this.getOrCreateModel() );

        }

    };

    window.ExampleOSGJS = Example;
} )();
