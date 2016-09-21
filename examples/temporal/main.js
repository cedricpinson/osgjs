( function () {
    'use strict';

    //  get other js file Classes
    var CustomCompiler = window.CustomCompiler;
    var TemporalAttribute = window.TemporalAttribute;
    var ExampleOSGJS = window.ExampleOSGJS;

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgShader = OSG.osgShader;
    var osgUtil = OSG.osgUtil;

    // inherits for the ExampleOSGJS prototype
    var Example = function () {

        ExampleOSGJS.call( this );

        this._angle = 0;
        this._currFrame = -1;
        this._lastUpdate = -1;
        this._config = {
            rotate: false,
            debug: false,
            supersample: false,
            angle: 0.01,
            motionblur: false,
            showScene: false
        };

        this._shaderNames = [
            'supersample.glsl',
            'passthrough.glsl',
        ];
        this._renderTextures = [];
        this._filterCheck = osg.Texture.NEAREST;
        //_filterCheck = osg.Texture.LINEAR,

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        createScene: function () {
            var group = new osg.Node();
            group.setName( 'group' );

            group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

            var size = 1.0;

            // sort of background

            var ground = osg.createTexturedBoxGeometry( 0.0, 0.0, 0.0, size, size, size );
            ground.setName( 'groundBox' );

            var groundPlace = new osg.MatrixTransform();
            groundPlace.addChild( ground );
            var m = groundPlace.getMatrix();
            osg.mat4.fromRotation( m, 0.0, [ 0.0, 0.0, 1.0 ] );
            osg.mat4.setTranslation( m, [ 0.0, 0.0, 0.0 ] );
            group.addChild( groundPlace );

            ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, osg.Texture.createFromURL( this._mediaPath + 'textures/seamless/bricks1.jpg' ) );


            var gridDefinition = 15;
            // THE GRID http://www.youtube.com/watch?v=S-d7iXuJlvE&t=0m9s
            var theGrid = osg.createGridGeometry( -1.0, -1.0, 0.0, 2.0, 0.0, 0.0, 0.0, 2.0, 0.0, gridDefinition, gridDefinition );

            var material = new osg.Material();
            theGrid.getOrCreateStateSet().setAttributeAndModes( material );
            material.setEmission( [ 1.0, 1.0, 1.0, 1.0 ] );
            material.setDiffuse( [ 1.0, 1.0, 1.0, 1.0 ] );
            material.setSpecular( [ 1.0, 1.0, 1.0, 1.0 ] );
            material.setAmbient( [ 1.0, 1.0, 1.0, 1.0 ] );

            group.addChild( theGrid );

            return group;
        },

        ///// UTILS

        // show the renderTexture as ui quad on left bottom screen
        // in fact show all texture inside this._rtt
        showHideFrameBuffers: function ( optionalArgs ) {

            // debug Scene
            if ( !this._rttDebugNode ) {
                this._rttDebugNode = new osg.Node();
                this._rttDebugNode.setName( '_rttDebugNode' );
                this._root.addChild( this._rttDebugNode );
            } else if ( this._rttDebugNode.getChildren().length !== 0 ) {
                this._rttDebugNode.removeChildren();
                return;
            }

            var ComposerdebugNode = new osg.Node();
            ComposerdebugNode.setName( 'debugComposerNode' );
            ComposerdebugNode.setCullingActive( false );
            var ComposerdebugCamera = new osg.Camera();
            ComposerdebugCamera.setName( '_ComposerdebugCamera' );
            this._rttDebugNode.addChild( ComposerdebugCamera );

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

            var matrixDest = ComposerdebugCamera.getProjectionMatrix();
            osg.mat4.ortho( matrixDest, 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5 );
            ComposerdebugCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

            matrixDest = ComposerdebugCamera.getViewMatrix();
            osg.mat4.fromTranslation( matrixDest, [ 0, 0, 0 ] );
            ComposerdebugCamera.setViewMatrix( matrixDest );
            ComposerdebugCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
            ComposerdebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            ComposerdebugCamera.addChild( ComposerdebugNode );

            var texture;
            var xOffset = optionsDebug.x;
            var yOffset = optionsDebug.y;
            ComposerdebugNode.removeChildren();

            var stateset;

            stateset = ComposerdebugNode.getOrCreateStateSet();

            if ( !optionsDebug.fullscreen ) {
                stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            }

            for ( var i = 0, l = this._renderTextures.length; i < l; i++ ) {
                texture = this._renderTextures[ i ];
                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    stateset = quad.getOrCreateStateSet();

                    quad.setName( 'debugCompoGeom' + i );

                    stateset.setTextureAttributeAndModes( 0, texture );
                    stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

                    ComposerdebugNode.addChild( quad );

                    if ( optionsDebug.horizontal ) {
                        xOffset += optionsDebug.w + 2;
                    } else {
                        yOffset += optionsDebug.h + 2;
                    }
                }
            }
        },


        createTextureRTT: function ( name, filter, type ) {
            var texture = new osg.Texture();
            texture.setInternalFormatType( type );
            texture.setTextureSize( this._canvas.width, this._canvas.height );

            texture.setInternalFormat( osg.Texture.RGBA );
            texture.setMinFilter( filter );
            texture.setMagFilter( filter );
            texture.setName( name );
            return texture;
        },

        createCameraRTT: function ( texture, is3D ) {
            var camera = new osg.Camera();
            camera.setName( is3D ? 'MainCamera' : 'composer2D' );
            camera.setViewport( new osg.Viewport( 0, 0, this._canvas.width, this._canvas.height ) );

            camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
            camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, texture, 0 );

            //
            camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

            if ( is3D ) {
                camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
                camera.setClearColor( osg.vec4.fromValues( 0.0, 0.0, 0.1, 1.0 ) );
            } else {

                camera.setClearMask( 0 );

            }
            return camera;
        },
        ///// END UTILS

        // halton[0-1] : jitter offset
        // halton[2] : 0 disable; 1: supersample, 2: motion blur
        // halton[3] : Frame Number since start of amortized supersample of static frame

        //http://www.ben-peck.com/articles/halton/
        haltonFunc: function ( index, base ) {
            var result = 0.0;
            var f = 1.0 / base;
            var i = index;
            while ( i > 0 ) {
                result = result + f * ( i % base );
                i = Math.floor( i / base );
                f = f / base;
            }
            return result;
        },

        updateUniforms: function () {

            if ( !this._halton ) return;
            // update frame num to know how to amortize
            this._frameNum++;

            // jitter the projection matrix
            this._halton[ 0 ] = this.haltonFunc( this._frameNum - 1, 4 ) - 0.5;
            this._halton[ 1 ] = this.haltonFunc( this._frameNum - 1, 3 ) - 0.5;

            this._halton[ 3 ] = this._frameNum;

        },


        rotateNode: function ( nv ) {
            var t = nv.getFrameStamp().getSimulationTime();
            var dt = t - this._lastUpdate;
            if ( dt < 0 ) {
                return true;
            }
            this._lastUpdate = t;

            // rotation
            var m = this._rotate.getMatrix();
            osg.mat4.fromRotation( m, this._angle, [ 0.0, 0.0, 1.0 ] );
            osg.mat4.setTranslation( m, [ 0, 0, 0 ] );

            this._angle += parseFloat( this._config.angle );

            return true;
        },


        pingPongFrame: function ( nv ) {

            if ( this._currFrame === nv.getFrameStamp().getFrameNumber() ) {
                console.log( 'double Frame' );
                return;
            }
            this._currFrame = nv.getFrameStamp().getFrameNumber();


            if ( this._config.rotate ) {
                this.rotateNode( nv );
            }

            /*
             if ( this._frameNum > 64 ) {
             halton[ 2 ] = 0.0;
             uniforms.halton.dirty();
             return;
             }
            */

            this.updateUniforms();

            // superSample PingPong
            if ( this._aaFilter ) {
                this._aaFilter.switch();
            }

        },


        createComposer: function ( sceneRTT ) {
            var composer = new osgUtil.Composer();
            composer.setName( 'supersample composer' );

            ///
            // Create Texture And Camera
            ///


            // current Destination
            var rttAA0 = this.createTextureRTT( 'antiAlias1', this._filterCheck, osg.Texture.UNSIGNED_BYTE );
            this._renderTextures.push( rttAA0 );
            var cameraRttAA0 = this.createCameraRTT( rttAA0, false );

            // previous Destination
            var rttAA1 = this.createTextureRTT( 'antialias2', this._filterCheck, osg.Texture.UNSIGNED_BYTE );
            this._renderTextures.push( rttAA1 );
            var cameraRttAA1 = this.createCameraRTT( rttAA1, false );

            // add shader supersample
            var fragmentShader = this._shaderProcessor.getShader( 'supersample.glsl' );


            ///
            // now Construct Super Sample Filter
            ///
            this._aaFilter = new osgUtil.Composer.Filter.PingPong( cameraRttAA0, rttAA0, cameraRttAA1, rttAA1, fragmentShader, this._uniforms );

            // add input
            // previous render Texture + current Scene RTT
            this._aaFilter.getStateSet().setTextureAttributeAndModes( 0, sceneRTT );

            // current render texture
            this._aaFilter = composer.addPass( this._aaFilter );
            this._aaFilter.setFragmentName( 'SuperSample' );

            // basic Pass through
            // "Backup Final Pass" to a Destination Texture we save for next render
            // (Otherwise previous "supersample" pass above
            // would render into screen FrameBuffer,
            // thus next frame wouldn't be able to read from it
            //(screen frame buffer read is "undefined" by spec (triple/double buffer things)))
            //
            // To avoid ping pong on this one,
            // we use shader to do the read ping pong
            fragmentShader = this._shaderProcessor.getShader( 'passthrough.glsl' );

            var passThroughFilter = new osgUtil.Composer.Filter.Custom( fragmentShader, this._uniforms );

            // For debug purpose add scene for comparisons
            passThroughFilter.getStateSet().setTextureAttributeAndModes( 2, sceneRTT );
            var uniform = osg.Uniform.createInt1( 2, 'Texture2' );
            passThroughFilter.getStateSet().addUniform( uniform );

            passThroughFilter = composer.addPass( passThroughFilter );
            passThroughFilter.setFragmentName( 'PassThrough' );

            //            composer.renderToScreen( canvas.width, canvas.height );
            composer.build();

            // get result
            this._rttFinal = composer.getResultTexture();

            passThroughFilter.getStateSet().setName( 'passthrough' );

            return composer;
        },

        installCustomShaders: function () {

            // create a new shader generator with our own compiler
            var shaderGenerator = new osgShader.ShaderGenerator();
            shaderGenerator.setShaderCompiler( CustomCompiler );

            var accepted = shaderGenerator.getAcceptAttributeTypes();
            accepted.add( 'Temporal' );

            // get or create instance of ShaderGeneratorProxy
            var shaderGeneratorProxy = this._viewer.getState().getShaderGeneratorProxy();
            shaderGeneratorProxy.addShaderGenerator( 'custom', shaderGenerator );

            // now we can use 'custom' in StateSet to access our shader generator

        },

        initDatGUI: function () {
            var controller;

            this._gui = new window.dat.GUI();

            // add callbacks
            var self = this;

            // start/stop AA accumulation
            this._config[ 'enableSuperSample' ] = function () {

                if ( this.supersample ) {

                    self._frameNum = 1;
                    self._halton[ 2 ] = 1.0;

                } else {

                    //disable
                    self._frameNum = 1;
                    self._halton[ 2 ] = 0.0;

                }

            };
            // start/stop motion blur accumulation
            this._config[ 'enableMotionBlur' ] = function () {

                if ( this.motionblur ) {

                    self._frameNum = 1;
                    self._halton[ 2 ] = 2.0;

                } else {

                    //disable
                    self._frameNum = 1;
                    self._halton[ 2 ] = 0.0;

                }

            };
            // show the framebuffers as ui quad on left bottom screen
            this._config[ 'debugFunc' ] = function () {

                self.showHideFrameBuffers( {

                    screenW: self._canvas.width,
                    screenH: self._canvas.height

                } );

            };

            // make sure the input Scene RTT is OK
            // Doesn't show other RTT, could be a droplist...
            this._config[ 'showSceneFunc' ] = function () {

                if ( this.showScene ) {

                    self._quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, self._rttScene );

                } else {

                    self._quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, self._rttFinal );

                }

            };

            var gui = this._gui;
            controller = gui.add( this._config, 'rotate' );
            controller = gui.add( this._config, 'supersample' );
            controller.onChange( this._config.enableSuperSample.bind( this._config ) );
            controller = gui.add( this._config, 'motionblur' );
            controller.onChange( this._config.enableMotionBlur.bind( this._config ) );
            controller = gui.add( this._config, 'debug' );
            controller.onChange( this._config.debugFunc.bind( this._config ) );
            controller = gui.add( this._config, 'showScene' );
            controller.onChange( this._config.showSceneFunc.bind( this._config ) );
            controller = gui.add( this._config, 'angle', 0.0, 1.0 );
        },

        run: function () {
            this.setConfigFromOptionsURL();
            this._canvas = document.getElementById( 'View' );

            var manipulator;

            this._viewer = new osgViewer.Viewer( this._canvas, {
                antialias: false,
                alpha: false,
                overrideDevicePixelRatio: 0.75
            } );
            this._viewer.init();


            if ( manipulator ) this._viewer.setupManipulator( manipulator );
            else this._viewer.setupManipulator();

            this._viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );

            var temporalAttribute;
            this.installCustomShaders();
            temporalAttribute = new TemporalAttribute();

            this._rotate = new osg.MatrixTransform();
            this._rotate.addChild( this.createScene() );
            this._lastUpdate = 0.0;

            // rotating cube  scene
            this._rttScene = this.createTextureRTT( 'sceneRTT',
                this._filterCheck,
                osg.Texture.UNSIGNED_BYTE );

            this._renderTextures.push( this._rttScene );


            var cameraScene = this.createCameraRTT( this._rttScene, true );
            cameraScene.addChild( this._rotate );
            //        cameraScene.setComputeNearFar( false );
            var m = cameraScene.getViewMatrix();

            osg.mat4.fromRotation( m, -90, [ 0.0, 1.0, 0.0 ] );


            cameraScene.setViewMatrix( m );


            // composer scene
            if ( temporalAttribute ) {
                this._halton = [ 0.0, 0.0, 0.0, 0.0 ];
                var renderSize = [ this._canvas.width, this._canvas.height ];
                this._uniforms = {
                    halton: osg.Uniform.createFloat4( this._halton, 'halton' ),
                    RenderSize: osg.Uniform.createFloat2( renderSize, 'RenderSize' )
                };

                this.getRootNode().getOrCreateStateSet().addUniform( this._uniforms.halton );
                this.getRootNode().getOrCreateStateSet().addUniform( this._uniforms.RenderSize );

                temporalAttribute.setAttributeEnable( true );

                this._rotate.getOrCreateStateSet().setAttributeAndModes( temporalAttribute );
                this._rotate.getOrCreateStateSet().setShaderGeneratorName( 'custom' );

            }

            // final Quad
            var quadSize = [ 16 * 16 / 9, 16 * 1 ];
            this._quad = osg.createTexturedQuadGeometry( -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                quadSize[ 0 ], 0, 0,
                0, 0, quadSize[ 1 ] );


            var self = this;
            this.readShaders().then( function () {

                var composer;

                composer = self.createComposer( self._rttScene );

                var nodeCompo = new osg.Node();
                nodeCompo.addChild( composer );
                self._quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, self._rttFinal );
                self._quad.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

                // add in correct order !
                self.getRootNode().addChild( cameraScene );
                self.getRootNode().addChild( nodeCompo );

                self.getRootNode().addChild( self._quad );


                self._viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
                //self._viewer.getCamera().setClearMask( 0 );
                self._viewer.setSceneData( self.getRootNode() );


                self.initDatGUI();

                var camera = self._viewer.getCamera();
                camera.setName( 'scene' );

                camera.setComputeNearFar( false );

                manipulator = self._viewer.getManipulator();
                manipulator.computeHomePosition();
                // manipulate inside the RTT
                //manipulator.setNode( self._rotate );
                //manipulator.setCamera( cameraScene );
                //manipulator.computeHomePosition();

                manipulator.setNode( self._quad );

                manipulator.oldUp = manipulator.update;

                manipulator.update = function ( nv ) {
                    self.pingPongFrame( nv );
                    manipulator.oldUp( nv );
                };

                self._viewer.run();
            } );

        }

    } );





    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
