( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgShader = OSG.osgShader;
    var $ = window.$;

    var uTimeUnif;

    var EarlyZ = function ( shaderProcessor ) {

        if ( EarlyZ.instance )
            return EarlyZ.instance;

        this._shaderProcessor = shaderProcessor;

        this._drawImplementation = osg.RenderBin.prototype.drawImplementation;
        this._earlyZ = false;

        this._stateSet = this.getOrCreateDefaultStateSet();

        var depth = new osg.Depth( 'EQUAL' );
        depth.setWriteMask( false );

        this._stateSetDepthEqual = new osg.StateSet();
        this._stateSetDepthEqual.setAttributeAndModes( depth, osg.StateAttribute.OVERRIDE );

        EarlyZ.instance = this;
        return this;
    };

    EarlyZ.prototype = {

        getOrCreateShaderEarlyZ: function () {

            var vertexShader = this._shaderProcessor.getShader( 'vertex.glsl' );
            var fragmentShader = this._shaderProcessor.getShader( 'fragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexShader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentShader ) );

            return program;
        },

        getOrCreateDefaultStateSet: function () {

            var stateSet = new osg.StateSet();
            stateSet.setAttributeAndModes( this.getOrCreateShaderEarlyZ(), osg.StateAttribute.OVERRIDE );

            stateSet.addUniform( uTimeUnif );

            var cullFace = new osg.CullFace( 'DISABLE' );
            stateSet.setAttributeAndModes( cullFace );



            var alpha = osg.Uniform.createInt1( 1, 'uAlpha' );
            stateSet.addUniform( alpha );

            stateSet.setAttributeAndModes( new osg.Depth( 'LESS' ), osg.StateAttribute.OVERRIDE );
            // disable it to debug and see ff00ff color if bad depth
            stateSet.setAttributeAndModes( new osg.ColorMask( false, false, false, false ), osg.StateAttribute.OVERRIDE );

            return stateSet;

        },

        enable: function () {
            this._earlyZ = true;
            this.hookRenderBin();
        },

        disable: function () {
            this._earlyZ = false;
        },

        setStateSet: function ( stateSet ) {
            this._stateSet = stateSet;
        },

        getStateSet: function () {
            return this._stateSet;
        },

        hookRenderBin: function () {

            // dont hook more than one time
            if ( this._drawImplementation !== osg.RenderBin.prototype.drawImplementation )
                return;

            var numToPop = function ( sg ) {
                var num = 0;

                // need to pop back all statesets and matrices.
                while ( sg ) {
                    if ( sg.stateset ) ++num;
                    sg = sg.parent;
                }

                return num;
            };

            var self = this;

            // change prototype of RenderBin
            osg.RenderBin.prototype.drawImplementation = function ( state, previousRenderLeaf ) {

                var previous = previousRenderLeaf;

                var isTransparent = ( this._sortMode === osg.RenderBin.SORT_BACK_TO_FRONT && this.getBinNumber() === 10 );
                var isRenderStage = this.className() === 'RenderStage';

                if ( self._earlyZ && isTransparent === false && isRenderStage === false ) {

                    // force sorting front to back
                    //this._sortMode = osg.RenderBin.SORT_FRONT_TO_BACK;
                    this.sortFrontToBack();

                    // check where to insert stateSet
                    var num = ( previous ? numToPop( previous._parent ) : 0 );
                    if ( num > 1 ) --num;
                    var insertStateSetPosition = state.getStateSetStackSize() - num;

                    // draw zbuffer only
                    state.insertStateSet( insertStateSetPosition, self._stateSet );
                    previous = self._drawImplementation.call( this, state, previous );
                    state.removeStateSet( insertStateSetPosition );


                    // if the root scene contain the good depth test we could avoid
                    // draw real scene with only z depth equal
                    state.insertStateSet( insertStateSetPosition, self._stateSetDepthEqual );
                    previous = self._drawImplementation.call( this, state, previous );
                    state.removeStateSet( insertStateSetPosition );

                    return previous;

                } else {

                    previous = self._drawImplementation.call( this, state, previous );
                    return previous;
                }

            };
        }

    };


    var Example = function () {

        this._config = {

            enableEarlyZ: false,
            passCountNoise: 2
        };

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

        this._shaderProcessor = new osgShader.ShaderProcessor();
        this._stateSet1 = undefined;
    };


    Example.prototype = {
        init: function () {

            uTimeUnif = osg.Uniform.createFloat1( 0.0, 'uTime' );
            this._earlyZ = new EarlyZ( this._shaderProcessor );

        },
        initDatGUI: function () {

            var gui = new window.dat.GUI();

            var controller;

            controller = gui.add( this._config, 'enableEarlyZ' );
            controller.onChange( this.updateEarlyZ.bind( this ) );

        },

        updateEarlyZ: function () {

            if ( this._config.enableEarlyZ )
                this._earlyZ.enable();
            else
                this._earlyZ.disable();
        },

        // get the model
        getOrCreateModel: function () {

            if ( !this._model ) {

                var size = 10;
                // check osg/Shape.js to see arguements of createTexturedQuadGeometry
                this._model = osg.createTexturedBoxGeometry( 0, 0, 0,
                    size, size, size );
            }

            var node = new osg.MatrixTransform();
            node.addChild( this._model );
            return node;
        },

        readShaders: function () {

            var defer = P.defer();

            var shaderNames = [
                'vertex.glsl',
                'fragment.glsl',
            ];


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
        },

        getOrCreateShader: function () {

            if ( !this._shader ) {

                var vertexshader = this._shaderProcessor.getShader( 'vertex.glsl' );
                var fragmentshader = this._shaderProcessor.getShader( 'fragment.glsl', [
                    '#define GPU_HARD', '#define COUNT ' + this._config[ 'passCountNoise' ]
                ] );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
                this._shader = program;

            }

            return this._shader;
        },


        updateMaterial: function () {

            if ( !this._stateSet )
                return;

            this._stateSet.setAttributeAndModes( this.getOrCreateShader() );

        },

        createScene: function () {

            var UpdateCallback = function ( stateSet ) {
                this._stateSet = stateSet;
            };
            UpdateCallback.prototype = {
                update: function ( node, nv ) {

                    var t = this._stateSet.getUniform( 'uTime' );
                    t.get()[ 0 ] = nv.getFrameStamp().getSimulationTime();
                    t.dirty();

                    return true;
                }
            };

            var node = new osg.Node();

            var alpha = osg.Uniform.createInt1( 1, 'uAlpha' );
            var opaque = osg.Uniform.createInt1( 0, 'uAlpha' );

            // stateAttribute for transparent
            var depth = new osg.Depth();
            var blendFunc = new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' );
            var cullFace = new osg.CullFace( 'DISABLE' );

            var stateSetTranparent = new osg.StateSet();
            stateSetTranparent.setRenderingHint( 'TRANSPARENT_BIN' );
            stateSetTranparent.setAttributeAndModes( blendFunc );
            stateSetTranparent.setAttributeAndModes( cullFace );
            stateSetTranparent.setAttributeAndModes( depth, osg.StateAttribute.PROTECTED );
            stateSetTranparent.addUniform( alpha );


            node.getOrCreateStateSet().addUniform( opaque );

            var nb = 4;

            for ( var k = 0; k < nb; k++ )
                for ( var i = 0; i < nb; i++ )
                    for ( var j = 0; j < nb; j++ ) {

                        var model = this.getOrCreateModel();
                        osg.Matrix.makeTranslate( i * 15, j * 15, k * 15, model.getMatrix() );
                        node.addChild( model );

                        if ( ( j === 1 || i === 1 ) && k === 1 ) {

                            model.setStateSet( stateSetTranparent );

                        } else {
                            model.getOrCreateStateSet().setAttributeAndModes( cullFace );
                            model.getOrCreateStateSet().setRenderingHint( 'OPAQUE_BIN' );
                        }
                    }

            // TODO
            // add also a rtt to demonstrate how to organise scene with rtt and earlyZ



            this._stateSet = node.getOrCreateStateSet();
            this._stateSet.addUniform( uTimeUnif );
            node.addUpdateCallback( new UpdateCallback( this._stateSet ) );
            this.updateMaterial();

            this._scene = node;
            return node;
        },

        run: function ( canvas ) {

            var viewer;
            viewer = new osgViewer.Viewer( canvas, this._osgOptions );
            this._viewer = viewer;
            viewer.init();

            this.readShaders().then( function () {

                this.init();
                var scene = this.createScene();

                viewer.setSceneData( scene );
                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition();

                viewer.run();

            }.bind( this ) );

            this.initDatGUI();
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
