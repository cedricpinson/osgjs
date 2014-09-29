 ( function() {
     'use strict';
     var OSG = window.OSG;
     var osg = OSG.osg;
     var osgDB = OSG.osgDB;
     var osgViewer = OSG.osgViewer;
     var osgUtil = OSG.osgUtil;
     var shaderLoader;

     var MyShaderLoader = function( glContext ) {
         this._globalDefaultprecision = '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif';
         this._precisionR = /precision\s+(high|low|medium)p\s+float/;
         this._includeR = /#pragma include "([^"]+)"/g;
         this._shadersList = {};
         this._shadersText = {};
         this._glContext = glContext;
         this._cacheProgram = {};
         return this;
     };

     MyShaderLoader.prototype.loadCallBack = function( e ) {
         if ( e.target.status === 200 ) {
             this._shadersText[ e.target.shaderName ] = e.target.responseText;
         }
     };
     MyShaderLoader.prototype.load = function( shaderFilename, shaderName ) {
         if ( !this._shadersList[ shaderName ] ) this._shadersList[ shaderName ] = shaderFilename;
         var req = new XMLHttpRequest();
         req.shaderName = shaderName;
         req.overrideMimeType( 'text/plain; charset=x-user-defined' );
         req.open( 'GET', shaderFilename + '?id=' + Math.random(), false ); // no async
         req.addEventListener( 'load', this.loadCallBack.bind( this ), false );
         req.send( null );
         return this;
     };
     MyShaderLoader.prototype.preprocess = function( content, includeList ) {
         return content.replace( this._includeR, function( _, name ) {
             // \#pragma include "name";
             if ( includeList.indexOf( name ) !== -1 ) return '';
             var txt = this.getShaderTextPure( name );
             includeList.push( name );
             txt = this.preprocess( txt, includeList );
             return txt;
         }.bind( this ) );
     };
     MyShaderLoader.prototype.getShaderTextPure = function( shaderName ) {
         var preShader;
         if ( !( shaderName in this._shadersText ) ) {
             console.error( 'shader file/text: ' + shaderName + ' not loaded' );
             return '';
         } else {
             preShader = this._shadersText[ shaderName ];
         }
         return preShader;
     };
     MyShaderLoader.prototype.getShaderText = function( shaderName, defines ) {
         // useful for
         var includeList = [];
         var preShader = this.getShaderTextPure( shaderName );
         includeList.push( shaderName );
         var postShader = this.preprocess( preShader, includeList );
         var prePrend = '';
         if ( !this._precisionR.test( postShader ) ) prePrend += this._globalDefaultprecision + '\n';
         if ( !defines ) defines = [];
         prePrend += defines.join( '\n' ) + '\n';
         postShader = prePrend + postShader;
         return postShader;
     };

     MyShaderLoader.prototype.loadAll = function( shadersList ) {
         for ( var shader in shadersList ) {
             if ( shadersList.hasOwnProperty( shader ) ) {
                 this.load( shadersList[ shader ], shader );
             }
         }
         return this;
     };

     MyShaderLoader.prototype.getShaderProgram = function( vs, ps, defines ) {
         if ( this._cacheProgram[ vs + ps + defines ] !== undefined )
             return this._cacheProgram[ vs + ps + defines ];

         var vertexshader = this.getShaderText( vs, defines );
         var fragmentshader = this.getShaderText( ps, defines );

         var program = new osg.Program(
             new osg.Shader( this._glContext.VERTEX_SHADER, vertexshader ), new osg.Shader( this._glContext.FRAGMENT_SHADER, fragmentshader ) );

         this._cacheProgram[ vs + ps + defines ] = program;
         return program;
     };

     var shaderLists = {
         'shadowmap_vsm_receive.vert': 'shaders/shadowmap_vsm_receive.vert',
         'shadowmap_vsm_receive.frag': 'shaders/shadowmap_vsm_receive.frag',
         'shadowmap_vsm_cast.vert': 'shaders/shadowmap_vsm_cast.vert',
         'shadowmap_vsm_cast.frag': 'shaders/shadowmap_vsm_cast.frag',
         'shadowmap_evsm_receive.vert': 'shaders/shadowmap_evsm_receive.vert',
         'shadowmap_evsm_receive.frag': 'shaders/shadowmap_evsm_receive.frag',
         'shadowmap_evsm_cast.vert': 'shaders/shadowmap_evsm_cast.vert',
         'shadowmap_evsm_cast.frag': 'shaders/shadowmap_evsm_cast.frag',
         'shadowmap_receive.vert': 'shaders/shadowmap_receive3.vert',
         'shadowmap_receive.frag': 'shaders/shadowmap_receive3.frag',
         'shadowmap_cast.vert': 'shaders/shadowmap_cast.vert',
         'shadowmap_cast.frag': 'shaders/shadowmap_cast.frag',
         'shadow.glsl': 'shaders/shadow.glsl',
         'object.vert': 'shaders/object.vert',
         'object.frag': 'shaders/object.frag',
         'light.frag': 'shaders/light.frag',
         'interpolation.frag': 'shaders/interpolation.frag',
         'floatrgbacodec.glsl': 'shaders/floatrgbacodec.glsl',
         'fastblur.frag': 'shaders/fastblur.frag',
         'downsize.frag': 'shaders/downsize.frag',
         'common.vert': 'shaders/common.vert',
         'common.frag': 'shaders/common.frag',
         'blur.frag': 'shaders/blur.frag',
         'basic.vert': 'shaders/basic.vert',
         'basic.frag': 'shaders/basic.frag'
     };


     var LightUpdateCallbackShadowMap = function( options ) {

         this._config = options.config;
         this.projectionShadow = options.projectionShadow;
         this.viewShadow = options.viewShadow;
         this.shadowCasterScene = options.shadowCasterScene;
         this.depthRange = options.depthRange;
         this.depthRangeNum = options.depthRangeNum;
         this.camera = options.camera;
         //this.invShadowViewMatrix = options.invShadowViewMatrix;
         this.lightTarget = [ 0.0, 0.0, 0.0 ];
         //this.lightTarget = [15.0, 15.0, 0.0];
         if ( options.position ) this.lightPositionProjTexOrig = options.position;
         else this.lightPositionProjTexOrig = [ 50.0, 50.0, 80.0, 0.0 ];

         this.lightPos = [];
         this.lightPos[ 0 ] = this.lightPositionProjTexOrig[ 0 ]; //x
         this.lightPos[ 1 ] = this.lightPositionProjTexOrig[ 1 ]; //y
         this.lightPos[ 2 ] = this.lightPositionProjTexOrig[ 2 ]; //z*/
         this.lightPos[ 3 ] = 1.0; //z*/

         this.lightDir = [];


         this.worldLightPos = [];
         this.worldLightDir = [];
         this.worldLightTarget = [];

         this.shadowProj = [];
         this.shadowView = [];

         this.up = [ 0, 0, 1 ];
         this.first = true;

     };
     LightUpdateCallbackShadowMap.prototype = {
         updateLightPos: function( node ) {
             var light = node.getLight();
             if ( light._enable ) {
                 // TODO: check change
                 //if (this.lastPos !== &&& this.lastTargetPos !== ){

                 //  GENERIC Code getting pos&dir from light
                 // update shadow camera with  light parameters
                 osg.Vec3.sub( this.lightPos, this.lightTarget, this.lightDir );
                 osg.Vec3.normalize( this.lightDir, this.lightDir );
                 this.up = [ 0, 1, 0 ]; //   camera up
                 // Check it's not coincident with lightdir
                 if ( Math.abs( osg.Vec3.dot( this.up, this.lightDir ) ) >= 1.0 ) {
                     // another camera up
                     this.up = [ 1, 0, 0 ];
                 }


                 // lightSource can has only 1 parent and it is matrix transform.
                 var parentNode = node.parents[ 0 ];
                 // light current position local transform
                 var lightMatrix = parentNode.getMatrix();
                 // update Light node
                 osg.Matrix.makeLookAt( this.lightPos, this.lightTarget, this.up, lightMatrix );

                 osg.Matrix.copy( lightMatrix, this.camera.getViewMatrix() );
                 osg.Matrix.inverse( lightMatrix, lightMatrix );

                 light.setPosition( this.lightPos );
                 light.setDirection( this.lightDir );

                 // osg.Matrix.setTrans(lightMatrix, this.lightPos[0], this.lightPos[1], this.lightPos[2]);
                 //osg.Matrix.makeTranslate(this.lightPos[0], this.lightPos[1], this.lightPos[2], lightMatrix);

                 // inject
                 // camera world matrix.
                 // from light current position
                 var matrixList = parentNode.getWorldMatrices();
                 var worldMatrix = matrixList[ 0 ];

                 //  light pos & lightTarget in World Space
                 osg.Matrix.transformVec3( worldMatrix, this.lightPos, this.worldLightPos );
                 osg.Matrix.transformVec3( worldMatrix, this.lightTarget, this.worldLightTarget );
                 osg.Matrix.transformVec3( worldMatrix, this.lightDir, this.worldLightDir );
                 this.worldLightPos[ 3 ] = 1.0;
                 //light.setPosition( this.worldLightPos );
                 //light.setDirection( this.worldLightDir );

                 //
                 // LIGHT VIEW MATRIX
                 // put that into shadow camera view matrix.
                 //osg.Matrix.makeLookAt( this.worldLightPos, this.worldLightTarget, this.up, this.camera.getViewMatrix() );
                 //this.shadowCasterScene.setMatrix(worldMatrix);


                 // LIGHT PROJ MATRIX
                 // update depth range camera with  light parameters
                 // camera proj matrix should be automatically updated by update/culling ?




                 /*jshint bitwise: false */
                 // we could get that from osgjs cullvisitor easily
                 // adding a bbox and near/far to camera
                 // instead of doing all that here
                 // or ensuring only 1 childnode
                 //var boundingSphere = this.camera.children[ 0 ].getBound();

                 var near = this.camera.near;
                 var far = this.camera.far;
                 if ( near === undefined || far === undefined ) {
                     near = 0.01;
                     far = 100;
                 }

                 if ( near === far ) {
                     far += 1;
                 }

                 this.depthRange.set( [ near, far, far - near, 1.0 / ( far - near ) ] );
                 this.depthRangeNum.set( [ near, far, far - near, 1.0 / ( far - near ) ] );

                 var fov = this._config[ 'fov' ];
                 if ( this._config[ 'shadowproj' ] === 'fov' || this.camera.boundingbox === undefined ) {
                     // spot light get spot light angle/frustum
                     var matrixDest = this.camera.getProjectionMatrix();
                     osg.Matrix.makePerspective( light.getSpotCutoff() * 2.0, 1, near, far, matrixDest );
                     this.camera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

                 } else {
                     // Dir light
                     // get scene bbox ?
                     var min = this.camera.boundingbox._min;
                     var max = this.camera.boundingbox._max;
                     /*
                // Find minimum enclosing sphere for view frustum
                var fovScale = Math.tan(fov);
                var size = osg.Vec3.sub(max, min, []);
                var sizeScaled = osg.Vec3.mult(size, fovScale, []);
                var diffSize = osg.Vec3.sub(size, sizeScaled, []);

                osg.Matrix.makeOrtho(
                        min[0] + diffSize[0], max[0] - diffSize[0],
                        min[1] + diffSize[1], max[1] - diffSize[1],
                        min[2] + diffSize[2], max[2] - diffSize[2],
                        this.camera.getProjectionMatrix());
          */
                     osg.Matrix.makeOrtho(
                         min[ 0 ], max[ 0 ],
                         min[ 1 ], max[ 1 ],
                         min[ 2 ], max[ 2 ],
                         this.camera.getProjectionMatrix() );
                 }
                 osg.Matrix.copy( this.camera.getProjectionMatrix(), this.shadowProj );
                 osg.Matrix.copy( this.camera.getViewMatrix(), this.shadowView );

                 // udpate shader Parameters
                 this.projectionShadow.set( this.shadowProj );
                 this.viewShadow.set( this.shadowView );


                 node._light.dirty();
                 // add cache trashing info when matrix cache enabled
                 //node.setDirtyMatrix( true );
                 //this.camera.setDirtyMatrix( true );
             }
         },

         animation: function( currentTime ) {

             this.lightPos[ 0 ] = this.lightPositionProjTexOrig[ 0 ] * ( Math.cos( currentTime ) + this.lightPositionProjTexOrig[ 3 ] ); //x
             this.lightPos[ 1 ] = this.lightPositionProjTexOrig[ 1 ] * ( Math.sin( currentTime ) + this.lightPositionProjTexOrig[ 3 ] ); //y
             this.lightPos[ 2 ] = this.lightPositionProjTexOrig[ 2 ]; //z

         },

         update: function( node, nv ) {
             //if ( node.getLight()._enable ) {
             if ( node._light._enable ) {
                 // animation !
                 if ( this.first || ( this._config[ 'lightrotate' ] && this._config[ 'lightrotate' ] !== 0 ) ) {
                     this.animation( nv.getFrameStamp().getSimulationTime() * 0.2 );
                     this.updateLightPos( node );
                     this.first = false;
                 }

             }
             node.traverse( nv );
         }
     };



     var Example = function() {

         this._config = {
             'texturesize': 1024,
             'shadow': 'VSM',
             'texturetype': 'Force8bits',
             'lightnum': 3,
             'bias': 0.005,
             'VsmEpsilon': 0.0008,
             'supersample': 0,
             'blur': true,
             'blurKernelSize': 4.0,
             'blurTextureSize': 256,
             'model': 'ogre',
             'shadowstable': 'World Position',
             'shadowproj': 'fov',
             'fov': 50,

             'exponent': 40,
             'exponent1': 10.0,

             'lightrotate': true,
             'texture': true,
             'debugRtt': true,

             '_spotCutoff': 25,
             '_spotBlend': 0.3,
             '_constantAttenuation': 0.0,
             '_linearAttenuation': 0.005,
             '_quadraticAttenuation': 0.0
         };

         this._rtt = [];
         this._parameterUniform = {};

         // Per Light/shadow
         this._lights = [];
         this._lightsMatrix = [];
         this._lightsSource = [];
         this._lightsUniform = [];
         this._casterStateSet = [ undefined, undefined, undefined ]; // one statset per light casting shadow
         this._shadowTexture = [ undefined, undefined, undefined ];
         this._shadowCamera = [ undefined, undefined, undefined ];

         this._blurPass = [ undefined, undefined, undefined ];
         this._downPass = [ undefined, undefined, undefined ];

         // shared
         this._receiverStateSet = undefined;
         this.textureType = undefined;

         this.previousTech = this._config[ 'technique' ];
         this.previousTextureSize = this._config[ 'texturesize' ];
         this.previousTextureType = this._config[ 'texturetype' ];
         this.previousBlur = this._config[ 'blur' ];

         this.floatTextureSupport = false;
     };

     Example.prototype = {

         initDatGUI: function() {

             var gui = new window.dat.GUI();

             var controller;

             controller = gui.add( this._config, 'shadow', {
                 'Variance Shadow Map (VSM)': 'VSM',
                 'Exponential Variance Shadow Map (EVSM)': 'EVSM',
                 'Exponential Shadow Map (ESM)': 'ESM',
                 'Shadow Map': 'NONE',
                 'Shadow Map Percentage Close Filtering (PCF)': 'PCF'
             } );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'texturetype', [ 'Force8bits', 'Autodetect' ] );
             controller.onChange( this.updateShadow.bind( this ) );
             controller = gui.add( this._config, 'texturesize', [ 32, 64, 128, 256, 512, 1024, 2048, 4096, 8144 ] );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightnum', 1, 3 ).step( 1 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightrotate' );
             controller.onChange( this.updateShadow.bind( this ) );


             controller = gui.add( this._config, 'bias', 0.0001, 0.05 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'fov' ).min( 0.0 ).max( 180.0 );
             controller.onChange( this.updateShadow.bind( this ) );




             var VSMFolder = gui.addFolder( 'Variance (VSM, EVSM)' );

             controller = VSMFolder.add( this._config, 'VsmEpsilon' ).min( 0.0001 ).max( 0.01 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = VSMFolder.add( this._config, 'supersample' ).step( 1 ).min( 0.0 ).max( 8 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = VSMFolder.add( this._config, 'blur' );
             controller.onChange( this.updateShadow.bind( this ) );

             //controller = VSMFolder.add( this._config, 'blurKernelSize' ).min( 3.0 ).max( 128.0 );
             //controller.onChange( this.updateShadow.bind( this ) );

             //controller = VSMFolder.add( this._config, 'blurTextureSize', [ 32, 64, 128, 256, 512, 1024, 2048, 4096, 8144 ] );
             //controller.onChange( this.updateShadow.bind( this ) );


             var ExpFolder = gui.addFolder( 'Exponent (ESM, EVSM)' );

             controller = ExpFolder.add( this._config, 'exponent' ).min( 0.0 ).max( 300.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = ExpFolder.add( this._config, 'exponent1' ).min( 0.0 ).max( 200.0 );
             controller.onChange( this.updateShadow.bind( this ) );


             var debugFolder = gui.addFolder( 'Debug Show' );
             controller = debugFolder.add( this._config, 'debugRtt' );
             controller.onChange( this.updateShadow.bind( this ) );
             controller = debugFolder.add( this._config, 'texture' );
             controller.onChange( this.updateShadow.bind( this ) );


         },

         updateShadow: function() {

             var l, numLights = ~~ ( this._config[ 'lightnum' ] );

             l = this._lights.length;
             while ( l-- ) {
                 this._lights[ l ]._enable = false;
             }

             while ( ++l < numLights ) {
                 this._lights[ l ]._enable = true;
             }

             // update
             this._config[ '_spotCutoff' ] = this._config[ 'fov' ] * 0.5;

             l = this._lights.length;
             while ( l-- ) {
                 this._lights[ l ].setSpotCutoff( this._config[ '_spotCutoff' ] );
             }

             l = this._lights.length;
             while ( l-- ) {
                 this._lightsUniform[ l ].set( this._lights[ l ]._enable ? 1.0 : 0.0 );
             }

             for ( var p in this._parameterUniform ) {
                 if ( this._config[ p ] !== undefined ) {
                     if ( typeof this._config[ p ] !== 'boolean' ) {
                         this._parameterUniform[ p ].set( this._config[ p ] );
                     } else {
                         this._parameterUniform[ p ].set( this._config[ p ] ? 1.0 : 0.0 );
                     }
                 }
             }

             var doBlur = this._config[ 'blur' ];
             var doDownSample = this._config[ 'supersample' ];

             if ( this.previousTech !== this._config[ 'technique' ] ) {
                 // technique change.
                 switch ( this._config[ 'technique' ] ) {
                     case 'ESM':
                         this._config[ 'exponent' ] = 200.0;
                         doBlur = false;
                         doDownSample = false;
                         break;
                     case 'EVSM':
                         this._config[ 'exponent' ] = 0.001;
                         this._config[ 'exponent1' ] = 0.001;
                         break;
                     case 'VSM':
                         this._config[ 'exponent' ] = 0.001;
                         this._config[ 'exponent1' ] = 0.001;
                         break;
                     default:
                         doBlur = false;
                         doDownSample = false;
                         break;
                 }
                 this.previousTech = this._config[ 'technique' ];
             }
             var mapsize = ~~ ( this._config[ 'texturesize' ] );
             var shadowSizeFinal = [ mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize ];

             if ( this.previousTextureSize !== mapsize ) {

                 l = numLights;
                 while ( l-- ) {
                     this._shadowTexture[ l ].setTextureSize( shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] );
                     this._shadowTexture[ l ].dirty();
                     // force recreation
                     this._shadowTexture[ l ].releaseGLObjects( this._glContext ); //broken
                     osg.Texture.textureManager.releaseTextureObject( this._shadowTexture[ l ]._textureObject );
                     this._shadowTexture[ l ]._textureObject = undefined;
                     this._shadowTexture[ l ].init( this._glContext );

                     this._shadowCamera[ l ].setViewport( new osg.Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );

                     // miss detach texture
                     // force reattach
                     this._shadowCamera[ l ].attachments = undefined;
                     this._shadowCamera[ l ].frameBufferObject.attachments = [];
                     this._shadowCamera[ l ].frameBufferObject.dirty();
                     this._shadowCamera[ l ].attachTexture( this._glContext.COLOR_ATTACHMENT0, this._shadowTexture[ l ], 0 );
                     this._shadowCamera[ l ].attachRenderBuffer( this._glContext.DEPTH_ATTACHMENT, this._glContext.DEPTH_COMPONENT16 );



                     if ( this._blurPass[ l ] !== undefined ) {
                         var bp = this._blurPass[ l ];
                         var bpl = bp.length;
                         while ( bpl-- ) {
                             bp[ bpl ].texture.setTextureSize( shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] );
                             bp[ bpl ].texture.dirty();

                             // force recreation
                             //bp[ bpl ].texture.releaseGLObjects( this._glContext ); //broken
                             osg.Texture.textureManager.releaseTextureObject( bp[ bpl ].texture._textureObject );
                             bp[ bpl ].texture._textureObject = undefined;
                             bp[ bpl ].texture.init( this._glContext );

                             bp[ bpl ].camera.setViewport( new osg.Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );

                             // miss detach texture
                             // force reattach
                             bp[ bpl ].camera.attachments = undefined;
                             bp[ bpl ].camera.frameBufferObject.attachments = [];
                             bp[ bpl ].camera.frameBufferObject.dirty();
                             bp[ bpl ].camera.attachTexture( this._glContext.COLOR_ATTACHMENT0, bp[ bpl ].texture, 0 );
                         }
                     }
                     if ( this._downPass[ l ] !== undefined ) {
                         var dp = this._downPass[ l ];


                         var dpl = dp.length;
                         while ( dpl-- ) {
                             shadowSizeFinal[ 0 ] *= 0.5;
                             shadowSizeFinal[ 1 ] *= 0.5;

                             dp[ dpl ].texture.setTextureSize( shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] );
                             dp[ dpl ].texture.dirty();

                             // force recreation
                             // dp[ dpl ].texture.releaseGLObjects( this._glContext );// broken
                             osg.Texture.textureManager.releaseTextureObject( dp[ dpl ].texture._textureObject );
                             dp[ dpl ].texture._textureObject = undefined;
                             dp[ dpl ].texture.init( this._glContext );

                             // miss detach texture
                             // force reattach
                             dp[ dpl ].camera.setViewport( new osg.Viewport( 0, 0, shadowSizeFinal[ 0 ], shadowSizeFinal[ 1 ] ) );
                             dp[ dpl ].camera.attachments = undefined;
                             dp[ dpl ].camera.frameBufferObject.attachments = [];
                             dp[ dpl ].camera.frameBufferObject.dirty();
                             dp[ dpl ].camera.attachTexture( this._glContext.COLOR_ATTACHMENT0, dp[ dpl ].texture, 0 );


                         }
                     }



                     this._receiverStateSet.getUniformList()[ 'Shadow_MapSize' + l ].getUniform().set( shadowSizeFinal );
                 }
                 this.previousTextureSize = this._config[ 'texturesize' ];
             }

             var texType = this._config[ 'texturetype' ];
             if ( this.previousTextureType !== texType ) {
                 l = numLights;
                 while ( l-- ) {
                     this._shadowTexture[ l ].setType( this.textureType );
                 }
                 this.previousTextureType = this._config[ 'texturetype' ];
             }

             // what if texture size change
             // force change blur ?
             // this code need change
             // as it's on/off, not on/on or off/off
             if ( this.previousBlur !== doBlur ) {
                 this._rtt.length = 0;

                 shadowSizeFinal = [ mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize ];

                 l = numLights;
                 while ( l-- ) {

                     this._rtt.push( this._shadowTexture );
                     var shadowTextureFinal = this._shadowTexture[ l ];
                     var lightsource = this._lightsSource[ l ];
                     if ( doBlur ) {
                         // we want to blur as VSM support that
                         this._shadowTexture[ l ].setMinFilter( 'LINEAR' );
                         this._shadowTexture[ l ].setMagFilter( 'LINEAR' );

                         var blurPass;
                         this._blurPass[ l ] = [];
                         blurPass = this.addBlur( shadowTextureFinal, shadowSizeFinal );
                         this._blurPass[ l ].push( blurPass );
                         shadowTextureFinal = blurPass.texture;
                         lightsource.addChild( blurPass.camera );


                         this._downPass[ l ] = [];
                         while ( doDownSample-- && shadowSizeFinal[ 0 ] > 64 ) {
                             var halfPass;
                             shadowSizeFinal[ 0 ] *= 0.5;
                             shadowSizeFinal[ 1 ] *= 0.5;
                             shadowSizeFinal[ 2 ] *= 2.0;
                             shadowSizeFinal[ 3 ] *= 2.0;

                             halfPass = this.addHalfDownSample( shadowTextureFinal, shadowSizeFinal );
                             this._downPass[ l ].push( halfPass );
                             shadowTextureFinal = halfPass.texture;
                             lightsource.addChild( halfPass.camera );

                         }

                         this._receiverStateSet.setTextureAttributeAndMode( l + 1, shadowTextureFinal, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

                     } else {
                         // ESM likes anisotropic
                         this._shadowTexture[ l ].setMinFilter( 'NEAREST' );
                         this._shadowTexture[ l ].setMagFilter( 'NEAREST' );


                         // if disabling blur, you want to set shadow texture as input for draw
                         this._receiverStateSet.setTextureAttributeAndMode( l + 1, shadowTextureFinal, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

                         // remove blur and haldown camera and rtt.
                         // lightsource.
                         if ( this._blurPass[ l ] !== undefined ) {
                             var bp = this._blurPass[ l ];
                             var bpl = bp.length;
                             while ( bpl-- ) {
                                 this._lightsSource[ l ].removeChild( bp[ bpl ].camera );
                                 bp[ bpl ].camera = undefined;
                                 bp[ bpl ] = undefined;
                             }
                         }
                         if ( this._downPass[ l ] !== undefined ) {
                             var dp = this._downPass[ l ];
                             var dpl = dp.length;
                             while ( dpl-- ) {
                                 this._lightsSource[ l ].removeChild( dp[ dpl ] );
                                 dp[ dpl ].camera = undefined;
                                 dp[ dpl ] = undefined;
                             }
                         }
                     }


                 }
                 this.previousBlur = doBlur;
             }





             var prg = this.getShadowCasterShaderProgram();
             l = numLights;
             while ( l-- ) {
                 if ( this._casterStateSet[ l ] !== undefined && this._lights[ l ] && this._lights[ l ]._enable ) {
                     this._casterStateSet[ l ].setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
                 }
             }

             prg = this.getShadowReceiverShaderProgram();
             this._receiverStateSet.setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );


             this._rttdebugNode.removeChildren();
             if ( this._config[ 'debugRtt' ] ) {
                 this.showFrameBuffers( {
                     screenW: this._canvas.width,
                     screenH: this._canvas.height
                 } );
             }


         },
         getShadowReceiverShaderProgram: function() {

             var shadowmapReceiverVertex;
             var shadowmapReceiverFragment;
             var defines = [];

             if ( this._config[ 'shadowstable' ] === 'World Position' )
                 defines.push( '#define NUM_STABLE' );

             var floatTexSupp = this._config[ 'texturetype' ] !== 'Force8bits' && this.floatTexSupport;
             if ( floatTexSupp ) {
                 defines.push( '#define _FLOATTEX' );
             }


             if ( floatTexSupp && this._config[ 'shadow' ] === 'EVSM' ) {
                 // NEED float
                 // add alert if not ?
                 shadowmapReceiverVertex = 'shadowmap_evsm_receive.vert';
                 shadowmapReceiverFragment = 'shadowmap_evsm_receive.frag';
             } else if ( floatTexSupp && this._config[ 'shadow' ] === 'VSM' ) {
                 shadowmapReceiverVertex = 'shadowmap_vsm_receive.vert';
                 shadowmapReceiverFragment = 'shadowmap_vsm_receive.frag';
             } else {
                 if ( this._config[ 'shadow' ] === 'ESM' ) {
                     defines.push( '#define _ESM' );
                 } else if ( this._config[ 'shadow' ] === 'NONE' ) {
                     defines.push( '#define _NONE' );
                 } else if ( this._config[ 'shadow' ] === 'PCF' ) {
                     defines.push( '#define _PCF' );
                 } else if ( this._config[ 'shadow' ] === 'VSM' ) {
                     defines.push( '#define _VSM' ); // VSM 8 bits
                 }
                 shadowmapReceiverVertex = 'shadowmap_receive.vert';
                 shadowmapReceiverFragment = 'shadowmap_receive.frag';
             }
             var prg = shaderLoader.getShaderProgram( shadowmapReceiverVertex, shadowmapReceiverFragment, defines );

             prg.trackAttributes = {};
             prg.trackAttributes.attributeKeys = [];
             prg.trackAttributes.attributeKeys.push( 'Material' );

             if ( this._lights[ 0 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light0' );
             if ( this._lights[ 1 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light1' );
             if ( this._lights[ 2 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light2' );

             return prg;
         },
         setShadowReceiving: function( receivers /*, sceneCamera, ReceivesShadowTraversalMask*/ ) {

             //sceneCamera.traversalMask = ReceivesShadowTraversalMask;
             // applies on receivers selection for material state set apply only ?
             // scene models (shadow receiver)
             var shadowReceiverScene = new osg.Node();
             shadowReceiverScene.addChild( receivers );

             var stateSet = shadowReceiverScene.getOrCreateStateSet();
             this._receiverStateSet = stateSet;

             var prg = this.getShadowReceiverShaderProgram();
             stateSet.setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

             stateSet.addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
             var myuniform;

             var texturedebug = this._config[ 'texture' ] ? 1.0 : 0.0;
             myuniform = osg.Uniform.createFloat1( texturedebug, 'debug' );
             stateSet.addUniform( myuniform );
             this._parameterUniform[ 'texture' ] = myuniform;

             var bias = this._config[ 'bias' ];
             myuniform = osg.Uniform.createFloat1( bias, 'bias' );
             stateSet.addUniform( myuniform );
             this._parameterUniform[ 'bias' ] = myuniform;

             var exponent = this._config[ 'exponent' ];
             myuniform = osg.Uniform.createFloat1( exponent, 'exponent' );
             stateSet.addUniform( myuniform );
             this._parameterUniform[ 'exponent' ] = myuniform;

             var exponent1 = this._config[ 'exponent1' ];
             myuniform = osg.Uniform.createFloat1( exponent1, 'exponent1' );
             stateSet.addUniform( myuniform );
             this._parameterUniform[ 'exponent1' ] = myuniform;

             var VsmEpsilon = this._config[ 'VsmEpsilon' ];
             myuniform = osg.Uniform.createFloat1( VsmEpsilon, 'VsmEpsilon' );
             stateSet.addUniform( myuniform );
             this._parameterUniform[ 'VsmEpsilon' ] = myuniform;



             return shadowReceiverScene;
         },
         getShadowCasterShaderProgram: function() {
             var textureType, textureFormat, defines = [];

             var shadowmapCasterVertex;
             var shadowmapCasterFragment;
             var floatTexSupp = this.floatTexSupport && this._config[ 'texturetype' ] !== 'Force8bits';
             if ( floatTexSupp ) {
                 textureType = osg.Texture.FLOAT;
                 defines.push( '#define _FLOATTEX' );
             } else {
                 textureType = osg.Texture.UNSIGNED_BYTE;
             }
             if ( this._config[ 'shadowstable' ] === 'World Position' )
                 defines.push( '#define NUM_STABLE' );
             if ( floatTexSupp && this._config[ 'shadow' ] === 'EVSM' ) {
                 shadowmapCasterVertex = 'shadowmap_evsm_cast.vert';
                 shadowmapCasterFragment = 'shadowmap_evsm_cast.frag';
                 textureFormat = osg.Texture.RGBA;
             } else if ( floatTexSupp && this._config[ 'shadow' ] === 'VSM' ) {
                 shadowmapCasterVertex = 'shadowmap_vsm_cast.vert';
                 shadowmapCasterFragment = 'shadowmap_vsm_cast.frag';
                 textureFormat = osg.Texture.RGBA;
             } else {
                 if ( this._config[ 'shadow' ] === 'ESM' ) {
                     defines.push( '#define _ESM' );
                     textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'NONE' ) {
                     defines.push( '#define _NONE' );
                     if ( floatTexSupp )
                         textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'PCF' ) {
                     defines.push( '#define _PCF' );
                     if ( floatTexSupp )
                         textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'VSM' ) {
                     defines.push( '#define _VSM' );
                     textureFormat = osg.Texture.RGBA;
                 }
                 shadowmapCasterVertex = 'shadowmap_cast.vert';
                 shadowmapCasterFragment = 'shadowmap_cast.frag';
                 textureFormat = osg.Texture.RGBA;
             }

             var prg = shaderLoader.getShaderProgram( shadowmapCasterVertex, shadowmapCasterFragment, defines );
             this.textureType = textureType;
             this.textureFormat = textureFormat;
             return prg;
         },
         setShadowCasting: function( receivers, casters, lightsource, lightNode, position, num /*, CastsShadowTraversalMask*/ ) {

             var shadowCamera = new osg.Camera();
             this._shadowCamera[ num ] = shadowCamera;
             shadowCamera.setName( 'light_perspective_camera' + num );

             //shadowCamera.traversalMask = CastsShadowTraversalMask;

             // scene models (shadow caster)
             //  filled upon distance from light and node/geom mask and transparency
             var shadowCasterScene = new osg.MatrixTransform();
             shadowCasterScene.addChild( casters );
             shadowCamera.addChild( shadowCasterScene );

             var mapsize = this._config[ 'texturesize' ];
             var shadowSize = [ mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize ];

             // important because we use linear zbuffer
             var near = 0.0;
             var far = 1.0;

             // update projection each frame, at least near/far but better a computed matrix
             var matrixDest = shadowCamera.getProjectionMatrix();
             // 15 === this._config[fov]; or spot blend angle
             osg.Matrix.makePerspective( 15, 1, near, far, matrixDest );
             shadowCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

             // update order upon render shadow/ render scene/postproc/etc. inehritance.
             shadowCamera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
             shadowCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             shadowCamera.setViewport( new osg.Viewport( 0, 0, shadowSize[ 0 ], shadowSize[ 1 ] ) );
             shadowCamera.setClearColor( [ 1.0, 1.0, 1.0, 1.0 ] );


             var casterStateSet = shadowCasterScene.getOrCreateStateSet();
             this._casterStateSet[ num ] = casterStateSet;
             var prg = this.getShadowCasterShaderProgram();
             casterStateSet.setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

             //casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
             //casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.BACK), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

             //prevent unessecary texture bindings
             casterStateSet.setTextureAttributeAndMode( 0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
             casterStateSet.setTextureAttributeAndMode( 1, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
             casterStateSet.setTextureAttributeAndMode( 2, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );
             casterStateSet.setTextureAttributeAndMode( 3, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE );

             //casterStateSet.setAttributeAndMode(new osg.BlendFunc('ONE', 'ZERO'));
             //casterStateSet.setAttributeAndMode(new osg.Depth('LESS', 0.0, 1.0, false));


             var depthRange = new osg.Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' );

             casterStateSet.addUniform( depthRange );


             ////////////// SHADOW TEXTURE
             // CASTERs are rendered INTO THAT AS DEPTH POS
             // RECEIVERs USE IT AS texture input
             var shadowTexture = new osg.Texture();
             shadowTexture.setName( 'shadow' + num );

             this._shadowTexture[ num ] = shadowTexture;

             shadowTexture.setTextureSize( shadowSize[ 0 ], shadowSize[ 1 ] );
             shadowTexture.setType( this.textureType );
             shadowTexture.setInternalFormat( this.textureFormat );


             var doBlur = this._config[ 'blur' ];
             var doDownSample = this._config[ 'supersample' ];
             if ( doBlur && doDownSample !== 0 ) {
                 // we want to blur as VSM support that
                 shadowTexture.setMinFilter( 'LINEAR' );
                 shadowTexture.setMagFilter( 'LINEAR' );
             } else {
                 shadowTexture.setMinFilter( 'NEAREST' );
                 shadowTexture.setMagFilter( 'NEAREST' );
             }

             shadowTexture.setWrapS( osg.Texture.CLAMP_TO_EDGE );
             shadowTexture.setWrapT( osg.Texture.CLAMP_TO_EDGE );

             this._rtt.push( shadowTexture );
             shadowCamera.attachTexture( this._glContext.COLOR_ATTACHMENT0, shadowTexture, 0 );
             shadowCamera.attachRenderBuffer( this._glContext.DEPTH_ATTACHMENT, this._glContext.DEPTH_COMPONENT16 );

             // LIGHT SHADOW RELATION
             lightsource.addChild( shadowCamera );
             //lightnode.addChild( shadowCamera );

             var shadowTextureFinal = shadowTexture;
             var shadowSizeFinal = shadowSize;
             //var shadowSizeFinal shadowSize.slice(0);//cp by value
             if ( doBlur ) {
                 var blurPass;
                 this._blurPass[ num ] = [];
                 blurPass = this.addBlur( shadowTextureFinal, shadowSizeFinal );
                 this._blurPass[ num ].push( blurPass );
                 shadowTextureFinal = blurPass.texture;
                 lightsource.addChild( blurPass.camera );
             }

             this._downPass[ num ] = [];
             while ( doDownSample-- && shadowSizeFinal[ 0 ] > 64 ) {
                 var halfPass;
                 halfPass = this.addHalfDownSample( shadowTextureFinal, shadowSizeFinal );
                 this._downPass[ num ].push( halfPass );
                 shadowTextureFinal = halfPass.texture;
                 shadowSizeFinal[ 0 ] *= 0.5;
                 shadowSizeFinal[ 1 ] *= 0.5;
                 shadowSizeFinal[ 2 ] *= 2.0;
                 shadowSizeFinal[ 3 ] *= 2.0;
                 lightsource.addChild( halfPass.camera );

             }

             lightsource.getOrCreateStateSet().setAttributeAndMode( lightsource.getLight() );

             //////////////////////////////////
             //// HERE we add the texture shadow to the normal rendering
             // by hand for model with 1 texture only
             var stateSet = receivers.getOrCreateStateSet();

             stateSet.setTextureAttributeAndMode( num + 1, shadowTextureFinal, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
             stateSet.addUniform( osg.Uniform.createInt1( num + 1, 'Texture' + ( num + 1 ) ) );

             var depthRangeNum = new osg.Uniform.createFloat4( [ near, far, far - near, 1.0 / ( far - near ) ], 'Shadow_DepthRange' + num );
             var shadowMapSizeNum = new osg.Uniform.createFloat4( shadowSize, 'Shadow_MapSize' + num );
             var projectionShadowNum = new osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'Shadow_Projection' + num );
             var viewShadowNum = new osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'Shadow_View' + num );
             var enabledLight = new osg.Uniform.createFloat1( 1.0, 'Light' + num + '_uniform_enable' );

             this._lightsUniform.push( enabledLight );

             stateSet.addUniform( enabledLight );
             stateSet.addUniform( projectionShadowNum );
             stateSet.addUniform( viewShadowNum );
             stateSet.addUniform( depthRangeNum );
             stateSet.addUniform( shadowMapSizeNum );

             var lightCallback = new LightUpdateCallbackShadowMap( {
                 'config': this._config,
                 'projectionShadow': projectionShadowNum,
                 'viewShadow': viewShadowNum,
                 'depthRangeNum': depthRangeNum,
                 'camera': shadowCamera,
                 'position': position,
                 'shadowCasterScene': shadowCasterScene,
                 'depthRange': depthRange
                 //'invShadowViewMatrix': invShadowViewMatrixUniform
             } );

             // Callback where we get Matrix update relfected between light and shadow camera
             lightsource.setUpdateCallback( lightCallback );
             //lightnode.setUpdateCallback( lightCallback );

             lightNode.addChild( lightsource );

             return lightNode;
         },

         getModel: function( /*func*/) {
             var modelName;
             modelName = this._config[ 'model' ];
             var node = new osg.MatrixTransform();
             if ( !modelName ) return node;

             var defer = Q.defer();
             //node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));
             var loadModel = function( url ) {
                 osg.log( 'loading ' + url );
                 var req = new XMLHttpRequest();
                 req.open( 'GET', url, true );
                 var options = {};
                 var urlParts = url.split( '/' );
                 urlParts = urlParts.slice( 0, urlParts.length - 1 );
                 options.prefixURL = urlParts.join( '/' ) + '/';
                 req.overrideMimeType( 'application/javascript' );
                 req.onreadystatechange = function( /*aEvt*/) {
                     if ( req.readyState === 4 ) {
                         //var child;
                         if ( req.status === 200 ) {
                             Q.when( osgDB.parseSceneGraph( JSON.parse( req.responseText ), options ) ).then( function( child ) {
                                 node.addChild( child );
                                 defer.resolve( node );
                                 osg.log( 'success ' + url );
                             } );
                         } else {
                             osg.log( 'error ' + url );
                         }
                     }
                 };
                 req.send( null );
             };

             loadModel( modelName + '.osgjs' );
             return defer.promise;
         },

         addHalfDownSample: function( rttTexture, rttSize ) {
             var w = rttSize[ 0 ] / 2,
                 h = rttSize[ 1 ] / 2;

             var halfDownedTexture = new osg.Texture();
             halfDownedTexture.setTextureSize( w, h );

             halfDownedTexture.setMinFilter( 'LINEAR' );
             halfDownedTexture.setMagFilter( 'NEAREST' );

             // TODO: texture getType !== setType ?
             halfDownedTexture.setType( rttTexture._type );
             halfDownedTexture.setInternalFormat( rttTexture.getInternalFormat() );

             var halfDownQuad = osg.createTexturedQuadGeometry( -w / 2, -h / 2, 0, w, 0, 0, 0, h, 0 );
             var stateSet = halfDownQuad.getOrCreateStateSet();
             stateSet.setTextureAttributeAndMode( 0, rttTexture );
             stateSet.setAttributeAndMode( shaderLoader.getShaderProgram( 'basic.vert', 'downsize.frag' ) );
             var texMapSize = new osg.Uniform.createFloat4( rttSize, 'TexSize' );
             stateSet.addUniform( texMapSize );

             var halfDownCam = new osg.Camera();
             var matrixDest = halfDownCam.getProjectionMatrix();
             osg.Matrix.makeOrtho( -w / 2, w / 2, -h / 2, h / 2, -5, 5, matrixDest );
             halfDownCam.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches
             //TODO disable clear & depth checks
             halfDownCam.setClearMask( 0 );
             //halfDownCam.setClearColor([0, 0, 0, 0]);
             //halfDownCam.setClearDepth(1.0);
             halfDownCam.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
             halfDownCam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             halfDownCam.setViewport( new osg.Viewport( 0, 0, w, h ) );
             halfDownCam.attachTexture( this._viewer.getGraphicContext().COLOR_ATTACHMENT0, halfDownedTexture, 0 );

             halfDownCam.addChild( halfDownQuad );

             this._rtt.push( halfDownedTexture );

             return {
                 camera: halfDownCam,
                 texture: halfDownedTexture,
                 quad: halfDownQuad
             };

         },

         addBlur: function( rttTexture, rttSize ) {

             var w = rttSize[ 0 ],
                 h = rttSize[ 1 ];

             var blurredTexture = new osg.Texture();
             blurredTexture.setTextureSize( w, h );

             blurredTexture.setMinFilter( 'LINEAR' );
             blurredTexture.setMagFilter( 'LINEAR' );

             // TODO: texture getType !== setType ?
             blurredTexture.setType( rttTexture._type );
             blurredTexture.setInternalFormat( rttTexture.getInternalFormat() );

             var blurQuad = osg.createTexturedQuadGeometry( -w / 2, -h / 2, 0, w, 0, 0, 0, h, 0 );
             var stateSet = blurQuad.getOrCreateStateSet();
             stateSet.setTextureAttributeAndMode( 0, rttTexture );
             stateSet.setAttributeAndMode( shaderLoader.getShaderProgram( 'basic.vert', 'fastblur.frag' ) );
             var texMapSize = new osg.Uniform.createFloat4( rttSize, 'TexSize' );
             stateSet.addUniform( texMapSize );

             var blurCam = new osg.Camera();

             var matrixDest = blurCam.getProjectionMatrix();
             osg.Matrix.makeOrtho( -w / 2, w / 2, -h / 2, h / 2, -5, 5, matrixDest );
             blurCam.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

             //TODO disable clear & depth checks
             blurCam.setClearMask( 0 );
             //blurCam.setClearColor([0, 0, 0, 0]);
             //blurCam.setClearDepth(1.0);
             blurCam.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
             blurCam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             blurCam.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
             blurCam.attachTexture( this._viewer.getGraphicContext().COLOR_ATTACHMENT0, blurredTexture, 0 );

             blurCam.addChild( blurQuad );

             this._rtt.push( blurredTexture );

             return {
                 camera: blurCam,
                 texture: blurredTexture,
                 quad: blurQuad
             };
         },

         createSceneCasterReceiver: function() {
             // Scene to be shadowed,  and to cast  shadow from
             // Multiple parents...
             var ShadowScene = new osg.Node();
             ShadowScene.setName( 'ShadowScene' );

             var _self = this;
             var modelNode = new osg.Node();
             modelNode.setName( 'cubeSubNode' );
             ( function() {
                 Q.when( _self.getModel() ).then( function( model ) {
                     var dist = 25;
                     var modelSubNode = new osg.MatrixTransform();
                     modelSubNode.setMatrix( osg.Matrix.makeTranslate( 0, 0, 0, [] ) );
                     modelSubNode.setMatrix( osg.Matrix.makeScale( 0.1, 0.1, 0.1, [] ) );
                     modelSubNode.addChild( model );
                     modelNode.addChild( modelSubNode );
                     modelSubNode = new osg.MatrixTransform();
                     modelSubNode.setMatrix( osg.Matrix.makeTranslate( 0, dist, 0, [] ) );
                     modelSubNode.addChild( model );
                     modelNode.addChild( modelSubNode );

                     modelSubNode = new osg.MatrixTransform();
                     modelSubNode.setMatrix( osg.Matrix.makeTranslate( dist, 0, 0, [] ) );
                     modelSubNode.addChild( model );
                     modelNode.addChild( modelSubNode );

                     modelSubNode = new osg.MatrixTransform();
                     modelSubNode.setMatrix( osg.Matrix.makeTranslate( -dist, 0, -5, [] ) );
                     modelSubNode.addChild( model );
                     modelNode.addChild( modelSubNode );

                 } );
             } )();
             // make "pillars"
             // testing light artifacts
             // peter panning, light streaks, etc.
             var cubeNode = new osg.Node();
             //if ( window.location.href.indexOf( 'cube' ) !== -1 )

             var size = 2;
             var dist = 15;
             var cube = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size * 10 );
             var cubeSubNode = new osg.MatrixTransform();
             cubeSubNode.setName( 'cubeSubNode' );

             cubeSubNode.setMatrix( osg.Matrix.makeTranslate( -dist, -dist, dist / 2, [] ) );
             cubeSubNode.addChild( cube );
             cubeNode.addChild( cubeSubNode );
             if ( 1 || window.location.href.indexOf( 'cubes' ) !== -1 ) {
                 cubeSubNode = new osg.MatrixTransform();
                 cubeSubNode.setMatrix( osg.Matrix.makeTranslate( dist, 0, 0, [] ) );
                 cubeSubNode.addChild( cube );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNode = new osg.MatrixTransform();
                 cubeSubNode.setMatrix( osg.Matrix.makeTranslate( dist, dist, 0, [] ) );
                 cubeSubNode.addChild( cube );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNode = new osg.MatrixTransform();
                 cubeSubNode.setMatrix( osg.Matrix.makeTranslate( 0, dist, 0, [] ) );
                 cubeSubNode.addChild( cube );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNode = new osg.MatrixTransform();
                 cubeSubNode.setMatrix( osg.Matrix.makeTranslate( -dist, dist, -dist / 2, [] ) );
                 cubeSubNode.addChild( cube );
                 cubeNode.addChild( cubeSubNode );

             }

             var cubeTex = osg.Texture.createFromURL( 'textures/sol_trauma_periph.png' );
             //cubeTex.setMinFilter( 'LINEAR_MIPMAP_LINEAR', 16 );
             //cubeTex.setMagFilter( 'LINEAR_MIPMAP_LINEAR', 16 );
             cubeTex.setWrapT( 'MIRRORED_REPEAT' );
             cubeTex.setWrapS( 'MIRRORED_REPEAT' );
             cubeNode.getOrCreateStateSet().setTextureAttributeAndMode( 0, cubeTex );


             var groundNode = new osg.Node();
             groundNode.setName( 'groundNode' );

             var groundSize = 40;
             var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
             var groundTex = osg.Texture.createFromURL( 'textures/sol_trauma_periph.png' );
             //groundTex.setMinFilter( 'LINEAR_MIPMAP_LINEAR', 16 );
             //groundTex.setMagFilter( 'LINEAR_MIPMAP_LINEAR', 16 );
             groundTex.setWrapT( 'MIRRORED_REPEAT' );
             groundTex.setWrapS( 'MIRRORED_REPEAT' );
             ground.getOrCreateStateSet().setTextureAttributeAndMode( 0, groundTex );
             ground.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( osg.CullFace.DISABLE ), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );


             var groundSubNode;
             // intentionally create many node/transform
             // to mimick real scene with many nodes
             for ( var wG = 0; wG < 5; wG++ ) {
                 for ( var wH = 0; wH < 5; wH++ ) {
                     groundSubNode = new osg.MatrixTransform();
                     groundSubNode.setMatrix( osg.Matrix.makeTranslate( wG * groundSize - 100, wH * groundSize - 100, -5.0, [] ) );
                     groundSubNode.setName( 'groundSubNode' );
                     groundSubNode.addChild( ground );
                     groundNode.addChild( groundSubNode );
                 }
             }

             ShadowScene.addChild( groundNode );
             ShadowScene.addChild( cubeNode );
             //ShadowScene.addChild( modelNode );

             return ShadowScene;
         },

         createShadow: function( shadowScene ) {


             // Zero ambient for "dark" shadows

             //var ambientControlMat = new osg.Material();
             //ambientControlMat.setAmbient( [ 0.0, 0.0, 0.0, 1.0 ] );
             //shadowScene.getOrCreateStateSet().setAttributeAndMode( ambientControlMat, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

             var rootShadowScene = new osg.Node(); // will handle this._lights and scene
             rootShadowScene.setName( 'rootShadowScene' );

             var sceneCamera = this._viewer.getCamera();
             sceneCamera.setName( 'mainShadowReceivingCam' );
             sceneCamera.addChild( rootShadowScene ); // Shadowed scene root, all lights
             //
             // Node Mask
             var ReceivesShadowTraversalMask = 0x1;
             var CastsShadowTraversalMask = 0x2;
             //
             //

             // need working light/camera mask
             //shadowScene.setNodeMask( ReceivesShadowTraversalMask | CastsShadowTraversalMask );
             //modelNode.setNodeMask( ReceivesShadowTraversalMask | CastsShadowTraversalMask );
             //cubeNode.setNodeMask( ReceivesShadowTraversalMask | CastsShadowTraversalMask );
             // needed for VSM
             //groundNode.setNodeMask( ReceivesShadowTraversalMask | CastsShadowTraversalMask );
             // PCF ok with this
             //groundNode.setNodeMask(ReceivesShadowTraversalMask);
             //




             // Let there be lights.
             //

             var lightScale = 0.1; // at three light you might burn...
             /////////////////////////////
             ////////////////// Light 0
             /////////////////////////////
             var lightPos0 = [ 50, 50, 15, 0 ];
             var lightSource0 = new osg.LightSource();
             var lightNode0 = new osg.MatrixTransform();

             var destMatrix = lightNode0.getMatrix();
             osg.Matrix.makeLookAt( lightPos0, [ 0, 0, 0 ], [ 0, 1, 0 ], destMatrix );
             osg.Matrix.inverse( destMatrix, destMatrix );

             lightNode0.setName( 'lightNode0' );
             var light0 = new osg.Light( 0 );
             this._light0 = light0;


             // spot light
             light0.setPosition( [ 0, 0, 0, 1 ] );
             light0.setName( 'light0' );

             light0.setSpotCutoff( this._config[ '_spotCutoff' ] );
             light0.setSpotBlend( this._config[ '_spotBlend' ] );
             light0.setConstantAttenuation( this._config[ '_constantAttenuation' ] );
             light0.setLinearAttenuation( this._config[ '_linearAttenuation' ] );
             light0.setQuadraticAttenuation( this._config[ '_quadraticAttenuation' ] );

             light0._ambient = [ 0.0, 0.0, 0.0, 1.0 ];
             light0._diffuse = [ lightScale, lightScale, lightScale, 1.0 ];
             light0._specular = [ lightScale, lightScale, lightScale, 1.0 ];

             lightSource0.setLight( light0 );
             //lightNode0._light = light0;
             //lightNode0.addChild( lightSource0 );

             this._lights.push( light0 );
             this._lightsMatrix.push( lightNode0 );
             this._lightsSource.push( lightSource0 );

             /////////////////////////////
             ////////////////// Light 1
             /////////////////////////////
             var lightPos1 = [ -15, -5, 30, 1.2 ];

             var lightSource1 = new osg.LightSource();
             var lightNode1 = new osg.MatrixTransform();

             osg.Matrix.makeLookAt( lightPos1, [ 0, 0, 0 ], [ 0, 1, 0 ], lightNode1.getMatrix() );
             lightNode1.setName( 'lightNode1' );

             var light1 = new osg.Light( 1 );
             this._light1 = light1;
             light1.setPosition( [ 0, 0, 0, 1 ] );

             light1._ambient = [ 0.0, 0.0, 0.0, 1.0 ];
             light1._diffuse = [ lightScale, lightScale, lightScale, 1.0 ];
             light1._specular = [ lightScale, lightScale, lightScale, 1.0 ];

             light1.setSpotCutoff( this._config[ '_spotCutoff' ] );
             light1.setSpotBlend( this._config[ '_spotBlend' ] );
             light1.setConstantAttenuation( this._config[ '_constantAttenuation' ] );
             light1.setLinearAttenuation( this._config[ '_linearAttenuation' ] );
             light1.setQuadraticAttenuation( this._config[ '_quadraticAttenuation' ] );

             light1.setName( 'light1' );
             lightSource1.setLight( light1 );
             //lightNode1._light = light1;
             //lightNode1.addChild( lightSource1 );

             this._lights.push( light1 );
             this._lightsMatrix.push( lightNode1 );
             this._lightsSource.push( lightSource1 );


             /////////////////////////////
             ////////////////// Light 2
             /////////////////////////////
             var lightPos2 = [ 25, 25, 30, 2.0 ];
             var lightSource2 = new osg.LightSource();
             var lightNode2 = new osg.MatrixTransform();
             osg.Matrix.makeLookAt( lightPos2, [ 0, 0, 0 ], [ 0, 1, 0 ], lightNode2.getMatrix() );
             lightNode2.setName( 'lightNode2' );

             var light2 = new osg.Light( 2 );
             this._light2 = light2;
             light2.setPosition( [ 0, 0, 0, 1 ] );

             light2._ambient = [ 0.0, 0.0, 0.0, 1.0 ];
             light2._diffuse = [ lightScale, lightScale, lightScale, 1.0 ];
             light2._specular = [ lightScale, lightScale, lightScale, 1.0 ];

             light2.setSpotCutoff( this._config[ '_spotCutoff' ] );
             light2.setSpotBlend( this._config[ '_spotBlend' ] );
             light2.setConstantAttenuation( this._config[ '_constantAttenuation' ] );
             light2.setLinearAttenuation( this._config[ '_linearAttenuation' ] );
             light2.setQuadraticAttenuation( this._config[ '_quadraticAttenuation' ] );


             light2.setName( 'light2' );
             lightSource2.setLight( light2 );
             //lightNode2._light = light1;
             //lightNode2.addChild( lightSource2 );

             this._lights.push( light2 );
             this._lightsMatrix.push( lightNode2 );
             this._lightsSource.push( lightSource2 );

             light0._enable = false;
             light1._enable = false;
             light2._enable = false;

             if ( this._config[ 'lightnum' ] >= 1 ) {
                 light0._enable = true;
             }
             if ( this._config[ 'lightnum' ] >= 2 ) {
                 light1._enable = true;
             }
             if ( this._config[ 'lightnum' ] >= 3 ) {
                 light2._enable = true;
             }

             //

             if ( light0._enable ) rootShadowScene.getOrCreateStateSet().setAttributeAndMode( lightSource0.getLight() );
             if ( light1._enable ) rootShadowScene.getOrCreateStateSet().setAttributeAndMode( lightSource1.getLight() );
             if ( light2._enable ) rootShadowScene.getOrCreateStateSet().setAttributeAndMode( lightSource2.getLight() );


             //receiving scene
             var shadowReceiverScene = this.setShadowReceiving( shadowScene, sceneCamera, ReceivesShadowTraversalMask );
             rootShadowScene.addChild( shadowReceiverScene );

             //casting scene
             if ( light0._enable )
                 rootShadowScene.addChild( this.setShadowCasting( shadowReceiverScene, shadowScene, lightSource0, lightNode0, lightPos0, 0, CastsShadowTraversalMask ) );
             if ( light1._enable )
                 rootShadowScene.addChild( this.setShadowCasting( shadowReceiverScene, shadowScene, lightSource1, lightNode1, lightPos1, 1, CastsShadowTraversalMask ) );
             if ( light2._enable )
                 rootShadowScene.addChild( this.setShadowCasting( shadowReceiverScene, shadowScene, lightSource2, lightNode2, lightPos2, 2, CastsShadowTraversalMask ) );


             // debug axis, blue show light dir
             var lightNodemodel0 = osg.createAxisGeometry();
             var lightNodemodelNode0 = new osg.MatrixTransform();
             lightNodemodelNode0.addChild( lightNodemodel0 );

             var lightNodemodel1 = osg.createAxisGeometry();
             var lightNodemodelNode1 = new osg.MatrixTransform();
             lightNodemodelNode1.addChild( lightNodemodel1 );

             var lightNodemodel2 = osg.createAxisGeometry();
             var lightNodemodelNode2 = new osg.MatrixTransform();
             lightNodemodelNode2.addChild( lightNodemodel2 );
             // light debug axis view
             if ( light0._enable )
                 lightNode0.addChild( lightNodemodelNode0 );
             if ( light1._enable )
                 lightNode1.addChild( lightNodemodelNode1 );
             if ( light2._enable )
                 lightNode2.addChild( lightNodemodelNode2 );



             return rootShadowScene;
         },

         showFrameBuffers: function( optionalArgs ) {

             if ( !this._rttdebugNode ) this._rttdebugNode = new osg.Node();
             if ( !this._ComposerdebugNode ) this._ComposerdebugNode = new osg.Node();
             if ( !this._ComposerdebugCamera ) this._ComposerdebugCamera = new osg.Camera();
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
             if ( optionalArgs )
                 osg.extend( optionsDebug, optionalArgs );


             var matrixDest = this._ComposerdebugCamera.getProjectionMatrix();
             osg.Matrix.makeOrtho( 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5, matrixDest );
             this._ComposerdebugCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

             matrixDest = this._ComposerdebugCamera.getViewMatrix();
             osg.Matrix.makeTranslate( 0, 0, 0, matrixDest );
             this._ComposerdebugCamera.setViewMatrix( matrixDest );
             this._ComposerdebugCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
             this._ComposerdebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
             this._ComposerdebugCamera.addChild( this._ComposerdebugNode );

             var texture;
             var xOffset = optionsDebug.x;
             var yOffset = optionsDebug.y;
             this._ComposerdebugNode.removeChildren();

             var stateset;

             var fgt = [
                 osgUtil.Composer.Filter.defaultFragmentShaderHeader, 'void main (void)', '{', '  gl_FragColor = texture2D(Texture0,FragTexCoord0);', '}', ''
             ].join( '\n' );
             var program = new osg.Program(
                 new osg.Shader( this._glContext.VERTEX_SHADER, osgUtil.Composer.Filter.defaultVertexShader ), new osg.Shader( this._glContext.FRAGMENT_SHADER, fgt ) );

             stateset = this._ComposerdebugNode.getOrCreateStateSet();
             if ( !optionsDebug.fullscreen )
                 stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
             stateset.setAttributeAndModes( program );


             for ( var i = 0, l = this._rtt.length; i < l; i++ ) {
                 texture = this._rtt[ i ];
                 if ( texture ) {
                     var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                     stateset = quad.getOrCreateStateSet();

                     stateset.setTextureAttributeAndMode( 0, texture );
                     stateset.setAttributeAndModes( program );
                     // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

                     this._ComposerdebugNode.addChild( quad );

                     if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
                     else yOffset += optionsDebug.h + 2;
                 }
             }
             return this._ComposerdebugCamera;
         },
         createScene: function() {
             var group = new osg.Node();

             this._shadowScene = this.createSceneCasterReceiver();
             this._lightAndShadowScene = this.createShadow( this._shadowScene );

             group.addChild( this._lightAndShadowScene );

             this._rttdebugNode = new osg.Node();
             group.addChild( this._rttdebugNode );
             if ( this._config[ 'debugRtt' ] ) {
                 this.showFrameBuffers( {
                     screenW: this._canvas.width,
                     screenH: this._canvas.height
                 } );
             }
             return group;
         },

         run: function( canvas ) {

             var viewer;
             viewer = new osgViewer.Viewer( canvas, this._osgOptions );
             this._canvas = canvas;
             this._viewer = viewer;


             viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
             viewer.init();

             this._glContext = viewer.getGraphicContext();
             this.floatTexSupport = this._viewer._webGLCaps.getWebGLExtension( 'OES_texture_float' );
             shaderLoader = new MyShaderLoader( this._glContext ).loadAll( shaderLists );
             var scene = this.createScene();

             viewer.setSceneData( scene );
             viewer.setupManipulator();
             viewer.getManipulator().computeHomePosition();
             viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

             viewer.run();

             this.initDatGUI();
         }
     };

     window.addEventListener( 'load', function() {
         var example = new Example();
         var canvas = document.getElementById( 'View' );
         example.run( canvas );
     }, true );

 } )();