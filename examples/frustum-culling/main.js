( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;
    var viewer;

    var culled = 0;
    var config;

    // Callback getting the Total, only on model root node for main render
    var CountCallback = function ( options, config ) {
        this._options = options;
        this._config = config;
    };
    CountCallback.prototype = {

        update: function ( /*node, nv*/) {
            // update
            this._config.culled = culled + '';
            culled = 0;
            return true;
        }
    };



    var CustomCullVisitor = function ( config ) {
        osg.CullVisitor.call( this );
        this._config = config;
    };

    // The Way of  getting the near/far, only on camera for main render

    CustomCullVisitor.prototype = osg.objectInherit( osg.CullVisitor.prototype, {

        // this one
        popCameraModelViewProjectionMatrix: function ( camera ) {
            this._mainCamera = camera === this._config[ 'camera' ];

            this.popModelViewMatrix();
            this.popProjectionMatrix( camera );

            if ( this._mainCamera ) {

                // cull
                this._config.near = this._computedNear + '';
                this._config.far = this._computedFar + '';

            }
        }

    } );


    // TODO:
    // features
    // - add multiples scenes for frustum tests
    // - add wireframe frustum display
    // - add multiple camera for frustum intersection
    // - show/hide sphere, attach them to all node, etc.
    // - more esthetic scenes, diferent shapes
    // bugsfix:
    // - fix remove texture for sphere?
    //
    // some refs:
    // https://fgiesen.wordpress.com/2010/10/20/some-more-frustum-culling-notes/
    // http://iquilezles.org/www/articles/frustumcorrect/frustumcorrect.htm
    var Example = function () {


        this._config = {
            nearFar: function () {
                viewer.getCamera().setComputeNearFar( !viewer.getCamera().getComputeNearFar() );
                console.log( 'autoNearFar: ' + viewer.getCamera().getComputeNearFar() );
            },
            frustumculling: function () {
                viewer.getCamera().setEnableFrustumCulling( !viewer.getCamera().getEnableFrustumCulling() );

                console.log( 'frustumCull ' + viewer.getCamera().getEnableFrustumCulling() );
            },
            near: '0',
            far: '0',
            culled: '0'
        };
        config = this._config;


        // default & change debug
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







    // callback on each Node
    // tricky code with nodepath is to disable
    // debug sphere and the topview render
    // from counts/coloring
    // as the scene in rendered for the two camera (main and topview)
    var FrustumCullingDebugCallback = function ( options ) {
        this._options = options;
    };
    FrustumCullingDebugCallback.prototype = {
        update: function ( node, nv ) {
            // update
            var topView = false;
            var debugSphere = false;
            nv.getNodePath().forEach( function ( a ) {
                if ( a.getName() === 'TopView' || ( a.getParents()[ 0 ] && a.getParents()[ 0 ].getName() === 'TopView' ) ) {
                    topView = true;
                }
                if ( a.getName() === 'debugSphere' || ( a.getParents()[ 0 ] && a.getParents()[ 0 ].getName() === 'debugSphere' ) ) {
                    debugSphere = true;
                }
            } );
            if ( !topView && !debugSphere ) {
                culled++;

                var ss = node.getOrCreateStateSet();
                var m = ss.getAttribute( 'Material' );
                if ( m ) {
                    //m.setTransparency( 0.75 );
                    m.setDiffuse( [ 1.0, 0.0, 0.0, 1.0 ] );
                }
            }
            return true;
        },

        cull: function ( node, nv ) {
            // cull
            var topView = false;
            var debugSphere = false;
            nv.getNodePath().forEach( function ( a ) {
                if ( a.getName() === 'TopView' || ( a.getParents()[ 0 ] && a.getParents()[ 0 ].getName() === 'TopView' ) ) {
                    topView = true;
                }
                if ( a.getName() === 'debugSphere' || ( a.getParents()[ 0 ] && a.getParents()[ 0 ].getName() === 'debugSphere' ) ) {
                    debugSphere = true;
                }
            } );
            if ( !topView && !debugSphere ) {
                culled--;

                var ss = node.getOrCreateStateSet();
                var m = ss.getAttribute( 'Material' );
                if ( m ) {
                    //m.setTransparency( 0.1 );
                    m.setDiffuse( [ 0.0, 1.0, 0.0, 1.0 ] );
                }
            }
            return true;
        }
    };

    Example.prototype = {


        initDatGUI: function () {
            var gui = new window.dat.GUI();
            // ui
            gui.add( this._config, 'nearFar' );
            gui.add( this._config, 'frustumculling' );
            // auto update
            gui.add( this._config, 'culled' ).listen();
            gui.add( this._config, 'near' ).listen();
            gui.add( this._config, 'far' ).listen();

        },

        // helper for transaprency
        setMaterialAndAlpha: function ( n, alpha ) {
            var ss = n.getOrCreateStateSet();

            ss.setRenderingHint( 'TRANSPARENT_BIN' );
            ss.setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
            var material = new osg.Material();
            material.setTransparency( alpha );
            material.setDiffuse( [ 1.0, 1.0, 1.0, alpha ] );
            ss.setAttributeAndModes( material );

        },
        // init a model
        createModelInstance: function () {

            if ( !this._model ) {

                // for now a once and for all
                var debugSphere = false;
                if ( this._config[ 'debug' ] ) {
                    debugSphere = true;
                }

                this._model = new osg.MatrixTransform();
                this._groundNode = this._model;


                this._groundNode.setName( 'groundNode' );

                var count = 10;

                // intentionally create many node/transform
                // to mimick real scene with many nodes
                if ( this._config[ 'count' ] ) {
                    count = this._config[ 'count' ];
                }
                var groundSize = 75 / count;
                var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
                ground.setName( 'groundWithThousandsParent' );
                ground.setCullingActive( true );

                var groundTex = osg.Texture.createFromURL( '../media/textures/seamless/bricks1.jpg' );
                groundTex.setWrapT( 'MIRRORED_REPEAT' );
                groundTex.setWrapS( 'MIRRORED_REPEAT' );
                ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );

                ground.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

                var emptyTex = new osg.Texture();
                emptyTex.defaultType = true;

                var callbackUpdateCull;
                var bbs, bs;
                var groundSubNode;

                for ( var wG = 0; wG < count; wG++ ) {
                    for ( var wH = 0; wH < count; wH++ ) {
                        var groundSubNodeTrans = new osg.MatrixTransform();
                        groundSubNodeTrans.setMatrix(
                            osg.Matrix.makeTranslate( wG * groundSize - 100, wH * groundSize - 100, -5.0, [] ) );
                        // only node are culled in CullVisitor frustum culling
                        groundSubNode = new osg.Node();

                        groundSubNode.setCullingActive( true );

                        callbackUpdateCull = new FrustumCullingDebugCallback();
                        groundSubNode.setUpdateCallback( callbackUpdateCull );
                        groundSubNode.setCullCallback( callbackUpdateCull );

                        this.setMaterialAndAlpha( groundSubNode, 0.0 );

                        groundSubNode.setName( 'groundSubNode_' + wG + '_' + wH );

                        groundSubNodeTrans.addChild( ground );
                        groundSubNode.addChild( groundSubNodeTrans );
                        this._groundNode.addChild( groundSubNode );

                        if ( debugSphere ) {
                            bbs = groundSubNode.getBound();
                            bs = osg.createTexturedSphere( bbs.radius() );
                            bs.setName( 'debugSphere' );

                            bs.setCullingActive( false );

                            this.setMaterialAndAlpha( bs, 0.5 );

                            bs.getOrCreateStateSet().setTextureAttributeAndModes( 0, emptyTex, osg.StateAttribute.OFF | osg.StateAttribute.PROTECTED );
                            /*
bs.getOrCreateStateSet().setTextureAttributeAndModes( 0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
*/

                            callbackUpdateCull = new FrustumCullingDebugCallback();
                            bs.setUpdateCallback( callbackUpdateCull );
                            bs.setCullCallback( callbackUpdateCull );

                            var transformSphere = new osg.MatrixTransform();
                            transformSphere.setMatrix(
                                osg.Matrix.makeTranslate( 2.5 + wG * groundSize - 100, 2.5 + wH * groundSize - 100, -5.0, [] ) );
                            groundSubNode.addChild( transformSphere );
                            transformSphere.addChild( bs );

                            // should fin
                            bs.setBound( new osg.BoundingBox() );
                        }
                    }
                }

                if ( debugSphere ) {
                    bbs = this._groundNode.getBound();
                    bs = osg.createTexturedSphere( bbs.radius() );
                    bs.setName( 'debugSphere' );
                    bs.setCullingActive( false );
                    this.setMaterialAndAlpha( bs, 0.5 );

                    bs.getOrCreateStateSet().setTextureAttributeAndModes( 0, new osg.Texture(), osg.StateAttribute.ON | osg.StateAttribute.PROTECTED | osg.StateAttribute.OVERRIDE );

                    callbackUpdateCull = new FrustumCullingDebugCallback();
                    bs.setUpdateCallback( callbackUpdateCull );
                    bs.setCullCallback( callbackUpdateCull );


                    var transformSphere2 = new osg.MatrixTransform();
                    transformSphere2.setMatrix(
                        osg.Matrix.makeTranslate( count * groundSize * 0.5 - 100, count * groundSize * 0.5 - 100, -5.0, [] ) );
                    this._groundNode.addChild( transformSphere2 );
                    transformSphere2.addChild( bs );

                    bs.setBound( new osg.BoundingBox() );

                }
                this._groundNode.setCullingActive( true );


            }
        },

        addTopView: function () {

            // create a camera that will render to texture
            var rttSize = [ 512, 512 ];
            var rttCamera = new osg.Camera();
            rttCamera.setName( 'TopView' );
            osg.Matrix.makeOrtho( 0, rttSize[ 0 ], 0, rttSize[ 1 ], -5, 5, rttCamera.getProjectionMatrix() );
            rttCamera.setRenderOrder( osg.Camera.POST_RENDER, 0 );
            rttCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            rttCamera.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );

            rttCamera.setProjectionMatrix( [ 1.4034433605922465, 0, 0, 0, 0, 1.920982126971166, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -2.002002002002002, 0 ] );
            rttCamera.setViewMatrix( [ 1, -4.4404402314756446e-13, 1.459502124082795e-13, 0, 4.674147612079625e-13, 0.9500000000000002, -0.3122498999199198, 0, -0, 0.31224989991991986, 0.95, 0, 62.50000000002921, 60.936249499571865, -94.31513162847247, 1 ] );
            // we will render a textured quad on the rtt target with a fixed texture without
            // motion
            //rttCamera.addChild( this._model );
            var disableCullingNode = new osg.Node();
            disableCullingNode.setName( 'DisableCullingNode' );
            disableCullingNode.addChild( this._model );
            disableCullingNode.setCullingActive( false );
            rttCamera.addChild( disableCullingNode );


            // we attach the target texture to our camera
            var rttTargetTexture = new osg.Texture();
            rttTargetTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
            rttTargetTexture.setMinFilter( 'LINEAR' );
            rttTargetTexture.setMagFilter( 'LINEAR' );
            rttCamera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTargetTexture, 0 );

            this._rtt.push( rttTargetTexture );

            this._topView = rttCamera;
        },
        addFrameBufferView: function () {

            this._rttdebugNode = new osg.Node();
            this._rttdebugNode._name = 'debugFBNode';

            if ( !this._rttdebugNode ) this._rttdebugNode = new osg.Node();
            if ( !this._ComposerdebugNode ) this._ComposerdebugNode = new osg.Node();
            this._ComposerdebugNode.setName( 'debugComposerNode' );
            this._ComposerdebugNode.setCullingActive( false );
            if ( !this._ComposerdebugCamera ) this._ComposerdebugCamera = new osg.Camera();
            this._ComposerdebugCamera.setName( 'debugComposerCamera' );
            this._rttdebugNode.addChild( this._ComposerdebugCamera );

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


            var matrixDest = this._ComposerdebugCamera.getProjectionMatrix();
            osg.Matrix.makeOrtho( 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5, matrixDest );
            this._ComposerdebugCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

            matrixDest = this._ComposerdebugCamera.getViewMatrix();
            osg.Matrix.makeTranslate( 0, 0, 0, matrixDest );
            this._ComposerdebugCamera.setViewMatrix( matrixDest );
            this._ComposerdebugCamera.setViewport( new osg.Viewport( 0, 0, this._canvas.width, this._canvas.height ) );
            this._ComposerdebugCamera.setRenderOrder( osg.Camera.POST_RENDER, 0 );
            this._ComposerdebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            this._ComposerdebugCamera.addChild( this._ComposerdebugNode );

            this._ComposerdebugCamera.setClearMask( !( osg.Camera.COLOR_BUFFER_BIT | osg.Camera.DEPTH_BUFFER_BIT ) );
            var texture;
            var xOffset = optionsDebug.x;
            var yOffset = optionsDebug.y;
            this._ComposerdebugNode.removeChildren();

            var stateset;

            var fgt = [
                osgUtil.Composer.Filter.defaultFragmentShaderHeader, 'void main (void)', '{', '  gl_FragColor = texture2D(Texture0,FragTexCoord0);', '}', ''
            ].join( '\n' );


            var vertexShader = [
                '',
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

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexShader ), new osg.Shader( 'FRAGMENT_SHADER', fgt ) );

            stateset = this._ComposerdebugNode.getOrCreateStateSet();
            if ( !optionsDebug.fullscreen )
                stateset.setAttributeAndModes( new osg.Depth( 'ALWAYS' ) );
            stateset.setAttributeAndModes( program );


            for ( var i = 0, l = this._rtt.length; i < l; i++ ) {
                texture = this._rtt[ i ];
                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    stateset = quad.getOrCreateStateSet();

                    quad.setName( 'debugCompoQuadGeom' );

                    stateset.setTextureAttributeAndModes( 0, texture );
                    stateset.setAttributeAndModes( program );
                    stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

                    this._ComposerdebugNode.addChild( quad );

                    if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
                    else yOffset += optionsDebug.h + 2;
                }
            }
            return this._ComposerdebugCamera;


        },

        createScene: function () {
            var root = new osg.Node();

            this._rtt = [];
            this.createModelInstance();

            var updateCountNode = new osg.Node();
            updateCountNode.setName( 'updateCountNode' );

            var callbackUpdateCount = new CountCallback( {}, this._config );
            updateCountNode.setUpdateCallback( callbackUpdateCount );


            updateCountNode.addChild( this._model );
            updateCountNode.setCullingActive( true );
            root.addChild( updateCountNode );


            this.addTopView();
            this.addFrameBufferView();
            root.addChild( this._topView );
            root.addChild( this._rttdebugNode );

            this._viewer.getCamera().getRenderer().setCullVisitor( new CustomCullVisitor( this._config ) );


            return root;
        },

        run: function ( canvas ) {

            viewer = new osgViewer.Viewer( canvas, {
                'enableFrustumCulling': false
            } );
            this._canvas = canvas;
            this._viewer = viewer;
            viewer.init();

            var scene = this.createScene();

            viewer.getCamera().setEnableFrustumCulling( true );

            this._config[ 'camera' ] = viewer.getCamera();
            viewer.getCamera().setComputeNearFar( true );
            viewer.getCamera().setName( 'main' );

            viewer.setSceneData( scene );
            viewer.setupManipulator();
            viewer.getManipulator().setNode( this._model );
            viewer.getManipulator().computeHomePosition();

            this._topView.setEnableFrustumCulling( false );

            viewer.run();

            this.initDatGUI();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
