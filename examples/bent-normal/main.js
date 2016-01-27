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

    var Example = function () {

        ExampleOSGJS.call( this );

        this._shaderPath = 'shaders';

    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        createScene: function () {

            this.readShaders( [
                'shaders/vertex.glsl',
                'shaders/fragment.glsl'

            ] ).then( function () {

                var prg = this.createShader( 'shaders/vertex.glsl', undefined, 'shaders/fragment.glsl' );
                osgDB.readNodeURL( 'model/file.osgjs' ).then( function ( node ) {

                    node.getOrCreateStateSet().setAttributeAndModes( prg );
                    node.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'normalMap' ) );

                    this._root.addChild( node );
                }.bind( this ) );

            }.bind( this ) );

        },

        run: function () {

            ExampleOSGJS.prototype.run.call( this );

        }

    } );

    window.addEventListener( 'load', function () {

        var example = new Example();
        example.run();
        window.example = example;

    }, true );

} )();
