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

        readFloatTexture: function ( file ) {

            var defer = P.defer();

            var input = new osgDB.Input();
            input.requestFile( file, {
                responseType: 'arraybuffer'
            } ).then( function ( inputArray ) {

                var data = input._unzipTypedArray( inputArray );

                var imageData = new Float32Array( data );
                var image = new osg.Image();
                image.setImage( imageData );

                image.setWidth( 586 );
                image.setHeight( 574 );

                image.setWidth(  1247 ); //1820 x 2004
                image.setHeight( 1209 );
                // image.setWidth( 470 ); // 470 x  386
                // image.setHeight( 386 );

                var texture = new osg.Texture();
                texture.setImage( image, 'RGBA' );
                texture.setInternalFormatType( 'FLOAT' );

                defer.resolve( texture );

            }.bind( this ) );

            return defer.promise;
        },

        createScene: function () {

            this.readShaders( [
                'shaders/vertex.glsl',
                'shaders/fragment.glsl'

            ] ).then( function () {

                var prg = this.createShader( 'shaders/vertex.glsl', undefined, 'shaders/fragment.glsl' );
                osgDB.readNodeURL( 'model/file.osgjs' ).then( function ( node ) {

                    node.getOrCreateStateSet().setAttributeAndModes( prg );
                    node.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'normalMap' ) );
                    this.readFloatTexture( 'model/atlas_0.bin' ).then( function ( texture ) {
                        console.log( 'yeah' );
                        node.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture, osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
                    } );

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
