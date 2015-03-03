'use strict';

var OSG = window.OSG;
var osgViewer = OSG.osgViewer;
var osg = OSG.osg;

var Example = function () {};

Example.prototype = {

    // the root node
    scene: undefined,
    model: undefined,
    ground: new Ground(),
    scale: 1.0,
    debugDiv: document.getElementById( 'debug' ),
    gui: undefined,
    params: undefined,
    viewer: undefined,

    run: function () {

        var canvas = document.getElementById( 'View' );

        this.viewer = new osgViewer.Viewer( canvas );
        this.viewer.init();

        this.viewer.getCamera().setClearColor( [ 0.005, 0.005, 0.005, 1.0 ] );

        this.scene = new osg.Node();

        // create a dummy model
        this.model = OSG.osg.createTexturedSphere( 1.0, 20, 20 );
        this.model.name = 'mySphere';

        this.scene.addChild( this.ground );
        this.scene.addChild( this.model );

        this.gui = new window.dat.GUI();

        var self = this;
        // config to let dat.gui change the scale
        this.params = {
            model: 'ogre',
            adjustY: 0.001,
            groundColor: colorFloatTo255( self.ground.getColor() ),
            backgroundColor: colorFloatTo255( self.viewer.getCamera().getClearColor() ),
            reset: function () {
                self.resetHeightAndGui();
            },
        };

        var modelController = this.gui.add( this.params, 'model', [ 'ogre', 'pokerscene' ] );
        modelController.onFinishChange( function ( value ) {
            self.changeModel( 'models/' + value + '.osgjs' );
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

        this.viewer.setSceneData( this.scene );
        this.viewer.setupManipulator();
        this.viewer.getManipulator().computeHomePosition();

        this.changeModel( 'models/ogre.osgjs' );

        this.viewer.run();
    },

    resetHeightAndGui: function () {

        this.ground.setGroundFromModel( this.model );

        this.params.adjustY = this.ground.getNormalizedHeight();
        // Update gui
        for ( var i in this.gui.__controllers )
            this.gui.__controllers[ i ].updateDisplay();
    },
    setModel: function ( model ) {
        // this.modelNode.removeChild(this.model);
        this.scene.removeChild( this.model );

        this.model = model;
        this.resetHeightAndGui();

        // this.modelNode.addChild(this.model);
        this.scene.addChild( this.model );

        this.viewer.getManipulator().computeHomePosition();
    },
    changeModel: ( function () {

        var models = [];

        return function ( url, model ) {

            // If no model for this url yet
            if ( !models[ url ] ) {
                // If no model received, load it and return
                if ( !model ) {
                    this.loadModelUrlAsync( url );
                    return;
                }
                // Model received, cache it
                models[ url ] = model;
            }
            // We have the model in cache, so take it
            this.setModel( models[ url ] );

        };
    } )(),

    loadModelUrlAsync: function ( url ) {
        var osg = window.OSG.osg;
        var osgDB = window.OSG.osgDB;
        var self = this;

        osg.log( 'loading ' + url );
        var req = new XMLHttpRequest();
        req.open( 'GET', url, true );
        req.onload = function () {
            new Q( osgDB.parseSceneGraph( JSON.parse( req.responseText ) ) ).then(
                function ( model ) {
                    self.changeModel( url, model );
                }
            );
            osg.log( 'success ' + url );
        };

        req.onerror = function () {
            osg.log( 'error ' + url );
        };
        req.send( null );
    },

};

function colorFloatTo255( color ) {
    return [ color[ 0 ] * 255.0, color[ 1 ] * 255.0, color[ 2 ] * 255.0 ];
}

function color255ToFloat( color ) {
    return [ color[ 0 ] / 255.0, color[ 1 ] / 255.0, color[ 2 ] / 255.0 ];
}

window.addEventListener( 'load', function () {
    var example = new Example();
    example.run();
}, true );
