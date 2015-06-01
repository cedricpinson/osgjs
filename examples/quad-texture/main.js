( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;

    var Example = function () {

        this._textureNames = [
            'seamless/fabric1.jpg',
            'seamless/fabric2.jpg',
            'seamless/bricks1.jpg',
            'seamless/grunge1.jpg',
            'seamless/grunge2.jpg',
            'seamless/leather1.jpg',
            'seamless/wood1.jpg',
            'seamless/wood2.jpg'
        ];


        this._config = {

            materialEmission1: '#050505',
            materialAmbient1: '#050505',
            materialDiffuse1: '#f0f0f0',
            materialSpecular1: '#505050',
            materialShininess1: 0.3,
            texture1Unit0: this._textureNames[ 1 ]
        };



        this._stateSet1 = undefined;

    };

    Example.prototype = {

        initDatGUI: function () {

            var path = '../media/textures/';

            // generate array of paths
            var paths = this._textureNames.map( function ( name ) {
                return path + name;
            } );

            // generate array of promise
            var images = paths.map( function ( path ) {
                return osgDB.readImageURL( path );
            } );

            var gui = new window.dat.GUI();

            var controller;

            // ui material 1
            var material1 = gui.addFolder( 'material1' );
            controller = material1.addColor( this._config, 'materialEmission1' );
            controller.onChange( this.updateMaterial1.bind( this ) );

            controller = material1.addColor( this._config, 'materialAmbient1' );
            controller.onChange( this.updateMaterial1.bind( this ) );

            controller = material1.addColor( this._config, 'materialDiffuse1' );
            controller.onChange( this.updateMaterial1.bind( this ) );

            controller = material1.addColor( this._config, 'materialSpecular1' );
            controller.onChange( this.updateMaterial1.bind( this ) );

            controller = material1.add( this._config, 'materialShininess1', 0.01, 1.0 );
            controller.onChange( this.updateMaterial1.bind( this ) );


            // wait for all images
            P.all( images ).then( function ( args ) {

                this._textures = args.map( function ( image ) {
                    var texture = new osg.Texture();
                    texture.setImage( image );
                    texture.setWrapT( 'REPEAT' );
                    texture.setWrapS( 'REPEAT' );
                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    return texture;
                } );


                controller = material1.add( this._config, 'texture1Unit0', this._textureNames );
                controller.onChange( this.updateMaterial1.bind( this ) );
                this.updateMaterial1();

            }.bind( this ) );


        },


        // get the model
        getOrCreateModel: function () {

            if ( !this._model ) {

                var size = 10;
                // check osg/Shape.js to see arguements of createTexturedQuadGeometry
                this._model = osg.createTexturedQuadGeometry( -size / 2, 0, -size / 2,
                    size, 0, 0,
                    0, 0, size );

            }

            return this._model;
        },

        convertColor: function ( color ) {

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
        },

        updateMaterial1: function () {

            if ( !this._stateSet1 )
                return;
            var material = this._stateSet1.getAttribute( 'Material' );

            if ( !material )
                material = new osg.Material();

            this._stateSet1.setAttributeAndModes( material );
            material.setEmission( this.convertColor( this._config.materialEmission1 ) );
            material.setDiffuse( this.convertColor( this._config.materialDiffuse1 ) );
            material.setSpecular( this.convertColor( this._config.materialSpecular1 ) );
            material.setAmbient( this.convertColor( this._config.materialAmbient1 ) );


            material.setShininess( Math.exp( this._config.materialShininess1 * 13.0 - 4.0 ) );

            if ( !this._textures )
                return;

            var idx = this._textureNames.indexOf( this._config.texture1Unit0 );
            var texture = this._textures[ idx ];
            this._stateSet1.setTextureAttributeAndModes( 0, texture );

        },

        createScene: function () {

            var model1 = this.getOrCreateModel();
            this._stateSet1 = model1.getOrCreateStateSet();
            this.updateMaterial1();

            return model1;
        },

        run: function ( canvas ) {

            var viewer;
            viewer = new osgViewer.Viewer( canvas, this._osgOptions );
            this._viewer = viewer;
            viewer.init();

            var scene = this.createScene();

            viewer.setSceneData( scene );
            viewer.setupManipulator();
            viewer.getManipulator().computeHomePosition();

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
