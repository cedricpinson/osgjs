( function () {
    'use strict';

    window.OSG.globalify();

    var osg = window.osg;
    //var osgUtil = window.osgUtil;
    var osgViewer = window.osgViewer;
    var osgShader = window.osgShader;
    var osgShadow = window.osgShadow;
    var $ = window.$;
    var Q = window.Q;
    var osgDB = window.osgDB;


    window.postScenes = [];
    var CustomCompiler = window.CustomCompiler;

    var LightRemoveVisitor = function () {
        osg.NodeVisitor.call( this );
        this.nodeList = [];
    };
    LightRemoveVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( ( node.getName() && node.getName().indexOf( 'Point' ) !== -1 ) || node.getTypeID() === osg.Light.getTypeID() ) {
                this.nodeList.push( node );
                return;
            }
            this.traverse( node );
        },
        clean: function () {
            for ( var i = 0; i < this.nodeList.length; i++ ) {
                var node = this.nodeList[ i ];
                var parents = node.getParents();
                if ( parents && parents[ 0 ] ) parents[ 0 ].removeChild( node );
            }
        }
    } );



    var Example = function () {
        this._config = {};

        // default & change config with URL params
        var queryDict = {};
        window.location.search.substr( 1 ).split( '&' ).forEach( function ( item ) {
            queryDict[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ];
        } );
        if ( queryDict[ 'debug' ] ) {
            this._debugOtherTechniques = true;
            this._debugFrustum = true;
            this._debugPrefilter = true;
        }

        var keys = Object.keys( queryDict );
        for ( var i = 0; i < keys.length; i++ ) {
            var property = keys[ i ];
            this._config[ property ] = queryDict[ property ];
        }
    };


    Example.prototype = {

        getShaderBackground: function () {
            var vertexshader = [
                'attribute vec3 Vertex;',
                'attribute vec3 Normal;',
                'attribute vec2 TexCoord0;',
                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',
                'uniform mat4 NormalMatrix;',

                'varying vec3 osg_FragNormal;',
                'varying vec3 osg_FragEye;',
                'varying vec3 osg_FragVertex;',
                'varying vec2 osg_TexCoord0;',

                'void main(void) {',
                '  osg_FragVertex = Vertex;',
                '  osg_TexCoord0 = TexCoord0;',
                '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
                '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '}'
            ].join( '\n' );

            var fragmentshader = [
                'precision highp float;',
                'uniform samplerCube Texture0;',
                'varying vec3 osg_FragNormal;',
                'varying vec3 osg_FragEye;',
                'varying vec3 osg_FragVertex;',
                'varying vec2 osg_TexCoord0;',

                'void main(void) {',
                '  vec3 eye = -normalize(osg_FragVertex);',
                '  gl_FragColor = textureCube(Texture0, eye);',
                '}',
                ''
            ].join( '\n' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        addBackground: function () {
            var group = new osg.Node();

            var size = 250;
            var background = this.getCubeMap( size, group );
            background.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            background.getOrCreateStateSet().setAttributeAndModes( this.getShaderBackground() );



            var texture = new osg.TextureCubeMap();
            this._cubemapTexture = texture;

            Q.all( [
                osgDB.readImage( '../cubemap/textures/posx.jpg' ),
                osgDB.readImage( '../cubemap/textures/negx.jpg' ),

                osgDB.readImage( '../cubemap/textures/posy.jpg' ),
                osgDB.readImage( '../cubemap/textures/negy.jpg' ),

                osgDB.readImage( '../cubemap/textures/posz.jpg' ),
                osgDB.readImage( '../cubemap/textures/negz.jpg' )
            ] ).then( function ( images ) {


                texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_X', images[ 0 ] );
                texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_X', images[ 1 ] );

                texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Y', images[ 2 ] );
                texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Y', images[ 3 ] );

                texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Z', images[ 4 ] );
                texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Z', images[ 5 ] );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );

                background.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
                background.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
            } );

            this.backGround = group;
        },
        getCubeMap: function ( size, scene ) {
            // create the environment sphere
            var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
                size, size, size );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( this.getShaderBackground() );

            var cubemapTransform = osg.Uniform.createMatrix4( osg.Matrix.create(), 'CubemapTransform' );

            var mt = new osg.MatrixTransform();
            mt.setMatrix( osg.Matrix.makeRotate( Math.PI / 2.0, 1, 0, 0, [] ) );
            mt.addChild( geom );

            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.Matrix.setTrans( nv.getCurrentModelViewMatrix(), 0, 0, 0 );
                    var m = nv.getCurrentModelViewMatrix();
                    osg.Matrix.copy( m, cubemapTransform.get() );
                    cubemapTransform.dirty();
                    return true;
                };
            };
            mt.setCullCallback( new CullCallback() );
            scene.getOrCreateStateSet().addUniform( cubemapTransform );


            var cam = new osg.Camera();

            cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            cam.addChild( mt );

            // the update callback get exactly the same view of the camera
            // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
            var _self = this;
            var UpdateCallback = function () {
                this.update = function ( /*node, nv*/) {
                    var rootCam = _self._viewer.getCamera();
                    var info = {};
                    osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                    var proj = [];
                    osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 100.0, proj );
                    cam.setProjectionMatrix( proj );
                    cam.setViewMatrix( rootCam.getViewMatrix() );

                    return true;
                };
            };

            cam.setUpdateCallback( new UpdateCallback() );

            scene.addChild( cam );

            return geom;
        },

        addModel: function () {

            var groundTex = osg.Texture.createFromURL( '../media/textures/seamless/bricks1.jpg' );
            groundTex.setWrapT( 'MIRRORED_REPEAT' );
            groundTex.setWrapS( 'MIRRORED_REPEAT' );

            var modelTex = osg.Texture.createFromURL( '../media/textures/alpha/logo.png' );
            modelTex.setWrapT( 'MIRRORED_REPEAT' );
            modelTex.setWrapS( 'MIRRORED_REPEAT' );

            //var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
            var model = new osg.MatrixTransform();
            model.setName( 'ModelParent' );

            var modelTrans = new osg.MatrixTransform();
            modelTrans.setName( 'ModelTrans' );
            model.addChild( modelTrans );
            /*
                        var modelName = '../ssao/raceship.osgjs';
                        osg.Matrix.makeRotate( Math.PI, 0, 0, 1, modelTrans.getMatrix() );
            */

            var modelName = '../media/models/material-test/file.osgjs';
            osg.Matrix.makeScale( 0.3, 0.3, 0.3, modelTrans.getMatrix() );
            osg.Matrix.setTrans( modelTrans.getMatrix(), 15, 15.0, -5.0 );
            modelTrans.getOrCreateStateSet().setTextureAttributeAndModes( 0, modelTex );
            modelTrans.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'BACK' ) );

            var request = osgDB.readNodeURL( modelName );

            // copy tex coord 0 to tex coord1 for multi texture
            request.then( function ( loadedModel ) {
                var lightRmv = new LightRemoveVisitor();
                loadedModel.accept( lightRmv );
                lightRmv.clean();

                loadedModel.setName( 'model' );



                modelTrans.addChild( loadedModel );


            } );
            modelTrans.getOrCreateStateSet().setTextureAttributeAndModes( 6, this._cubemapTexture );
            modelTrans.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 6, 'Texture6' ) );



            // add a node to animate the scene
            var rootModel = new osg.MatrixTransform();
            rootModel.setName( 'rootModel' );
            rootModel.addChild( model );




            var groundNode = new osg.MatrixTransform();
            var numPlanes = 5;
            var groundSize = 60 / numPlanes;
            var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
            ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );
            for ( var wG = 0; wG < numPlanes; wG++ ) {
                for ( var wH = 0; wH < numPlanes; wH++ ) {

                    var groundSubNodeTrans = new osg.MatrixTransform();
                    //groundSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( -groundSize + groundSize * 0.5, -groundSize + groundSize * 0.5, -5.0, [] ) );

                    groundSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( -wG * groundSize + groundSize * numPlanes * 0.5, -wH * groundSize + groundSize * numPlanes * 0.5, -5.0, [] ) );

                    groundSubNodeTrans.setName( 'groundSubNode_' + wG + '_' + wH );
                    groundSubNodeTrans.addChild( ground );
                    groundNode.addChild( groundSubNodeTrans );
                }
            }
            rootModel.addChild( groundNode );


            if ( !rootModel._userData ) rootModel._userData = {};
            rootModel._userData[ 'model' ] = model;
            rootModel._userData[ 'ground' ] = groundNode;
            rootModel._name = 'UPDATED MODEL NODE';
            return rootModel;
        },


        commonScene: function ( rttSize, order, rootModel, doFloat ) {

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

            // prevent projection matrix changes
            // after store in node
            //camera.setComputeNearFar( false );
            camera.setComputeNearFar( true );

            // attach a texture to the camera to render the scene on
            var newSceneTexture = new osg.Texture();
            newSceneTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );

            //newSceneTexture.setMinFilter( 'LINEAR' );
            //newSceneTexture.setMagFilter( 'LINEAR' );

            newSceneTexture.setMinFilter( 'NEAREST' );
            newSceneTexture.setMagFilter( 'NEAREST' );


            if ( doFloat ) {
                newSceneTexture.setInternalFormatType( osg.Texture.FLOAT );
                newSceneTexture.setInternalFormat( osg.Texture.RGBA );
            }




            camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, newSceneTexture, 0 );
            camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );


            // shadows
            var lightnew = new osg.Light( 0 );

            // pretty spotlight fallof showing
            // clearly directions
            var spot = false;
            if ( spot ) {
                lightnew.setSpotCutoff( 25 );
                lightnew.setSpotBlend( 1.0 );
                lightnew.setLightType( osg.Light.SPOT );
            } else {
                lightnew.setSpotCutoff( 190 );
                lightnew.setLightType( osg.Light.DIRECTION );
            }

            lightnew.setConstantAttenuation( 0 );
            lightnew.setLinearAttenuation( 0.005 );
            lightnew.setQuadraticAttenuation( 0 );

            lightnew.setName( 'light0' );
            lightnew._enabled = true;

            // light source is a node handling the light
            var lightSourcenew = new osg.LightSource();
            lightSourcenew.setName( 'lightNode0' );
            lightSourcenew.setLight( lightnew );

            // node helping position the light
            var lightNodemodelNodeParent = new osg.MatrixTransform();

            // Important: set the light as attribute so that it's inhered by all node under/attached the mainNode
            camera.getOrCreateStateSet().setAttributeAndModes( lightnew );

            // setting light, each above its cube
            lightNodemodelNodeParent.setMatrix( osg.Matrix.makeTranslate( -10, -10, 10, osg.Matrix.create() ) );

            // red light
            lightnew.setAmbient( [ 0.0, 0, 0.0, 1.0 ] );
            lightnew.setDiffuse( [ 1.5, 1.5, 1.5, 1.0 ] );
            lightnew.setSpecular( [ 1.0, 1.0, 1.0, 1.0 ] );


            var shadowedNode = new osgShadow.ShadowedScene();

            var rootTrans = new osg.MatrixTransform();
            rootTrans.addChild( rootModel );
            shadowedNode.addChild( rootTrans );

            if ( false ) {
                var shadowSettings = new osgShadow.ShadowSettings();
                shadowSettings.setLightSource( lightSourcenew );
                shadowSettings.setAlgorithm( 'NONE' );
                shadowSettings.setTextureSize( 2048 );
                shadowSettings.bias = 0.5;
                var shadowMap = new osgShadow.ShadowMap();
                shadowMap.setShadowSettings( shadowSettings );

                shadowedNode.addShadowTechnique( shadowMap );
            }


            // add the scene to the camera
            camera.addChild( shadowedNode );
            // better view
            osg.Matrix.copy( [ 1.3408910815142607, 0, 0, 0, 0, 1.920982126971166, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0 ], camera.getProjectionMatrix() );
            //osg.Matrix.copy( [ -1, 0, -0, 0, 0, 1, -0, 0, 0, -0, -1, 0, 0, 0, -50, 1 ], camera.getViewMatrix() );

            // better view
            osg.Matrix.copy( [ 0.9999999999999999, 3.979118659715591e-17, -1.2246467991473532e-16, 0, -1.2876698473377504e-16, 0.3090169943749474, -0.9510565162951535, 0, 0, 0.9510565162951536, 0.3090169943749474, 0, -2.465190328815662e-32, 0, -25.000000000000004, 1 ], camera.getViewMatrix() );

            // attach camera to root
            var newRoot = new osg.MatrixTransform();
            newRoot.setName( 'CameraRTTFather' );
            newRoot.addChild( camera );

            camera.addChild( this.backGround );

            return [ newRoot, newSceneTexture, camera, rootTrans ];
        },



        readShaders: function () {
            var defer = Q.defer();
            this._shaderProcessor = new osgShader.ShaderProcessor();

            var shaders = [
                'add.frag',
                'baseVert',
                'baseFrag',
                'diffFrag',
                'fxaa',
                'hbao.frag',
                'normal.vert',
                'normal.frag',
                'showNormal.frag',
                'reconstNormal.frag',
                'reconstFrag',
                'refractVert',
                'refractFrag',
                'reflect.frag',
                'reflectOpt.frag',
                'UVVert',
                'UVFrag',
                'depthVert',
                'depthFrag',
                'motionBlurDepth',
                'motionBlurVelocity',
                'ssaa_node',
                'velocity_node',
                'colorEncode',
                'raytrace',
                'smaa.all',
                'smaa'
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

            var _self = this;
            Q.all( promises ).then( function () {
                _self._shaderProcessor.addShaders( shadersLib );
                defer.resolve();
            } );

            return defer.promise;
        },



        getShaderProgram: function ( vs, ps, defines, useCache ) {

            var hash;
            if ( useCache ) {
                hash = vs + ps + defines.join( '' );
                if ( !this._cache )
                    this._cache = {};

                if ( this._cache[ hash ] )
                    return this._cache[ hash ];
            }

            var vertexshader = this._shaderProcessor.getShader( vs, defines );
            var fragmentshader = this._shaderProcessor.getShader( ps, defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ), new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            if ( useCache ) {
                this._cache[ hash ] = program;
            }

            return program;
        },

        // show the shadowmap as ui quad on left bottom screen
        // in fact show all texture inside this._rtt
        showFrameBuffers: function ( optionalArgs ) {

            var _ComposerdebugNode = new osg.Node();
            _ComposerdebugNode.setName( 'debugComposerNode' );
            _ComposerdebugNode.setCullingActive( false );
            var _ComposerdebugCamera = new osg.Camera();
            _ComposerdebugCamera.setName( '_ComposerdebugCamera' );
            this._rttDebugNode.addChild( _ComposerdebugCamera );

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
            var program = this.getShaderProgram( 'baseVert', 'baseFrag', [], true );
            stateset = _ComposerdebugNode.getOrCreateStateSet();
            if ( !optionsDebug.fullscreen )
                stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            stateset.setAttributeAndModes( program );
            for ( var i = 0, l = this._rtt.length; i < l; i++ ) {
                texture = this._rtt[ i ];
                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    stateset = quad.getOrCreateStateSet();

                    quad.setName( 'debugCompoGeom' );

                    stateset.setTextureAttributeAndModes( 0, texture );
                    stateset.setAttributeAndModes( program );
                    // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

                    _ComposerdebugNode.addChild( quad );

                    if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
                    else yOffset += optionsDebug.h + 2;
                }
            }
        },

        updateDebugRtt: function () {
            // show the framebuffers as ui quad on left bottom screen
            if ( this._rttDebugNode ) {
                this._rttDebugNode.removeChildren();
            } else {
                this._rttDebugNode = new osg.Node();
                this._rttDebugNode.setName( '_rttDebugNode' );
            }
            this.showFrameBuffers( {
                screenW: this._canvas.width,
                screenH: this._canvas.height
            } );
        },


        setComposers: function ( effectName0, effectName1, textureScale ) {

            this._currentFrame = 0;

            if ( this._effect0 ) this._scene.removeChild( this._effect0.getRootNode() );
            if ( this._effect1 && this._notSame ) this._scene.removeChild( this._effect1.getRootNode() );

            this._notSame = effectName0 !== effectName1;

            this._rttSize = [ this._canvas.width * textureScale, this._canvas.height * textureScale, 1.0 / this._canvas.width * textureScale, 1.0 / this._canvas.height * textureScale ];

            this._effect0 = this._effects[ effectName0 ];
            this._effect1 = this._effects[ effectName1 ];

            this._effect0.buildComposer( this );
            if ( this._notSame ) this._effect1.buildComposer( this );

            var st = this._quad.getOrCreateStateSet();
            st.setTextureAttributeAndModes( 0, this._effect0.getOutputTexture(), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
            st.setTextureAttributeAndModes( 1, this._effect1.getOutputTexture(), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );


            // Recreate the whole gui
            this._gui.destroy();
            this._gui = new dat.GUI();

            this.addSceneController();

            this._effect0.buildGui( this._gui );
            if ( this._notSame ) this._effect1.buildGui( this._gui );

            this._scene.addChild( this._effect0.getRootNode() );
            if ( this._notSame ) this._scene.addChild( this._effect1.getRootNode() );

            this._currentFrameSinceStop = 0;
            this._rtt = [];

            var output, l, k;
            var input = this._effect0.getInputTexture();

            if ( Object.prototype.toString.call( input ) === '[object Array]' ) {
                for ( k = 0; k < input.length; k++ ) {
                    this._rtt.push( input[ k ] );
                }
            } else {
                this._rtt.push( this._effect0.getInputTexture() );
            }

            // MRT handle, woot
            output = this._effect0.getOutputTexture();
            if ( Object.prototype.toString.call( output ) === '[object Array]' ) {
                for ( l = 0; l < output.length; l++ ) {
                    if ( this._rtt.indexOf( output[ l ] ) === -1 ) {
                        this._rtt.push( output[ l ] );
                    }
                }
            } else {
                if ( this._rtt.indexOf( output ) === -1 ) {
                    this._rtt.push( output );
                }
            }


            if ( this._notSame ) {
                input = this._effect1.getInputTexture();
                if ( Object.prototype.toString.call( input ) === '[object Array]' ) {
                    for ( k = 0; k < input.length; k++ ) {
                        this._rtt.push( input[ k ] );
                    }
                } else {
                    this._rtt.push( this._effect1.getInputTexture() );
                }

                // MRT handle, woot
                output = this._effect1.getOutputTexture();
                if ( Object.prototype.toString.call( output ) === '[object Array]' ) {
                    for ( l = 0; l < output.length; l++ ) {
                        if ( this._rtt.indexOf( output[ l ] ) === -1 ) {
                            this._rtt.push( output[ l ] );
                        }
                    }
                } else {
                    if ( this._rtt.indexOf( output ) === -1 ) {
                        this._rtt.push( output );
                    }
                }

            }
            this.updateDebugRtt();

        },

        addSceneController: function () {
            var _self = this;

            this._gui.add( this._globalGui, 'filter0', Object.keys( this._effects ) ).onChange( function ( value ) {
                _self.setComposers( value, _self._globalGui.filter1, parseFloat( _self._globalGui.pixelRatio ) );
            } );

            this._gui.add( this._globalGui, 'filter1', Object.keys( this._effects ) ).onChange( function ( value ) {
                _self.setComposers( _self._globalGui.filter0, value, parseFloat( _self._globalGui.pixelRatio ) );
            } );

            this._gui.add( this._globalGui, 'diffMode', [ 'slide', 'diffScale', 'mix' ] ).onChange( function ( value ) {

                _self.slideUnif.set( -1.0 );
                _self.mixUnif.set( -1.0 );
                _self.diffUnif.set( -1.0 );
                switch ( value ) {
                case 'slide':
                    _self.slideUnif.set( _self._globalGui.factor );
                    break;
                case 'diffScale':
                    _self.diffUnif.set( _self._globalGui.factor );
                    break;
                case 'mix':
                    _self.mixUnif.set( _self._globalGui.factor );
                    break;

                }
            } );

            this._gui.add( this._globalGui, 'factor', 0.0, 1.0 ).onChange( function ( value ) {
                _self.slideUnif.set( -1.0 );
                _self.mixUnif.set( -1.0 );
                _self.diffUnif.set( -1.0 );
                switch ( _self._globalGui.diffMode ) {
                case 'slide':
                    _self.slideUnif.set( value );
                    break;
                case 'diffScale':
                    _self.diffUnif.set( value );
                    break;
                case 'mix':
                    _self.mixUnif.set( value );
                    break;
                }
            } );

            this._gui.add( this._globalGui, 'pixelRatio', 0.125, 3.0 ).onChange( function ( value ) {
                _self.factorRenderUnif.set( value );
                _self.setComposers( _self._globalGui.filter0, _self._globalGui.filter1, parseFloat( value ) );
            } );

            this._gui.add( this._globalGui, 'animate' );
            this._gui.add( this._globalGui, 'reload' );
        },

        createScene: function () {

            var textureScale = 1.0;

            this._rttSize = [ this._canvas.width * textureScale, this._canvas.height * textureScale, 1.0 / this._canvas.width * textureScale, 1.0 / this._canvas.height * textureScale ];
            // cannot add same model multiple in same grap
            // it would break previousframe matrix saves

            this._model = this.addModel(); // "current frame model" added twise if no model2

            this._root = new osg.Node();
            this._root.setName( 'rootcreateScene' );

            this.sampleXUnif = osg.Uniform.createFloat1( 0.0, 'SampleX' );
            this.sampleYUnif = osg.Uniform.createFloat1( 0.0, 'SampleY' );
            this.frameNumUnif = osg.Uniform.createFloat1( 0.0, 'FrameNum' );
            this.factorRenderUnif = osg.Uniform.createFloat1( textureScale, 'FactorRender' );

            this._root.getOrCreateStateSet().addUniform( this.sampleXUnif );
            this._root.getOrCreateStateSet().addUniform( this.sampleYUnif );
            this._root.getOrCreateStateSet().addUniform( this.frameNumUnif );
            this._root.getOrCreateStateSet().addUniform( this.factorRenderUnif );


            this._texW = osg.Uniform.createFloat1( this._rttSize[ 0 ], 'tex_w' );
            this._texH = osg.Uniform.createFloat1( this._rttSize[ 1 ], 'tex_h' );

            this._root.getOrCreateStateSet().addUniform( this._texW );
            this._root.getOrCreateStateSet().addUniform( this._texH );

            this._renderSize = osg.Uniform.createFloat4( this._rttSize, 'renderSize' );
            this._root.getOrCreateStateSet().addUniform( this._renderSize );



            // create a quad on main camera which will be applied the postprocess effects
            var quadSize = [ 16 / 9, 1 ];
            this._quad = osg.createTexturedQuadGeometry( -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
                quadSize[ 0 ], 0, 0,
                0, 0, quadSize[ 1 ] );
            this._quad.getOrCreateStateSet().setAttributeAndModes( this.getShaderProgram( 'baseVert', 'diffFrag', [], true ) );
            this._quad.setName( 'TextureFinalTVDebug' );

            this.diffUnif = osg.Uniform.createFloat1( 0.0, 'diffScale' );
            this.slideUnif = osg.Uniform.createFloat1( 0.5, 'slide' );
            this.mixUnif = osg.Uniform.createFloat1( 0.0, 'mixTex' );

            this._quad.getOrCreateStateSet().addUniform( this.diffUnif );
            this._quad.getOrCreateStateSet().addUniform( this.mixUnif );
            this._quad.getOrCreateStateSet().addUniform( this.slideUnif );

            this._scene = new osg.MatrixTransform();
            this._scene.setName( 'sceneFinalTV' );


            this._postScenes = window.postScenes;

            this._effects = [];
            for ( var i = 0; i < this._postScenes.length; i++ ) {
                this._effects[ this._postScenes[ i ].name ] = this._postScenes[ i ];
            }

            var _self = this;
            this._globalGui = {
                'filter0': _self._postScenes[ 0 ].name,
                'filter1': _self._postScenes[ 1 ].name,
                'diffMode': 'slide',
                'pixelRatio': 1.0,
                'factor': 0.5,
                'animate': function () {
                    _self._doAnimate = !_self._doAnimate;
                    _self._currentFrameSinceStop = 0;
                },
                'reload': function () {
                    _self.readShaders().then( function () {
                        if ( console.clear ) console.clear();
                        _self.setComposers( _self._globalGui.filter0, _self._globalGui.filter1, parseFloat( _self._globalGui.pixelRatio ) );

                        _self._currentFrameSinceStop = 0;
                    } );

                },

                'camera': function () {
                    this._viewer._manipulator._target = _self._model;

                }
            };

            var filter0 = this._config[ 'filter0' ];
            if ( !filter0 ) filter0 = this._globalGui.filter0;
            else this._globalGui.filter1 = filter0;

            var filter1 = this._config[ 'filter1' ];
            if ( !filter1 ) filter1 = this._globalGui.filter0;
            else this._globalGui.filter1 = filter1;

            var pxlRatio = parseFloat( this._config[ 'pxlRatio' ] );
            if ( !pxlRatio ) pxlRatio = parseFloat( this._globalGui.pixelRatio );
            else pxlRatio = this._globalGui.pixelRatio;


            if ( this._config[ 'hideGui' ] ) setTimeout( function () {
                    _self._gui.close();
                },
                50 );
            this.setComposers( filter0,
                filter1,
                parseFloat( pxlRatio ) );

            this._scene.addChild( this._quad );
            this._scene.addChild( this._rttDebugNode );
            this._root.addChild( this._scene );

            this._doAnimate = true;

            // update once a frame
            var UpdateCallback = function () {
                this.update = function ( node, nv ) {
                    _self._currentFrame++;

                    // making sure here same proj/view
                    if ( _self._notSame ) {
                        if ( _self._effect1.updateCamera ) {
                            _self._effect1.updateCamera( _self._effect0.getCamera().getProjectionMatrix(), _self._effect0.getCamera().getViewMatrix() );
                        } else {
                            osg.Matrix.copy( _self._effect0.getCamera().getProjectionMatrix(), _self._effect1.getCamera().getProjectionMatrix() );
                            osg.Matrix.copy( _self._effect0.getCamera().getViewMatrix(), _self._effect1.getCamera().getViewMatrix() );
                        }
                    }


                    if ( _self._doAnimate ) {
                        _self._currentTime = nv.getFrameStamp().getSimulationTime();
                        var x = Math.cos( _self._currentTime );
                        if ( _self._effect0.updateTransNode ) {
                            _self._effect0.updateTransNode( x );
                        }
                        if ( _self._notSame && _self._effect1.updateTransNode ) {
                            _self._effect1.updateTransNode( x );
                        }
                        osg.Matrix.makeRotate( x, 0, 0, 1, _self._model.getMatrix() );


                    }


                    _self._effect0.update();
                    if ( _self._notSame ) _self._effect1.update();


                    _self._quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, _self._effect0.getOutputTexture() );
                    _self._quad.getOrCreateStateSet().setTextureAttributeAndModes( 1, _self._effect1.getOutputTexture() );

                    node.traverse( nv );
                };
            };
            this._root.setUpdateCallback( new UpdateCallback() );

            return this._root;
        },

        installCustomShaders: function () {

            // create a new shader generator with our own compiler
            var shaderGenerator = new osgShader.ShaderGenerator();
            shaderGenerator.setShaderCompiler( CustomCompiler );

            // make the ShaderGenerator accept new Attributes
            shaderGenerator.getAcceptAttributeTypes().add( 'Temporal' );
            shaderGenerator.getAcceptAttributeTypes().add( 'Velocity' );

            // get or create instance of ShaderGeneratorProxy
            var shaderGeneratorProxy = this._viewer.getState().getShaderGeneratorProxy();
            shaderGeneratorProxy.addShaderGenerator( 'custom', shaderGenerator );

        },

        run: function () {

            // osg.ReportWebGLError = true;
            this._canvas = document.getElementById( 'View' );
            this._canvas.style.width = this._canvas.width = window.innerWidth;
            this._canvas.style.height = this._canvas.height = window.innerHeight;

            this._gui = new dat.GUI();
            this._viewer = new osgViewer.Viewer( this._canvas, {
                antialias: false
            } );
            // we'll do it ourself
            this._viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
            this._viewer.init();

            var rotate = new osg.MatrixTransform();
            rotate.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

            this._viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

            this._viewer.setSceneData( rotate );
            this._viewer.setupManipulator();
            this._viewer.getManipulator().computeHomePosition();
            this._viewer.run();

            this.addBackground();

            var _self = this;
            this.readShaders().then( function () {
                _self.installCustomShaders();
                rotate.addChild( _self.createScene() );
                /*
        visitor = new osgUtil.DisplayNodeGraphVisitor();
        rotate.accept( visitor );
        visitor.createGraph();
                 */


            } );


        }
    };


    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
