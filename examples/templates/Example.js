( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var $ = window.$;


    var Example = function () {
        // documented here for classes that will inherits
        // so that we have a shared common set of variables


        // user Config:
        // - overriden by user param on url: see setConfigFromOptionsURL
        // - used for the GUI tweak: see initDatGui
        this._config = {

        };

        // resources to load prior calling Example:run
        this._texturesNames = [];
        this._meshNames = [];
        this._shaderNames = [];
        this._renderTextures = [];

        // defines
        this._mediaPath = '../media/';

        // main variables

        this._viewer = undefined;
        this._gui = undefined;
        this._shaderProcessor = undefined;
        this._root = undefined;
        this._canvas = undefined;


    };

    Example.prototype = {

        run: function () {

            // get url parameter to override default _config values
            this.setConfigFromOptionsURL();
            //
            this._canvas = document.getElementById( 'View' );

            this._viewer = new osgViewer.Viewer( this._canvas );
            this._viewer.init();
            this._viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            this._viewer.setupManipulator();

            // add all nodes under this._root
            this.createScene();
            // add a Gui and its controller
            this.initDatGUI();

            // basic setup
            this._viewer.setSceneData( this._root );
            this._viewer.getManipulator().computeHomePosition();


            // TODO: only run after textures and shaders loaded ?
            this._viewer.run();
        },

        initDatGUI: function () {

            this._gui = new window.dat.GUI();

        },

        setConfigFromOptionsURL: function () {

            // default & change config with URL params
            var queryDict = {};
            window.location.search.substr( 1 ).split( '&' ).forEach( function ( item ) {
                queryDict[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ];
            } );
            var keys = Object.keys( queryDict );
            for ( var i = 0; i < keys.length; i++ ) {
                var property = keys[ i ];
                this._config[ property ] = queryDict[ property ];
            }
        },

        readTextures: function ( textures ) {

            var textureNames = textures || this._textureNames;
            var path = this._mediaPath + 'textures/';

            // generate array of paths
            var paths = textureNames.map( function ( name ) {
                return path + name;
            } );

            // generate array of promise
            var images = paths.map( function ( path ) {
                return osgDB.readImageURL( path );
            } );

            return images;

            // wait for all images
            //P.all( images ).then( function ( args ) {}

        },

        readShaders: function ( shadersFilenames ) {

            this._shaderProcessor = new osgShader.ShaderProcessor();

            var defer = P.defer();
            var shaderNames = shadersFilenames || this._shaderNames;
            var shaders = shaderNames.map( function ( arg ) {
                return arg;
            }.bind( this ) );


            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( P.resolve( $.get( shader ) ) );
            }.bind( this ) );

            P.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );

                this._shaderProcessor.addShaders( shaderNameContent );

                defer.resolve();

            }.bind( this ) );

            return defer.promise;

            // wait for shaders:
            // this.readShaders.then(function(){ this.run(); }.bind(this))
        },

        // create a shader program from both VS and FS fetched inside shaderprocessor
        createShader: function ( vName, vDefines, fName, fDefines ) {

            var vertexshader = this._shaderProcessor.getShader( vName, vDefines );
            var fragmentshader = this._shaderProcessor.getShader( fName, fDefines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
            return program;
        },

        // get the model

        getOrCreateModel: function ( modelName ) {

            if ( !this._model ) {
                this._model = new osg.MatrixTransform();
            } else {
                this._model.removeChildren();
            }
            if ( modelName ) {

                // TODO: a generic model loader that fills also the Dat.gui

                // ../media/models/animation/' + modelName ?
                var request = osgDB.readNodeURL( modelName );
                request.then( function ( node ) {

                    this._model.addChild( node );

                } );
            } else {

                var size = 10;
                var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
                    size, size, size );
                this._model.addChild( geom );

            }

            return this._model;
        },


        createScene: function () {

            // the root node
            this._root = new osg.Node();

            // create the model
            var model = this.getOrCreateModel();

            this._root.addChild( model );

            return this._root;
        }

    };

    window.ExampleOSGJS = Example;
} )();
