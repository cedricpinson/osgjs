window.ModelLoader = ( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;

    var ModelLoader = function ( path, options ) {
        this._options = options || {};
        this._path = path;
        this._node = new osg.MatrixTransform();
    };

    ModelLoader.prototype = {

        createTexture: function () {
            var texture = new osg.Texture();
            texture.setWrapS( 'REPEAT' );
            texture.setWrapT( 'REPEAT' );
            return texture;
        },

        getNode: function () {
            return this._node;
        },

        readImage: function ( file ) {
            return osgDB.readImageURL( this._path + file );
        },

        setTexture: function ( image, node, unit ) {
            var texture = this.createTexture();
            texture.setImage( image );
            node.getOrCreateStateSet().setTextureAttributeAndModes( unit, texture );
        },

        load: function () {

            var d = P.defer();
            // read config file
            var p = P.resolve( $.get( this._path + 'config.json' ) );

            p.then( function ( config ) {

                this._config = config;

                var ready = [];
                var modelPromise = osgDB.readNodeURL( this._path + config.file );
                ready.push( modelPromise );


                modelPromise.then( function ( node ) {
                    this._node.addChild( node );
                }.bind( this ) );

                // handle diffuse
                if ( config.albedo ) {

                    this._albedo = this.readImage( config.albedo.file );
                    ready.push( this._albedo );

                    P.all( [ this._albedo, modelPromise ] ).then( function ( args ) {
                        this.setTexture( args[ 0 ], args[ 1 ], window.ALBEDO_TEXTURE_UNIT );
                    }.bind( this ) );

                }

                // handle metal
                if ( config.metalness ) {

                    this._metalness = this.readImage( config.metalness.file );
                    ready.push( this._metalness );

                    P.all( [ this._metalness, modelPromise ] ).then( function ( args ) {
                        this.setTexture( args[ 0 ], args[ 1 ], window.METALNESS_TEXTURE_UNIT );
                    }.bind( this ) );

                }


                // handle normal
                if ( config.normal ) {

                    this._normal = this.readImage( config.normal.file );
                    ready.push( this._normal );

                    P.all( [ this._normal, modelPromise ] ).then( function ( args ) {
                        this.setTexture( args[ 0 ], args[ 1 ], window.NORMAL_TEXTURE_UNIT );
                    }.bind( this ) );

                }


                // handle roughness
                if ( config.roughness ) {

                    this._roughness = this.readImage( config.roughness.file );
                    ready.push( this._roughness );

                    P.all( [ this._roughness, modelPromise ] ).then( function ( args ) {
                        this.setTexture( args[ 0 ], args[ 1 ], window.ROUGHNESS_TEXTURE_UNIT );
                    }.bind( this ) );

                }

                if ( config.flipNormalY ) {
                    var flipNormalY = osg.Uniform.createInt1( 1, 'uFlipNormalY' );
                    this._node.getOrCreateStateSet().addUniform( flipNormalY );
                }

                if ( config.rotate ) {
                    osg.Matrix.makeRotate( config.rotate[ 0 ] * Math.PI / 2, config.rotate[ 1 ], config.rotate[ 2 ], config.rotate[ 3 ], this._node.getMatrix() );
                }


                P.all( ready ).then( function () {
                    d.resolve( config );
                } );

            }.bind( this ) );

            return d.promise;
        },

        getConfig: function () {
            return this._config;
        }
    };

    return ModelLoader;
} )();
