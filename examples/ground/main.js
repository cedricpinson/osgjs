( function () {
    'use strict';

    var OSG = window.OSG;
    var osgViewer = OSG.osgViewer;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;

    function colorFloatTo255( color ) {
        return [ color[ 0 ] * 255.0, color[ 1 ] * 255.0, color[ 2 ] * 255.0 ];
    }

    function color255ToFloat( color ) {
        return [ color[ 0 ] / 255.0, color[ 1 ] / 255.0, color[ 2 ] / 255.0 ];
    }

    var Example = function () {};

    Example.prototype = {

        // the root node
        scene: undefined,
        model: undefined,
        ground: new window.Ground(),
        scale: 1.0,
        debugDiv: document.getElementById( 'debug' ),
        gui: undefined,
        params: undefined,
        viewer: undefined,

        run: function () {
            this.cacheURLs = {};

            var canvas = document.getElementById( 'View' );

            this.viewer = new osgViewer.Viewer( canvas );
            this.viewer.init();
            this.viewer.getCamera().setClearColor( [ 0.005, 0.005, 0.005, 1.0 ] );

            this.scene = new osg.Node();
            this.scene.addChild( this.ground );

            this.viewer.setSceneData( this.scene );
            this.viewer.setupManipulator();

            this.viewer.run();
            this.initGui();
            this.changeModel( 'file.osgjs' );
        },
        initGui: function () {
            this.gui = new window.dat.GUI();
            var self = this;
            // config to let dat.gui change the scale
            this.params = {
                model: 'file.osgjs',
                adjustY: 0.001,
                groundColor: colorFloatTo255( self.ground.getColor() ),
                backgroundColor: colorFloatTo255( self.viewer.getCamera().getClearColor() ),
                reset: function () {
                    self.resetHeightAndGui();
                }
            };

            var modelController = this.gui.add( this.params, 'model', [ 'file.osgjs', 'sphere' ] );
            modelController.onFinishChange( function ( value ) {
                self.changeModel( value );
            } );
            var adjustYController = this.gui.add( this.params, 'adjustY', -1.0, 1.0 );
            adjustYController.onChange( function ( value ) {
                self.ground.setNormalizedHeight( value );
            } );
            this.gui.add( this.params, 'reset' ).name( 'Reset ground height' );
            var colorController = this.gui.addColor( this.params, 'groundColor' );
            colorController.onChange( function ( color ) {
                self.ground.setColor( color255ToFloat( color ) );
            } );
            var backgroundColorController = this.gui.addColor( this.params, 'backgroundColor' );
            backgroundColorController.onChange( function ( color ) {
                var temp = [ 0.0, 0.0, 0.0 ];
                temp[ 0 ] = Math.pow( color[ 0 ] / 255.0, 2.2 );
                temp[ 1 ] = Math.pow( color[ 1 ] / 255.0, 2.2 );
                temp[ 2 ] = Math.pow( color[ 2 ] / 255.0, 2.2 );
                self.viewer.getCamera().setClearColor( temp );
            } );
        },
        resetHeightAndGui: function () {

            this.ground.setGroundFromModel( this.model );

            this.params.adjustY = this.ground.getNormalizedHeight();
            // Update gui
            for ( var i in this.gui.__controllers )
                this.gui.__controllers[ i ].updateDisplay();
        },
        setModel: function ( model ) {
            this.scene.removeChild( this.model );

            this.model = model;
            this.resetHeightAndGui();

            this.scene.addChild( this.model );
            this.viewer.getManipulator().computeHomePosition();
        },
        changeModel: function ( key ) {
            if ( this.cacheURLs[ key ] )
                return this.setModel( this.cacheURLs[ key ] );

            if ( key === 'sphere' ) {
                var sphere = this.cacheURLs[ key ] = osg.createTexturedSphere( 1.0, 20, 20 );
                return this.setModel( sphere );
            }

            osgDB.readNodeURL( '../media/models/material-test/' + key ).then( function ( model ) {
                this.cacheURLs[ key ] = model;
                this.setModel( model );
            }.bind( this ) );
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );
} )();
