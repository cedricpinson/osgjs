( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgShader = OSG.osgShader;
    var $ = window.$;
    var ExampleOSGJS = window.ExampleOSGJS;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var Example = function () {

        ExampleOSGJS.call( this );

        this._shaderPath = 'shaders';

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        readShaders: function () {
            return P.resolve( true );
            var defer = P.defer();

            var shaderNames = [
                'vertex.glsl',
                'fragment.glsl'
            ];


            var shaders = shaderNames.map( function ( arg ) {
                return this._shaderPath + arg;
            }.bind( this ) );


            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( P.resolve( $.get( shader ) ) );
            } );


            P.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );

                shaderProcessor.addShaders( shaderNameContent );

                defer.resolve();

            } );

            return defer.promise;
        },

        createScene: function () {
            osgDB.readNodeURL( 'model/file.osgjs' ).then( function ( node ) {
                this._root.addChild( node );
            }.bind( this ) );
        },

        run: function () {

            this.readShaders().then( function () {
                ExampleOSGJS.prototype.run.call( this );
            }.bind( this ) );

        }

    } );

    window.addEventListener( 'load', function () {

        var example = new Example();
        example.run();
        window.example = example;

    }, true );

} )();
