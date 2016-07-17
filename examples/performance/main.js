( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    // globals
    var P = window.P;
    var $ = window.$;

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgShader = OSG.osgShader;
    var osgUtil = OSG.osgUtil;

    // we create a Callback
    var FPSUpdateCallback = function ( config ) {
        this._config = config;
    };
    FPSUpdateCallback.prototype = {
        update: function ( node, nv ) {

            var currentTime = 1000.0 * nv.getFrameStamp().getDeltaTime();
            var frameNumber = nv.getFrameStamp().getFrameNumber();
            if ( frameNumber % 60 === 1 ) {
                this._config.ms = currentTime;
            } else {
                this._config.ms += ( currentTime - this._config.ms ) / frameNumber;
            }
            this._config.fps = 1000.0 / currentTime;

            //
            node.traverse( nv );
        }
    };

    // inherits for the ExampleOSGJS prototype
    var Example = function () {

        ExampleOSGJS.call( this );

        var that = this;
        this._config = {
            items: 4,
            deep: 2,
            quadSize: 1,
            instance: false,
            texture: true,
            textureSize: 512,
            numTextures: 1,
            shaderComplexity: 0,
            nbTotalItems: 0,
            nbTotalNodes: 0,
            ms: 0.0,
            fps: 0.0,

            update: function () {
                that._rootItems.removeChildren();
                that._rootItems.addChild( that.createItems( that._config.deep ) );
            },

            frustumCulling: function () {
                that._viewer.getCamera().setEnableFrustumCulling( !that._viewer.getCamera().getEnableFrustumCulling() );

            }
        };

        this._mediaPath = '';
        this._textureNames = [ 'texture.png' ];
        this._shaderNames = [];

        this._texture = [];
        this._contextTexture = [];
        this._canvasTexture = [];

    };


    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {


        createItem: function () {

            var item;
            if ( this._config.instance && this._item ) {

                item = this._item;

            } else {

                var quadSizeX = this._config.quadSize;
                var quadSizeY = quadSizeX * 9 / 16.0;
                item = osg.createTexturedQuadGeometry( -quadSizeX / 2.0, -quadSizeY / 2.0, 0, quadSizeX, 0, 0, 0, quadSizeY, 0 );

            }

            if ( this._config.texture ) {

                var tex = this.getTexture();
                if ( tex ) {
                    item.getOrCreateStateSet().setTextureAttributeAndModes( 0, tex );
                }

            }

            return item;
        },

        getTexture: function () {

            var numTex = this._config.numTextures;
            if ( !this._config.texture || numTex === 0 ) return undefined;
            if ( this._texture.length === numTex ) return this._texture[ Math.floor( Math.random() * numTex ) ];

            var texture = new osg.Texture();

            var size = this._config.textureSize;

            var canvasTexture = document.createElement( 'canvas' );
            canvasTexture.width = size;
            canvasTexture.height = size;

            var contextTexture = canvasTexture.getContext( '2d' );
            contextTexture.clearRect( 0, 0, size, size );
            //contextTexture.textAlign = "center";
            contextTexture.fillStyle = 'black';
            contextTexture.fillRect( 0, 0, size, size );

            contextTexture.font = ( size * 0.50 ) + 'px Arial';
            contextTexture.fillStyle = 'red';
            contextTexture.fillText( size + '', 0, size / 2.0 );

            texture.setTextureSize( size, size );
            texture.setMinFilter( 'LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            texture.setImage( canvasTexture );

            this._texture.push( texture );
            this._contextTexture.push( contextTexture );
            this._canvasTexture.push( canvasTexture );

            return texture;

        },

        createItems: function ( deep ) {

            var scale = Math.pow( 2, deep - 1 );

            var root = new osg.MatrixTransform();
            var nbx = this._config.items;
            var nby = Math.floor( nbx * 9 / 16.0 );
            if ( deep === this._config.deep ) {

                this._config.nbTotalItems = 0;
                this._config.nbTotalNodes = 0;


                // root of the tree.
                this._texture = [];
                this._contextTexture = [];
                this._canvasTexture = [];

                if ( this._config.instance ) {

                    // recreate at update
                    this._item = this.createItem();
                    this._config.nbTotalItems += 1;
                }

            } else if ( deep === 0 ) {

                if ( !this._config.instance ) {
                    this._config.nbTotalItems += nbx * nby;
                }
                this._config.nbTotalNodes += nbx * nby;

            }





            for ( var i = 0, l = nbx; i < l; i++ ) {
                for ( var j = 0, m = nby; j < m; j++ ) {

                    var mt = new osg.MatrixTransform();
                    var x, y;
                    if ( deep === 0 ) {

                        x = ( -nbx * 0.5 + 0.5 + i ) * 1.1;
                        y = ( -nby * 0.5 + 0.5 + j ) * 1.1;

                        osg.Matrix.makeTranslate( x, y, 0, mt.getMatrix() );
                        mt.addChild( this.createItem() );

                    } else {
                        var s = nbx * deep * scale * 1.1;
                        x = ( -nbx * 0.5 + 0.5 + i ) * ( s );
                        y = ( -nby * 0.5 + 0.5 + j ) * ( s * 9 / 16.0 );
                        //osg.log([x,y]);
                        osg.Matrix.makeTranslate( x, y, 0, mt.getMatrix() );
                        mt.addChild( this.createItems( deep - 1 ) );
                    }

                    root.addChild( mt );

                }
            }
            return root;
        },

        initDatGUI: function () {

            this._gui = new window.dat.GUI();

            // ui
            this._gui.add( this._config, 'items', 1, 10 ).step( 1 );
            this._gui.add( this._config, 'deep', 1, 5 ).step( 1 );
            this._gui.add( this._config, 'quadSize', 1, 20 ).step( 1 );
            this._gui.add( this._config, 'instance' );

            this._gui.add( this._config, 'texture' );
            this._gui.add( this._config, 'textureSize', [ '64', '128', '256', '512', '1024', '2048', '4096' ] );
            this._gui.add( this._config, 'numTextures', 0, 60 ).step( 1 );;

            //button            
            this._gui.add( this._config, 'update' );
            this._gui.add( this._config, 'frustumCulling' );
            //this._gui.add( this._config, 'postProc' );
            //this._gui.add( this._config, 'scissor' );

            // auto updated info
            this._gui.add( this._config, 'nbTotalItems' ).listen();
            this._gui.add( this._config, 'nbTotalNodes' ).listen();
            this._gui.add( this._config, 'fps' ).listen();
            this._gui.add( this._config, 'ms' ).listen();

        },

        getOrCreateModel: function () {


            this._rootItems = new osg.Node();

            this._rootItems.setUpdateCallback( new FPSUpdateCallback( this._config ) );

            this._rootItems.addChild( this.createItems( this._config.deep ) );

            return this._rootItems;
        }

    } );


    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
