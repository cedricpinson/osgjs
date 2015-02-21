( function () {

    'use strict';

    window.OSG.globalify();

    var osg = window.osg;

    var TemporalAttribute = window.TemporalAttribute;

    //http://www.ben-peck.com/articles/halton/
    var halton = function ( index, base ) {
        var result = 0.0;
        var f = 1.0 / base;
        var i = index;
        while ( i > 0 ) {
            result = result + f * ( i % base );
            i = Math.floor( i / base );
            f = f / base;
        }

        return result;
    };

    // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
    var radicalInverseVdC = function ( a ) {
        a = ( a << 16 | a >>> 16 ) >>> 0;
        a = ( ( a & 1431655765 ) << 1 | ( a & 2863311530 ) >>> 1 ) >>> 0;
        a = ( ( a & 858993459 ) << 2 | ( a & 3435973836 ) >>> 2 ) >>> 0;
        a = ( ( a & 252645135 ) << 4 | ( a & 4042322160 ) >>> 4 ) >>> 0;
        return ( ( ( a & 16711935 ) << 8 | ( a & 4278255360 ) >>> 8 ) >>> 0 ) / 4294967296;
    };

    var ssaaEffect = {

        name: 'SSAA',

        getInputTexture: function () {
            return ( this._helper._currentFrame % 2 === 0 ) ? this._sceneTexture2 : this._sceneTexture;
        },
        getOutputTexture: function () {
            return ( this._helper._currentFrame % 2 === 0 ) ? this._sceneTexture : this._sceneTexture2;
        },
        getRootNode: function () {
            return this._effectRoot;
        },
        getCamera: function () {
            return ( this._helper._currentFrame % 2 === 0 ) ? this._cameraRTT : this._cameraRTT2;
        },

        updateCamera: function ( projection, view ) {
            osg.Matrix.copy( projection, this._cameraRTT.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT.getViewMatrix() );
            osg.Matrix.copy( projection, this._cameraRTT2.getProjectionMatrix() );
            osg.Matrix.copy( view, this._cameraRTT2.getViewMatrix() );
        },

        update: function () {

            var numSSAA = 4096;
            var numCol = 64;

            if ( !this._helper._doAnimate ) {
                this._helper._currentFrameSinceStop++;
                if ( this._helper._currentFrameSinceStop ) {
                    if ( this._helper._currentFrameSinceStop > numSSAA ) {
                        this._helper._currentFrameSinceStop = numSSAA;
                    }
                }
            } else {
                this._helper._currentFrameSinceStop = 0;
            }

            var frameNum = this._helper._currentFrameSinceStop;
            if ( frameNum >= 1 ) {

                //this._helper.sampleXUnif.set( halton( frameNum - 1, 2 ) );
                //this._helper.sampleYUnif.set( halton( frameNum - 1, 3 ) );

                //this._helper.sampleXUnif.set( frameNum / numSSAA );
                //this._helper.sampleYUnif.set( radicalInverseVdC( frameNum ) );

                var xSample = frameNum % numCol;
                var ySample = ( frameNum - xSample );

                this._helper.sampleXUnif.set( xSample / numCol );
                this._helper.sampleYUnif.set( ySample / numSSAA );

            }
            this._helper.frameNumUnif.set( frameNum );

            this.nodeFlip();

        },
        nodeFlip: function () {

            // should be composer node switching,
            // but it's a mess.
            //var sceneTexture, sceneTexture2;

            //currentCameraComposerEffect;

            if ( this._helper._currentFrame % 2 === 0 ) {
                if ( this._effectRoot.hasChild( this._commonNode ) ) this._effectRoot.removeChild( this._commonNode );
                if ( !this._effectRoot.hasChild( this._commonNode2 ) ) this._effectRoot.addChild( this._commonNode2 );
            } else {
                if ( this._effectRoot.hasChild( this._commonNode2 ) ) this._effectRoot.removeChild( this._commonNode2 );
                if ( !this._effectRoot.hasChild( this._commonNode ) ) this._effectRoot.addChild( this._commonNode );
            }
        },

        createScene: function () {

            //////////////////////////////
            // create First RTTed Scene for ping pong
            var result2 = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode2 = result2[ 0 ];
            this._sceneTexture2 = result2[ 1 ];
            this._sceneTexture2.preventDiffuseAcc = true;
            this._cameraRTT2 = result2[ 2 ];

            //////////////////////////////////////////////
            // render Second RTTed Scene for ping pong
            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, false );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._sceneTexture.preventDiffuseAcc = true;
            this._cameraRTT = result[ 2 ];

        },

        buildComposer: function ( helper ) {
            this._helper = helper;
            this.createScene();

            this._temporalAttribute = new TemporalAttribute();
            this._temporalAttribute.setAttributeEnable( true );


            var st;
            st = this._cameraRTT.getOrCreateStateSet();

            st.setTextureAttributeAndModes( 2, this._sceneTexture2, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 2, 'Texture2' ) );

            st = this._cameraRTT2.getOrCreateStateSet();
            st.setTextureAttributeAndModes( 2, this._sceneTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            st.addUniform( osg.Uniform.createInt1( 2, 'Texture2' ) );


            this._effectRoot = new osg.Node();
            this._effectRoot.getOrCreateStateSet().setAttributeAndModes( this._temporalAttribute, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );

            this._effectRoot.getOrCreateStateSet().setShaderGeneratorName( 'custom' );
            this._effectRoot.addChild( this._commonNode );
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };

    var tssaaInf = osg.objectInherit( ssaaEffect, {

        name: 'TSSAA ∞ (Halton)',


        update: function () {

            if ( true || !this._helper._doAnimate ) {
                this._helper._currentFrameSinceStop++;
            } else {
                this._helper._currentFrameSinceStop = 0;
            }

            var frameNum = this._helper._currentFrameSinceStop;
            if ( frameNum >= 1 ) {

                this._helper.sampleXUnif.set( halton( frameNum - 1, 4 ) );
                this._helper.sampleYUnif.set( halton( frameNum - 1, 3 ) );


            }
            this._helper.frameNumUnif.set( frameNum );
            this.nodeFlip();

        }
    } );
    window.postScenes.push( tssaaInf );

    var tssaa64Hammersley = osg.objectInherit( ssaaEffect, {

        name: 'TSSAAx64 (Hammersley)',

        numSSAA: 4096,
        numCol: 64,

        update: function () {

            if ( !this._helper._doAnimate ) {
                this._helper._currentFrameSinceStop++;
                if ( this._helper._currentFrameSinceStop ) {
                    if ( this._helper._currentFrameSinceStop > this.numSSAA ) {
                        this._helper._currentFrameSinceStop = this.numSSAA;
                    }
                }
            } else {
                this._helper._currentFrameSinceStop = 0;
            }

            var frameNum = this._helper._currentFrameSinceStop;
            if ( frameNum >= 1 ) {
                this._helper.sampleXUnif.set( frameNum / this.numSSAA );
                this._helper.sampleYUnif.set( radicalInverseVdC( frameNum ) );
            }
            this._helper.frameNumUnif.set( frameNum );
            this.nodeFlip();

        }
    } );
    window.postScenes.push( tssaa64Hammersley );

    var tssaa64 = osg.objectInherit( ssaaEffect, {

        name: 'TSSAAx64',
        numSSAA: 4096,
        numCol: 64,

        update: function () {

            if ( !this._helper._doAnimate ) {
                this._helper._currentFrameSinceStop++;
                if ( this._helper._currentFrameSinceStop ) {
                    if ( this._helper._currentFrameSinceStop > this.numSSAA ) {
                        this._helper._currentFrameSinceStop = this.numSSAA;
                    }
                }
            } else {
                this._helper._currentFrameSinceStop = 0;
            }

            var frameNum = this._helper._currentFrameSinceStop;
            if ( frameNum >= 1 ) {
                var xSample = frameNum % this.numCol;
                var ySample = ( frameNum - xSample );

                this._helper.sampleXUnif.set( xSample / this.numCol );
                this._helper.sampleYUnif.set( ySample / this.numSSAA );
            }
            this._helper.frameNumUnif.set( frameNum );
            this.nodeFlip();

        }
    } );
    window.postScenes.push( tssaa64 );

    var tssaa16 = osg.objectInherit( tssaa64, {

        name: 'TSSAAx16',
        numSSAA: 256,
        numCol: 16

    } );
    window.postScenes.push( tssaa16 );

    var tssaa4 = osg.objectInherit( tssaa64, {

        name: 'TSSAAx4',
        numSSAA: 16,
        numCol: 4

    } );
    window.postScenes.push( tssaa4 );

    var tssaaInfHDR = osg.objectInherit( tssaaInf, {

        name: 'TSSAA ∞ (HDR)',


        createScene: function () {

            //////////////////////////////
            // create First RTTed Scene for ping pong
            var result2 = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, true );
            this._commonNode2 = result2[ 0 ];
            this._sceneTexture2 = result2[ 1 ];
            this._cameraRTT2 = result2[ 2 ];

            //////////////////////////////////////////////
            // render Second RTTed Scene for ping pong
            var result = this._helper.commonScene( this._helper._rttSize, osg.Camera.PRE_RENDER, this._helper._model, true );
            this._commonNode = result[ 0 ];
            this._sceneTexture = result[ 1 ];
            this._cameraRTT = result[ 2 ];

        }

    } );

    window.postScenes.push( tssaaInfHDR );
} )();
