( function () {
    'use strict';

    var OSG = window.OSG;
    var osgDB = OSG.osgDB;
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
            directionalDiffuse: '#6955b1',
            directionalSpecular: '#000000',

            hemiDiffuse: '#d2ce90',
            hemiGround: '#151515',

            materialAmbient: '#050505',
            materialDiffuse: '#f0f0f0',
            materialSpecular: '#505050'

        };

    };

    Example.prototype = {

        initDatGUI: function () {

            var gui = new window.dat.GUI();

            var controller;
            controller = gui.addColor( this._config, 'spotAmbient' );
            controller.onChange( this.updateSpot.bind( this ) );

            controller = gui.addColor( this._config, 'spotDiffuse' );
            controller.onChange( this.updateSpot.bind( this ) );

            controller = gui.addColor( this._config, 'spotSpecular' );
            controller.onChange( this.updateSpot.bind( this ) );

            controller = gui.add( this._config, 'spotCutoff', 0, 179 );
            controller.onChange( this.updateSpot.bind( this ) );

            controller = gui.add( this._config, 'spotAttenuation', 0.0001, 20.0 );
            controller.onChange( this.updateSpot.bind( this ) );

            controller = gui.add( this._config, 'spotBlend', 0.0, 1.0 );
            controller.onChange( this.updateSpot.bind( this ) );



            controller = gui.addColor( this._config, 'pointAmbient' );
            controller.onChange( this.updatePoint.bind( this ) );

            controller = gui.addColor( this._config, 'pointDiffuse' );
            controller.onChange( this.updatePoint.bind( this ) );

            controller = gui.addColor( this._config, 'pointSpecular' );
            controller.onChange( this.updatePoint.bind( this ) );

            controller = gui.add( this._config, 'pointAttenuation', 0.0001, 20 );
            controller.onChange( this.updatePoint.bind( this ) );



            controller = gui.addColor( this._config, 'directionalAmbient' );
            controller.onChange( this.updateDirectional.bind( this ) );

            controller = gui.addColor( this._config, 'directionalDiffuse' );
            controller.onChange( this.updateDirectional.bind( this ) );

            controller = gui.addColor( this._config, 'directionalSpecular' );
            controller.onChange( this.updateDirectional.bind( this ) );




            controller = gui.addColor( this._config, 'hemiDiffuse' );
            controller.onChange( this.updateHemi.bind( this ) );

            controller = gui.addColor( this._config, 'hemiGround' );
            controller.onChange( this.updateHemi.bind( this ) );


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

        updateSpot: function () {
            this._spotLight.setDiffuse( this.convertColor( this._config.spotDiffuse ) );
            this._spotLight.setSpecular( this.convertColor( this._config.spotSpecular ) );
            this._spotLight.setAmbient( this.convertColor( this._config.spotAmbient ) );
            this._spotLight.setSpotCutoff( this._config.spotCutoff );
            this._spotLight.setSpotBlend( this._config.spotBlend );
            var att = 1.0 / this._config.spotAttenuation;
            this._spotLight.setConstantAttenuation( 0.0 );
            this._spotLight.setLinearAttenuation( 0.0 );
            this._spotLight.setQuadraticAttenuation( att * att );
        },

        updateDirectional: function () {
            this._directionalLight.setDiffuse( this.convertColor( this._config.directionalDiffuse ) );
            this._directionalLight.setSpecular( this.convertColor( this._config.directionalSpecular ) );
            this._directionalLight.setAmbient( this.convertColor( this._config.directionalAmbient ) );
        },

        updateHemi: function () {
            this._hemiLight.setDiffuse( this.convertColor( this._config.hemiDiffuse ) );
            this._hemiLight.setGround( this.convertColor( this._config.hemiGround ) );
        },

        updatePoint: function () {
            this._pointLight.setDiffuse( this.convertColor( this._config.pointDiffuse ) );
            this._pointLight.setSpecular( this.convertColor( this._config.pointSpecular ) );
            this._pointLight.setAmbient( this.convertColor( this._config.pointAmbient ) );

            var att = 1.0 / this._config.pointAttenuation;
            this._pointLight.setConstantAttenuation( 0.0 );
            this._pointLight.setLinearAttenuation( 0.0 );
            this._pointLight.setQuadraticAttenuation( att * att );
        },


        updateMaterial: function () {
            this._material.setDiffuse( this.convertColor( this._config.materialDiffuse ) );
            this._material.setSpecular( this.convertColor( this._config.materialSpecular ) );
            this._material.setAmbient( this.convertColor( this._config.materialAmbient ) );
        },


        createDirectionalLight: function ( x, y, z ) {

            var root = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( x, y, z, root.getMatrix() );

            var ls = new osg.LightSource();

            // by default lights are directionnal like in opengl
            var light = new osg.Light( 0 );
            this._directionalLight = light;

            ls.setLight( light );
            this.updateDirectional();

            var lightTransform = new osg.MatrixTransform();

            var matrixTranslate = osg.Matrix.create();
            osg.Matrix.makeTranslate( 0, 0, 10, matrixTranslate );

            var matrixRotate = osg.Matrix.create();
            osg.Matrix.makeRotate( -Math.PI / 4, 1, 0, 0, matrixRotate );

            osg.Matrix.mult( matrixRotate, matrixTranslate, lightTransform.getMatrix() );

            lightTransform.addChild( ls );

            var lightGeometry = osg.createTexturedBoxGeometry( 0, 0, 0,
                1, 1, 1 );

            lightTransform.addChild( lightGeometry );

            root.addChild( this.createPlane() );
            root.addChild( lightTransform );

            return root;
        },


        createHemiLight: function ( x, y, z ) {

            var root = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( x, y, z, root.getMatrix() );

            var ls = new osg.LightSource();

            var light = new osg.Light( 3 );
            light.setLightAsHemi();
            this._hemiLight = light;

            ls.setLight( light );
            this.updateHemi();

            var lightTransform = new osg.MatrixTransform();

            var matrixTranslate = osg.Matrix.create();
            osg.Matrix.makeTranslate( 0, 0, 10, matrixTranslate );

            var matrixRotate = osg.Matrix.create();
            osg.Matrix.makeRotate( -Math.PI / 4, 1, 0, 0, matrixRotate );

            osg.Matrix.mult( matrixRotate, matrixTranslate, lightTransform.getMatrix() );

            lightTransform.addChild( ls );

            var lightGeometry = osg.createTexturedBoxGeometry( 0, 0, 0,
                1, 1, 1 );

            lightTransform.addChild( lightGeometry );

            root.addChild( this.createPlane() );
            root.addChild( lightTransform );

            return root;
        },

        createSpotLight: function ( x, y, z ) {

            var root = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( x, y, z, root.getMatrix() );

            var ls = new osg.LightSource();
            var light = new osg.Light( 1 );
            this._spotLight = light;
            light.setPosition( [ 0, 0, 0, 1 ] );

            this.updateSpot();

            ls.setLight( light );

            var lightTransform = new osg.MatrixTransform();

            var matrixTranslate = osg.Matrix.create();
            osg.Matrix.makeTranslate( 0, 0, 10, matrixTranslate );

            var matrixRotate = osg.Matrix.create();
            osg.Matrix.makeRotate( -Math.PI / 4, 1, 0, 0, matrixRotate );

            osg.Matrix.mult( matrixRotate, matrixTranslate, lightTransform.getMatrix() );

            lightTransform.addChild( ls );

            var lightGeometry = osg.createTexturedBoxGeometry( 0, 0, 0,
                1, 1, 1 );

            lightTransform.addChild( lightGeometry );

            root.addChild( this.createPlane() );
            root.addChild( lightTransform );

            return root;
        },

        createPointLight: function ( x, y, z ) {

            var root = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( x, y, z, root.getMatrix() );

            var ls = new osg.LightSource();
            var light = new osg.Light( 2 );
            this._pointLight = light;
            light.setPosition( [ 0, 0, 0, 1 ] );

            this.updatePoint();

            ls.setLight( light );

            var lightTransform = new osg.MatrixTransform();

            osg.Matrix.makeTranslate( 0, 0, 5, lightTransform.getMatrix() );

            lightTransform.addChild( ls );

            var lightGeometry = osg.createTexturedSphereGeometry( 0.8, 20, 20 );

            lightTransform.addChild( lightGeometry );

            root.addChild( this.createPlane() );
            root.addChild( lightTransform );

            return root;
        },


        createModelInstance: function () {

            if ( !this._model ) {

                this._model = new osg.MatrixTransform();
                osg.Matrix.makeRotate( -Math.PI, 0, 0, 1, this._model.getMatrix() );
                var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );

                // copy tex coord 0 to tex coord1 for multi texture
                request.then( function ( model ) {
                    this._model.addChild( model );
                }.bind( this ) );

            }

            var node = new osg.MatrixTransform();
            var rotate = osg.Matrix.makeRotate( -Math.PI, 0, 0, 1, osg.Matrix.create() );
            var scale = osg.Matrix.makeScale( 0.1, 0.1, 0.1, osg.Matrix.create() );
            osg.Matrix.mult( scale, rotate, node.getMatrix() );
            node.addChild( this._model );
            return node;
        },


        setDisableLights: function ( stateSet, except ) {
            for ( var i = 0; i < 4; i++ ) {
                if ( i === except )
                    continue;
                var light = new osg.Light( i, true );
                stateSet.setAttributeAndModes( light ); // use a default light to disable all
            }
        },

        createPlane: function () {
            // create plane
            var grp = new osg.Node();
            var planeSize = 20;
            var plane = osg.createTexturedQuadGeometry( -planeSize / 2, -planeSize / 2, 0,
                planeSize, 0, 0,
                0, planeSize, 0,
                0, 0
            );

            grp.addChild( this.createModelInstance() );
            grp.addChild( plane );
            return grp;
        },

        createScene: function () {
            var group = new osg.Node();

            // add a light directionnal
            var scene;

            scene = this.createHemiLight( 0, 0, 0 );
            this.setDisableLights( scene.getOrCreateStateSet(), 3 );
            group.addChild( scene );

            scene = this.createDirectionalLight( 25, 0, 0 );
            this.setDisableLights( scene.getOrCreateStateSet(), 0 );
            group.addChild( scene );

            scene = this.createSpotLight( 50, 0, 0 );
            this.setDisableLights( scene.getOrCreateStateSet(), 1 );
            group.addChild( scene );

            scene = this.createPointLight( 75, 0, 0 );
            this.setDisableLights( scene.getOrCreateStateSet(), 2 );
            group.addChild( scene );



            var planeMaterial = new osg.Material();
            this._material = planeMaterial;
            this.updateMaterial();
            group.getOrCreateStateSet().setAttributeAndModes( planeMaterial );

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
