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
    var JSZip = window.JSZip;

    var Environment = window.Environment;
    var ModelLoader = window.ModelLoader;

    var PredefinedMaterials = {
        Silver: [ 0.971519, 0.959915, 0.915324 ],
        Aluminium: [ 0.913183, 0.921494, 0.924524 ],
        Gold: [ 1, 0.765557, 0.336057 ],
        Copper: [ 0.955008, 0.637427, 0.538163 ],
        Chromium: [ 0.549585, 0.556114, 0.554256 ],
        Nickel: [ 0.659777, 0.608679, 0.525649 ],
        Titanium: [ 0.541931, 0.496791, 0.449419 ],
        Cobalt: [ 0.662124, 0.654864, 0.633732 ],
        Platinum: [ 0.672411, 0.637331, 0.585456 ]
    };

    var CameraPresets = {
        CameraGold: {
            target: [ 80.0, 0.0, 80.0 ],
            eye: [ 80.0, -155.0, 120.0 ]
        },
        CameraMetal: {
            target: [ 80.0, 0.0, 40.0 ],
            eye: [ 80.0, -155.0, 80.0 ]
        },
        CameraCenter: {
            target: [ 80.0, 0.0, 20.0 ],
            eye: [ 80.0, -215.0, 20.0 ]
        },
        CameraPBR: {
            target: [ 160.0, 0.0, 80.0 ],
            eye: [ 160.0, -100.0, 80.0 ]
        },
        CameraSamples: {
            target: [ 46.0, 20.0, 80.0 ],
            eye: [ 46.0, -62.5, 80.0 ]
        }


    };


    var isMobileDevice = function () {

        if ( navigator.userAgent.match( /Mobile/i ) )
            return true;
        if ( navigator.userAgent.match( /Android/i ) )
            return true;
        if ( navigator.userAgent.match( /iPhone/i ) )
            return true;
        if ( navigator.userAgent.match( /iPad/i ) )
            return true;
        if ( navigator.userAgent.match( /iPod/i ) )
            return true;
        if ( navigator.userAgent.match( /BlackBerry/i ) )
            return true;
        if ( navigator.userAgent.match( /Windows Phone/i ) )
            return true;

        return false;

    };

    var optionsURL = {};
    ( function ( options ) {
        var vars = [],
            hash;
        var indexOptions = window.location.href.indexOf( '?' );
        if ( indexOptions < 0 ) return;

        var hashes = window.location.href.slice( indexOptions + 1 ).split( '&' );
        for ( var i = 0; i < hashes.length; i++ ) {
            hash = hashes[ i ].split( '=' );
            var element = hash[ 0 ];
            vars.push( element );
            var result = hash[ 1 ];
            if ( result === undefined ) {
                result = '1';
            }
            options[ element ] = result;
        }
    } )( optionsURL );


    var linear2Srgb = function ( value, gammaIn ) {
        var gamma = gammaIn;
        if ( !gamma ) gamma = 2.2;
        var result = 0.0;
        if ( value < 0.0031308 ) {
            if ( value > 0.0 )
                result = value * 12.92;
        } else {
            result = 1.055 * Math.pow( value, 1.0 / gamma ) - 0.055;
        }
        return result;
    };

    var PBRWorklowVisitor = function () {

        this._workflow = [];
        osg.NodeVisitor.call( this );

    };

    PBRWorklowVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {

        apply: function ( node ) {
            var data = node.getUserData();

            if ( data && data.pbrWorklow ) {

                var stateSetWorkflow = {
                    stateSet: node.getOrCreateStateSet(),
                    workflow: data.pbrWorklow
                };
                this._workflow.push( stateSetWorkflow );
            }

            this.traverse( node );
        },

        getWorkflows: function () {
            return this._workflow;
        }

    } );

    var shaderProcessor = new osgShader.ShaderProcessor();

    window.ALBEDO_TEXTURE_UNIT = 2;
    window.DIFFUSE_TEXTURE_UNIT = 2;
    window.ROUGHNESS_TEXTURE_UNIT = 3;
    window.METALNESS_TEXTURE_UNIT = 4;
    window.NORMAL_TEXTURE_UNIT = 5;
    window.SPECULAR_TEXTURE_UNIT = 4;

    window.GLTF_PBR_METAL_MODE = 'PBR_metal_roughness';
    window.GLTF_PBR_SPEC_MODE = 'PBR_specular_glossiness';

    window.formatList = [ 'FLOAT', 'RGBE', 'RGBM', 'LUV' ];

    var modelsPBR = [ 'cerberus', 'c3po', 'devastator' ];

    var modelList = [ 'sphere', 'model' ];
    if ( window.useExternalModels ) {
        modelList = modelList.concat( modelsPBR );
    }


    var Example = function () {

        this._gui = new window.dat.GUI();

        this._shaderPath = 'shaders/';

        if ( optionsURL.colorEncoding )
            window.formatList = [ optionsURL.colorEncoding ];

        this._config = {
            envRotation: Math.PI,
            lod: 0.01,
            albedo: '#c8c8c8',
            environmentType: 'cubemapSeamless',
            brightness: 1.0,
            normalAA: Boolean( optionsURL.normalAA ),
            flipY: true,
            specularPeak: Boolean( optionsURL.specularPeak ),
            occlusionHorizon: Boolean( optionsURL.occlusionHorizon ),
            cameraPreset: optionsURL.camera ? Object.keys( CameraPresets )[ optionsURL.camera ] : 'CameraCenter',

            roughness: 0.5,
            material: 'Gold',

            format: window.formatList[ 0 ],
            model: modelList[ 0 ],
            mobile: isMobileDevice()
        };

        if ( window.useExternalModels )
            $( '#model-list' )[ 0 ].innerHTML = 'Cerberus by Andrew Maximov / Devastator by Pasha GubaInsania / C3PO by Christian Hecht / <a href=\'https://github.com/lighttransport/lighttransportequation-orb\'>lighttransportequation orb</a> by Syoyo Fujita';
        else
            $( '#model-list' )[ 0 ].innerHTML = '<a href=\'https://github.com/lighttransport/lighttransportequation-orb\'>lighttransportequation orb</a> by Syoyo Fujita';

        this.updateAlbedo();

        this._uniformHammersleySequence = {};
        this._integrateBRDFTextureUnit = 14;
        this._materialDefines = [];
        this._shaderDefines = [];
        this._modelDefines = [];

        this._modelsLoaded = {};

        this._modelsPBR = [];
        this._modelPBRConfig = [];

        this._environmentTransformUniform = osg.Uniform.createMatrix4( osg.mat4.create(), 'uEnvironmentTransform' );

        this._cubemapUE4 = {};

        this._shaders = [];

        this._currentEnvironment = new Environment();

        // node that will contains models
        this._proxyRealModel = new osg.Node();
        this._proxyRealModel.setName( 'ProxyRealModel' );

        // rotation of the environment geometry
        this._environmentTransformMatrix = undefined;

        this._envBrightnessUniform = osg.Uniform.createFloat1( 1.0, 'uBrightness' );

        this._normalAA = osg.Uniform.createInt1( 0, 'uNormalAA' );
        this._flipYUniform = osg.Uniform.createInt1( 0, 'uFlipNormalY' );
        this._specularPeak = osg.Uniform.createInt1( this._config.specularPeak ? 1 : 0, 'uSpecularPeak' );

        this._occlusionHorizon = osg.Uniform.createInt1( 0, 'uOcclusionHorizon' );

        // background stateSet
        this._backgroundStateSet = new osg.StateSet();

        window.printCurrentCamera = function () {
            var eye = osg.vec3.create();
            var target = osg.vec3.create();
            console.log( 'target ' + this._viewer.getManipulator().getTarget( target ).toString() );
            console.log( 'eye ' + this._viewer.getManipulator().getEyePosition( eye ).toString() );
        }.bind( this );


    };

    Example.prototype = {

        loadGLTFModel: function ( files, gltfFileName, loaded ) {

            var self = this;
            var promise = osgDB.Registry.instance().getReaderWriterForExtension( 'gltf' )
                .readNodeURL( files, {
                    preloaded: loaded
                } );

            promise.then( function ( root ) {

                $( '#loading' ).hide();

                if ( !root )
                    return;

                //osg.mat4.scale( root.getMatrix(), root.getMatrix(), [ 20, 20, 20 ] );

                self._modelsLoaded[ gltfFileName ] = root;

                self._config.model = gltfFileName;
                self.updateModel();

                // Updates the dropdown list
                modelList.push( gltfFileName );

                var controllers = self._gui.__controllers;
                controllers[ controllers.length - 1 ].remove();
                self._gui.add( self._config, 'model', modelList ).onChange( self.updateModel.bind( self ) );

            } );

        },

        loadZipFile: function ( file ) {

            return JSZip.loadAsync( file ).then( function ( zip ) {

                var promisesArray = [];

                Object.keys( zip.files ).forEach( function ( filename ) {

                    var ext = filename.split( '.' ).pop();
                    var type = null;

                    if ( ext === 'gltf' )
                        type = 'string';
                    else if ( ext === 'bin' )
                        type = 'arraybuffer';
                    else if ( ext === 'png' || ext === 'jpg' || ext === 'jpeg' )
                        type = 'base64';

                    if ( !type ) return;

                    var p = zip.files[ filename ].async( type ).then( function ( fileData ) {

                        var data = fileData;
                        var name = filename.split( '/' ).pop();

                        if ( type === 'base64' ) {

                            data = new window.Image();
                            data.src = 'data:image/' + ext + ';base64,' + fileData;

                        }

                        return {
                            name: name,
                            data: data
                        };

                    } );

                    promisesArray.push( p );

                } );

                return P.all( promisesArray );

            } );

        },

        handleDroppedFiles: function ( files ) {

            var gltfFileName = null;
            var self = this;

            $( '#loading' ).show();

            if ( files.length === 1 && files[ 0 ].name.indexOf( '.zip' ) !== -1 ) {

                var loadedFiles = {};

                var p = self.loadZipFile( files[ 0 ] );
                p.then( function ( dataList ) {

                    for ( var i = 0; i < dataList.length; ++i ) {

                        var name = dataList[ i ].name;
                        var data = dataList[ i ].data;

                        if ( name.indexOf( '.gltf' ) !== -1 )
                            gltfFileName = dataList[ i ].name;

                        loadedFiles[ dataList[ i ].name ] = data;

                    }

                    self.loadGLTFModel( loadedFiles, gltfFileName, true );

                } );

                return;

            }

            for ( var i = 0; i < files.length; ++i ) {

                if ( files[ i ].name.indexOf( '.gltf' ) !== -1 ) {

                    gltfFileName = files[ i ].name;
                    break;

                }

            }

            self.loadGLTFModel( files, gltfFileName, false );

            return false;
        },

        loadFiles: function () {

            var self = this;

            var input = $( document.createElement( 'input' ) );
            input.attr( 'type', 'file' );
            input.attr( 'multiple', '' );
            input.trigger( 'click' );
            input.on( 'change', function () {

                self.handleDroppedFiles( this.files );

            } );


            return false;
        },

        setMaterial: function ( stateSet, albedo, roughness, specular ) {

            stateSet.setTextureAttributeAndModes( window.ALBEDO_TEXTURE_UNIT, albedo );
            stateSet.setTextureAttributeAndModes( window.ROUGHNESS_TEXTURE_UNIT, roughness );
            stateSet.setTextureAttributeAndModes( window.METALNESS_TEXTURE_UNIT, specular );

            if ( this._stateSetPBR )
                this.updateShaderPBR();
        },

        getTexture0000: function () {
            if ( !this._texture0000 )
                this._texture0000 = this.createTextureFromColor( [ 0, 0, 0, 1 ] );
            return this._texture0000;
        },

        getTexture1111: function () {
            if ( !this._texture1111 )
                this._texture1111 = this.createTextureFromColor( [ 1, 1, 1, 1 ] );
            return this._texture1111;
        },

        createTextureFromColor: function ( colorArg, srgb, textureOutput ) {
            var colorInput = colorArg;
            var albedo = new osg.Uint8Array( 4 );

            if ( typeof colorInput === 'number' ) {
                colorInput = [ colorInput ];
            }
            var color = colorInput.slice( 0 );

            if ( color.length === 3 )
                color.push( 1.0 );

            if ( color.length === 1 ) {
                color.push( color[ 0 ] );
                color.push( color[ 0 ] );
                color.push( 1.0 );
            }

            color.forEach( function ( value, index ) {
                if ( srgb )
                    albedo[ index ] = Math.floor( 255 * linear2Srgb( value ) );
                else
                    albedo[ index ] = Math.floor( 255 * value );
            } );

            var texture = textureOutput;
            if ( !texture )
                texture = new osg.Texture();
            texture.setTextureSize( 1, 1 );
            texture.setImage( albedo );
            return texture;
        },

        readShaders: function () {

            var defer = P.defer();

            var shaderNames = [
                'math.glsl',
                'cubemapVertex.glsl',
                'cubemapFragment.glsl',
                'cubemapSampler.glsl',
                'panoramaVertex.glsl',
                'panoramaFragment.glsl',
                'panoramaSampler.glsl',

                'pbrReferenceFragment.glsl',
                'pbrReferenceVertex.glsl',
                'colorSpace.glsl',

                'pbr_ue4.glsl',

                'sphericalHarmonics.glsl',
                'sphericalHarmonicsVertex.glsl',
                'sphericalHarmonicsFragment.glsl'

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

        // config = {
        //     normalMap: false,
        //     glossinessMap: false,
        //     specularMap: false
        //     aoMap: false
        // }
        createShaderPBR: function ( config ) {

            var defines = [];

            this._materialDefines.forEach( function ( d ) {
                defines.push( d );
            } );

            this._modelDefines.forEach( function ( d ) {
                defines.push( d );
            } );

            if ( config && config.noTangent === true )
                defines.push( '#define NO_TANGENT' );

            if ( config && config.normalMap === true )
                defines.push( '#define NORMAL' );

            if ( config && config.glossinessMap === true )
                defines.push( '#define GLOSSINESS' );

            if ( config && config.specularMap === true )
                defines.push( '#define SPECULAR' );

            if ( config && config.aoMap === true )
                defines.push( '#define AO' );


            if ( config && config.environmentType === 'cubemapSeamless' ) {
                defines.push( '#define CUBEMAP_LOD ' );
            } else {
                defines.push( '#define PANORAMA ' );
            }

            defines.push( '#define ' + config.format );

            if ( config && config.mobile ) {
                defines.push( '#define MOBILE' );
            }


            if ( !this._shaderCache )
                this._shaderCache = {};

            var hash = defines.join();
            if ( !this._shaderCache[ hash ] ) {

                var vertexshader = shaderProcessor.getShader( 'pbrReferenceVertex.glsl' );
                var fragmentshader = shaderProcessor.getShader( 'pbrReferenceFragment.glsl', defines );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                this._shaderCache[ hash ] = program;

            }

            return this._shaderCache[ hash ];
        },


        updateEnvironmentBrightness: function () {
            var b = this._config.brightness;
            this._envBrightnessUniform.setFloat( b );
        },

        updateNormalAA: function () {
            var aa = this._config.normalAA ? 1 : 0;
            this._normalAA.setInt( aa );
        },

        updateFlipY: function () {

            var flip = this._config.flipY ? 1 : 0;
            this._flipYUniform.setInt( flip );

        },

        updateSpecularPeak: function () {
            var aa = this._config.specularPeak ? 1 : 0;
            this._specularPeak.setInt( aa );
        },

        updateOcclusionHorizon: function () {
            var aa = this._config.occlusionHorizon ? 1 : 0;
            this._occlusionHorizon.setInt( aa );
        },

        updateCameraPreset: function () {
            var preset = CameraPresets[ this._config.cameraPreset ];
            if ( !preset ) {
                preset = CameraPresets[ Object.keys( CameraPresets )[ 0 ] ];
                osg.warn( 'Camera preset not found, use default' );
            }
            this._viewer.getManipulator().setTarget( preset.target );
            this._viewer.getManipulator().setEyePosition( preset.eye );
        },

        updateEnvironmentRotation: function () {
            if ( !this._environmentTransformMatrix )
                return;
            var rotation = this._config.envRotation;
            osg.mat4.fromRotation( this._environmentTransformMatrix, rotation, [ 0, 0, 1 ] );
        },

        createEnvironmentNode: function () {

            var scene = new osg.Node();

            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );

            // to use the same shader panorama
            var geom = osg.createTexturedSphereGeometry( size / 2, 20, 20 );
            var ss = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            geom.setBound( new osg.BoundingBox() );

            ss.setRenderBinDetails( -1, 'RenderBin' );

            var environmentTransform = this._environmentTransformUniform;

            var mt = new osg.MatrixTransform();
            mt.addChild( geom );

            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.mat4.setTranslation( nv.getCurrentModelViewMatrix(), [ 0, 0, 0 ] );
                    var m = nv.getCurrentModelViewMatrix();

                    // add a rotation, because environment has the convention y up
                    var rotateYtoZ = osg.mat4.fromRotation( osg.mat4.create(), Math.PI / 2, [ 1, 0, 0 ] );

                    osg.mat4.mul( environmentTransform.getInternalArray(), m, rotateYtoZ );
                    //osg.mat4.copy( environmentTransform.get() , m );
                    return true;
                };
            };
            mt.setCullCallback( new CullCallback() );
            this._environmentTransformMatrix = mt.getMatrix();

            var cam = new osg.Camera();
            cam.setClearMask( 0x0 );
            cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            cam.addChild( mt );
            cam.setCullCallback( new CullCallback() );


            var self = this;
            // the update callback get exactly the same view of the camera
            // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
            var info = {};
            var proj = [];
            var UpdateCallback = function () {
                this.update = function () {
                    var rootCam = self._viewer.getCamera();

                    osg.mat4.getPerspective( info, rootCam.getProjectionMatrix() );
                    osg.mat4.perspective( proj, Math.PI / 180 * info.fovy, info.aspectRatio, 1.0, 1000.0 );

                    cam.setProjectionMatrix( proj );
                    cam.setViewMatrix( rootCam.getViewMatrix() );

                    return true;
                };
            };
            cam.addUpdateCallback( new UpdateCallback() );

            scene.addChild( cam );
            return scene;
        },

        createModelMaterialSample: function () {

            this._proxyModel = new osg.Node();

            var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );

            request.then( function ( model ) {

                var mt = new osg.MatrixTransform();
                osg.mat4.fromRotation( mt.getMatrix(), -Math.PI / 2, [ 1, 0, 0 ] );
                var bb = model.getBound();
                osg.mat4.mul( mt.getMatrix(), osg.mat4.fromTranslation( osg.mat4.create(), [ 0, -bb.radius() / 2, 0 ] ), mt.getMatrix() );
                mt.addChild( model );

                this._modelMaterial = mt;

                this._proxyModel.addChild( this._modelMaterial );
                this._modelMaterial.setNodeMask( 0 );

                var tangentVisitor = new osgUtil.TangentSpaceGenerator();
                model.accept( tangentVisitor );

            }.bind( this ) );

            this._modelSphere = osg.createTexturedSphereGeometry( 20 / 2, 40, 40 );
            this._proxyModel.addChild( this._modelSphere );

            return request;

        },

        updateModel: function () {
            if ( !this._modelSphere || !this._modelMaterial )
                return;

            this._modelSphere.setNodeMask( 0x0 );
            this._modelMaterial.setNodeMask( 0x0 );
            this._proxyRealModel.setNodeMask( 0x0 );

            var node;
            if ( this._config.model === 'sphere' ) {
                node = this._modelSphere;
            } else if ( this._config.model === 'model' ) {
                node = this._modelMaterial;
            } else {

                var model = null;
                var index = modelsPBR.indexOf( this._config.model );

                if ( this._config.model.indexOf( '.gltf' ) !== -1 ) {

                    model = this._modelsLoaded[ this._config.model ];

                    var visitorWorkflow = new PBRWorklowVisitor();
                    model.accept( visitorWorkflow );

                    var workflows = visitorWorkflow.getWorkflows();
                    for ( var i = 0; i < workflows.length; ++i ) {

                        var specularWorkflow = ( workflows[ i ].workflow === window.GLTF_PBR_SPEC_MODE );

                        var shaderConfig = {
                            normalMap: true,
                            noTangeant: false,
                            glossinessMap: specularWorkflow,
                            specularMap: specularWorkflow
                        };

                        var config = {
                            stateSet: workflows[ i ].stateSet,
                            config: shaderConfig
                        };

                        this._shaders.push( config );
                        this.updateShaderPBR();

                    }

                } else if ( index !== -1 ) {

                    var modelPBR = this._modelsPBR[ index ];
                    if ( modelPBR ) {

                        model = modelPBR.getNode();

                        if ( !this._modelPBRConfig[ index ] ) {
                            this._modelPBRConfig[ index ] = this.registerModel( modelPBR );
                        }
                    }

                }

                if ( model ) {

                    this._proxyRealModel.removeChildren();
                    this._proxyRealModel.addChild( model );
                    node = this._proxyRealModel;

                }

            }

            if ( node ) {
                node.setNodeMask( ~0x0 );
                node.dirtyBound();
                this._viewer.getManipulator().computeHomePosition();
            }
        },


        registerModel: function ( model ) {

            var modelNode = model.getNode();

            var config = {
                stateSet: modelNode.getOrCreateStateSet(),
                config: model.getConfig()
            };

            this._shaders.push( config );
            this.updateShaderPBR();
            return config;
        },


        getModelTestInstance: function () {
            var mt = new osg.MatrixTransform();

            mt.addChild( this._proxyModel );

            return mt;
        },

        updateRowModelsSpecularMetal: function () {
            var specularTexture = this._specularMetalTexture = this.createTextureFromColor( PredefinedMaterials[ this._config.material ], true, this._specularMetalTexture );
            return specularTexture;
        },

        createRowModelsSpecularMetal: function ( nb, offset ) {

            var albedo = this.getTexture0000();

            var specularTexture = this.updateRowModelsSpecularMetal();

            var group = new osg.MatrixTransform();

            for ( var j = 0; j < nb; j++ ) {
                var roughness = j / ( nb - 1 );

                var sample = this.getModelTestInstance();
                var x = roughness * offset;
                osg.mat4.fromTranslation( sample.getMatrix(), [ x, 0, 0 ] );

                var roughnessTexture = this.createTextureFromColor( roughness, false );

                this.setMaterial( sample.getOrCreateStateSet(), albedo, roughnessTexture, specularTexture );
                group.addChild( sample );
            }
            return group;
        },

        updateRowModelsMetalic: function () {
            var roughnessTexture = this._roughnessMetalTexture = this.createTextureFromColor( this._config.roughness, false, this._roughnessMetalTexture );
            return roughnessTexture;
        },

        createRowModelsMetalic: function ( nb, offset ) {

            var albedo = this._albedoTexture;
            var roughnessTexture = this.updateRowModelsMetalic();

            var group = new osg.MatrixTransform();

            for ( var j = 0; j < nb; j++ ) {
                var metal = j / ( nb - 1 );

                var sample = this.getModelTestInstance();
                var x = metal * offset;
                osg.mat4.fromTranslation( sample.getMatrix(), [ x, 0, 0 ] );

                var metalTexture = this.createTextureFromColor( metal, false );

                this.setMaterial( sample.getOrCreateStateSet(), albedo, roughnessTexture, metalTexture );
                group.addChild( sample );
            }
            return group;
        },


        createRowModelsRoughness: function ( nb, offset ) {

            var group = new osg.MatrixTransform();
            var albedo = this._albedoTexture;
            var metal, roughness;
            var metalTexture, roughnessTexture;
            var sample;

            for ( var i = 0; i < 2; i++ ) {

                metal = i;
                metalTexture = this.createTextureFromColor( metal, false );

                for ( var j = 0; j < nb; j++ ) {
                    roughness = j / ( nb - 1 );

                    sample = this.getModelTestInstance();

                    var x = roughness * offset;
                    var y = metal * offset * 0.2;
                    osg.mat4.fromTranslation( sample.getMatrix(), [ x, -y * 1.2, 0 ] );

                    roughnessTexture = this.createTextureFromColor( roughness, false );

                    this.setMaterial( sample.getOrCreateStateSet(), albedo, roughnessTexture, metalTexture );

                    group.addChild( sample );
                }
            }

            return group;
        },

        createSampleModels: function () {

            var nb = 8;
            var offset = 8 * 20;

            var group = new osg.Node();

            var stateSet;
            var config;

            var rowRoughness = this.createRowModelsRoughness( nb, offset );
            stateSet = rowRoughness.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    noTangent: true
                }
            };
            this._shaders.push( config );
            group.addChild( rowRoughness );
            osg.mat4.fromTranslation( rowRoughness.getMatrix(), [ 0, 0, 0 ] );

            var rowMetalic = this.createRowModelsMetalic( nb, offset );
            stateSet = rowMetalic.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    noTangent: true
                }
            };
            this._shaders.push( config );
            group.addChild( rowMetalic );
            osg.mat4.fromTranslation( rowMetalic.getMatrix(), [ 0, 40, 0 ] );

            var rowSpecular = this.createRowModelsSpecularMetal( nb, offset );
            stateSet = rowSpecular.getOrCreateStateSet();
            config = {
                stateSet: stateSet,
                config: {
                    specularMap: true,
                    noTangent: true
                }
            };
            this._shaders.push( config );
            group.addChild( rowSpecular );
            osg.mat4.fromTranslation( rowSpecular.getMatrix(), [ 0, 80, 0 ] );


            this.updateShaderPBR();

            group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace() );
            return group;
        },


        createSampleScene: function () {

            var group = new osg.Node();
            this._mainSceneNode = group;
            // add environment geometry
            var environmentGeometry = this.createEnvironmentNode();
            group.addChild( environmentGeometry );

            this._environmentStateSet = environmentGeometry.getOrCreateStateSet();

            group.addChild( this.createSampleModels() );

            // add node that contains model loaded
            group.addChild( this._proxyRealModel );

            return group;
        },

        createShaderPanorama: function ( defines ) {

            var vertexshader = shaderProcessor.getShader( 'panoramaVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'panoramaFragment.glsl', defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        createShaderCubemap: function ( defines ) {

            var vertexshader = shaderProcessor.getShader( 'cubemapVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'cubemapFragment.glsl', defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;

        },

        updateGlobalUniform: function ( stateSet ) {
            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.addUniform( this._envBrightnessUniform );
            stateSet.addUniform( this._normalAA );
            stateSet.addUniform( this._flipYUniform );
            stateSet.addUniform( this._specularPeak );
            stateSet.addUniform( this._occlusionHorizon );
        },

        setPanorama: function () {

            // set the stateSet of the environment geometry
            this.setSphericalEnv();

            var texture;

            texture = this._currentEnvironment.getPanoramaUE4()[ this._config.format ].getTexture();

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w / 2 ], 'uEnvironmentSize' ) );

            // x4 because the base is for cubemap
            var textures = this._currentEnvironment.getTextures( 'specular_ue4', 'luv', 'panorama' );
            var textureConfig = textures[ 0 ];
            var minTextureSize = textureConfig.limitSize;

            var nbLod = Math.log( w ) / Math.LN2;
            var maxLod = nbLod - Math.log( minTextureSize ) / Math.LN2;

            stateSet.addUniform( osg.Uniform.createFloat2( [ nbLod, maxLod ], 'uEnvironmentLodRange' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironment' ) );

            this.updateGlobalUniform( stateSet );

            stateSet.setTextureAttributeAndModes( 0, texture );

        },

        setCubemapSeamless: function () {

            this.setSphericalEnv();

            var texture = this._currentEnvironment.getCubemapUE4()[ this._config.format ].getTexture();

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();

            var textures = this._currentEnvironment.getTextures( 'specular_ue4', 'luv', 'cubemap' );
            var textureConfig = textures[ 0 ];
            var minTextureSize = textureConfig.limitSize;

            var nbLod = Math.log( w ) / Math.LN2;
            var maxLod = nbLod - Math.log( minTextureSize ) / Math.LN2;

            stateSet.addUniform( osg.Uniform.createFloat2( [ nbLod, maxLod ], 'uEnvironmentLodRange' ) );
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w ], 'uEnvironmentSize' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironmentCube' ) );

            this.updateGlobalUniform( stateSet );

            stateSet.setTextureAttributeAndModes( 0, texture );

        },


        setBackgroundEnvironment: function () {

            // set the stateSet of the environment geometry
            this._environmentStateSet.setAttributeAndModes(
                this.createShaderCubemap( [
                    '#define ' + this._config.format
                ] ) );

            var textureBackground = this._currentEnvironment.getBackgroundCubemap()[ this._config.format ].getTexture();
            var w = textureBackground.getWidth();
            this._environmentStateSet.addUniform( osg.Uniform.createFloat2( [ w, w ], 'uEnvironmentSize' ) );
            this._environmentStateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironmentCube' ) );
            this._environmentStateSet.setTextureAttributeAndModes( 0, textureBackground );

        },

        setSphericalEnv: function () {
            this._environmentStateSet.addUniform( this._currentEnvironment.getSpherical()._uniformSpherical );
        },

        createScene: function () {

            var root = new osg.Node();
            //root.addChild( osg.createAxisGeometry( 50 ) );

            var group = new osg.MatrixTransform();
            root.addChild( group );

            // add lod controller to debug
            this._lod = osg.Uniform.createFloat1( 0.0, 'uLod' );
            group.getOrCreateStateSet().addUniform( this._lod );
            //var flipNormalY = osg.Uniform.createInt1( 0, 'uFlipNormalY' );
            //group.getOrCreateStateSet().addUniform( flipNormalY );

            if ( !isMobileDevice() ) {
                var integrateBRDFUniform = osg.Uniform.createInt1( this._integrateBRDFTextureUnit, 'uIntegrateBRDF' );
                group.getOrCreateStateSet().addUniform( integrateBRDFUniform );
                group.getOrCreateStateSet().setTextureAttributeAndModes( this._integrateBRDFTextureUnit, this._currentEnvironment.getIntegrateBRDF().getTexture() );
            }

            var promises = [];

            // precompute panorama
            P.all( promises ).then( function () {

                group.addChild( this.createSampleScene() );

                this.updateEnvironment();


                //group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

                // y up
                osg.mat4.fromRotation( group.getMatrix(), -Math.PI / 2, [ -1, 0, 0 ] );

                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.ROUGHNESS_TEXTURE_UNIT, 'roughnessMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.NORMAL_TEXTURE_UNIT, 'normalMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.METALNESS_TEXTURE_UNIT, 'specularMap' ) );
                //                group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.SPECULAR_TEXTURE_UNIT, 'specularMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.ALBEDO_TEXTURE_UNIT, 'albedoMap' ) );


                this._viewer.getManipulator().computeHomePosition();
                this.updateCameraPreset();


            }.bind( this ) );

            return root;
        },

        readEnvConfig: function ( file ) {

            var d = P.defer();
            var p = P.resolve( $.get( file ) );

            p.then( function ( text ) {

                var config = text;
                d.resolve( config );

            } );

            return d.promise;
        },

        setEnableInput: function ( enable ) {

            this._viewer.getEventProxy().StandardMouseKeyboard.setEnable( enable );

        },

        run: function ( canvas ) {

            //osgGA.Manipulator.DEFAULT_SETTINGS = osgGA.Manipulator.DEFAULT_SETTINGS | osgGA.Manipulator.COMPUTE_HOME_USING_BBOX;
            var viewer = this._viewer = new osgViewer.Viewer( canvas, {
                preserveDrawingBuffer: true,
                premultipliedAlpha: false
            } );
            viewer.init();

            var gl = viewer.getState().getGraphicContext();
            console.log( gl.getSupportedExtensions() );
            console.log( gl.getExtension( 'OES_texture_float' ) );
            var hasFloatLinear = gl.getExtension( 'OES_texture_float_linear' );
            console.log( hasFloatLinear );
            var hasTextureLod = gl.getExtension( 'EXT_shader_texture_lod' );
            console.log( hasTextureLod );

            var ready = [];

            var environment;
            // environment = 'textures/city_night_reference_2048/';
            environment = 'textures/' + ( optionsURL.env ? optionsURL.env : 'sample_parking' ) + '/';


            //var environment = 'textures/bus_garage5/';
            //var environment = 'textures/walk_of_fame/';
            //var environment = 'textures/airport/';
            //var environment = 'textures/tmp/';

            //var model = new ModelLoader( 'models/cerberus/' );

            var modelPromises = [];
            if ( window.useExternalModels ) {
                modelsPBR.forEach( function ( modelString, index ) {

                    var model = new ModelLoader( 'models/' + modelString + '/' );
                    var promise = model.load();
                    modelPromises.push( promise );
                    promise.then( function () {
                        this._modelsPBR[ index ] = model;
                    }.bind( this ) );

                }.bind( this ) );
            }

            var promise = this.readEnvConfig( environment + 'config.json' );
            promise.then( function ( config ) {

                // adjust format requested from environment config and fallback on LUV
                var formatListEnvironment = {};
                config.textures.forEach( function ( texture ) {
                    formatListEnvironment[ texture.encoding ] = true;
                } );
                formatListEnvironment = Object.keys( formatListEnvironment );
                if ( formatListEnvironment.indexOf( this._config.format.toLowerCase() ) === -1 ) {
                    this._config.format = 'LUV';
                }

                this._currentEnvironment.init( environment, config );

                ready.push( this.readShaders() );
                ready.push( this._currentEnvironment.getPromise() );
                ready.push( this.createModelMaterialSample() );
                ready.push( P.all( modelPromises ) );

                return P.all( ready );

            }.bind( this ) ).then( function () {

                var root = this.createScene();
                viewer.setSceneData( root );

                // this.addModel( model );

                viewer.setupManipulator();
                viewer.getManipulator()._boundStrategy = OSG.osgGA.Manipulator.COMPUTE_HOME_USING_BBOX;
                viewer.getManipulator().computeHomePosition();
                viewer.getManipulator().setComputeBoundNodeMaskOverride( 0x0 );

                viewer.run();

                osg.mat4.perspective( viewer.getCamera().getProjectionMatrix(), Math.PI / 180 * 30, canvas.width / canvas.height, 0.1, 1000 );


                //var gui = new window.dat.GUI();
                var gui = this._gui;

                var controller;

                controller = gui.add( this._config, 'envRotation', -Math.PI, Math.PI ).step( 0.1 );
                controller.onChange( this.updateEnvironmentRotation.bind( this ) );

                controller = gui.add( this._config, 'brightness', 0.0, 25.0 ).step( 0.01 );
                controller.onChange( this.updateEnvironmentBrightness.bind( this ) );

                controller = gui.add( this._config, 'normalAA' );
                controller.onChange( this.updateNormalAA.bind( this ) );

                controller = gui.add( this._config, 'flipY' );
                controller.onChange( this.updateFlipY.bind( this ) );

                controller = gui.add( this._config, 'specularPeak' );
                controller.onChange( this.updateSpecularPeak.bind( this ) );

                controller = gui.add( this._config, 'occlusionHorizon' );
                controller.onChange( this.updateOcclusionHorizon.bind( this ) );

                controller = gui.add( this._config, 'cameraPreset', Object.keys( CameraPresets ) );
                controller.onChange( this.updateCameraPreset.bind( this ) );

                controller = gui.add( this._config, 'lod', 0.0, 15.01 ).step( 0.1 );
                controller.onChange( function ( value ) {
                    this._lod.get()[ 0 ] = value;
                    this._lod.dirty();
                }.bind( this ) );

                controller = gui.add( this._config, 'format', window.formatList );
                controller.onChange( this.updateEnvironment.bind( this ) );

                controller = gui.add( this._config, 'environmentType', [ 'cubemapSeamless', 'panorama' ] );
                controller.onChange( this.updateEnvironment.bind( this ) );

                controller = gui.add( this._config, 'material', Object.keys( PredefinedMaterials ) );
                controller.onChange( this.updateRowModelsSpecularMetal.bind( this ) );

                controller = gui.add( this._config, 'roughness', 0, 1.0 );
                controller.onChange( this.updateRowModelsMetalic.bind( this ) );

                controller = gui.addColor( this._config, 'albedo' );
                controller.onChange( this.updateAlbedo.bind( this ) );

                controller = gui.add( {
                    loadModel: function () {}
                }, 'loadModel' );
                controller.onChange( this.loadFiles.bind( this ) );

                controller = gui.add( this._config, 'model', modelList );
                controller.onChange( this.updateModel.bind( this ) );

                if ( !hasTextureLod )
                    this._config.environmentType = 'panorama';

                if ( !hasFloatLinear )
                    this._config.format = 'LUV';

                this.updateModel();

                // Iterate over all controllers
                for ( var i in gui.__controllers ) {
                    gui.__controllers[ i ].updateDisplay();
                }

            }.bind( this ) );

        },

        updateAlbedo: function () {
            this._albedoTexture = this.createTextureFromColor( this.convertColor( this._config.albedo ), true, this._albedoTexture );
        },

        updateShaderPBR: function () {

            this._shaders.forEach( function ( config ) {

                var stateSet = config.stateSet;

                var shaderConfig = osg.objectMix( {
                    environmentType: this._config.environmentType,
                    format: this._config.format,
                    mobile: this._config.mobile
                }, config.config );

                var program = this.createShaderPBR( shaderConfig );

                stateSet.setAttributeAndModes( program );

            }.bind( this ) );

        },

        updateEnvironment: function () {

            if ( this._config.environmentType === 'cubemapSeamless' ) {
                this.setCubemapSeamless();
            } else {
                this.setPanorama();
            }

            this.setBackgroundEnvironment();
            this.updateEnvironmentRotation();
            this.updateShaderPBR();
        },

        convertColor: function ( color ) {

            var r, g, b;

            // rgb [255, 255, 255]
            if ( color.length === 3 ) {
                r = color[ 0 ];
                g = color[ 1 ];
                b = color[ 2 ];

            } else if ( color.length === 7 ) {

                // hex (24 bits style) '#ffaabb'
                var intVal = parseInt( color.slice( 1 ), 16 );
                r = intVal >> 16;
                g = intVal >> 8 & 0xff;
                b = intVal & 0xff;
            }

            var result = [ 0, 0, 0, 1 ];
            result[ 0 ] = r / 255.0;
            result[ 1 ] = g / 255.0;
            result[ 2 ] = b / 255.0;
            return result;
        }


    };

    var dragOverEvent = function ( evt ) {

        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';

    };

    var dropEvent = function ( evt ) {

        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;

        this.handleDroppedFiles( files );

    };

    window.addEventListener( 'load', function () {

        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );

        $( '#loading' ).hide();

        window.addEventListener( 'dragover', dragOverEvent.bind( example ), false );
        window.addEventListener( 'drop', dropEvent.bind( example ), false );

        var lastMousePosition = {
            x: 0,
        };

        window.addEventListener( 'mousemove', function ( evt ) {

            var button = evt.which || evt.button;

            if ( evt.altKey && button ) {

                evt.stopPropagation();
                var deltaX = evt.clientX - lastMousePosition.x;
                example._config.envRotation += deltaX * 0.01;
                example.updateEnvironmentRotation();

            }

            lastMousePosition.x = evt.clientX;

        }, true );

    }, true );

} )();
