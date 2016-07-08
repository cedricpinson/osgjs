( function () {
    'use strict';

    var ExampleOSGJS = window.ExampleOSGJS;

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgShader = OSG.osgShader;
    var osgUtil = OSG.osgUtil;
    var Texture = osg.Texture;

    var $ = window.$;
    var P = window.P;

    // Generates MAX_MIP_LEVEL depth mipmaps.
    // Do not forget to change the code in ssaoFragment.glsl
    // because the mipmaps are passed manually using texture units
    var MAX_MIP_LEVEL = 5;

    var shaderProcessor = new osgShader.ShaderProcessor();

    // Loads a glTF model and update
    // the current displayed scene in the Example
    var loadFiles = function ( example, files, sceneName ) {

        var promise = OSG.osgDB.Registry.instance().getReaderWriterForExtension( 'gltf' ).readNodeURL( files );
        promise.then( function ( scene ) {

            if ( !scene ) {

                example._config.scene = 'default';
                example.updateScene();

                return;

            }

            var mt = new osg.MatrixTransform();

            var mtr = new osg.MatrixTransform();
            osg.mat4.fromRotation( mtr.getMatrix(), Math.PI / 2, [ 1, 0, 0 ] );

            mtr.addChild( scene );
            mt.addChild( mtr );

            example.addScene( sceneName, mt );
        } );

    };

    // inherits for the ExampleOSGJS prototype
    var Example = function () {

        ExampleOSGJS.call( this );

        this._config = {
            scale: 1.0,
            radius: 1.00,
            bias: 0.08,
            intensity: 1.8,
            crispness: 0.8,
            scene: 'default'
        };

        // The two following attributes are use for sliders
        // normalization according to the scene bounding sphere
        this._baseSlidersBounds = {
            radius: [ 0.005, 0.3 ],
            bias: [ 0.01, 0.08 ],
            intensity: [ 0.01, 1.8 ],
        };
        this._baseSceneRadius = 2.8284271247461903;

        this._modelsMap = {};
        this._modelList = [];
        this._modelList.push( this._config.scene );

        this._aoUniforms = {
            uRadius: osg.Uniform.createFloat1( this._config.radius, 'uRadius' ),
            uRadius2: osg.Uniform.createFloat1( this._config.radius * this._config.radius, 'uRadius2' ),
            uBias: osg.Uniform.createFloat1( this._config.bias, 'uBias' ),
            uIntensity: osg.Uniform.createFloat1( this._config.intensity, 'uIntensity' ),
            uIntensityDivRadius6: osg.Uniform.createFloat1( this._config.intensity, 'uIntensityDivRadius6' ),
            uNear: osg.Uniform.createFloat1( 1.0, 'uNear' ),
            uFar: osg.Uniform.createFloat1( 1000.0, 'uFar' ),
            uProjectionInfo: osg.Uniform.createFloat4( new Array( 4 ), 'uProjectionInfo' ),
            uProjScale: osg.Uniform.createFloat1( 1.0, 'uProjScale' ),
            uDepthTexture: null,
        };

        this._blurUniforms = {
            uCrispness: osg.Uniform.createFloat( this._config.crispness, 'uCrispness' ),
        };

        this._viewer = null;
        this._composerNode = null;

        this._depthTexture = null;
        this._depthShader = null;
        this._rttCamera = null;

        this._previousViewport = new Array( 2 );
        this._projectionInfo = new Array( 4 );
    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        createScene: function () {

            var group = new osg.MatrixTransform();
            group.setName( 'group' );

            for ( var i = 0; i < 100; ++i ) {

                var sphere = osg.createTexturedSphereGeometry( Math.random() * 2.0 + 1.0, 32, 32 );
                var dir = osg.vec3.create();
                dir[ 0 ] = Math.random() * 2.0 - 1.0;
                dir[ 1 ] = Math.random() * 2.0 - 1.0;
                dir[ 2 ] = Math.random() * 2.0 - 1.0;
                osg.vec3.normalize( dir, dir );

                var scale = Math.random() * -15.0 + 15.0;
                dir[ 0 ] *= scale;
                dir[ 1 ] *= scale;
                dir[ 2 ] *= scale;

                var mt = new osg.MatrixTransform();

                osg.mat4.translate( mt.getMatrix(), mt.getMatrix(), dir );

                mt.addChild( sphere );
                group.addChild( mt );
            }

            group.addUpdateCallback( {

                update: function ( node ) {

                    var mt = node.getMatrix();
                    osg.mat4.rotate( mt, mt, 0.001, [ 1.0, 0, 0 ] );

                }


            } );

            this._modelsMap.default = group;

        },

        getRstatsOptions: function () {

            var values = {};
            var passNames = [];
            for ( var i = 1; i <= MAX_MIP_LEVEL; ++i ) {

                values[ 'mipmap_' + i ] = {
                    caption: 'mipmap_' + i,
                    average: true
                };
                passNames.push( 'mipmap_' + i );

            }
            passNames.push( 'ssao', 'blurh', 'blurv' );

            values.ssao = {
                caption: 'ssao',
                average: true
            };
            values.blurh = {
                caption: 'blurh',
                average: true
            };
            values.blurv = {
                caption: 'blurv',
                average: true
            };

            var group = [ {
                caption: 'SSAO Postprocess',
                values: passNames
            } ];

            return {
                values: values,
                groups: group
            };

        },

        createViewer: function () {
            this._canvas = document.getElementById( 'View' );
            this._viewer = new osgViewer.Viewer( this._canvas, {
                rstats: this.getRstatsOptions()
            } );
            this._viewer.init();

            this._viewer.setupManipulator();
            this._viewer.run();

            this._previousViewport[ 0 ] = this._canvas.width;
            this._previousViewport[ 1 ] = this._canvas.height;
        },

        readShaders: function () {

            var defer = P.defer();
            var self = this;

            var shaderNames = [
                'depthVertex.glsl',
                'depthFragment.glsl',
                'downsampleFragment.glsl',
                'ssaoFragment.glsl',
                'blurFragment.glsl',
            ];

            var shaders = shaderNames.map( function ( arg ) {
                return 'shaders/' + arg;
            }.bind( this ) );

            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( P.resolve( $.get( shader ) ) );
            } );

            P.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );
                shaderProcessor.addShaders( shaderNameContent );

                var vertexshader = shaderProcessor.getShader( 'depthVertex.glsl' );
                var fragmentshader = shaderProcessor.getShader( 'depthFragment.glsl' );

                self._depthShader = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                defer.resolve();

            } );

            return defer.promise;
        },

        createTexture: function ( name, filter, type, size ) {

            var texture = new osg.Texture();
            texture.setInternalFormatType( type );
            texture.setTextureSize( Math.floor( size.width ), Math.floor( size.height ) );

            texture.setInternalFormat( osg.Texture.RGBA );
            texture.setMinFilter( filter );
            texture.setMagFilter( filter );
            texture.setName( name );

            return texture;

        },

        createCameraRTT: function ( texture ) {

            var camera = new osg.Camera();
            camera.setName( 'MainCamera' );

            camera.setViewport( new osg.Viewport( 0, 0, this._canvas.width, this._canvas.height ) );

            camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
            camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );

            camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

            camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
            camera.setClearColor( osg.vec4.fromValues( 0.0, 0.0, 0.0, 1.0 ) );


            return camera;

        },

        createDepthCameraRTT: function () {

            var rttSize = {
                width: this._canvas.width,
                height: this._canvas.height
            };

            var rttDepth = this.createTexture( 'rttDepth', Texture.NEAREST, Texture.UNSIGNED_BYTE, rttSize );
            this._depthTexture = rttDepth;

            var cam = this.createCameraRTT( rttDepth );
            cam.setName( 'DepthCamera' );
            cam.setComputeNearFar( true );

            var stateSetCam = cam.getOrCreateStateSet();
            stateSetCam.setAttributeAndModes( this._depthShader );
            stateSetCam.addUniform( this._aoUniforms.uNear );
            stateSetCam.addUniform( this._aoUniforms.uFar );

            this._rttCamera = cam;

            return cam;
        },

        // Creates MAX_MIP_LEVEL depth mipmaps
        buildMipmapPasses: function ( downsampleFragment ) {

            var mipmaps = new Array( MAX_MIP_LEVEL );
            var uniforms = {
                uPreviousTexture: this._depthTexture,
                uPreviousViewport: osg.Uniform.createFloat2( [ this._canvas.width, this._canvas.height ], 'uPreviousViewport' )
            };

            for ( var i = 1; i <= MAX_MIP_LEVEL; ++i ) {

                var size = {
                    width: this._canvas.width >> i,
                    height: this._canvas.height >> i
                };

                var elt = {
                    texture: this.createTexture( 'mipmap_' + ( i - 1 ), Texture.NEAREST, Texture.UNSIGNED_BYTE, size ),
                    pass: new osgUtil.Composer.Filter.Custom( downsampleFragment, uniforms )
                };

                // Creates uniforms needed by the next pass
                uniforms = {
                    uPreviousTexture: elt.texture,
                    uPreviousViewport: osg.Uniform.createFloat2( [ size.width, size.height ], 'uPreviousViewport' )
                };

                mipmaps[ i - 1 ] = elt;
            }

            return mipmaps;
        },

        createComposer: function () {

            var i = 0;
            var composer = new osgUtil.Composer();

            var downsampleFragment = shaderProcessor.getShader( 'downsampleFragment.glsl' );
            var aoFragment = shaderProcessor.getShader( 'ssaoFragment.glsl' );
            var blurFragment = shaderProcessor.getShader( 'blurFragment.glsl' );

            // Creates AO textures for each pass
            var rttSize = {
                width: this._canvas.width,
                height: this._canvas.height
            };
            var rttAo = this.createTexture( 'rttAoTexture', Texture.LINEAR, Texture.UNSIGNED_BYTE, rttSize );
            var rttAoHorizontalFilter = this.createTexture( 'rttAoTextureHorizontal', Texture.LINEAR, Texture.UNSIGNED_BYTE, rttSize );

            // The Composer makes 3 passes
            // 1. downsamples `MAX_MIP_LEVEL` times the depth
            // 2. creates the noisy AO texture
            // 3. horizontal blur on the AO texture
            // 4. vertical blur on the previously blured texture

            // Downsampling pass
            var mipmapPasses = this.buildMipmapPasses( downsampleFragment );
            for ( i = 0; i < mipmapPasses.length; ++i ) {
                var elt = mipmapPasses[ i ];
                composer.addPass( elt.pass, elt.texture ).setFragmentName( 'mipmap_' + ( i + 1 ) );

                this._aoUniforms[ 'uMipmap' + i ] = elt.texture;
            }

            // Noisy AO pass
            this._aoUniforms.uDepthTexture = this._depthTexture;
            var aoPass = new osgUtil.Composer.Filter.Custom( aoFragment, this._aoUniforms );

            // Horizontal blur pass
            var horizontalBlurUniforms = {
                uAoTexture: rttAo,
                uAxis: osg.Uniform.createInt2( [ 1, 0 ], 'uAxis' ),
                uCrispness: this._blurUniforms.uCrispness,
                uRadius: this._aoUniforms.uRadius
            };
            var blurHorizontalPass = new osgUtil.Composer.Filter.Custom( blurFragment, horizontalBlurUniforms );

            // Vertical blur pass
            var verticalBlurUniforms = {
                uAoTexture: rttAoHorizontalFilter,
                uAxis: osg.Uniform.createInt2( [ 0, 1 ], 'uAxis' ),
                uCrispness: this._blurUniforms.uCrispness,
                uRadius: this._aoUniforms.uRadius
            };
            var blurVerticalPass = new osgUtil.Composer.Filter.Custom( blurFragment, verticalBlurUniforms );

            composer.addPass( aoPass, rttAo ).setFragmentName( 'ssao' );
            composer.addPass( blurHorizontalPass, rttAoHorizontalFilter ).setFragmentName( 'blurh' );
            composer.addPass( blurVerticalPass ).setFragmentName( 'blurv' );

            composer.renderToScreen( this._canvas.width, this._canvas.height );
            composer.build();

            // DEBUG
            var timerGPU = OSG.osg.TimerGPU.instance();
            var cameras = composer.getChildren();
            var nbCameras = cameras.length;

            for ( i = 0; i < nbCameras; ++i ) {

                var cam = cameras[ i ];
                var name = cam.getName();

                cam.setInitialDrawCallback( timerGPU.start.bind( timerGPU, name ) );
                cam.setFinalDrawCallback( timerGPU.end.bind( timerGPU, name ) );

            }
            // END DEBUG

            return composer;
        },

        updateFloatData: function ( uniform, value ) {

            uniform.setFloat( value );

        },

        updateScale: function () {

            var scale = this._config.scale;

            var matrixTransform = this._modelsMap[ this._config.scene ];
            var prevBsRadius = matrixTransform.getBoundingSphere().radius();

            osg.mat4.fromScaling( matrixTransform.getMatrix(), [ scale, scale, scale ] );

            this.normalizeSliders( prevBsRadius );
        },

        updateRadius: function () {
            var value = this._config.radius;

            var uniform = this._aoUniforms.uRadius;
            var radius2Uniform = this._aoUniforms.uRadius2;

            this.updateFloatData( uniform, value );
            this.updateFloatData( radius2Uniform, value * value );

            // (intensity / radius^6) is dependent from the radius
            this.updateIntensity();
            this.updateBias();
        },

        updateBias: function () {

            var uniform = this._aoUniforms.uBias;
            var value = this._config.bias * this._config.radius;

            this.updateFloatData( uniform, value );

        },

        updateIntensity: function () {

            var uniform = this._aoUniforms.uIntensity;
            var uniformIntensityDiv = this._aoUniforms.uIntensityDivRadius6;

            var intensity = this._config.intensity;

            var value = intensity / Math.pow( this._config.radius, 6 );
            uniform.setFloat( intensity );
            uniformIntensityDiv.setFloat( value );

        },

        normalizeSliders: function ( prevBsRadius ) {

            var node = this._modelsMap[ this._config.scene ];
            node.dirtyBound();

            var sceneRadius = node.getBoundingSphere().radius();
            var scale = this._baseSceneRadius;

            var ssaoFolder = this._gui.__folders.SSAO;
            var ssaoControllers = ssaoFolder.__controllers;

            var radBounds = this._baseSlidersBounds.radius;

            var radiusCont = ssaoControllers.filter( function ( cont ) {
                return cont.property === 'radius';
            } )[ 0 ];
            var biasCont = ssaoControllers.filter( function ( cont ) {
                return cont.property === 'bias';
            } )[ 0 ];
            var intensityCont = ssaoControllers.filter( function ( cont ) {
                return cont.property === 'intensity';
            } )[ 0 ];

            // Updates the bounds of the sliders
            radiusCont.__min = ( radBounds[ 0 ] * sceneRadius ) / scale;
            radiusCont.__max = ( radBounds[ 1 ] * sceneRadius ) / scale;

            if ( prevBsRadius ) {

                this._config.radius = ( sceneRadius * this._config.radius ) / prevBsRadius;

            } else {

                this._config.radius = radiusCont.__max * 0.9;
                this._config.bias = biasCont.__max * 0.35;
                this._config.intensity = intensityCont.__max * 0.65;

                if ( this._config.scene === 'default' ) {

                    this._config.radius = 1.8;
                    this._config.intensity = 1.0;
                    this._config.bias = 0.08;

                }

            }

            this.updateRadius();
            this.updateIntensity();
            this.updateBias();

            radiusCont.updateDisplay();
            intensityCont.updateDisplay();
            biasCont.updateDisplay();

        },

        initDatGUI: function () {

            this._gui = new window.dat.GUI();
            var gui = this._gui;

            var sceneFolder = gui.addFolder( 'Scene' );
            var ssaoFolder = gui.addFolder( 'SSAO' );
            var blurFolder = gui.addFolder( 'Blur' );

            var radiusBounds = this._baseSlidersBounds.radius;
            var biasBounds = this._baseSlidersBounds.bias;
            var intensityBounds = this._baseSlidersBounds.intensity;

            sceneFolder.add( this._config, 'scale', 1.0, 1500.0 )
                .onChange( this.updateScale.bind( this ) );
            sceneFolder.add( this._config, 'scene', this._modelList )
                .onChange( this.updateScene.bind( this, this._config.scene ) );

            ssaoFolder.add( this._config, 'radius', radiusBounds[ 0 ], radiusBounds[ 1 ] )
                .onChange( this.updateRadius.bind( this ) );
            ssaoFolder.add( this._config, 'bias', biasBounds[ 0 ], biasBounds[ 1 ] )
                .onChange( this.updateBias.bind( this ) );
            ssaoFolder.add( this._config, 'intensity', intensityBounds[ 0 ], intensityBounds[ 1 ] )
                .onChange( this.updateIntensity.bind( this ) );

            blurFolder.add( this._config, 'crispness', 0.1, 2.5 )
                .onChange( this.updateFloatData.bind( this, this._blurUniforms.uCrispness ) );

        },

        bindProjectionUpdateCallback: function ( camera ) {

            var self = this;
            var rootCam = self._viewer.getCamera();

            osg.mat4.copy( camera.getProjectionMatrix(), rootCam.getProjectionMatrix() );

            camera.setClampProjectionMatrixCallback( function ( m, computedNear, computedFar, nearFarRatio ) {

                var viewport = rootCam.getViewport();
                var width = viewport.width();
                var height = viewport.height();

                if ( self._previousViewport[ 0 ] !== width || self._previousViewport[ 1 ] !== height )
                    self.resizeEvent();

                this.clampProjectionMatrix( m, computedNear, computedFar, nearFarRatio );

                osg.mat4.copy( camera.getViewMatrix(), rootCam.getViewMatrix() );
                osg.mat4.copy( camera.getProjectionMatrix(), m );

                var frustum = {};
                osg.mat4.getFrustum( frustum, m );

                self._aoUniforms.uNear.setFloat( frustum.zNear );
                self._aoUniforms.uFar.setFloat( frustum.zFar );

                // Projection scale used to project
                // the SSAO radius into screen space
                var vFov = m[ 15 ] === 1 ? 1.0 : 2.0 / m[ 5 ];
                var scale = -2.0 * Math.tan( vFov * 0.5 );
                var projScale = height / scale;
                self._aoUniforms.uProjScale.setFloat( projScale );

                self._projectionInfo[ 0 ] = -2.0 / ( width * m[ 0 ] );
                self._projectionInfo[ 1 ] = -2.0 / ( height * m[ 5 ] );
                self._projectionInfo[ 2 ] = ( 1.0 - m[ 8 ] ) / m[ 0 ];
                self._projectionInfo[ 3 ] = ( 1.0 - m[ 9 ] ) / m[ 5 ];

                self._aoUniforms.uProjectionInfo.setFloat4( self._projectionInfo );

                self._previousViewport[ 0 ] = width;
                self._previousViewport[ 1 ] = height;

            } );

        },

        run: function () {

            var self = this;

            this.initDatGUI();
            this.createViewer();
            self.createScene();

            this.readShaders().then( function () {

                // Loads the glTF Sponza scene by default if exists
                // loadFiles( self, '../media/models/sponza.gltf', 'sponza' );

                var cam = self.createDepthCameraRTT();
                self.bindProjectionUpdateCallback( cam );

                self._composerNode = new osg.Node();
                self._composerNode.setName( 'ComposerNode' );
                self._composerNode.addChild( self.createComposer() );

                var root = new osg.Node();
                root.addChild( cam );
                root.addChild( self._composerNode );

                self._viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
                self._viewer.setSceneData( root );

                self.updateScene();

                var scene = self._modelsMap[ self._config.scene ];
                scene.dirtyBound();
                self._viewer.getManipulator().computeHomePosition( OSG.osgGA.Manipulator.COMPUTE_HOME_USING_SPHERE );

            } );

        },

        resizeEvent: function () {

            var root = this._viewer.getSceneData();
            var scene = this._modelsMap[ this._config.scene ];

            this._rttCamera = this.createDepthCameraRTT();
            this._rttCamera.addChild( scene );
            this.bindProjectionUpdateCallback( this._rttCamera );

            this._composerNode.removeChildren();
            this._composerNode.addChild( this.createComposer() );

            root.removeChildren();
            root.addChild( this._rttCamera );
            root.addChild( this._composerNode );
        },

        updateScene: function () {

            var sceneId = this._config.scene;
            var node = this._modelsMap[ sceneId ];

            this._rttCamera.removeChildren();
            this._rttCamera.addChild( node );

            this.normalizeSliders( null );
        },

        addScene: function ( name, scene ) {

            this._modelList.push( name );
            this._modelsMap[ name ] = scene;
            this._config.scene = name;

            var folder = this._gui.__folders.Scene;
            var controllers = folder.__controllers;
            var controller = controllers.filter( function ( cont ) {
                return cont.property === 'scene';
            } )[ 0 ];
            controller = controller.options( this._modelList );
            controller.onChange( this.updateScene.bind( this ) );

            this.updateScene();
        },

    } );

    var dragOverEvent = function ( evt ) {

        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';

    };

    var dropEvent = function ( evt ) {

        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;
        var sceneName = null;

        for ( var i = 0; i < files.length; ++i ) {

            if ( files[ i ].name.indexOf( '.gltf' ) !== -1 ) {

                sceneName = files[ i ].name;
                break;

            }

        }

        loadFiles( this, files, sceneName );

    };


    window.addEventListener( 'load', function () {

        var example = new Example();
        example.run();

        window.addEventListener( 'dragover', dragOverEvent.bind( example ), false );
        window.addEventListener( 'drop', dropEvent.bind( example ), false );

    }, true );

} )();
