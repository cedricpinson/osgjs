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
        // at start most can be changed by the UI
        this._config = {
            'debugBounds': false,
            'textureSize': 1024,
            'shadow': 'PCF',
            'textureType': 'UNSIGNED_BYTE',
            'lightNum': 3,
            'lightType': 'Spot',
            'bias': 0.005,
            'epsilonVSM': 0.0008,
            'superSample': 0,
            'blur': false,
            'blurKernelSize': 4.0,
            'blurTextureSize': 256,
            'model': 'material-test',
            'shadowProjection': 'fov',
            'fov': 50,
            'kernelSizePCF': '1Tap(4texFetch)',
            'fakePCF': false,
            'rotateOffset': false,
            'exponent': 80.0,
            'exponent1': 0.33,

            'lightMovement': 'Rotate',
            'lightSpeed': 0.5,
            'lightDistance': 3.0,
            'lightHeight': 0.3,
            'lightAmbient': false,
            'frustumTest': 'free',
            'texture': true,
            'debugRTT': true,
            'targetPosition': [ 0.0, 0.0, 0.0 ],

            '_spotCutoff': 25,
            '_spotBlend': 0.3,
            '_constantAttenuation': 0.0,
            '_linearAttenuation': 0.001,
            '_quadraticAttenuation': 0.0,
            'exampleObj': this,
            'shadowStatic': false,
            'disableShadows': false,
            'basicScene': false,

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
        this._RTT = [];
        this._parameterUniform = {};

        // Per Light/shadow
        this._lights = [];
        this._lightsMatrix = [];
        this._lightsSource = [];
        this._debugLights = [];
        this._lightsUniform = [];
        this._shadowTexture = [];
        this._shadowCamera = [];

        this._shadowTechnique = [];

        this._blurPass = [];
        this._downPass = [];

        this._shadowSettings = [];

        // shared
        this._previousTech = this._config[ 'shadow' ];
        this._previousTextureSize = this._config[ 'textureSize' ];
        this._previousTextureType = this._config[ 'textureType' ];
        this._previousBlur = this._config[ 'blur' ];
        this._previousFov = this._config[ 'fov' ];
        this._previousLightType = this._config[ 'lightType' ];
        this._previousRTT = this._config[ 'debugRTT' ];
        this._previousFrustumTest = this._config[ 'frustumTest' ];
        this._previousKernelSizePCF = this._config[ 'kernelSizePCF' ];
        this._previousDisable = this._config[ 'disableShadows' ];
        this._fakePCF = this._config[ 'fakePCF' ];
        this._debugOtherTechniques = false;
        this._debugFrustum = false;
        this._debugPrefilter = false;

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
            if ( queryDict[ property ] && queryDict[ property ].length !== 0 ) {
                var n = JSON.parse( queryDict[ property ] );

                if ( !isNaN( parseFloat( n ) ) && isFinite( n ) ) {
                    n = parseFloat( n );
                }

                this._config[ property ] = n;
            }

        }
    };


    // That's where we update lights position/direction at each frame
    // so that the sample is not too much static
    var LightUpdateCallback = function ( light, myExample, debugNode, position, dir, target ) {
        this._example = myExample;

        this._positionX = position[ 0 ];
        this._positionY = position[ 1 ];
        this._positionZ = position[ 2 ];

        this._accum = 0;
        this._last = 0;
        this._debugNode = debugNode;
        this._lightPos = position;
        this._lightDir = dir;

        this._up = [ 0.0, 0.0, 1.0 ];
        this._lightTarget = target;

        this._directLightChange = false; // GUI change, mmm

    };
    LightUpdateCallback.prototype = {
        update: function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            //
            var lightPos = this._lightPos;
            var lightDir = this._lightDir;

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

                var lightHeight = parseFloat( this._example._config[ 'lightHeight' ] );
                var z = fac * lightHeight;


                //  GENERIC Code getting direction
                //  50 50 15
                var lightTarget = this._lightTarget;
                switch ( this._example._config[ 'lightMovement' ] ) {
                case 'Rotate':
                    lightPos[ 0 ] = x * this._positionX;
                    lightPos[ 1 ] = y * this._positionY;
                    lightPos[ 2 ] = z * this._positionZ;
                    // lightDir = [ 0.0, -15.0, -1.0 ];
                    lightDir = osg.vec3.sub( osg.vec3.create(), lightTarget, lightPos );
                    osg.vec3.normalize( lightDir, lightDir );
                    break;
                case 'Translate':
                    lightPos[ 0 ] = x * this._positionZ;
                    //lightPos[ 1 ] = y * this._position_y;
                    //lightPos[ 2 ] = this._position_z;
                    lightDir = [ 0.0, -15.0, -1.0 ];
                    break;
                case 'Nod':
                    lightTarget[ 1 ] = y * 180.0;
                    lightDir = osg.vec3.sub( osg.vec3.create(), lightTarget, lightPos );
                    osg.vec3.normalize( lightDir, lightDir );
                    //lightDir = [ 1.0 * x, -5.0 * x, -1.0 ];
                    break;
                }

                osg.vec3.normalize( lightDir, lightDir );

                if ( this._directLightChange ) {
                    var lightSource = node;
                    var l = lightSource.getLight();
                    l.setDirection( lightDir );

                    //best don't overwrite the direction bit on pos[3]
                    // l.setPosition( lightPos );
                    osg.vec3.copy( l.getPosition(), lightPos );

                }
            }

            // begin light debug
            // what follows,
            // .. just allow the debug node (AXIS) to be updated here.
            //
            var up = this._up; //   camera up
            // Check it's not coincident with lightDir
            if ( Math.abs( osg.vec3.dot( up, lightDir ) ) >= 1.0 ) {
                // another camera up
                up = [ 1.0, 0.0, 0.0 ];
            }

            var lightTargetDebug = this._lightTarget;
            //osg.vec3.mult( lightDir, 50, lightTargetDebug );
            //osg.vec3.add( lightPos, lightTargetDebug, lightTargetDebug );

            var lightMatrix = this._debugNode.getMatrix();
            osg.mat4.lookAt( lightMatrix, lightPos, lightTargetDebug, up );
            osg.mat4.invert( lightMatrix, lightMatrix );
            //

            if ( !this._directLightChange ) {
                var lightNode = node.getParents()[ 0 ];
                osg.mat4.copy( lightNode.getMatrix(), lightMatrix );
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

            var textureTypes = [ 'UNSIGNED_BYTE' ];
            if ( this._hasAnyFloatTextureSupport ) {
                if ( this._halfFloatTextureSupport ) textureTypes.push( 'HALF_FLOAT' );
                if ( this._halfFloatLinearTextureSupport ) textureTypes.push( 'HALF_FLOAT_LINEAR' );
                if ( this._floatLinearTextureSupport ) textureTypes.push( 'FLOAT_LINEAR' );
                if ( this._floatTextureSupport ) textureTypes.push( 'FLOAT' );
            }


            var controller;

            var algoShadow = {
                'Shadow Map': 'NONE',
                'Shadow Map Percentage Close Filtering (PCF)': 'PCF'
            };
            if ( this._debugOtherTechniques ) {
                algoShadow[ 'Variance Shadow Map (VSM)' ] = 'VSM';
                algoShadow[ 'Exponential Variance Shadow Map (EVSM)' ] = 'EVSM';
                algoShadow[ 'Exponential Shadow Map (ESM)' ] = 'ESM';
            }

            controller = gui.add( this._config, 'shadow', algoShadow );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'textureType', textureTypes );
            controller.onChange( this.updateShadow.bind( this ) );

            var textureSizes = [];
            var maxTextureSize = this._maxTextureSize;
            var textureSize = 16;
            while ( textureSize <= maxTextureSize ) {
                textureSizes.push( textureSize );
                textureSize *= 2;
            }
            controller = gui.add( this._config, 'textureSize', textureSizes );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'lightNum', 1, this._maxLights ).step( 1 );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'lightType', [ 'Spot',
                /*'Point',*/
                'Directional'
            ] );
            controller.onChange( this.updateShadow.bind( this ) );


            if ( this._debugFrustum ) {

                controller = gui.add( this._config, 'frustumTest', [ 'free', 'no shadowed', 'no caster', 'no caster but shadowed', 'no shadowed but caster', 'left', 'right', 'front', 'back', 'top', 'bottom', 'face2face', 'back2back', 'samePosition&Direction' ] );

                controller.onChange( this.updateShadow.bind( this ) );
            }

            controller = gui.add( this._config, 'lightMovement', [ 'Rotate', 'Translate', 'Fixed', 'Nod' ] );
            controller.onChange( this.updateShadow.bind( this ) );


            controller = gui.add( this._config, 'shadowStatic' );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'disableShadows' );

            controller = gui.add( this._config, 'debugBounds' );
            controller.onChange( this.updateShadow.bind( this ) );


            controller = gui.add( this._config, 'lightAmbient' );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'lightSpeed', 0.0, 2.0 ).listen();
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'lightDistance', -15.0, 15.0 );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'lightHeight', 0.0, 4.0 );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'bias', 0.0001, 0.05 );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = gui.add( this._config, 'fov' ).min( 0.0 ).max( 180.0 );
            controller.onChange( this.updateShadow.bind( this ) );



            // controller = gui.add( this._config, 'logCamLight' );


            var pcfFolder = gui.addFolder( 'PCF' );
            controller = pcfFolder.add( this._config, 'kernelSizePCF', osgShadow.ShadowSettings.kernelSizeList );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = pcfFolder.add( this._config, 'fakePCF' );
            controller.onChange( this.updateShadow.bind( this ) );

            controller = pcfFolder.add( this._config, 'rotateOffset' );
            controller.onChange( this.updateShadow.bind( this ) );


            if ( this._debugOtherTechniques ) {

                var folderVSM = gui.addFolder( 'Variance (VSM, EVSM)' );

                controller = folderVSM.add( this._config, 'epsilonVSM' ).min( 0.0001 ).max( 0.01 );
                controller.onChange( this.updateShadow.bind( this ) );


                if ( this._debugPrefilter ) {
                    controller = folderVSM.add( this._config, 'superSample' ).step( 1 ).min( 0.0 ).max( 8 );
                    controller.onChange( this.updateShadow.bind( this ) );

                    controller = folderVSM.add( this._config, 'blur' );
                    controller.onChange( this.updateShadow.bind( this ) );

                    controller = folderVSM.add( this._config, 'blurKernelSize' ).min( 3.0 ).max( 128.0 );
                    controller.onChange( this.updateShadow.bind( this ) );

                    controller = folderVSM.add( this._config, 'blurTextureSize', [ 32, 64, 128, 256, 512, 1024, 2048, 4096, 8144 ] );
                    controller.onChange( this.updateShadow.bind( this ) );
                }



                var ExpFolder = gui.addFolder( 'Exponent (ESM, EVSM)' );

                controller = ExpFolder.add( this._config, 'exponent' ).min( 0.0 ).max( 300.0 );
                controller.onChange( this.updateShadow.bind( this ) );

                controller = ExpFolder.add( this._config, 'exponent1' ).min( 0.0 ).max( 200.0 );
                controller.onChange( this.updateShadow.bind( this ) );

            }
            this._gui = gui;

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
            var l, numLights = this._config.lightNum;

            while ( this._maxVaryings < ( numLights + 4 ) ) {
                numLights--;
            }
            this._config[ 'lightNum' ] = numLights;

            for ( l = 0; l < this._lights.length; l++ )
                this._lights[ l ].setEnabled( false );


            if ( this._lights.length !== numLights ) {

                var lightScale = 1.0 / ( numLights + 4 );

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
                this._shadowSettings = [];
                this._debugLights = [];

                // re-add lights if any
                for ( var k = 0; k < numLights; k++ ) {
                    this.addShadowedLight( group, k, lightScale );
                }

                this._updateRTT = true;
            }


            for ( l = 0; l < numLights; l++ )
                this._lights[ l ].setEnabled( true );

        },

        updateShadowStatic: function () {
            var l = this._lights.length;
            // remove all lights
            while ( l-- ) {
                var st = this._shadowTechnique[ l ];
                st.setEnabled( !this._config[ 'shadowStatic' ] );
            }
            if ( this._config[ 'shadowStatic' ] ) {
                this._config[ 'lightSpeed' ] = '0.0';
            }

        },

        updateLightsAmbient: function () {
            var l = this._lights.length;
            var val = this._config[ 'lightAmbient' ] ? 0.6 : 0.0;
            while ( l-- ) {
                this._lights[ l ].setAmbient( [ val, val, val, 1.0 ] );
            }

        },
        updateLightType: function () {
            var l;
            if ( this._previousLightType !== this._config[ 'lightType' ] ) {
                switch ( this._config[ 'lightType' ] ) {
                case 'Spot':
                    {
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
                        this._config[ 'fov' ] = 180;
                        l = this._lights.length;
                        while ( l-- ) {
                            this._lights[ l ].setLightAsPoint();
                        }
                        break;
                    }
                case 'Directional':
                    {
                        if ( this._previousLightType === 'Spot' ) this._previousSpotFov = this._config[ 'fov' ];
                        this._config[ 'fov' ] = 180;
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
            var texType = this._config[ 'textureType' ];
            if ( this._previousTextureType !== texType ) {
                var l = this._lights.length;
                while ( l-- ) {

                    shadowMap = this._shadowTechnique[ l ];
                    var shadowSettings = this._shadowSettings[ l ];
                    shadowSettings.setTextureType( texType );
                }
                this._previousTextureType = this._config[ 'textureType' ];
            }
            this._updateRTT = true;
        },

        updateShadowMapSize: function () {

            var shadowMap;
            var mapsize = this._config.textureSize;
            if ( this._previousTextureSize !== mapsize ) {

                var l = this._lights.length;
                while ( l-- ) {
                    shadowMap = this._shadowTechnique[ l ];
                    this._shadowSettings[ l ].setTextureSize( mapsize );
                }
                this._previousTextureSize = mapsize;
            }
            this._updateRTT = true;

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

            var l, numLights = this._config.lightNum;
            var shadowMap;

            if ( this._previousTech !== this._config[ 'shadow' ] ) {
                // technique change.


                this._groundNode.setNodeMask( ~( this._castsShadowBoundsTraversalMask | this._castsShadowTraversalMask ) );

                switch ( this._config[ 'shadow' ] ) {
                case 'ESM':

                    this._config[ 'exponent' ] = 0.66;
                    this._config[ 'exponent1' ] = 20.0;

                    //this._groundNode.setNodeMask( this._castsShadowTraversalMask );
                    break;
                case 'EVSM':
                    this._config[ 'exponent' ] = 146;
                    this._config[ 'exponent1' ] = 1.0;
                    this._config[ 'bias' ] = 0.05;
                    this._config[ 'textureType' ] = 'FLOAT';
                    //this._groundNode.setNodeMask( this._castsShadowTraversalMask );
                    break;
                case 'VSM':
                    this._config[ 'epsilonVSM' ] = 0.0001;
                    //this._groundNode.setNodeMask( this._castsShadowTraversalMask );
                    break;
                default:
                    break;

                }
                l = numLights;
                while ( l-- ) {
                    shadowMap = this._shadowTechnique[ l ];
                    this._shadowSettings[ l ].setAlgorithm( this._config[ 'shadow' ] );
                }

                this._previousTech = this._config[ 'shadow' ];
            }

            l = numLights;
            while ( l-- ) {
                shadowMap = this._shadowTechnique[ l ];

                var shadowSettings = this._shadowSettings[ l ];

                shadowSettings.bias = this._config[ 'bias' ];
                shadowSettings.exponent = this._config[ 'exponent' ];
                shadowSettings.exponent1 = this._config[ 'exponent1' ];
                shadowSettings.epsilonVSM = this._config[ 'epsilonVSM' ];
                shadowSettings.kernelSizePCF = this._config[ 'kernelSizePCF' ];
                shadowSettings.fakePCF = this._config[ 'fakePCF' ];
                shadowSettings.rotateOffset = this._config[ 'rotateOffset' ];
            }


        },
        updateDebugRTT: function () {
            // show the shadowmap as ui quad on left bottom screen
            if ( this._updateRTT || ( this._previousRTT === true && this._config[ 'debugRTT' ] === false ) ) {
                this._RTTdebugNode.removeChildren();
            }
            if ( this._updateRTT || ( this._previousRTT === false && this._config[ 'debugRTT' ] ) ) {

                var l, numLights = this._config.lightNum;

                // make sure we have latest one
                this._RTT = [];
                l = numLights;
                while ( l-- ) {
                    var shadowMap = this._shadowTechnique[ l ];
                    this._RTT.push( shadowMap.getTexture() );
                }
                this.showFrameBuffers( {
                    screenW: this._canvas.width,
                    screenH: this._canvas.height
                } );
            }
            this._previousRTT = this._config[ 'debugRTT' ];
            this._updateRTT = false;
        },

        /*
         * try to minimize update cost and code size
         * with a single callback for all ui user changes
         */
        updateShadow: function () {

            if ( this._config[ 'disableShadows' ] !== this._previousDisable ) {
                if ( this._config[ 'disableShadows' ] ) {
                    this._rootNode.removeChild( this._lightAndShadowScene );
                    this._rootNode.addChild( this._shadowScene );
                } else {
                    this._rootNode.removeChild( this._shadowScene );
                    this._rootNode.addChild( this._lightAndShadowScene );
                }
                this._previousDisable = this._config[ 'disableShadows' ];
            }

            this.updateShadowStatic();

            this.updateLightsAmbient();
            this.updateLightsEnable();

            this.testFrustumIntersections();

            this.updateLightType();
            this.updateFov();
            this.updateShadowTechniqueMode();

            this.updateShadowFormat();
            this.updateShadowMapSize();

            this.updateDebugRTT();

            var l = this._lights.length;

            while ( l-- ) {
                var shadowMap = this._shadowTechnique[ l ];
                shadowMap.setShadowSettings( this._shadowSettings[ l ] );
                shadowMap.setDebug( this._config[ 'debugBounds' ] );
            }

            // Iterate over all controllers
            for ( var i in this._gui.__controllers ) {
                this._gui.__controllers[ i ].updateDisplay();
            }
            for ( var f in this._gui.__folders ) {
                var g = this._gui.__folders[ f ];
                for ( i in g.__controllers ) {
                    g.__controllers[ i ].updateDisplay();
                }
            }

        },

        // show the shadowmap as ui quad on left bottom screen
        // in fact show all texture inside this._RTT
        showFrameBuffers: function ( optionalArgs ) {

            if ( !this._RTTdebugNode ) this._RTTdebugNode = new osg.Node();
            if ( !this._composerDebugNode ) this._composerDebugNode = new osg.Node();
            this._composerDebugNode._name = 'debugComposerNode';
            this._composerDebugNode.setCullingActive( false );
            if ( !this._composerDebugCamera ) this._composerDebugCamera = new osg.Camera();
            this._RTTdebugNode.addChild( this._composerDebugCamera );

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


            var matrixDest = this._composerDebugCamera.getProjectionMatrix();
            osg.mat4.ortho( matrixDest, 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5 );
            this._composerDebugCamera.setProjectionMatrix( matrixDest ); //not really needed until we do matrix caches

            matrixDest = this._composerDebugCamera.getViewMatrix();
            osg.mat4.fromTranslation( matrixDest, [ 0, 0, 0 ] );
            this._composerDebugCamera.setViewMatrix( matrixDest );
            this._composerDebugCamera.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
            this._composerDebugCamera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            this._composerDebugCamera.addChild( this._composerDebugNode );

            var texture;
            var xOffset = optionsDebug.x;
            var yOffset = optionsDebug.y;
            this._composerDebugNode.removeChildren();

            var stateset;

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

            stateset = this._composerDebugNode.getOrCreateStateSet();
            if ( !optionsDebug.fullscreen )
                stateset.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            stateset.setAttributeAndModes( this._programRTT );


            for ( var i = 0, l = this._RTT.length; i < l; i++ ) {
                texture = this._RTT[ i ];
                if ( texture ) {
                    var quad = osg.createTexturedQuadGeometry( xOffset, yOffset, 0, optionsDebug.w, 0, 0, 0, optionsDebug.h, 0 );

                    stateset = quad.getOrCreateStateSet();

                    quad.setName( 'debugCompoQuadGeom' );

                    stateset.setTextureAttributeAndModes( 0, texture );
                    stateset.setAttributeAndModes( this._programRTT );
                    // stateset.setAttributeAndModes(new osg.Depth('DISABLE'));

                    this._composerDebugNode.addChild( quad );

                    if ( optionsDebug.horizontal ) xOffset += optionsDebug.w + 2;
                    else yOffset += optionsDebug.h + 2;
                }
            }
            return this._composerDebugCamera;
        },
        // Scene to be shadowed,  and to cast  shadow from
        // Multiple parents...
        createSceneCasterReceiver: function () {

            var ShadowScene = new osg.MatrixTransform();
            osg.mat4.setTranslation( ShadowScene.getMatrix(), this._config[ 'targetPosition' ] );

            ShadowScene.setName( 'ShadowScene' );

            var modelNode = new osg.Node();
            modelNode.setName( 'modelSubNode' );

            var modelName;
            modelName = this._config[ 'model' ];

            if ( !this._config[ 'basicScene' ] ) {
                var request = osgDB.readNodeURL( '../media/models/' + modelName + '/file.osgjs' );

                request.then( function ( model ) {


                    // adds models
                    model._name = 'material-test_model_0';
                    modelNode.addChild( model );

                    var dist = 25;

                    var modelSubNodeTrans = new osg.MatrixTransform();
                    var modelSubNode = new osg.Node();
                    modelSubNode._name = 'material-test_model_1';
                    modelSubNodeTrans.setMatrix( osg.mat4.fromScaling( osg.mat4.create(), [ 0.1, 0.1, 0.1 ] ) );
                    osg.mat4.setTranslation( modelSubNodeTrans.getMatrix(), [ 0, 0, 0 ] );
                    modelSubNodeTrans.addChild( model );
                    modelSubNode.addChild( modelSubNodeTrans );
                    modelNode.addChild( modelSubNode );


                    modelSubNode = new osg.Node();
                    modelSubNodeTrans = new osg.MatrixTransform();
                    modelSubNode._name = 'material-test_model_3';
                    modelSubNodeTrans.setMatrix( osg.mat4.fromScaling( osg.mat4.create(), [ 0.3, 0.3, 0.3 ] ) );
                    osg.mat4.setTranslation( modelSubNodeTrans.getMatrix(), [ dist, 0, 0 ] );
                    modelSubNodeTrans.addChild( model );
                    modelSubNode.addChild( modelSubNodeTrans );
                    modelNode.addChild( modelSubNode );
                    if ( this._config[ 'complexScene' ] ) {
                        modelSubNode = new osg.Node();
                        modelSubNodeTrans = new osg.MatrixTransform();
                        modelSubNode._name = 'material-test_model_3';
                        modelSubNodeTrans.setMatrix( osg.mat4.fromScaling( osg.mat4.create(), [ 0.5, 0.5, 0.5 ] ) );
                        osg.mat4.setTranslation( modelSubNodeTrans.getMatrix(), [ -dist, 0, -5 ] );
                        modelSubNodeTrans.addChild( model );
                        modelSubNode.addChild( modelSubNodeTrans );
                        modelNode.addChild( modelSubNode );

                        modelSubNode = new osg.Node();
                        modelSubNode._name = 'material-test_model_2';
                        modelSubNodeTrans = new osg.MatrixTransform();
                        modelSubNodeTrans.setMatrix( osg.mat4.fromScaling( osg.mat4.create(), [ 0.7, 0.7, 0.7 ] ) );
                        osg.mat4.setTranslation( modelSubNodeTrans.getMatrix(), [ dist * 2, 0.7, 0.7 ] );
                        modelSubNodeTrans.addChild( model );
                        modelSubNode.addChild( modelSubNodeTrans );
                        modelNode.addChild( modelSubNode );
                    }
                }.bind( this ) );
            }
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
            cubeSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ 0, 0, dist / 2 ] ) );
            var cubeSubNode = new osg.Node();
            cubeSubNode.addChild( cubeSubNodeTrans );
            cubeSubNodeTrans.addChild( cube );
            cubeSubNode.setName( 'cubeSubNode_0' );
            cubeNode.addChild( cubeSubNode );

            //cubeNode.addChild( cubeSubNode );
            if ( !this._config[ 'basicScene' ] ) {
                cubeSubNodeTrans = new osg.MatrixTransform();
                cubeSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ dist, 0, 0 ] ) );
                cubeSubNode = new osg.Node();
                cubeSubNode.addChild( cubeSubNodeTrans );
                cubeSubNodeTrans.addChild( cube );
                cubeSubNode.setName( 'cubeSubNode_1' );
                cubeNode.addChild( cubeSubNode );

                cubeSubNodeTrans = new osg.MatrixTransform();
                cubeSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ dist, dist, 0 ] ) );
                cubeSubNode = new osg.Node();
                cubeSubNode.addChild( cubeSubNodeTrans );
                cubeSubNodeTrans.addChild( cube );
                cubeSubNode.setName( 'cubeSubNode_2' );
                cubeNode.addChild( cubeSubNode );

                cubeSubNodeTrans = new osg.MatrixTransform();
                cubeSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ 0, dist, 0 ] ) );
                cubeSubNode = new osg.Node();
                cubeSubNode.addChild( cubeSubNodeTrans );
                cubeSubNodeTrans.addChild( cube );
                cubeSubNode.setName( 'cubeSubNode_3' );
                cubeNode.addChild( cubeSubNode );

                cubeSubNodeTrans = new osg.MatrixTransform();
                cubeSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ -dist, dist, -dist / 2 ] ) );
                cubeSubNode = new osg.Node();
                cubeSubNode.addChild( cubeSubNodeTrans );
                cubeSubNodeTrans.addChild( cube );
                cubeSubNode.setName( 'cubeSubNode_4' );
                cubeNode.addChild( cubeSubNode );

            }
            var texturePath = '../media/textures/seamless/wood2.jpg';
            osgDB.readImageURL( texturePath ).then( function ( cubeImage ) {
                var cubeTex = osg.Texture.createFromImage( cubeImage );
                cubeTex.setWrapT( 'MIRRORED_REPEAT' );
                cubeTex.setWrapS( 'MIRRORED_REPEAT' );
                cubeNode.getOrCreateStateSet().setTextureAttributeAndModes( 0, cubeTex );

            } );


            var groundNode = new osg.Node();
            groundNode.setName( 'groundNode' );

            var numPlanes = !this._config[ 'complexScene' ] ? 1 : 5;
            var groundSize = 600 / numPlanes;
            var ground = osg.createTexturedQuadGeometry( 0, 0, 0, groundSize, 0, 0, 0, groundSize, 0 );

            osgDB.readImageURL( texturePath ).then( function ( groundImage ) {
                var groundTex = osg.Texture.createFromImage( groundImage );
                groundTex.setWrapT( 'MIRRORED_REPEAT' );
                groundTex.setWrapS( 'MIRRORED_REPEAT' );
                ground.getOrCreateStateSet().setTextureAttributeAndModes( 0, groundTex );
                ground.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( osg.CullFace.DISABLE ), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

                //ground.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc( osg.BlendFunc.ONE, osg.BlendFunc.ONE_MINUS_SRC_ALPHA ) );

            } );
            var groundSubNode;
            // intentionally create many node/transform
            // to mimick real scene with many nodes
            for ( var wG = 0; wG < numPlanes; wG++ ) {
                for ( var wH = 0; wH < numPlanes; wH++ ) {
                    var groundSubNodeTrans = new osg.MatrixTransform();
                    groundSubNodeTrans.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), [ wG * groundSize - groundSize * numPlanes * 0.5, wH * groundSize - groundSize * numPlanes * 0.5, -5.0 ] ) );
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

            if ( !target ) target = this._config[ 'targetPosition' ];

            if ( !position ) position = [ -25 + -15 * num + -25 * ( num % 2 ),
                25 + 15 * num - 25 * ( num % 2 ),
                15 + 35 * num
            ];

            var shadowSettings = new osgShadow.ShadowSettings( this._config );

            var mapres = parseInt( this._config[ 'textureSize' ] );
            shadowSettings.setTextureSize( mapres );

            shadowSettings.setCastsShadowDrawTraversalMask( this._castsShadowDrawTraversalMask );
            shadowSettings.setCastsShadowBoundsTraversalMask( this._castsShadowBoundsTraversalMask );

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

            light.setAmbient( [ 0.0, 0.0, 0.0, 1.0 ] );
            light.setDiffuse( [ lightScale, lightScale, lightScale, 1.0 ] );
            light.setSpecular( [ lightScale, lightScale, lightScale, 1.0 ] );

            lightSource.setLight( light );
            lightNode.addChild( lightSource );

            this._lights.push( light );
            this._lightsMatrix.push( lightNode );
            this._lightsSource.push( lightSource );

            /////////////////////////////
            // add light to shadowedscene
            this._lightAndShadowScene.addChild( lightNode );
            //group.addChild( lightNode );
            /////////////////////////////

            var lightNodemodel = osg.createAxisGeometry();
            var lightNodemodelNode = new osg.MatrixTransform();
            lightNodemodelNode.addChild( lightNodemodel );
            this._debugLights.push( lightNodemodelNode );
            // light debug axis view
            // totally independant scene tree than light
            /////////
            group.addChild( lightNodemodelNode );
            ///////////////////

            ////////////
            //light.setPosition( position );
            var dir = [ 0, 0, 0 ];
            osg.vec3.sub( dir, position, target );
            osg.vec3.normalize( dir, dir );
            //light.setDirection( dir );
            lightSource.addUpdateCallback( new LightUpdateCallback( light, this, lightNodemodelNode, position, dir, target ) );

            // need to set lightSource rather than light pos
            // as there is no link in Light to get current Matrix.
            shadowSettings.setLight( light );
            ///////////////////////////////

            this._shadowSettings.push( shadowSettings );
            var shadowMap = new osgShadow.ShadowMap( shadowSettings );
            this._lightAndShadowScene.addShadowTechnique( shadowMap );
            shadowMap.setShadowSettings( shadowSettings );
            this._shadowTechnique.push( shadowMap );

            var shadowCam = shadowMap.getCamera();
            var timerGPU = osg.TimerGPU.instance();
            shadowCam.setInitialDrawCallback( timerGPU.start.bind( timerGPU, 'glshadows' + num ) );
            shadowCam.setFinalDrawCallback( timerGPU.end.bind( timerGPU, 'glshadows' + num ) );

            // init is done by shadowscene, at first render
            //shadowMap.init();

        },

        /*
         * main sample scene shadow code using OSG interface
         */
        createScene: function () {
            var group = new osg.Node();

            this._castsShadowDrawTraversalMask = 0x2;
            this._castsShadowBoundsTraversalMask = 0x2;
            //this._castsShadowBoundsTraversalMask = 0x4;

            this._shadowScene = this.createSceneCasterReceiver();

            var shadowedScene = new osgShadow.ShadowedScene();
            this._lightAndShadowScene = shadowedScene;

            // here you can set/change the mask for node you want to be
            // casting shadow
            // receiving shadow
            // any combination possible.
            //this._shadowScene.setNodeMask( this._castsShadowDrawTraversalMask );
            //this._shadowScene.setNodeMask( this._receivesShadowTraversalMask );


            this._cubeNode.setNodeMask( this._castsShadowBoundsTraversalMask | this._castsShadowDrawTraversalMask );
            this._modelNode.setNodeMask( this._castsShadowBoundsTraversalMask | this._castsShadowDrawTraversalMask );
            this._groundNode.setNodeMask( ~( this._castsShadowBoundsTraversalMask | this._castsShadowDrawTraversalMask ) );
            //this._groundNode.setNodeMask( ~this._castsShadowBoundsTraversalMask );

            /////////////////////////
            shadowedScene.addChild( this._shadowScene );
            // TODO: Better (Multi)Camera detection handling
            group.addChild( shadowedScene );

            // Camera as StateAttribute, positioned uniform ?
            // if we do world computation in shader
            // need camera position in world too
            this._config[ 'camera' ] = this._viewer.getCamera();

            var numLights = this._config.lightNum;
            var lightScale = 1.0 / numLights - 1e-4;


            for ( var k = 0; k < numLights; k++ ) {
                this.addShadowedLight( group, k, lightScale );
            }


            this._RTTdebugNode = new osg.Node();
            this._RTTdebugNode._name = 'debugFBNode';
            group.addChild( this._RTTdebugNode );

            // doesn't show anything as shadow text and scene
            // isn't init until first frame
            if ( this._config[ 'debugRTT' ] ) {
                this.showFrameBuffers( {
                    screenW: this._canvas.width,
                    screenH: this._canvas.height
                } );
            }

            // one config to rule them all
            //this._config = shadowedScene.getShadowSettings()._config;
            this._rootNode = group;
            return group;
        },

        getOptionsStats: function () {
            var values = {
                gltotalframe: {
                    caption: 'Total frame',
                    average: true
                }
            };

            var groupValues = [ 'gltotalframe' ];

            for ( var i = 0; i < this._maxLights; ++i ) {
                var shname = 'glshadows' + i;
                values[ shname ] = {
                    caption: 'Shadow ' + i,
                    average: true
                };
                groupValues.push( shname );
            }

            var groups = [ {
                caption: 'GL Frame',
                values: groupValues
            } ];

            return {
                values: values,
                groups: groups
            };
        },

        /*
         * standard run scene, but for float tex support and shader loading
         */
        run: function ( canvas ) {

            var caps = osg.WebGLCaps.instance();
            this._maxVaryings = caps.getWebGLParameter( 'MAX_VARYING_VECTORS' );
            this._maxTextureSize = caps.getWebGLParameter( 'MAX_TEXTURE_SIZE' );
            this._maxTextureUnit = caps.getWebGLParameter( 'MAX_TEXTURE_IMAGE_UNITS' );
            // shaders has to have under max varying decl max = this._maxVaryings -1
            // usual shader is already 4 vertexColor, vViewNormal, vViewVertex, vTexcoord. each shadow is 1 more vec4 per shadow
            this._maxLights = Math.min( this._maxTextureUnit - 1, this._maxVaryings - 5 );

            var opt = {
                rstats: this.getOptionsStats()
            };

            var viewer = new osgViewer.Viewer( canvas, opt );
            this._canvas = canvas;
            this._viewer = viewer;

            viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );
            viewer.init();

            viewer.getCamera().setComputeNearFar( true );

            this._glContext = viewer.getGraphicContext();

            this._floatLinearTextureSupport = osg.WebGLCaps.instance().hasLinearFloatRTT();
            this._floatTextureSupport = osg.WebGLCaps.instance().hasFloatRTT();
            this._halfFloatLinearTextureSupport = osg.WebGLCaps.instance().hasHalfFloatRTT();
            this._halfFloatTextureSupport = osg.WebGLCaps.instance().hasLinearHalfFloatRTT();
            this._hasAnyFloatTextureSupport = this._floatLinearTextureSupport || this._floatTextureSupport || this._halfFloatLinearTextureSupport || this._halfFloatTextureSupport;

            var scene = this.createScene();

            viewer.setSceneData( scene );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();
            viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

            viewer.run();

            var wantToSeeAShadowSceneGraph = false;
            if ( wantToSeeAShadowSceneGraph ) {
                var graphDebug = new osgUtil.DisplayGraph();
                graphDebug.createGraph( scene );
            }


            var timerGPU = osg.TimerGPU.instance();
            if ( timerGPU.isEnabled() ) {
                var cam = this._viewer.getCamera();
                cam.setInitialDrawCallback( timerGPU.start.bind( timerGPU, 'gltotalframe' ) );
                cam.setFinalDrawCallback( timerGPU.end.bind( timerGPU, 'gltotalframe' ) );
            }

            this.initDatGUI();
            this.updateShadow();
        }
    };
    // execute loaded code when ready
    window.addEventListener( 'load', function () {

        osg.log( osg.WebGLCaps.instance().getWebGLParameters() );

        var example = new Example();
        var canvas = document.getElementById( 'View' );
        example.run( canvas );
    }, true );

} )();
