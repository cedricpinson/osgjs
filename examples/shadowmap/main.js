 ( function () {
     'use strict';
     var OSG = window.OSG;
     var osg = OSG.osg;
     var osgDB = OSG.osgDB;
     var osgViewer = OSG.osgViewer;
     var osgUtil = OSG.osgUtil;
     var osgShadow = OSG.osgShadow;


     //////////////////////
     /// The sample itself is in this object.
     ///
     var Example = function () {
         // sample default parameters
         // at start
         // most can be changed by the UI
         this._config = {
             'texturesize': 1024,
             'shadow': 'PCF',
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
             'lightDistance': 1.0,
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
         this._debugLights = [];
         this._lightsUniform = [];
         this._casterStateSet = []; // one statset per light casting shadow
         this._shadowTexture = [];
         this._shadowCamera = [];

         this._shadowTechnique = [];

         this._blurPass = [];
         this._downPass = [];

         // shared
         this._previousTech = this._config[ 'shadow' ];
         this._previousTextureSize = this._config[ 'texturesize' ];
         this._previousTextureType = this._config[ 'texturetype' ];
         this._previousBlur = this._config[ 'blur' ];
         this._previousFov = this._config[ 'fov' ];
         this._previousLightType = this._config[ 'lightType' ];
         this._previousRtt = this._config[ 'debugRtt' ];
         this._previousFrustumTest = this._config[ 'frustumTest' ];


     };


     // That's where we update lights position/direction at each frame
     // so that the sample is not too much static
     var LightUpdateCallback = function ( light, myExample, debugNode, position, dir ) {
         this._example = myExample;

         this._positionX = position[ 0 ];
         this._positionY = position[ 1 ];
         this._positionZ = position[ 2 ];

         this._accum = 0;
         this._last = 0;
         this._debugNode = debugNode;
         this.lightPos = position;
         this.lightDir = dir;

         this.up = [ 0.0, 0.0, 1.0 ];
         this.lightTarget = [ 0.0, 0.0, 0.0 ];

         this._directLightChange = false; // GUI change, mmm

     };
     LightUpdateCallback.prototype = {
         update: function ( node, nv ) {
             var currentTime = nv.getFrameStamp().getSimulationTime();
             //
             var lightPos = this.lightPos;
             var lightDir = this.lightDir;

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

                 var lightDist = parseFloat( this._example._config[ 'lightDistance' ] );
                 var fac = 1.0 * lightDist;
                 var x = fac * Math.cos( delta );
                 var y = fac * Math.sin( delta );
                 //var z = fac * Math.sin( delta );


                 //  GENERIC Code getting direction
                 //  50 50 15
                 var lightTarget = this.lightTarget;
                 switch ( this._example._config[ 'lightMovement' ] ) {
                 case 'Rotate':
                     lightPos[ 0 ] = x * this._positionX;
                     lightPos[ 1 ] = y * this._positionY;
                     //lightPos[ 2 ] = this._position_z;
                     // lightDir = [ 0.0, -15.0, -1.0 ];
                     lightDir = osg.Vec3.sub( lightTarget, lightPos, [] );
                     osg.Vec3.normalize( lightDir, lightDir );
                     break;
                 case 'Translate':
                     lightPos[ 0 ] = x * this._positionZ;
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

                 if ( this._directLightChange ) {
                     var lightSource = node;
                     var l = lightSource.getLight();
                     l.setDirection( lightDir );

                     //best don't overwrite the direction bit on pos[3]
                     // l.setPosition( lightPos );
                     osg.Vec3.copy( lightPos, l.getPosition() );

                     l.dirty();
                 }
             }

             // begin light debug
             // what follows,
             // .. just allow the debug node (AXIS) to be updated here.
             //
             var up = this.up; //   camera up
             // Check it's not coincident with lightDir
             if ( Math.abs( osg.Vec3.dot( up, lightDir ) ) >= 1.0 ) {
                 // another camera up
                 up = [ 1.0, 0.0, 0.0 ];
             }

             var lightTargetDebug = this.lightTarget;
             //osg.Vec3.mult( lightDir, 50, lightTargetDebug );
             //osg.Vec3.add( lightPos, lightTargetDebug, lightTargetDebug );

             var lightMatrix = this._debugNode.getMatrix();
             osg.Matrix.makeLookAt( lightPos, lightTargetDebug, up, lightMatrix );
             osg.Matrix.inverse( lightMatrix, lightMatrix );
             //

             if ( !this._directLightChange ) {
                 var lightNode = node.getParents()[ 0 ];
                 osg.Matrix.copy( lightMatrix, lightNode.getMatrix() );
             }
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
             if ( this._hasAnyFloatTexSupport ) {
                 if ( this._halfFloatTexSupport ) textureTypes.push( 'HALF_FLOAT' );
                 if ( this._halfFloatLinearTexSupport ) textureTypes.push( 'HALF_FLOAT_LINEAR' );
                 if ( this._floatLinearTexSupport ) textureTypes.push( 'FLOAT_LINEAR' );
                 if ( this._floatTexSupport ) textureTypes.push( 'FLOAT' );
             }


             var controller;

             controller = gui.add( this._config, 'shadow', {
                 //'Variance Shadow Map (VSM)': 'VSM',
                 //'Exponential Variance Shadow Map (EVSM)': 'EVSM',
                 //'Exponential Shadow Map (ESM)': 'ESM',
                 'Shadow Map': 'NONE',
                 'Shadow Map Percentage Close Filtering (PCF)': 'PCF'
             } );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'texturetype', textureTypes );
             controller.onChange( this.updateShadow.bind( this ) );

             var texSizes = [];
             var maxTexSize = this._maxTexSize;
             var texSize = 16;
             while ( texSize <= maxTexSize ) {
                 texSizes.push( texSize );
                 texSize *= 2;
             }
             controller = gui.add( this._config, 'texturesize', texSizes );
             controller.onChange( this.updateShadow.bind( this ) );

             // shaders has to have under max varying decl
             // max = this._maxVaryings -1
             // usual shader is already 4 vertexColor, FragNormal, FragEye, FragTexcoord.
             // each shadow is 2 more.
             var maxLights = ~~ ( ( this._maxVaryings - 1 ) - 4 ) / 2.0;

             controller = gui.add( this._config, 'lightnum', 1, maxLights ).step( 1 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightType', [ 'Spot',
                 /*'Point',*/
                 'Directional'
             ] );
             controller.onChange( this.updateShadow.bind( this ) );
             /*

             controller = gui.add( this._config, 'frustumTest', [ 'free', 'no shadowed', 'no caster', 'no caster but shadowed', 'no shadowed but caster', 'left', 'right', 'front', 'back', 'top', 'bottom', 'face2face', 'back2back', 'samePosition&Direction' ] );

             controller.onChange( this.updateShadow.bind( this ) );
 */

             controller = gui.add( this._config, 'lightMovement', [ 'Rotate', 'Translate', 'Fixed', 'Nod' ] );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightAmbient' );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightSpeed', 0.0, 2.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'lightDistance', 0.0, 5.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'bias', 0.0001, 0.05 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = gui.add( this._config, 'fov' ).min( 0.0 ).max( 180.0 );
             controller.onChange( this.updateShadow.bind( this ) );

             // controller = gui.add( this._config, 'logCamLight' );


             /*
             var VSMFolder = gui.addFolder( 'Variance (VSM, EVSM)' );

             controller = VSMFolder.add( this._config, 'VsmEpsilon' ).min( 0.0001 ).max( 0.01 );
             controller.onChange( this.updateShadow.bind( this ) );

             /*
             controller = VSMFolder.add( this._config, 'supersample' ).step( 1 ).min( 0.0 ).max( 8 );
             controller.onChange( this.updateShadow.bind( this ) );

             controller = VSMFolder.add( this._config, 'blur' );
             controller.onChange( this.updateShadow.bind( this ) );
              */


             //controller = VSMFolder.add( this._config, 'blurKernelSize' ).min( 3.0 ).max( 128.0 );
             //controller.onChange( this.updateShadow.bind( this ) );

             //controller = VSMFolder.add( this._config, 'blurTextureSize', [ 32, 64, 128, 256, 512, 1024, 2048, 4096, 8144 ] );
             //controller.onChange( this.updateShadow.bind( this ) );


             /*

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
*/

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

             while ( this._maxVaryings < ( numLights * 2 + 4 ) ) {
                 numLights--;
             }
             this._config[ 'lightnum' ] = numLights;

             if ( this._lights.length !== numLights ) {

                 var lightScale = 1.0 / numLights;

                 var group = this._viewer.getSceneData();

                 l = this._lights.length;

                 // remove all lights
                 while ( l-- ) {
                     this._lightAndShadowScene.removeShadowTechnique( this._shadowTechnique[ l ] );

                     group.removeChild( this._lightsMatrix[ l ] );
                     group.removeChild( this._debugLights[ l ] );
                 }

                 this._lights = [];
                 this._lightsMatrix = [];
                 this._lightsSource = [];
                 this._shadowTechnique = [];
                 this._debugLights = [];

                 // re-add lights if any
                 for ( var k = 0; k < numLights; k++ ) {
                     this.addShadowedLight( group, k, lightScale );
                 }

                 this._lightAndShadowScene.init();
                 this._updateRtt = true;
             }



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
             if ( this._previousLightType !== this._config[ 'lightType' ] ) {
                 switch ( this._config[ 'lightType' ] ) {
                 case 'Spot':
                     {
                         if ( this._previousSpotFov )
                             this._config[ 'fov' ] = this._previousSpotFov;

                         l = this._lights.length;
                         while ( l-- ) {
                             this._lights[ l ].setLightAsSpot();
                         }
                         break;
                     }
                 case 'Point':
                     {

                         if ( this._previousLightType === 'Spot' ) this._previousSpotFov = this._config[ 'fov' ];
                         this._config[ 'fov' ] = 181;
                         l = this._lights.length;
                         while ( l-- ) {
                             this._lights[ l ].setLightAsPoint();
                         }
                         break;
                     }
                 case 'Directional':
                     {
                         if ( this._previousLightType === 'Spot' ) this._previousSpotFov = this._config[ 'fov' ];
                         this._config[ 'fov' ] = 181;
                         l = this._lights.length;
                         while ( l-- ) {
                             this._lights[ l ].setLightAsDirection();
                         }
                         break;
                     }
                 }
                 this._previousLightType = this._config[ 'lightType' ];
             }
         },
         updateShadowFormat: function () {

             var shadowMap;
             var texType = this._config[ 'texturetype' ];
             if ( this._previousTextureType !== texType ) {
                 var l = this._lights.length;
                 while ( l-- ) {

                     shadowMap = this._shadowTechnique[ l ];
                     var shadowSettings = shadowMap.getShadowSettings();
                     shadowSettings.setTextureType( texType );

                 }
                 this._previousTextureType = this._config[ 'texturetype' ];
             }
             this._updateRtt = true;
         },
         updateShadowMapSize: function () {

             var shadowMap;
             var mapsize = ~~ ( this._config[ 'texturesize' ] );
             if ( this._previousTextureSize !== mapsize ) {

                 var l = this._lights.length;
                 while ( l-- ) {
                     shadowMap = this._shadowTechnique[ l ];
                     shadowMap.getShadowSettings().setTextureSize( mapsize );
                 }
                 this._previousTextureSize = mapsize;
             }
             this._updateRtt = true;

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
         updateShadowTechniqueMode: function () {

             var l, numLights = ~~ ( this._config[ 'lightnum' ] );
             var shadowMap;

             if ( this._previousTech !== this._config[ 'shadow' ] ) {
                 // technique change.

                 this._groundNode.setNodeMask( ~this._castsShadowTraversalMask );
                 switch ( this._config[ 'shadow' ] ) {
                 case 'ESM':
                     this._config[ 'exponent' ] = 200.0;
                     this._groundNode.setNodeMask( this._castsShadowTraversalMask );
                     break;
                 case 'EVSM':
                     this._config[ 'exponent' ] = 0.001;
                     this._config[ 'exponent1' ] = 0.001;
                     this._config[ 'texturetype' ] = 'FLOAT';
                     this._groundNode.setNodeMask( this._castsShadowTraversalMask );
                     break;
                 case 'VSM':
                     this._config[ 'exponent' ] = 0.001;
                     this._config[ 'exponent1' ] = 0.001;
                     break;
                 default:
                     break;

                 }
                 l = numLights;
                 while ( l-- ) {
                     shadowMap = this._shadowTechnique[ l ];
                     shadowMap.getShadowSettings().setAlgorithm( this._config[ 'shadow' ] );
                 }

                 this._previousTech = this._config[ 'shadow' ];
             }

             l = numLights;
             while ( l-- ) {
                 shadowMap = this._shadowTechnique[ l ];

                 var shadowSettings = shadowMap.getShadowSettings();

                 shadowSettings._config[ 'bias' ] = this._config[ 'bias' ];
                 shadowSettings._config[ 'exponent' ] = this._config[ 'exponent' ];
                 shadowSettings._config[ 'exponent1' ] = this._config[ 'exponent1' ];
                 shadowSettings._config[ 'VsmEpsilon' ] = this._config[ 'VsmEpsilon' ];

             }

         },
         updateDebugRtt: function () {
             // show the shadowmap as ui quad on left bottom screen
             if ( this._updateRtt || ( this._previousRtt === true && this._config[ 'debugRtt' ] === false ) ) {
                 this._rttdebugNode.removeChildren();
             }
             if ( this._updateRtt || ( this._previousRtt === false && this._config[ 'debugRtt' ] ) ) {

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
             this._updateRtt = false;
         },
         /*
          * try to minimize update cost and code size
          * with a single callback for all ui user changes
          */
         updateShadow: function () {


             this.updateLightsAmbient();
             this.updateLightsEnable();

             this.testFrustumIntersections();

             this.updateLightType();
             this.updateFov();
             this.updateShadowTechniqueMode();

             this.updateShadowFormat();
             this.updateShadowMapSize();

             this.updateDebugRtt();

         },

         // show the shadowmap as ui quad on left bottom screen
         // in fact show all texture inside this._rtt
         showFrameBuffers: function ( optionalArgs ) {

             if ( !this._rttdebugNode ) this._rttdebugNode = new osg.Node();
             if ( !this._ComposerdebugNode ) this._ComposerdebugNode = new osg.Node();
             this._ComposerdebugNode._name = 'debugComposerNode';
             this._ComposerdebugNode.setCullingActive( false );
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

             if ( !this._programRTT ) {
                 var fgt = [
                     osgUtil.Composer.Filter.defaultFragmentShaderHeader, 'void main (void)', '{', '  gl_FragColor = texture2D(Texture0,FragTexCoord0);', '}', ''
                 ].join( '\n' );
                 var program = new osg.Program(
                     new osg.Shader( 'VERTEX_SHADER', osgUtil.Composer.Filter.defaultVertexShader ), new osg.Shader( 'FRAGMENT_SHADER', fgt ) );

                 this._programRTT = program;
             }

             stateset = this._ComposerdebugNode.getOrCreateStateSet();
             if ( !optionsDebug.fullscreen )
                 stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
             stateset.setAttributeAndModes( this._programRTT );


             for ( var i = 0, l = this._rtt.length; i < l; i++ ) {
                 texture = this._rtt[ i ];
                 if ( texture ) {
                     var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                     stateset = quad.getOrCreateStateSet();

                     quad.setName( 'debugCompoQuadGeom' );

                     stateset.setTextureAttributeAndMode( 0, texture );
                     stateset.setAttributeAndModes( this._programRTT );
                     // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

                     this._ComposerdebugNode.addChild( quad );

                     if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
                     else yOffset += optionsDebug.h + 2;
                 }
             }
             return this._ComposerdebugCamera;
         },
         // Scene to be shadowed,  and to cast  shadow from
         // Multiple parents...
         createSceneCasterReceiver: function () {
             var ShadowScene = new osg.Node();
             ShadowScene.setName( 'ShadowScene' );

             var modelNode = new osg.Node();
             modelNode.setName( 'modelSubNode' );

             var modelName;
             modelName = this._config[ 'model' ];

             var request = osgDB.readNodeURL( '../media/models/' + modelName + '/file.osgjs' );

             request.then( function ( model ) {

                 model._name = 'material-test_model_0';
                 modelNode.addChild( model );

                 var dist = 25;

                 var modelSubNodeTrans = new osg.MatrixTransform();
                 var modelSubNode = new osg.Node();
                 modelSubNode._name = 'material-test_model_1';
                 modelSubNodeTrans.setMatrix( osg.Matrix.makeScale( 0.1, 0.1, 0.1, [] ) );
                 osg.Matrix.setTrans( modelSubNodeTrans.getMatrix(), 0, 0, 0 );
                 modelSubNodeTrans.addChild( model );
                 modelSubNode.addChild( modelSubNodeTrans );
                 modelNode.addChild( modelSubNode );

                 modelSubNode = new osg.Node();
                 modelSubNode._name = 'material-test_model_2';
                 modelSubNodeTrans = new osg.MatrixTransform();
                 modelSubNodeTrans.setMatrix( osg.Matrix.makeScale( 0.7, 0.7, 0.7, [] ) );
                 osg.Matrix.setTrans( modelSubNodeTrans.getMatrix(), 0.7, 0.7, 0.7 );
                 modelSubNodeTrans.addChild( model );
                 modelSubNode.addChild( modelSubNodeTrans );
                 modelNode.addChild( modelSubNode );

                 modelSubNode = new osg.Node();
                 modelSubNodeTrans = new osg.MatrixTransform();
                 modelSubNode._name = 'material-test_model_3';
                 modelSubNodeTrans.setMatrix( osg.Matrix.makeScale( 0.3, 0.3, 0.3, [] ) );
                 osg.Matrix.setTrans( modelSubNodeTrans.getMatrix(), dist, 0, 0 );
                 modelSubNodeTrans.addChild( model );
                 modelSubNode.addChild( modelSubNodeTrans );
                 modelNode.addChild( modelSubNode );

                 modelSubNode = new osg.Node();
                 modelSubNodeTrans = new osg.MatrixTransform();
                 modelSubNode._name = 'material-test_model_3';
                 modelSubNodeTrans.setMatrix( osg.Matrix.makeScale( 0.5, 0.5, 0.5, [] ) );
                 osg.Matrix.setTrans( modelSubNodeTrans.getMatrix(), -dist, 0, -5 );
                 modelSubNodeTrans.addChild( model );
                 modelSubNode.addChild( modelSubNodeTrans );
                 modelNode.addChild( modelSubNode );

             }.bind( this ) );

             // make "pillars"
             // testing light artifacts
             // peter panning, light streaks, etc.
             var cubeNode = new osg.Node();
             cubeNode.setName( 'cubeNode' );
             //if ( window.location.href.indexOf( 'cube' ) !== -1 )

             var size = 2;
             var dist = 15;
             var cube = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size * 10 );

             var cubeSubNodeTrans = new osg.MatrixTransform();
             cubeSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( 0, 0, dist / 2, [] ) );
             var cubeSubNode = new osg.Node();
             cubeSubNode.addChild( cubeSubNodeTrans );
             cubeSubNodeTrans.addChild( cube );
             cubeSubNode.setName( 'cubeSubNode_0' );
             cubeNode.addChild( cubeSubNode );

             //cubeNode.addChild( cubeSubNode );
             if ( 1 || window.location.href.indexOf( 'cubes' ) !== -1 ) {
                 cubeSubNodeTrans = new osg.MatrixTransform();
                 cubeSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( dist, 0, 0, [] ) );
                 cubeSubNode = new osg.Node();
                 cubeSubNode.addChild( cubeSubNodeTrans );
                 cubeSubNodeTrans.addChild( cube );
                 cubeSubNode.setName( 'cubeSubNode_1' );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNodeTrans = new osg.MatrixTransform();
                 cubeSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( dist, dist, 0, [] ) );
                 cubeSubNode = new osg.Node();
                 cubeSubNode.addChild( cubeSubNodeTrans );
                 cubeSubNodeTrans.addChild( cube );
                 cubeSubNode.setName( 'cubeSubNode_2' );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNodeTrans = new osg.MatrixTransform();
                 cubeSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( 0, dist, 0, [] ) );
                 cubeSubNode = new osg.Node();
                 cubeSubNode.addChild( cubeSubNodeTrans );
                 cubeSubNodeTrans.addChild( cube );
                 cubeSubNode.setName( 'cubeSubNode_3' );
                 cubeNode.addChild( cubeSubNode );

                 cubeSubNodeTrans = new osg.MatrixTransform();
                 cubeSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( -dist, dist, -dist / 2, [] ) );
                 cubeSubNode = new osg.Node();
                 cubeSubNode.addChild( cubeSubNodeTrans );
                 cubeSubNodeTrans.addChild( cube );
                 cubeSubNode.setName( 'cubeSubNode_4' );
                 cubeNode.addChild( cubeSubNode );

             }

             var cubeTex = osg.Texture.createFromURL( '../camera/textures/sol_trauma_periph.png' );
             cubeTex.setWrapT( 'MIRRORED_REPEAT' );
             cubeTex.setWrapS( 'MIRRORED_REPEAT' );
             cubeNode.getOrCreateStateSet().setTextureAttributeAndMode( 0, cubeTex );


             var groundNode = new osg.Node();
             groundNode.setName( 'groundNode' );

             //  var numPlanes = 5;
             var numPlanes = 5;
             var groundSize = 200 / numPlanes;
             var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );
             var groundTex = osg.Texture.createFromURL( '../camera/textures/sol_trauma_periph.png' );
             groundTex.setWrapT( 'MIRRORED_REPEAT' );
             groundTex.setWrapS( 'MIRRORED_REPEAT' );
             ground.getOrCreateStateSet().setTextureAttributeAndMode( 0, groundTex );
             ground.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( osg.CullFace.DISABLE ), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );


             var groundSubNode;
             // intentionally create many node/transform
             // to mimick real scene with many nodes
             for ( var wG = 0; wG < numPlanes; wG++ ) {
                 for ( var wH = 0; wH < numPlanes; wH++ ) {
                     var groundSubNodeTrans = new osg.MatrixTransform();
                     groundSubNodeTrans.setMatrix( osg.Matrix.makeTranslate( wG * groundSize - 100, wH * groundSize - 100, -5.0, [] ) );
                     // only node are culled in CullVisitor frustum culling
                     groundSubNode = new osg.Node();
                     groundSubNode.setName( 'groundSubNode_' + wG + '_' + wH );
                     groundSubNodeTrans.addChild( ground );
                     groundSubNode.addChild( groundSubNodeTrans );
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
         addShadowedLight: function ( group, num, lightScale, position, target ) {
             if ( !target ) target = [ 0, 0, 0 ];
             if ( !position ) position = [ -25 + -15 * num + -25 * ( num % 2 ),
                 25 + 15 * num - 25 * ( num % 2 ),
                 15 + 35 * num
             ];
             var shadowSettings = new osgShadow.ShadowSettings( this._config );
             //this._lightAndShadowScene.setShadowSettings( shadowSettings );

             var mapres = parseInt( this._config[ 'texturesize' ] );
             shadowSettings.setTextureSize( mapres );

             shadowSettings.setCastsShadowTraversalMask( this._castsShadowTraversalMask );

             shadowSettings.setAlgorithm( this._config[ 'shadow' ] );

             // at three light you might burn...
             ////////////////// Light 0
             /////////////////////////////
             var lightSource = new osg.LightSource();
             var lightNode = new osg.MatrixTransform();
             lightNode.setName( 'lightNode' + num );
             var light = new osg.Light( num );

             light.setName( 'light' + num );

             switch ( this._config[ 'lightType' ] ) {
             case 'Directional':
                 light.setLightAsDirection();
                 break;
             case 'point':
                 light.setLightAsPoint();
                 break;
             default:
             case 'Spot':
                 light.setLightAsSpot();

             }


             light.setSpotCutoff( this._config[ '_spotCutoff' ] );
             light.setSpotBlend( this._config[ '_spotBlend' ] );
             light.setConstantAttenuation( this._config[ '_constantAttenuation' ] );
             light.setLinearAttenuation( this._config[ '_linearAttenuation' ] );
             light.setQuadraticAttenuation( this._config[ '_quadraticAttenuation' ] );

             light._ambient = [ 0.0, 0.0, 0.0, 1.0 ];
             light._diffuse = [ lightScale, lightScale, lightScale, 1.0 ];
             light._specular = [ lightScale, lightScale, lightScale, 1.0 ];

             lightSource.setLight( light );
             lightNode.addChild( lightSource );

             this._lights.push( light );
             this._lightsMatrix.push( lightNode );
             this._lightsSource.push( lightSource );

             /////////////////////////////
             // add light to scene
             group.addChild( lightNode );
             /////////////////////////////

             var lightNodemodel = osg.createAxisGeometry();
             var lightNodemodelNode = new osg.MatrixTransform();
             lightNodemodelNode.addChild( lightNodemodel );
             this._debugLights.push( lightNodemodelNode );
             // light debug axis view
             // totally indepedant scene tree than light
             /////////
             group.addChild( lightNodemodelNode );
             ///////////////////

             ////////////
             //light.setPosition( position );
             var dir = [ 0, 0, 0 ];
             osg.Vec3.sub( position, target, dir );
             osg.Vec3.normalize( dir, dir );
             //light.setDirection( dir );
             lightSource.setUpdateCallback( new LightUpdateCallback( light, this, lightNodemodelNode, position, dir ) );

             // need to set lightSource rather than light pos
             // as there is no link in Light to get current Matrix.
             shadowSettings.setLightSource( lightSource );
             ///////////////////////////////

             var shadowMap = new osgShadow.ShadowMap( shadowSettings );
             this._lightAndShadowScene.addShadowTechnique( shadowMap );

             this._shadowTechnique.push( shadowMap );

             // init is done by shadowscene, at first render
             //shadowMap.init();

         },
         /*
          * main sample scene shadow code using OSG interface
          */
         createScene: function () {
             var group = new osg.Node();

             this._receivesShadowTraversalMask = 0x1;
             this._castsShadowTraversalMask = 0x2;

             this._shadowScene = this.createSceneCasterReceiver();

             var shadowedScene = new osgShadow.ShadowedScene();
             this._lightAndShadowScene = shadowedScene;
             shadowedScene.setReceivesShadowTraversalMask( this._receivesShadowTraversalMask );

             //this._shadowScene.setNodeMask( this._castsShadowTraversalMask );
             //this._shadowScene.setNodeMask( this._receivesShadowTraversalMask );
             this._groundNode.setNodeMask( ~this._castsShadowTraversalMask );

             /////////////////////////
             shadowedScene.setGLContext( this._glContext );
             shadowedScene.addChild( this._shadowScene );
             // TODO: Better (Multi)Camera detection handling
             group.addChild( shadowedScene );

             // Camera as StateAttribute, positioned uniform ?
             // if we do world computation in shader
             // need camera position in world too
             this._config[ 'camera' ] = this._viewer.getCamera();

             var numLights = ~~ ( this._config[ 'lightnum' ] );
             var lightScale = 1.0 / numLights;


             for ( var k = 0; k < numLights; k++ ) {
                 this.addShadowedLight( group, k, lightScale );
             }


             this._rttdebugNode = new osg.Node();
             this._rttdebugNode._name = 'debugFBNode';
             group.addChild( this._rttdebugNode );

             // doesn't show anything as shadow text and scene
             // isn't init until first frame
             if ( this._config[ 'debugRtt' ] ) {
                 this.showFrameBuffers( {
                     screenW: this._canvas.width,
                     screenH: this._canvas.height
                 } );
             }

             // one config to rule them all
             //this._config = shadowedScene.getShadowSettings()._config;

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

             viewer.getCamera().setComputeNearFar( false );

             this._glContext = viewer.getGraphicContext();

             this._maxVaryings = this._viewer._webGLCaps.getWebGLParameter( 'MAX_VARYING_VECTORS' );
             this._maxTexSize = this._viewer._webGLCaps.getWebGLParameter( 'MAX_TEXTURE_SIZE' );

             this._floatLinearTexSupport = this._viewer._webGLCaps.hasRTTLinearFloat();
             this._floatTexSupport = this._viewer._webGLCaps.hasRTTLinearFloat();
             this._halfFloatLinearTexSupport = this._viewer._webGLCaps.hasRTTHalfFloat();
             this._halfFloatTexSupport = this._viewer._webGLCaps.hasRTTLinearHalfFloat();
             this._hasAnyFloatTexSupport = this._floatLinearTexSupport || this._floatTexSupport || this._halfFloatLinearTexSupport || this._halfFloatTexSupport;

             var scene = this.createScene();

             var wantToSeeAShadowSceneGraph = false;
             if ( wantToSeeAShadowSceneGraph ) {
                 var visitor = new osgUtil.DisplayNodeGraphVisitor();
                 scene.accept( visitor );
                 visitor.createGraph();
             }
             viewer.setSceneData( scene );
             viewer.setupManipulator();
             viewer.getManipulator().computeHomePosition();
             viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

             viewer.run();

             this.initDatGUI();
         }
     };
     // execute loaded code when ready
     window.addEventListener( 'load', function () {
         var example = new Example();
         var canvas = document.getElementById( 'View' );
         example.run( canvas );
     }, true );

 } )();
