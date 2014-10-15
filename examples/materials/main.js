( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var $ = window.$;


    var Example = function () {

        this._config = {

            spotAmbient: '#000000',
            spotDiffuse: '#d0cde8',
            spotSpecular: '#050505',
            spotCutoff: 23,
            spotBlend: 0.2,
            spotAttenuation: 10.0,

            pointAmbient: '#050505',
            pointDiffuse: '#7a3939',
            pointSpecular: '#050505',
            pointAttenuation: 5.0,

            directionalAmbient: '#000000',
            directionalDiffuse: '#0c0525',
            directionalSpecular: '#000000',

            materialAmbient: '#050505',
            materialDiffuse: '#f0f0f0',
            materialSpecular: '#505050'

        };

    };

    Example.prototype = {

        initDatGUI: function () {

            var gui = new window.dat.GUI();

            var controller;

            controller = gui.addColor( this._config, 'materialAmbient' );
            controller.onChange( this.updateMaterial.bind( this ) );

            controller = gui.addColor( this._config, 'materialDiffuse' );
            controller.onChange( this.updateMaterial.bind( this ) );

            controller = gui.addColor( this._config, 'materialSpecular' );
            controller.onChange( this.updateMaterial.bind( this ) );

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

        updateMaterial: function () {
            this._material.setDiffuse( this.convertColor( this._config.materialDiffuse ) );
            this._material.setSpecular( this.convertColor( this._config.materialSpecular ) );
            this._material.setAmbient( this.convertColor( this._config.materialAmbient ) );
        },


        createScene: function () {
            var group = new osg.Node();

            // add a light directionnal
            group.addChild( this.createDirectionalLight() );
            group.addChild( this.createSpotLight() );
            group.addChild( this.createPointLight() );

            // create plane
            var planeSize = 40;
            var plane = osg.createTexturedQuadGeometry( -planeSize/2, -planeSize/2, 0,
                                                        planeSize, 0, 0,
                                                        0, planeSize, 0,
                                                        0, 0
                                                      );

            var planeMaterial = new osg.Material();
            this._material = planeMaterial;
            this.updateMaterial();
            plane.getOrCreateStateSet().setAttributeAndModes( planeMaterial );
            group.addChild( plane );

            return group;
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
