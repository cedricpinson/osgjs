( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;

    var CustomCompiler = window.CustomCompiler;
    var RampAttribute = window.RampAttribute;
    var NegatifAttribute = window.NegatifAttribute;

    var Example = function () {

        this._config = {
            negatif: true,
            ramp: true,
            diffuse: '#bdaaeb'
        };

    };

    var convertColor = function ( color ) {

        var r, g, b;

        if ( color.length === 3 ) { // rgb [255, 255, 255]
            r = color[ 0 ];
            g = color[ 1 ];
            b = color[ 2 ];

        } else if ( color.length === 7 ) { // hex (24 bits style) '#ffaabb'
            var intVal = parseInt( color.slice( 1 ), 16 );
            r = ( intVal >> 16 );
            g = ( intVal >> 8 & 0xff );
            b = ( intVal & 0xff );
        }

        var result = [ 0, 0, 0, 1 ];
        result[ 0 ] = r / 255.0;
        result[ 1 ] = g / 255.0;
        result[ 2 ] = b / 255.0;
        //console.log( result );
        return result;
    };


    Example.prototype = {

        initDatGUI: function () {

            var controller;
            var gui = new window.dat.GUI();

            controller = gui.addColor( this._config, 'diffuse' );
            controller.onChange( this.updateDiffuse.bind( this ) );

            controller = gui.add( this._config, 'negatif' );
            controller.onChange( this.updateNegatif.bind( this ) );

            controller = gui.add( this._config, 'ramp', 0, 1.0 );
            controller.onChange( this.updateRamp.bind( this ) );

        },

        updateNegatif: function () {
            this._negatifAttribute.setAttributeEnable( this._config.negatif );
        },

        updateRamp: function () {
            this._rampAttribute.setAttributeEnable( this._config.ramp );
        },

        updateDiffuse: function () {
            this._materialAttribute.setDiffuse( convertColor( this._config.diffuse ) );
        },


        readShaders: function () {

            // get or create shader processor
            var shaderProcessor = new osgShader.ShaderProcessor();

            var promise = P.resolve( $.get( 'shaders/custom.glsl' ) );

            // register shader to the shader processor
            promise.then( function ( shader ) {
                shaderProcessor.addShaders( {
                    'custom.glsl': shader
                } );
            } );

            return promise;
        },

        installCustomShaders: function () {

            // create a new shader generator with our own compiler
            var shaderGenerator = new osgShader.ShaderGenerator();
            shaderGenerator.setShaderCompiler( CustomCompiler );

            // get or create instance of ShaderGeneratorProxy
            var shaderGeneratorProxy = this._viewer.getState().getShaderGeneratorProxy();
            shaderGeneratorProxy.addShaderGenerator( 'custom', shaderGenerator );

            // now we can use 'custom' in StateSet to access our shader generator
        },


        // get the model
        getOrCreateModel: function () {

            if ( !this._model ) {

                this._model = new osg.Node();

                var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );
                request.then( function ( model ) {

                    var mt = new osg.MatrixTransform();
                    osg.mat4.fromRotation( mt.getMatrix(), -Math.PI / 2, [ 1, 0, 0 ] );
                    var bb = model.getBound();
                    osg.mat4.mul( mt.getMatrix(), osg.mat4.fromTranslation( osg.mat4.create(), [ 0, -bb.radius() / 2, 0 ] ), mt.getMatrix() );
                    mt.addChild( model );
                    this._model.addChild( model );
                    // Create a new stateset to prove that CustomCompiler is applied to child nodes.
                    this._model.getOrCreateStateSet();
                    this._viewer.getManipulator().computeHomePosition();

                }.bind( this ) );

            }

            return this._model;
        },


        createScene: function () {

            var root = new osg.Node();
            this._materialAttribute = new osg.Material();
            root.getOrCreateStateSet().setAttributeAndModes( this._materialAttribute );


            this._stateSet = root.getOrCreateStateSet();
            this._rampAttribute = new RampAttribute();
            this._rampAttribute.setAttributeEnable( true );
            this._stateSet.setAttributeAndModes( this._rampAttribute );

            // use the shader generator 'custom'
            var rendering1 = new osg.MatrixTransform();
            rendering1.getOrCreateStateSet().setShaderGeneratorName( 'custom' );
            osg.mat4.fromTranslation( rendering1.getMatrix(), [ 20, 0, 0 ] );

            // use the shader generator 'custom'
            var rendering3 = new osg.MatrixTransform();
            this._negatifAttribute = new NegatifAttribute();
            this._negatifAttribute.setAttributeEnable( true );
            rendering3.getOrCreateStateSet().setAttributeAndModes( this._negatifAttribute );
            rendering3.getOrCreateStateSet().setShaderGeneratorName( 'custom' );
            osg.mat4.fromTranslation( rendering3.getMatrix(), [ 60, 0, 0 ] );


            // use the default shader generator
            var rendering2 = new osg.MatrixTransform();
            osg.mat4.fromTranslation( rendering2.getMatrix(), [ -20, 0, 0 ] );


            var model = this.getOrCreateModel();

            rendering2.addChild( model );
            rendering1.addChild( model );
            rendering3.addChild( model );

            root.addChild( rendering1 );
            root.addChild( rendering2 );
            root.addChild( rendering3 );

            return root;
        },

        run: function ( canvas ) {

            var viewer;
            viewer = new osgViewer.Viewer( canvas, this._osgOptions );
            this._viewer = viewer;
            viewer.init();

            this.readShaders().then( function () {

                this.installCustomShaders();
                this.initDatGUI();

                var scene = this.createScene();

                viewer.setSceneData( scene );
                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition();

                viewer.run();

            }.bind( this ) );
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
