'use strict';

var OSG = window.OSG;
var osgViewer = OSG.osgViewer;
var osg = OSG.osg;
var osgUtil = OSG.osgUtil;
var osgDB = OSG.osgDB;

var Example = function () {};

Example.prototype = {

    // the root node
    scene: undefined,
    model: undefined,
    ground: new osgUtil.Ground(),
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

        // this.scene.addChild( this.getCubeMap() );
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

        var modelController = this.gui.add( this.params, 'model', [ 'ogre', 'bob', 'shark', 'pokerscene', 'ubuntu_edge' ] );
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

    createCubeMap: function ( size, scene ) {
        // create the environment sphere
        var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
            size, size, size );
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        geom.getOrCreateStateSet().setAttributeAndModes( this.getShaderBackground() );

        var cubemapTransform = osg.Uniform.createMatrix4( osg.Matrix.create(), 'CubemapTransform' );

        var mt = new osg.MatrixTransform();
        mt.setMatrix( osg.Matrix.makeRotate( -Math.PI / 2.0, 1, 0, 0, [] ) );
        mt.addChild( geom );

        var CullCallback = function () {
            this.cull = function ( node, nv ) {
                // overwrite matrix, remove translate so environment is always at camera origin
                osg.Matrix.setTrans( nv.getCurrentModelviewMatrix(), 0, 0, 0 );
                var m = nv.getCurrentModelviewMatrix();
                osg.Matrix.copy( m, cubemapTransform.get() );
                cubemapTransform.dirty();
                return true;
            };
        };
        mt.setCullCallback( new CullCallback() );

        var cam = new osg.Camera();

        cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        // cam.setRenderOrder(osg.Camera.PRE_RENDER, 0);
        cam.addChild( mt );

        var self = this;
        // the update callback get exactly the same view of the camera
        // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
        var UpdateCallback = function () {
            this.update = function ( node, nv ) {
                var rootCam = self.viewer.getCamera();
                var info = {};
                osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                var proj = [];
                osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 1000.0, proj );
                cam.setProjectionMatrix( proj );
                cam.setViewMatrix( rootCam.getViewMatrix() );

                return true;
            };
        };

        cam.setUpdateCallback( new UpdateCallback() );

        scene.addChild( cam );

        return geom;
    },


    getShaderBackground: function () {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            'void main(void) {',
            '  osg_FragVertex = Vertex;',
            '  osg_TexCoord0 = TexCoord0;',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform samplerCube Texture0;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            'void main(void) {',
            '  vec3 eye = -normalize(osg_FragVertex);',
            '  gl_FragColor = textureCube(Texture0, eye);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    },
    getCubeMap: function () {

        var size = 250;

        var group = new osg.Node();
        var background = this.createCubeMap( size, group );

        Q.all( [
            osgDB.readImage( '../cubemap/textures/posx.jpg' ),
            osgDB.readImage( '../cubemap/textures/negx.jpg' ),

            osgDB.readImage( '../cubemap/textures/posy.jpg' ),
            osgDB.readImage( '../cubemap/textures/negy.jpg' ),

            osgDB.readImage( '../cubemap/textures/posz.jpg' ),
            osgDB.readImage( '../cubemap/textures/negz.jpg' )
        ] ).then( function ( images ) {

            var texture = new osg.TextureCubeMap();

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_X', images[ 0 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_X', images[ 1 ] );

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Y', images[ 3 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Y', images[ 2 ] );

            texture.setImage( 'TEXTURE_CUBE_MAP_POSITIVE_Z', images[ 4 ] );
            texture.setImage( 'TEXTURE_CUBE_MAP_NEGATIVE_Z', images[ 5 ] );

            texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );

            background.getOrCreateStateSet().setTextureAttributeAndMode( 0, texture );
            background.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
        } );

        return group;
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
