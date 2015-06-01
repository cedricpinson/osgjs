( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgDB = OSG.osgDB;

    /*
        This filter simulate a property of lenses which tends to make
        highly lit areas bleed along its normal borders
    */
    window.getPostSceneBlur = function ( /* sceneTexture*/) {
        var cachedScenes = {};
        var inputTex, hBlur, vBlur;

        var images = [
            osgDB.readImageURL( 'Budapest.jpg' ),
            osgDB.readImageURL( 'Beaumaris.jpg' ),
            osgDB.readImageURL( 'Seattle.jpg' )
        ];

        var imagesLoaded = false;
        P.all( images ).then( function ( images ) {
            getSceneTexture( 'Budapest.jpg', images[ 0 ] );
            getSceneTexture( 'Beaumaris.jpg', images[ 1 ] );
            getSceneTexture( 'Seattle.jpg', images[ 2 ] );
            imagesLoaded = true;
        } );

        var getSceneTexture = function ( sceneFile, image ) {
            if ( cachedScenes[ sceneFile ] === undefined ) {
                if ( image )
                    cachedScenes[ sceneFile ] = osg.Texture.createFromImage( image );
                else
                    cachedScenes[ sceneFile ] = osg.Texture.createFromURL( sceneFile );
            }
            return cachedScenes[ sceneFile ];
        };

        var setSceneTexture = function ( sceneFile ) {
            inputTex.getStateSet().setTextureAttributeAndModes( 0, getSceneTexture( sceneFile ) );
            inputTex.dirty();
        };

        var effect = {

            name: 'Blur',
            type: 'LinearGauss',
            kernelSize: 6,
            currentTexture: 'Budapest.jpg',
            needCommonCube: false,
            finalTexture: undefined,
            quad: undefined,
            composer: undefined,

            doBuildComposer: function () {
                var finalTexture = this.finalTexture;

                /*
            var quad = this.quad;

            var h = finalTexture.getHeight();
            var w = finalTexture.getWidth();

            finalTexture = new osg.Texture();
            finalTexture.setTextureSize( w, h );
            finalTexture.setMinFilter( osg.Texture.LINEAR );
            finalTexture.setMagFilter( osg.Texture.LINEAR );

            // Set the final texture on the quad
            quad.getOrCreateStateSet().setTextureAttributeAndModes( 0, finalTexture );
*/
                inputTex = new osgUtil.Composer.Filter.InputTexture( getSceneTexture( 'Budapest.jpg' ) );
                this.composer.addPass( inputTex );
                switch ( this.type ) {
                case 'LinearGauss':
                    hBlur = new osgUtil.Composer.Filter.HBlur( this.kernelSize );
                    vBlur = new osgUtil.Composer.Filter.VBlur( this.kernelSize );
                    this.composer.addPass( hBlur );
                    this.composer.addPass( vBlur, finalTexture );
                    break;
                case 'Gauss':
                    hBlur = new osgUtil.Composer.Filter.HBlur( this.kernelSize, false );
                    vBlur = new osgUtil.Composer.Filter.VBlur( this.kernelSize, false );
                    this.composer.addPass( hBlur );
                    this.composer.addPass( vBlur, finalTexture );
                    break;
                case 'LinearAverage':
                    hBlur = new osgUtil.Composer.Filter.AverageHBlur( this.kernelSize );
                    vBlur = new osgUtil.Composer.Filter.AverageVBlur( this.kernelSize );
                    this.composer.addPass( hBlur );
                    this.composer.addPass( vBlur, finalTexture );
                    break;
                case 'Average':
                    hBlur = new osgUtil.Composer.Filter.AverageHBlur( this.kernelSize, false );
                    vBlur = new osgUtil.Composer.Filter.AverageVBlur( this.kernelSize, false );
                    this.composer.addPass( hBlur );
                    this.composer.addPass( vBlur, finalTexture );
                    break;
                case 'Bilateral':
                    // need a depth pass
                    hBlur = new osgUtil.Composer.Filter.BilateralHBlur( this.kernelSize );
                    vBlur = new osgUtil.Composer.Filter.BilateralVBlur( this.kernelSize );
                    this.composer.addPass( hBlur );
                    this.composer.addPass( vBlur, finalTexture );
                    break;
                }


                this.composer.build();

            },
            buildIfLoaded: function () {
                if ( !imagesLoaded ) {
                    window.setTimeout( this.buildIfLoaded.bind( this ), 100.0 );
                } else {
                    this.doBuildComposer();
                }
            },
            buildComposer: function ( finalTexture, quad, scene ) {
                this.finalTexture = finalTexture;
                this.quad = quad;
                this.scene = scene;
                this.composer = new osgUtil.Composer();

                this.buildIfLoaded();

                return this.composer;
            },

            buildGui: function ( mainGui ) {

                var folder = mainGui.addFolder( 'Bloom' );
                folder.open();

                var blur = {
                    type: [ 'LinearGauss', 'Gauss', 'LinearAverage', 'Average' ],
                    scene: [ 'Budapest.jpg', 'Beaumaris.jpg', 'Seattle.jpg' ],
                    kernelSize: this.kernelSize
                };

                var sceneCtrl = folder.add( blur, 'scene', blur.scene );
                var typeCtrl = folder.add( blur, 'type', blur.type );
                var kernelSizeCtrl = folder.add( blur, 'kernelSize', 4, 126, 1 ).step( 1 );

                var _self = this;

                kernelSizeCtrl.onChange( function ( value ) {
                    _self.kernelSize = value;
                    hBlur.setBlurSize( value );
                    vBlur.setBlurSize( value );
                } );

                sceneCtrl.onChange( function ( value ) {
                    _self.currentTexture = value;
                    setSceneTexture( value );
                } );
                typeCtrl.onChange( function ( value ) {
                    _self.type = value;

                    _self.scene.removeChild( _self.composer );
                    _self.composer = new osgUtil.Composer();
                    _self.scene.addChild( _self.composer );

                    _self.buildIfLoaded();
                } );
            }
        };

        return effect;

    };
} )();
