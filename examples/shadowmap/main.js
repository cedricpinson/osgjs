 ( function () {
     'use strict';
     var Q = window.Q;
     var OSG = window.OSG;
     var osg = OSG.osg;
     var osgDB = OSG.osgDB;
     var osgViewer = OSG.osgViewer;
     var osgUtil = OSG.osgUtil;
     var osgShadow = OSG.osgShadow;
     var osgShader = OSG.osgShader;
     var $ = window.$;




     //////////////////////
     /// The sample itself is in this object.
     ///
     var Example = function () {
         // sample default parameters
         // at start
         // most can be changed by the UI
         this._config = {
             'texturesize': 1024,
             'shadow': 'ESM',
             'texturetype': 'BYTE',
             'lightnum': 1,
             'lightType': 'Spot',
             'bias': 0.005,
             'VsmEpsilon': 0.0008,
             'supersample': 0,
             'blur': false,
             'blurKernelSize': 4.0,
             'blurTextureSize': 256,
             'model': 'material-test',
             'shadowstable': 'World Position',
             'shadowproj': 'fov',
             'fov': 50,

             'exponent': 80.0,
             'exponent1': 0.33,

             'lightMovement': 'Rotate',
             'lightSpeed': 1.0,
             'lightAmbient': false,
             'frustumTest': 'free',
             'texture': true,
             'debugRtt': true,

             '_spotCutoff': 25,
             '_spotBlend': 0.3,
             '_constantAttenuation': 0.0,
             '_linearAttenuation': 0.005,
             '_quadraticAttenuation': 0.0,
             'exampleObj': this,
             logCamLight: function () {
                 var example = this[ 'exampleObj' ];
                 var cam = example._viewer._manipulator;
                 console.groupCollapsed( 'Cam & Light' );
                 console.log( 'Camera' );
                 var eye = [ 0, 0, 0, 0 ];
                 cam.getEyePosition( eye );
                 console.table( [ {
                     'x': eye[ 0 ],
                     'y': eye[ 1 ],
                     'z': eye[ 2 ],
                     'w': eye[ 3 ]
                 } ] );

                 var tar = [ 0, 0, 0, 0 ];
                 cam.getTarget( tar );
                 console.table( [ {
                     'x': tar[ 0 ],
                     'y': tar[ 1 ],
                     'z': tar[ 2 ],
                     'w': tar[ 3 ]
                 } ] );

                 console.log( 'Light' );
                 var light = example._lights[ 0 ];
                 var p = light.getPosition();
                 console.table( [ {
                     'x': p[ 0 ],
                     'y': p[ 1 ],
                     'z': p[ 2 ],
                     'directional': p[ 3 ]
                 } ] );

                 var d = light.getDirection();
                 console.table( [ {
                     'x': d[ 0 ],
                     'y': d[ 1 ],
                     'z': d[ 2 ]
                 } ] );

                 var logCode = 'manip.setTarget( [' + tar[ 0 ] + ', ' + tar[ 1 ] + ', ' + tar[ 2 ] + ', ' + tar[ 3 ] + ']);\n';
                 logCode += 'manip.setEyePosition( [' + eye[ 0 ] + ', ' + eye[ 1 ] + ', ' + eye[ 2 ] + ', ' + eye[ 3 ] + ']);\n';
                 logCode += 'light.setPosition( [' + p[ 0 ] + ', ' + p[ 1 ] + ', ' + p[ 2 ] + ', light.getPosition().w ]);\n';
                 logCode += 'light.setDirection( [' + d[ 0 ] + ', ' + d[ 1 ] + ', ' + d[ 2 ] + ']);\n';

                 console.log( logCode );

                 console.groupEnd();
             }
         };

         // ui value memory for minimizing switch on only
         // what changed
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

         this._shadowTechnique = [ undefined, undefined, undefined ];

         this._blurPass = [ undefined, undefined, undefined ];
         this._downPass = [ undefined, undefined, undefined ];

         // shared
         this._receiverStateSet = undefined;
         this.textureType = undefined;

         this._previousTech = this._config[ 'technique' ];
         this._previousTextureSize = this._config[ 'texturesize' ];
         this._previousTextureType = this._config[ 'texturetype' ];
         this._previousBlur = this._config[ 'blur' ];
         this._previousFov = this._config[ 'fov' ];
         this._previousRtt = this._config[ 'debugRtt' ];
         this._previousFrustumTest = this._config[ 'frustumTest' ];


         this._shaderProcessor = new osgShader.ShaderProcessor();
         this._cacheProgram = {};

         this.floatTextureSupport = false;


     };


     // That's where we update lights position/direction at each frame
     // so that the sample is not too much static
     var LightUpdateCallback = function ( myExample, debugNode ) {
         this._example = myExample;
         var position = this._example._lights[ 0 ].getPosition();
         this._position_x = position[ 0 ];
         this._position_y = position[ 1 ];
         this._position_z = position[ 2 ];
         this._accum = 0;
         this._last = 0;
         this._debugNode = debugNode;
     };
     LightUpdateCallback.prototype = {
         update: function ( node, nv ) {
             var currentTime = nv.getFrameStamp().getSimulationTime();
             var lightSource = node;
             var l = lightSource.getLight();
             var lightPos = l.getPosition();
             var lightDir = l.getDirection();
             // is user didn't prevent animation
             if ( this._example._config[ 'lightMovement' ] !== 'Fixed' && this._example._config[ 'frustumTest' ] === 'free' ) {

                 var delta = 0;
                 var t = currentTime - this._last;
                 if ( t < 0.5 ) {
                     delta = t;
                     delta = delta * parseFloat( this._example._config[ 'lightSpeed' ] );
                     this._accum += delta;
                     delta = this._accum;
                 }

                 //var nodeParent = node.getParents()[ 0 ]; // transform parent node

                 var fac = 1.0;
                 var x = fac * Math.cos( delta );
                 var y = fac * Math.sin( delta );
                 var z = fac * Math.sin( delta );


                 //  GENERIC Code getting direction
                 //  50 50 15
                 var lightTarget = [ 0.0, 0.0, 0.0 ];
                 switch ( this._example._config[ 'lightMovement' ] ) {
                 case 'Rotate':
                     lightPos[ 0 ] = x * this._position_x;
                     lightPos[ 1 ] = y * this._position_y;
                     //lightPos[ 2 ] = this._position_z;
                     // lightDir = [ 0.0, -15.0, -1.0 ];
                     lightDir = osg.Vec3.sub( lightTarget, lightPos, [] );
                     osg.Vec3.normalize( lightDir, lightDir );
                     break;
                 case 'Translate':
                     lightPos[ 0 ] = x * this._position_x;
                     //lightPos[ 1 ] = y * this._position_y;
                     //lightPos[ 2 ] = this._position_z;
                     lightDir = [ 0.0, -15.0, -1.0 ];
                     break;
                 case 'Nod':
                     lightTarget[ 1 ] = y * 180.0;
                     lightDir = osg.Vec3.sub( lightTarget, lightPos, [] );
                     osg.Vec3.normalize( lightDir, lightDir );
                     //lightDir = [ 1.0 * x, -5.0 * x, -1.0 ];
                     break;
                 }

                 osg.Vec3.normalize( lightDir, lightDir );
                 // that's where we actually update the light
                 // TODO: why not target in light ? as it's like a camera
                 // TODO: why not a stateAttribtue
                 // TODO: cumbersome light pos/dir and matrix update/sync
                 l.setDirection( lightDir );
                 l.setPosition( lightPos );
                 l.dirty();
             }

             // what follows,
             // .. just allow the debug node (AXIS) to be updated here.
             //
             var up = this.up || [ 0.0, 1.0, 0.0 ]; //   camera up
             // Check it's not coincident with lightDir
             if ( Math.abs( osg.Vec3.dot( up, lightDir ) ) >= 1.0 ) {
                 // another camera up
                 this.up = [ 1.0, 0.0, 0.0 ];
             } else {
                 this.up = up;
             }

             var lightTargetDebug = [ 0.0, 0.0, 0.0 ];
             osg.Vec3.mult( lightDir, 50, lightTargetDebug );
             osg.Vec3.add( lightPos, lightTargetDebug, lightTargetDebug );

             var lightMatrix = this._debugNode.getMatrix();
             osg.Matrix.makeLookAt( lightPos, lightTargetDebug, up, lightMatrix );
             osg.Matrix.inverse( lightMatrix, lightMatrix );
             // end light debug


             this._last = currentTime;
             node.traverse( nv );
         }
     };

     Example.prototype = {

         /*
          *   UI user choices
          */
         initDatGUI: function () {

             var gui = new window.dat.GUI();

             var textureTypes = [ 'BYTE' ];
             if ( this._halfFloatTexSupport ) textureTypes.push( 'HALF_FLOAT' );
             if ( this._halfFloatLinearTexSupport ) textureTypes.push( 'HALF_FLOAT_LINEAR' );
             if ( this._floatTexSupport ) textureTypes.push( 'FLOAT' );
             if ( this._floatLinearTexSupport ) textureTypes.push( 'FLOAT_LINEAR' );


             var controller;

             controller = gui.add( this._config, 'shadow', {
                 'Variance Shadow Map (VSM)': 'VSM',
                 'Exponential Variance Shadow Map (EVSM)': 'EVSM',
                 'Exponential Shadow Map (ESM)': 'ESM',
                 'Shadow Map': 'NONE',
                 'Shadow Map Percentage Close Filtering (PCF)': 'PCF'
             } );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'texturetype', textureTypes );
             controller.onChange( this.updateShadow.bind( this ) );
             controller = gui.add( this._config, 'texturesize', [ 32, 64, 128, 256, 512, 1024, 2048, 4096, 8144 ] );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightnum', 1, 3 ).step( 1 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightType', [ 'Spot',
                 /*'Point',*/
                 'Directional'
             ] );
             controller.onChange( this.updateShadow.bind( this ) );


             controller = gui.add( this._config, 'frustumTest', [ 'free', 'no shadowed', 'no caster', 'no caster but shadowed', 'no shadowed but caster', 'left', 'right', 'front', 'back', 'top', 'bottom', 'face2face', 'back2back', 'samePosition&Direction' ] );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightMovement', [ 'Rotate', 'Translate', 'Fixed', 'Nod' ] );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightAmbient' );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightSpeed', 0.0, 2.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'bias', 0.0001, 0.05 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'fov' ).min( 0.0 ).max( 180.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'logCamLight' );



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
         testFrustumIntersections: function () {
             if ( this._config[ 'frustumTest' ] !== this._previousFrustumTest ) {
                 var manip = this._viewer._manipulator;
                 var light = this._lights[ 0 ];


                 switch ( this._config[ 'frustumTest' ] ) {
                     ////////////////////////////
                     // Bastard cases
                     // where shadow map pass is unessecary
                     // ideally no shadow map render, just a clear.
                 case 'no shadowed':
                     manip.setTarget( [ 11.0721987395957, -21.171437894503, -0.713785786725304, 0 ] );
                     manip.setEyePosition( [ 126.312857059939, 59.1717582917732, 89.0255465966154, 0 ] );
                     light.setPosition( [ 49.0463080818749, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'no caster':
                     manip.setTarget( [ 11.0721987395739, -21.1714378944974, -0.713785786749115, 0 ] );
                     manip.setEyePosition( [ -16.4124585874524, 140.853390554934, 27.2350041278865, 0 ] );
                     light.setPosition( [ -4.16478262048437, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'no caster but shadowed':
                     manip.setTarget( [ 0, 0, -5, 0 ] );
                     manip.setEyePosition( [ 203.051858988223, -1.77475889513387, 56.3742029870193, 0 ] );
                     light.setPosition( [ -48.5691198680279, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'no shadowed but caster':
                     manip.setTarget( [ 0, 0, -0.9977851, -0.06652 ] );
                     manip.setEyePosition( [ 0, 0, -0.9977851, -0.06652 ] );
                     light.setPosition( [ 0, 48.33564090195111650151, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                     ////////////////////////////
                     // Standard cases, allow checking the NO near culling
                     // doesn't cull between light and camera
                 case 'back':
                     manip.setTarget( [ 11.0721987395982, -21.1714378945582, -0.713785786672559, 0 ] );
                     manip.setEyePosition( [ 16.6808944154566, 112.114764418358, 11.1175579786547, 0 ] );
                     light.setPosition( [ 9.54948142490062, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'front':
                     manip.setTarget( [ 0, 0, -5, 0 ] );
                     manip.setEyePosition( [ -18.8400138094453, -208.767981774991, 27.5727442082625, 0 ] );
                     light.setPosition( [ 3.44634695972348, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'left':
                     manip.setEyePosition( [ 170.822493889, -34.1670561462405, 45.1069888256632, 0 ] );
                     manip.setTarget( [ 11.0721987395999, -21.1714378945369, -0.713785786700684, 0 ] );
                     light.setPosition( [ 9.54948142490062, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'right':
                     manip.setTarget( [ 0, 0, -5, 0 ] );
                     manip.setEyePosition( [ -199.86004380911345, 31.942733131790295, 58.52656679445649, 0 ] );
                     light.setPosition( [ -47.2792683004939, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'top':
                     manip.setTarget( [ 0, 0, -5, 0 ] );
                     manip.setEyePosition( [ -20.161786666401184, -63.095194777599346, 196.52542954773435, 0 ] );
                     light.setPosition( [ 11.246431610733037, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'bottom':
                     manip.setTarget( [ -8.797280076478858, -12.859778813688333, -8.308952702739692, 0 ] );
                     manip.setEyePosition( [ -19.370764410777106, 25.581637242118962, -129.6079385994182, 0 ] );
                     light.setPosition( [ 13.934303868121559, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                     ////////////////////////////
                     // tricky: light and cam parallel
                     // in direction, div by 0 detect from dot
                 case 'face2face':
                     manip.setTarget( [ 31.6858829004952, -16.6958342590879, -2.54477673437539, 0 ] );
                     manip.setEyePosition( [ 16.3913827111024, -142.956680258752, -13.575986033593, 0 ] );
                     light.setPosition( [ -3.7657152005487, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'back2back':
                     manip.setTarget( [ 11.0721987395739, -210.1714378944974, 0.713785786749115, 0 ] );
                     manip.setEyePosition( [ -16.4124585874524, 140.853390554934, 27.2350041278865, 0 ] );
                     light.setPosition( [ -4.16478262048437, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                 case 'samePosition&Direction':
                     manip.setTarget( [ -18.8400138094453, -208.767981774991, 27.5727442082625, 0 ] );
                     manip.setEyePosition( [ -4.16478262048437, 50, 15, 0 ] );
                     light.setPosition( [ -4.16478262048437, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     break;
                     ////////////////////////////
                     // nothing to do, allow light moves
                 case 'free':
                 case 'default':
                     manip.setTarget( [ 0, 0, -5, 0 ] );
                     manip.setEyePosition( [ -2.59786816870648e-14, -201.749553589187, 60.5524036673232, 0 ] );
                     light.setPosition( [ 7.20537602023089, 50, 15, light.getPosition().w ] );
                     light.setDirection( [ 0, -0.9977851578566089, -0.06651901052377393 ] );
                     console.log( 'Free Cam, we are good' );
                     break;
                 }
                 light.dirty();
                 this._previousFrustumTest = this._config[ 'frustumTest' ];
             }

         },
         updateLightsEnable: function () {
             var l, numLights = ~~ ( this._config[ 'lightnum' ] );

             l = this._lights.length;
             while ( l-- ) {
                 this._lights[ l ]._enable = false;
             }

             while ( ++l < numLights ) {
                 this._lights[ l ]._enable = true;
             }

         },
         updateLightsAmbient: function () {
             var l = this._lights.length;
             var val = this._config[ 'lightAmbient' ] ? 0.6 : 0.0;
             while ( l-- ) {
                 this._lights[ l ]._ambient = [ val, val, val, 1.0 ];
                 this._lights[ l ].dirty();
             }

         },
         updateLightType: function () {
             var l;
             switch ( this._config[ 'lightType' ] ) {
             case 'Spot':
                 {
                     this._config[ 'fov' ] = this._previousFov;
                     l = this._lights.length;
                     while ( l-- ) {
                         this._lights[ l ].getPosition()[ 3 ] = 1.0;
                     }
                     break;
                 }
             case 'Point':
                 {
                     this._config[ 'fov' ] = 181;
                     l = this._lights.length;
                     while ( l-- ) {
                         this._lights[ l ].getPosition()[ 3 ] = 1.0;
                     }
                     break;
                 }
             case 'Directional':
                 {
                     this._config[ 'fov' ] = 181;
                     l = this._lights.length;
                     while ( l-- ) {
                         this._lights[ l ].getPosition()[ 3 ] = 0.0;
                     }
                     break;
                 }
             }
         },
         updateShadowFormat: function () {

             var shadowMap;
             var texType = this._config[ 'texturetype' ];
             if ( this._previousTextureType !== texType ) {
                 var l, numLights = ~~ ( this._config[ 'lightnum' ] );
                 var textureType, textureFormat, texFilterMin, texFilterMax;
                 switch ( this._config[ 'texturetype' ] ) {
                 case 'HALF_FLOAT':
                     textureType = osg.Texture.HALF_FLOAT;
                     texFilterMin = osg.Texture.NEAREST;
                     texFilterMax = osg.Texture.NEAREST;
                     break;
                 case 'HALF_FLOAT_LINEAR':
                     textureType = osg.Texture.HALF_FLOAT;
                     texFilterMin = osg.Texture.LINEAR;
                     texFilterMax = osg.Texture.LINEAR;
                     break;
                 case 'FLOAT':
                     textureType = osg.Texture.FLOAT;
                     texFilterMin = osg.Texture.NEAREST;
                     texFilterMax = osg.Texture.NEAREST;
                     break;
                 case 'FLOAT_LINEAR':
                     break;
                 case 'BYTE':
                     textureType = osg.Texture.UNSIGNED_BYTE;
                     texFilterMin = osg.Texture.LINEAR;
                     texFilterMax = osg.Texture.LINEAR;
                     break;

                 default:
                     textureType = osg.Texture.UNSIGNED_BYTE;
                     texFilterMin = osg.Texture.LINEAR;
                     texFilterMax = osg.Texture.LINEAR;
                     break;

                 }

                 textureFormat = osg.Texture.RGBA;
                 /*
                 FLOAT luminance webgl bug or unsupported by spec
                  */
                 /*
                 if ( this._config[ 'shadow' ] === 'ESM' ) {
                     textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'NONE' ) {
                     textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'PCF' ) {
                     textureFormat = osg.Texture.LUMINANCE;
                 } else if ( this._config[ 'shadow' ] === 'VSM' ) {
                     textureFormat = osg.Texture.RGBA;
                 } else if ( this._config[ 'shadow' ] === 'EVSM' ) {
                     textureFormat = osg.Texture.RGBA;
                 }
*/
                 l = numLights;
                 var shadowSettings = this._lightAndShadowScene.getShadowSettings();
                 while ( l-- ) {

                     shadowMap = this._shadowTechnique[ l ];

                     shadowSettings.setTextureType( textureType );
                     shadowSettings.setTextureFilter( texFilterMin, texFilterMax );

                     shadowMap.getTexture().setType( textureType );
                     shadowMap.getTexture().setMinFilter( texFilterMin );
                     shadowMap.getTexture().setMaxFilter( texFilterMax );

                     //shadowMap.getTexture().setInternalFormat( textureFormat );
                     //shadowMap.getTexture().dirty();
                     //shadowMap.resize( shadowSizeFinal );
                 }
                 this._previousTextureType = this._config[ 'texturetype' ];
             }
         },
         updateFov: function () {

             if ( this._previousFov !== this._config[ 'fov' ] ) {
                 this._config[ '_spotCutoff' ] = this._config[ 'fov' ] * 0.5;
                 var l = this._lights.length;
                 while ( l-- ) {
                     this._lights[ l ].setSpotCutoff( this._config[ '_spotCutoff' ] );
                 }
                 this._previousFov = this._config[ 'fov' ];
             }

         },
         updateShadowMapSize: function () {

             var l, numLights = ~~ ( this._config[ 'lightnum' ] );

             var mapsize = ~~ ( this._config[ 'texturesize' ] );
             var shadowSizeFinal = [ mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize ];
             var shadowMap;

             if ( this._previousTextureSize !== mapsize ) {

                 l = numLights;
                 while ( l-- ) {
                     shadowMap = this._shadowTechnique[ l ];
                     shadowMap.resize( shadowSizeFinal );

                     shadowMap.getReceivingStateSet().getUniformList()[ 'Shadow_MapSize' + l ].getUniform().set( shadowSizeFinal );
                 }
                 this._previousTextureSize = mapsize;
             }

         },
         updateShadowTechniqueMode: function () {

             if ( this._previousTech !== this._config[ 'technique' ] ) {
                 // technique change.
                 switch ( this._config[ 'technique' ] ) {
                 case 'ESM':
                     this._config[ 'exponent' ] = 200.0;
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
                     break;
                 }
                 this._previousTech = this._config[ 'technique' ];
             }

         },
         updateShaders: function () {
             var l, numLights = ~~ ( this._config[ 'lightnum' ] );
             var shadowMap;

             var prg = this.getShadowCasterShaderProgram();
             l = numLights;
             while ( l-- ) {
                 shadowMap = this._shadowTechnique[ l ];
                 shadowMap.setShadowCasterShaderProgram( prg );
             }

             prg = this.getShadowReceiverShaderProgram();
             l = numLights;
             while ( l-- ) {
                 shadowMap = this._shadowTechnique[ l ];
                 shadowMap.setShadowReceiverShaderProgram( prg );
             }
         },
         updateDebugRtt: function () {
             // show the shadowmap as ui quad on left bottom screen
             if ( this._previousRtt === true && this._config[ 'debugRtt' ] === false ) {
                 this._rttdebugNode.removeChildren();
             }
             if ( this._previousRtt === false && this._config[ 'debugRtt' ] ) {

                 var l, numLights = ~~ ( this._config[ 'lightnum' ] );

                 // make sure we have latest one
                 this._rtt = [];
                 l = numLights;
                 while ( l-- ) {
                     var shadowMap = this._shadowTechnique[ l ];
                     this._rtt.push( shadowMap.getTexture() );
                 }
                 this.showFrameBuffers( {
                     screenW: this._canvas.width,
                     screenH: this._canvas.height
                 } );
             }
             this._previousRtt = this._config[ 'debugRtt' ];
         },
         /*
          * try to minimize update cost and code size
          * with a single callback for all ui user changes
          */
         updateShadow: function () {


             this.updateLightsAmbient();
             this.updateLightsEnable();

             this.testFrustumIntersections();

             this.updateFov();
             this.updateLightType();
             this.updateShadowTechniqueMode();

             this.updateShadowFormat();
             this.updateShadowMapSize();
             this.updateShaders();

             this.updateDebugRtt();

         },

         // show the shadowmap as ui quad on left bottom screen
         // in fact show all texture inside this._rtt
         showFrameBuffers: function ( optionalArgs ) {

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

                     quad.setName( "debugCompoQuadGeom" );

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
         readShaders: function () {

             var defer = Q.defer();

             var shaderNames = [
                 'shadowmap_vsm_receive.vert',
                 'shadowmap_vsm_receive.frag',
                 'shadowmap_vsm_cast.vert',
                 'shadowmap_vsm_cast.frag',
                 'shadowmap_evsm_receive.vert',
                 'shadowmap_evsm_receive.frag',
                 'shadowmap_evsm_cast.vert',
                 'shadowmap_evsm_cast.frag',
                 'shadowmap_receive.vert',
                 'shadowmap_receive.frag',
                 'shadowmap_cast.vert',
                 'shadowmap_cast.frag',
                 'shadow.glsl',
                 'object.vert',
                 'object.frag',
                 'light.frag',
                 'interpolation.frag',
                 'floatrgbacodec.glsl',
                 'downsize.frag',
                 'common.vert',
                 'common.frag',
                 'basic.vert',
                 'basic.frag'
             ];
             this._shaderPath = 'shaders/';

             var shaders = shaderNames.map( function ( arg ) {
                 return this._shaderPath + arg;
             }.bind( this ) );


             var promises = [];
             shaders.forEach( function ( shader ) {
                 promises.push( Q( $.get( shader ) ) );
             }.bind( this ) );


             Q.all( promises ).then( function ( args ) {

                 var shaderNameContent = {};
                 shaderNames.forEach( function ( name, idx ) {
                     shaderNameContent[ name ] = args[ idx ];
                 } );

                 this._shaderProcessor.addShaders( shaderNameContent );

                 defer.resolve();

             }.bind( this ) );

             return defer.promise;
         },
         getShaderProgram: function ( vs, ps, defines ) {
             if ( this._cacheProgram[ vs + ps + defines ] !== undefined )
                 return this._cacheProgram[ vs + ps + defines ];

             var vertexshader = this._shaderProcessor.getShader( vs, defines );
             var fragmentshader = this._shaderProcessor.getShader( ps, defines );

             var program = new osg.Program(
                 new osg.Shader( this._glContext.VERTEX_SHADER, vertexshader ), new osg.Shader( this._glContext.FRAGMENT_SHADER, fragmentshader ) );

             this._cacheProgram[ vs + ps + defines ] = program;
             return program;
         },
         // computes a shader upon user choice
         // of shadow algorithms
         // shader file, define but texture type/format
         // associated too
         getShadowCasterShaderProgram: function () {
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

             var prg = this.getShaderProgram( shadowmapCasterVertex, shadowmapCasterFragment, defines );
             this.textureType = textureType;
             this.textureFormat = textureFormat;
             return prg;
         },
         // computes a shader upon user choice
         // of shadow algorithms
         // shader file, define but texture type/format
         // associated too
         getShadowReceiverShaderProgram: function () {

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
             var prg = this.getShaderProgram( shadowmapReceiverVertex, shadowmapReceiverFragment, defines );

             prg.trackAttributes = {};
             prg.trackAttributes.attributeKeys = [];
             prg.trackAttributes.attributeKeys.push( 'Material' );

             if ( this._lights[ 0 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light0' );
             //if ( this._lights[ 1 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light1' );
             //if ( this._lights[ 2 ]._enable ) prg.trackAttributes.attributeKeys.push( 'Light2' );

             return prg;
         },

         // Scene to be shadowed,  and to cast  shadow from
         // Multiple parents...
         createSceneCasterReceiver: function () {
             var ShadowScene = new osg.Node();
             ShadowScene.setName( 'ShadowScene' );

             var _self = this;
             var modelNode = new osg.Node();
             modelNode.setName( 'cubeSubNode' );

             var modelName;
             modelName = this._config[ 'model' ];
             var node = new osg.MatrixTransform();
             if ( !modelName ) return node;

             var request = osgDB.readNodeURL( '../media/models/' + modelName + '/file.osgjs' );

             request.then( function ( model ) {

                 node.addChild( model );

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

             }.bind( this ) );

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

             var cubeTex = osg.Texture.createFromURL( '../camera/textures/sol_trauma_periph.png' );
             cubeTex.setWrapT( 'MIRRORED_REPEAT' );
             cubeTex.setWrapS( 'MIRRORED_REPEAT' );
             cubeNode.getOrCreateStateSet().setTextureAttributeAndMode( 0, cubeTex );


             var groundNode = new osg.Node();
             groundNode.setName( 'groundNode' );

             var groundSize = 40;
             var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
             var groundTex = osg.Texture.createFromURL( '../camera/textures/sol_trauma_periph.png' );
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
             ShadowScene.addChild( modelNode );

             this._groundNode = groundNode;
             this._cubeNode = cubeNode;
             this._modelNode = modelNode;

             return ShadowScene;
         },
         /*
          * main sample scene shadow code using OSG interface
          */
         createScene: function () {
             var group = new osg.Node();


             this._shadowScene = this.createSceneCasterReceiver();

             var shadowedScene = new osgShadow.ShadowedScene();

             /////////////////////////
             shadowedScene.setGLContext( this._glContext );
             shadowedScene.addChild( this._shadowScene );
             group.addChild( shadowedScene );

             // Camera as StateAttribute, positioned uniform ?
             // if we do world computation in shader
             // need camera position in world too
             this._config[ 'camera' ] = this._viewer.getCamera();

             var shadowSettings = new osgShadow.ShadowSettings( this._config );
             shadowedScene.setShadowSettings( shadowSettings );

             var mapres = 1024;
             shadowSettings.setTextureSize( [ mapres, mapres ] );
             var ReceivesShadowTraversalMask = 0x1;
             var CastsShadowTraversalMask = 0x2;

             shadowSettings.setReceivesShadowTraversalMask( ReceivesShadowTraversalMask );
             shadowSettings.setCastsShadowTraversalMask( CastsShadowTraversalMask );

             //this._shadowScene.setNodeMask( CastsShadowTraversalMask );
             //this._shadowScene.setNodeMask( ReceivesShadowTraversalMask );
             this._groundNode.setNodeMask( CastsShadowTraversalMask );

             var lightScale = 1.0; // at three light you might burn...
             ////////////////// Light 0
             /////////////////////////////
             var lightPos0 = [ 50, 50, 15, 0 ];
             var lightSource0 = new osg.LightSource();
             var lightNode0 = new osg.MatrixTransform();

             //var destMatrix = lightNode0.getMatrix();
             //osg.Matrix.makeLookAt( lightPos0, [ 0, 0, 0 ], [ 0, 0, 1 ], destMatrix );
             //osg.Matrix.inverse( destMatrix, destMatrix );

             lightNode0.setName( 'lightNode0' );
             var light0 = new osg.Light( 0 );
             this._light0 = light0;


             // spot light
             //light0.setPosition( [ 0, 0, 0, 1 ] );

             light0.setPosition( [ 50, 50, 15, 1 ] );
             var dir = [ 0, 0, 0, 0 ];
             osg.Vec3.sub( [ 0, 0, 0.0 ], light0._position, dir );
             osg.Vec3.normalize( dir, dir );
             light0.setDirection( dir );

             //light0.setDirection( [ 0, 1, 0 ] );

             this.up = [ 0, 1, 0 ]; //   camera up


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
             lightNode0.addChild( lightSource0 );

             this._lights.push( light0 );
             this._lightsMatrix.push( lightNode0 );
             this._lightsSource.push( lightSource0 );
             // how to give light link to ancestor ?
             // TODO: use positionned data ? to make sure it set before
             light0.setUserData( lightNode0 );


             /////////////////////////////
             group.addChild( lightNode0 );
             /////////////////////////////

             var lightNodemodel0 = osg.createAxisGeometry();
             var lightNodemodelNode0 = new osg.MatrixTransform();
             lightNodemodelNode0.addChild( lightNodemodel0 );
             // light debug axis view
             group.addChild( lightNodemodelNode0 );

             ////////////
             lightSource0.setUpdateCallback( new LightUpdateCallback( this, lightNodemodelNode0 ) );

             shadowSettings.setLight( light0 );
             ///

             var shadowMap = new osgShadow.ShadowMap();
             shadowedScene.setShadowTechnique( shadowMap );

             this._shadowTechnique[ 0 ] = shadowMap;

             // set shadow shaders
             // TODO: enable Material using shader Compiler support
             shadowMap.setShadowReceiverShaderProgram( this.getShadowReceiverShaderProgram() );
             shadowMap.setShadowCasterShaderProgram( this.getShadowCasterShaderProgram() );
             shadowMap.init();

             this._lightAndShadowScene = shadowedScene;

             // while only 1 light possible
             {
                 var st = shadowMap.getReceivingStateSet();
                 var enabledLight = new osg.Uniform.createFloat1( 0.0, 'Light' + 1 + '_uniform_enable' );
                 st.addUniform( enabledLight );
                 enabledLight = new osg.Uniform.createFloat1( 0.0, 'Light' + 2 + '_uniform_enable' );
                 st.addUniform( enabledLight );
             }

             this._rtt.push( shadowMap.getTexture() );

             this._rttdebugNode = new osg.Node();
             group.addChild( this._rttdebugNode );

             this._rttdebugNode.setCullingActive( false );
             if ( this._config[ 'debugRtt' ] ) {
                 this.showFrameBuffers( {
                     screenW: this._canvas.width,
                     screenH: this._canvas.height
                 } );
             }

             // one config to rule them all
             this._config = shadowedScene.getShadowSettings()._config;

             return group;
         },

         /*
          * standard run scene, but for float tex support and shader loading
          */
         run: function ( canvas ) {


             var viewer;
             viewer = new osgViewer.Viewer( canvas, this._osgOptions );
             this._canvas = canvas;
             this._viewer = viewer;


             viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
             viewer.init();

             this._glContext = viewer.getGraphicContext();

             this._floatLinearTexSupport = this._viewer._webGLCaps.hasRTTLinearFloat();
             this._floatTexSupport = this._viewer._webGLCaps.hasRTTLinearFloat();
             this._halfFloatLinearTexSupport = this._viewer._webGLCaps.hasRTTHalfFloat();
             this._halfFloatTexSupport = this._viewer._webGLCaps.hasRTTLinearHalfFloat();

             this.readShaders().then( function () {
                 var scene = this.createScene();

                 viewer.setSceneData( scene );
                 viewer.setupManipulator();
                 viewer.getManipulator().computeHomePosition();
                 viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

                 viewer.run();

                 this.initDatGUI();
             }.bind( this ) );
         }
     };
     // execute loaded code when ready
     window.addEventListener( 'load', function () {
         var example = new Example();
         var canvas = document.getElementById( 'View' );
         example.run( canvas );
     }, true );

 } )();