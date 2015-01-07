( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgShader = OSG.osgShader;
    var $ = window.$;


    var EnvironmentPanorama = window.EnvironmentPanorama;
    var EnvironmentCubeMap = window.EnvironmentCubeMap;
    var EnvironmentSphericalHarmonics = window.EnvironmentSphericalHarmonics;
    var IntegrateBRDFMap = window.IntegrateBRDFMap;
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



    var linear2Srgb = function ( value, gamma ) {
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

    var shaderProcessor = new osgShader.ShaderProcessor();

    window.ALBEDO_TEXTURE_UNIT = 2;
    window.DIFFUSE_TEXTURE_UNIT = 2;
    window.ROUGHNESS_TEXTURE_UNIT = 3;
    window.METALNESS_TEXTURE_UNIT = 4;
    window.NORMAL_TEXTURE_UNIT = 5;
    window.SPECULAR_TEXTURE_UNIT = 4;


    var formatList = [ 'FLOAT', 'RGBE', 'RGBM', 'LUV' ];

    var modelsPBR = [ 'cerberus', 'c3po', 'devastator' ];

    var modelList = [ 'sphere', 'model' ].concat( modelsPBR );


    var Environment = function () {
        this._promises = [];
        this._panoramaUE4 = {};
        this._cubemapUE4 = {};
    };

    Environment.prototype = {

        init: function ( environment, config ) {
            this._config = config;

            var ready = this._promises;


            //var spherical = environment + 'spherical';
            var cubemapPackedFloat = environment + 'cubemap_mipmap_float.bin.gz';
            var integrateBRDF = environment + 'brdf.bin.gz';

            //this._cubemapIrradiance = new EnvironmentCubeMap( cubemapIrradiance );
            this._cubemapPackedFloat = new EnvironmentCubeMap( cubemapPackedFloat, config );


            // read all panorama format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                this._panoramaUE4[ key ] = new EnvironmentPanorama( environment + 'panorama_prefilter_' + str + '.bin.gz', config );
                ready.push( this._panoramaUE4[ key ].loadPacked( key ) );

            }.bind( this ) );


            // read all cubemap format U4
            formatList.forEach( function ( key ) {
                var str = key.toLowerCase();
                this._cubemapUE4[ key ] = new EnvironmentCubeMap( environment + 'cubemap_prefilter_' + str + '.bin.gz', config );
                ready.push( this._cubemapUE4[ key ].loadPacked( key ) );

            }.bind( this ) );

            this._integrateBRDF = new IntegrateBRDFMap( integrateBRDF );


            if ( !this._config.shCoefs )
                osg.error( 'cant find shCoefs in environment config' );

            this._spherical = new EnvironmentSphericalHarmonics( config.shCoefs );

            ready.push( this._cubemapPackedFloat.loadPacked() );
            ready.push( this._integrateBRDF.loadPacked() );

            return this.getPromise();
        },

        getPromise: function () {
            return Q.all( this._promises );
        },

        getIntegrateBRDF: function () {
            return this._integrateBRDF;
        },
        getPanoramaUE4: function () {
            return this._panoramaUE4;
        },
        getCubemapUE4: function () {
            return this._cubemapUE4;
        },
        getCubemapMipMapped: function () {
            return this._cubemapPackedFloat;
        },
        getSpherical: function () {
            return this._spherical;
        },
        getCubemapIrradiance: function () {
            return this._cubemapIrradiance;
        },
        getConfig: function () {
            return this._config;
        }

    };

    var Example = function () {
        this._shaderPath = 'shaders/';

        this._config = {
            envRotation: 0.01,
            lod: 0.01,
            albedo: '#bdaaeb',
            nbSamples: 8,
            environmentType: 'cubemapSeamless',

            roughness: 0.5,
            material: 'Gold',

            pbr: 'ImportanceSampling',
            format: formatList[ 0 ],
            model: modelList[ 0 ],
            mobile: isMobileDevice()
        };

        this.updateAlbedo();

        this._uniformHammersleySequence = {};
        this._integrateBRDFTextureUnit = 14;
        this._materialDefines = [];
        this._shaderDefines = [];
        this._modelDefines = [];

        this._modelsPBR = [];
        this._modelPBRConfig = [];

        this._environmentTransformUniform = osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'uEnvironmentTransform' );

        this._cubemapUE4 = {};

        this._shaders = [];

        this._currentEnvironment = new Environment();

        // node that will contains models
        this._proxyRealModel = new osg.Node();

        // rotation of the environment geometry
        this._environmentTransformMatrix = undefined;
    };

    Example.prototype = {

        setPredefineMaterial: function ( stateSet, roughness, name ) {
            var roughnessTexture = this.createTextureFromColor( [ roughness, roughness, roughness, 1.0 ], false );
            if ( !PredefinedMaterials[ name ] ) {
                console.log( 'configuration not gound for material', name );
            }
            var specular = this.createTextureFromColor( PredefinedMaterials[ name ], true );

            this.setMaterial( stateSet, this.getTexture0000(), roughnessTexture, specular );
            this._materialDefines = [ '#define SPECULAR' ];
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

        createTextureFromColor: function ( colorInput, srgb, textureOutput ) {
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

            var defer = Q.defer();

            var shaderNames = [
                'math.glsl',
                'cubemapVertex.glsl',
                'cubemapFragment.glsl',
                'cubemapSampler.glsl',
                'panoramaVertex.glsl',
                'panoramaFragment.glsl',
                'tangentVertex.glsl',
                'tangentFragment.glsl',
                'panoramaSampler.glsl',
                'panoramaDebugFragment.glsl',

                'pbrReferenceFragment.glsl',
                'pbrReferenceVertex.glsl',
                'colorSpace.glsl',

                'pbr.glsl',
                'pbr_ue4.glsl',

                'sphericalHarmonics.glsl',
                'sphericalHarmonicsVertex.glsl',
                'sphericalHarmonicsFragment.glsl',

            ];


            var shaders = shaderNames.map( function ( arg ) {
                return this._shaderPath + arg;
            }.bind( this ) );


            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( Q( $.get( shader ) ) );
            }.bind( this ) );


            Q.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );

                shaderProcessor.addShaders( shaderNameContent );

                defer.resolve();

            }.bind( this ) );

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

            if ( config && config.nbSamples !== undefined )
                defines.push( '#define NB_SAMPLES ' + config.nbSamples );
            else
                defines.push( '#define NB_SAMPLES 8' );

            if ( config && config.environmentType === 'cubemapSeamless' ) {
                defines.push( '#define CUBEMAP_LOD ' );
            } else {
                defines.push( '#define PANORAMA ' );
            }

            defines.push( '#define ' + config.format );

            if ( config && config.pbr === 'UE4' ) {
                defines.push( '#define UE4 ' );
            } else {
                defines.push( '#define IMPORTANCE_SAMPLING ' );
            }

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

        updateEnvironmentRotation: function() {
            if (!this._environmentTransformMatrix)
                return;
            var rotation = this._config.envRotation;
            osg.Matrix.makeRotate( rotation, 0,0,1, this._environmentTransformMatrix );
        },

        createEnvironmentNode: function () {

            var scene = new osg.Node();

            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            var geom = osg.createTexturedSphereGeometry( size / 2, 20, 20 ); // to use the same shader panorama
            var ss = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
            geom.setBound(new osg.BoundingBox() );

            ss.setRenderBinDetails( -1, 'RenderBin' );

            var environmentTransform = this._environmentTransformUniform;

            var mt = new osg.MatrixTransform();
            mt.addChild( geom );

            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.Matrix.setTrans( nv.getCurrentModelViewMatrix(), 0, 0, 0 );
                    var m = nv.getCurrentModelViewMatrix();

                    // add a rotation, because environment has the convention y up
                    var rotateYtoZ = osg.Matrix.makeRotate( -Math.PI / 2, 1, 0, 0, osg.Matrix.create() );

                    osg.Matrix.mult( m, rotateYtoZ, environmentTransform.get() );
                    //osg.Matrix.copy( m, environmentTransform.get() );
                    environmentTransform.dirty();
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
                this.update = function ( /*node, nv*/) {
                    var rootCam = self._viewer.getCamera();

                    osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                    osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 1000.0, proj );
                    cam.setProjectionMatrix( proj );
                    cam.setViewMatrix( rootCam.getViewMatrix() );

                    return true;
                };
            };
            cam.setUpdateCallback( new UpdateCallback() );

            scene.addChild( cam );
            return scene;
        },

        createModelMaterialSample: function () {

            this._proxyModel = new osg.Node();

            var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );

            Q.when( request, function ( model ) {

                var mt = new osg.MatrixTransform();
                osg.Matrix.makeRotate( Math.PI / 2, 1, 0, 0, mt.getMatrix() );
                var bb = model.getBound();
                osg.Matrix.mult( osg.Matrix.makeTranslate( 0, -bb.radius() / 2, 0, osg.Matrix.create() ), mt.getMatrix(), mt.getMatrix() );
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

                var index = modelsPBR.indexOf( this._config.model );
                if ( index !== -1 ) {
                    var modelPBR = this._modelsPBR[ index ];
                    if ( modelPBR ) {
                        this._proxyRealModel.removeChildren();
                        this._proxyRealModel.addChild( modelPBR.getNode() );

                        if ( !this._modelPBRConfig[ index ] ) {
                            this._modelPBRConfig[ index ] = this.registerModel( modelPBR );
                        }
                        node = this._proxyRealModel;
                    }
                }
            }

            if ( node ) {
                node.setNodeMask( ~0x0 );
                node.dirtyBound();
                this._viewer.getManipulator().computeHomePosition( true );
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

            //mt.addChild( osg.createTexturedSphereGeometry( 20 / 2, 40, 40 ) );

            return mt;
        },

        updateRowModelsSpecularMetal: function () {
            var specularTexture = this._specularMetalTexture = this.createTextureFromColor( PredefinedMaterials[ this._config.material ], false, this._specularMetalTexture );
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
                osg.Matrix.makeTranslate( x, 0, 0, sample.getMatrix() );

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
                osg.Matrix.makeTranslate( x, 0, 0, sample.getMatrix() );

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

            if ( false ) {

                metal = 1;
                roughness = 0.3;

                metalTexture = this.createTextureFromColor( metal, false );

                sample = this.getModelTestInstance();

                osg.Matrix.makeTranslate( 0, 0, 0, sample.getMatrix() );

                roughnessTexture = this.createTextureFromColor( roughness, false );

                this.setMaterial( sample.getOrCreateStateSet(), albedo, roughnessTexture, metalTexture );

                group.addChild( sample );


            } else {

                for ( var i = 0; i < 2; i++ ) {

                    metal = i;
                    metalTexture = this.createTextureFromColor( metal, false );

                    for ( var j = 0; j < nb; j++ ) {
                        roughness = j / ( nb - 1 );

                        sample = this.getModelTestInstance();

                        var x = roughness * offset;
                        var y = metal * offset * 0.2;
                        osg.Matrix.makeTranslate( x, 0, y, sample.getMatrix() );

                        roughnessTexture = this.createTextureFromColor( roughness, false );

                        this.setMaterial( sample.getOrCreateStateSet(), albedo, roughnessTexture, metalTexture );

                        group.addChild( sample );
                    }
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
            osg.Matrix.makeTranslate( 0, 0, 0, rowRoughness.getMatrix() );

            if ( false )
                return group;

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
            osg.Matrix.makeTranslate( 0, 40, 0, rowMetalic.getMatrix() );

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
            osg.Matrix.makeTranslate( 0, 80, 0, rowSpecular.getMatrix() );


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

        setPanorama: function () {

            // set the stateSet of the environment geometry
            this.setSphericalEnv();

            var texture;

            if ( this._config.pbr !== 'UE4' ) {
                this.setCubemapSeamless();
                osg.warn( 'Importance sampling works only with cubemap' );
                return;
            }

            texture = this._currentEnvironment.getPanoramaUE4()[ this._config.format ].getTexture();

            var shader = this.createShaderPanorama( [
                '#define PANORAMA',
                '#define ' + this._config.format
            ] );
            this._environmentStateSet.setAttributeAndModes( shader );

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w / 2 ], 'uEnvironmentSize' ) );

            // x4 because the base is for cubemap
            var minTextureSize = this._currentEnvironment.getConfig().specularLimitSize * 4;
            var nbLod = Math.log( w ) / Math.LN2;
            var maxLod = nbLod - Math.log( minTextureSize ) / Math.LN2;

            stateSet.addUniform( osg.Uniform.createFloat2( [ nbLod, maxLod ], 'uEnvironmentLodRange' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironment' ) );

            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.setTextureAttributeAndModes( 0, texture );

        },

        setCubemapSeamless: function () {

            this.setSphericalEnv();

            // if importance sampling use only float
            if ( this._config.pbr !== 'UE4' ) {
                osg.warn( 'Importance sampling only use FLOAT format' );
                this._config.format = 'FLOAT';
            }

            // set the stateSet of the environment geometry
            this._environmentStateSet.setAttributeAndModes(
                this.createShaderCubemap( [ '#define CUBEMAP_LOD',
                    '#define ' + this._config.format,
                ] ) );

            var texture;
            if ( this._config.pbr === 'UE4' ) {
                texture = this._currentEnvironment.getCubemapUE4()[ this._config.format ].getTexture();
            } else {
                texture = this._currentEnvironment.getCubemapMipMapped().getTexture();
            }

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();

            var minTextureSize = this._currentEnvironment.getConfig().specularLimitSize;
            var nbLod = Math.log( w ) / Math.LN2;
            var maxLod = nbLod - Math.log( minTextureSize ) / Math.LN2;

            stateSet.addUniform( osg.Uniform.createFloat2( [ nbLod, maxLod ], 'uEnvironmentLodRange' ) );
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w ], 'uEnvironmentSize' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironmentCube' ) );

            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.setTextureAttributeAndModes( 0, texture );

        },


        setSphericalEnv: function () {
            this._environmentStateSet.addUniform( this._currentEnvironment.getSpherical()._uniformSpherical );
        },

        testSphericalHarmonics: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._currentEnvironment.getSpherical().createDebugGeometry() );
            return group;
        },


        testCubemapIrradiance: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._currentEnvironment.getCubemapIrradiance().createDebugGeometry() );
            return group;
        },

        testCubemapFloatPacked: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._currentEnvironment.getCubemapMipMapped().createFloatCubeMapPackedDebugGeometry() );
            return group;
        },

        createScene: function () {

            var root = new osg.Node();
            //root.addChild( osg.createAxisGeometry( 50 ) );

            var group = new osg.MatrixTransform();
            root.addChild( group );

            // add lod controller to debug
            this._lod = osg.Uniform.createFloat1( 0.0, 'uLod' );
            var flipNormalY = osg.Uniform.createInt1( 0, 'uFlipNormalY' );
            group.getOrCreateStateSet().addUniform( this._lod );
            group.getOrCreateStateSet().addUniform( flipNormalY );

            if ( !isMobileDevice() ) {
                var integrateBRDFUniform = osg.Uniform.createInt1( this._integrateBRDFTextureUnit, 'uIntegrateBRDF' );
                group.getOrCreateStateSet().addUniform( integrateBRDFUniform );
                group.getOrCreateStateSet().setTextureAttributeAndModes( this._integrateBRDFTextureUnit, this._currentEnvironment.getIntegrateBRDF().getTexture() );
            }

            var promises = [];

            // precompute panorama
            Q.all( promises ).then( function () {

                group.addChild( this.createSampleScene() );

                this.updateEnvironment();

                if ( false ) {

                    var offsetX = -60;
                    group.addChild( this.testSphericalHarmonics( offsetX - 30, 30 ) );

                    group.addChild( this.testCubemapFloatPacked( offsetX - 60, -60 ) );

                    //                    group.addChild( this.testCubemapIrradiance( offsetX -60, 30 ) );

                }


                //group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

                // y up
                osg.Matrix.makeRotate( Math.PI / 2, -1, 0, 0, group.getMatrix() );

                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.ROUGHNESS_TEXTURE_UNIT, 'roughnessMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.NORMAL_TEXTURE_UNIT, 'normalMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.METALNESS_TEXTURE_UNIT, 'specularMap' ) );
                //                group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.SPECULAR_TEXTURE_UNIT, 'specularMap' ) );
                root.getOrCreateStateSet().addUniform( osg.Uniform.createInt( window.ALBEDO_TEXTURE_UNIT, 'albedoMap' ) );


                this._viewer.getManipulator().computeHomePosition(true);

            }.bind( this ) );



            return root;

        },

        readEnvConfig: function ( file ) {

            var d = Q.defer();

            var p = Q( $.get( file ) );

            p.then( function ( text ) {
                var config = text;

                d.resolve( config );

            }.bind( this ) );

            return d.promise;
        },

        run: function ( canvas ) {

            //osgGA.Manipulator.DEFAULT_SETTINGS = osgGA.Manipulator.DEFAULT_SETTINGS | osgGA.Manipulator.COMPUTE_HOME_USING_BBOX;
            var viewer = this._viewer = new osgViewer.Viewer( canvas );
            viewer.init();

            var gl = viewer.getState().getGraphicContext();

            console.log( gl.getExtension( 'OES_texture_float' ) );
            var hasFloatLinear = gl.getExtension( 'OES_texture_float_linear' );
            console.log( hasFloatLinear );
            var hasTextureLod = gl.getExtension( 'EXT_shader_texture_lod' );
            console.log( hasTextureLod );

            var ready = [];

            //var environment = 'textures/parking/';
            //var environment = 'textures/path/';
            var environment = 'textures/field/';
            //var environment = 'textures/tmp/';

            //var model = new ModelLoader( 'models/cerberus/' );

            var modelPromises = [];
            modelsPBR.forEach( function ( modelString, index ) {

                var model = new ModelLoader( 'models/' + modelString + '/' );
                var promise = model.load();
                modelPromises.push( promise );
                promise.then( function () {
                    this._modelsPBR[ index ] = model;
                }.bind( this ) );

            }.bind( this ) );

            var promise = this.readEnvConfig( environment + 'config.json' );
            promise.then( function ( config ) {


                this._currentEnvironment.init( environment, config );

                ready.push( this.readShaders() );
                ready.push( this._currentEnvironment.getPromise() );
                ready.push( this.createModelMaterialSample() );
                ready.push( Q.all( modelPromises ) );

                return Q.all( ready );

            }.bind( this ) ).then( function () {

                var root = this.createScene();
                viewer.setSceneData( root );

                // this.addModel( model );

                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition( true );

                viewer.run();

                osg.Matrix.makePerspective( 30, canvas.width / canvas.height, 0.1, 1000, viewer.getCamera().getProjectionMatrix() );

                var gui = new window.dat.GUI();
                var controller;

                controller = gui.add( this._config, 'envRotation', -Math.PI, Math.PI  ).step(0.1);
                controller.onChange( this.updateEnvironmentRotation.bind( this ) );

                controller = gui.add( this._config, 'lod', 0.0, 15.01 ).step( 0.1 );
                controller.onChange( function ( value ) {
                    this._lod.get()[ 0 ] = value;
                    this._lod.dirty();
                }.bind( this ) );

                controller = gui.add( this._config, 'pbr', [ this._config.pbr, 'UE4', ] ).listen();
                controller.onChange( this.updateEnvironment.bind( this ) ); // is also call updatePBR

                controller = gui.add( this._config, 'format', formatList ).listen();
                controller.onChange( this.updateEnvironment.bind( this ) );


                controller = gui.add( this._config, 'nbSamples', [ 4, 8, 16, 32, 64, 128, 256 ] );
                var updateShaderCallback = this.updateShaderPBR.bind( this );
                controller.onChange( updateShaderCallback );

                controller = gui.add( this._config, 'environmentType', [ 'cubemapSeamless', 'panorama' ] ).listen();
                controller.onChange( this.updateEnvironment.bind( this ) );

                controller = gui.add( this._config, 'material', Object.keys( PredefinedMaterials ) );
                controller.onChange( this.updateRowModelsSpecularMetal.bind( this ) );

                controller = gui.add( this._config, 'roughness', 0, 1.0 );
                controller.onChange( this.updateRowModelsMetalic.bind( this ) );

                controller = gui.addColor( this._config, 'albedo' );
                controller.onChange( this.updateAlbedo.bind( this ) );


                controller = gui.add( this._config, 'model', modelList ).listen();
                controller.onChange( this.updateModel.bind( this ) );

                if ( !hasTextureLod )
                    this._config.environmentType = 'panorama';

                if ( !hasFloatLinear )
                    this._config.format = 'LUV';

                this._config.pbr = 'UE4';
                this.updateModel();


            }.bind( this ) );

        },

        // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
        computeHammersleyReverse: function ( a ) {
            a = ( a << 16 | a >>> 16 ) >>> 0;
            a = ( ( a & 1431655765 ) << 1 | ( a & 2863311530 ) >>> 1 ) >>> 0;
            a = ( ( a & 858993459 ) << 2 | ( a & 3435973836 ) >>> 2 ) >>> 0;
            a = ( ( a & 252645135 ) << 4 | ( a & 4042322160 ) >>> 4 ) >>> 0;
            return ( ( ( a & 16711935 ) << 8 | ( a & 4278255360 ) >>> 8 ) >>> 0 ) / 4294967296;
        },

        computeHammersleySequence: function ( size ) {
            var hammersley = [];
            for ( var i = 0; i < size; i++ ) {
                var u = i / size;
                var v = this.computeHammersleyReverse( i );
                hammersley.push( u );
                hammersley.push( v );
            }
            //console.log( this._hammersley );
            return hammersley;
        },

        updateAlbedo: function () {
            this._albedoTexture = this.createTextureFromColor( this.convertColor( this._config.albedo ), true, this._albedoTexture );
        },

        updateShaderPBR: function () {

            var nbSamples = this._config.nbSamples;
            if ( !this._uniformHammersleySequence[ nbSamples ] ) {
                var sequence = this.computeHammersleySequence( nbSamples );
                var uniformHammersley = osg.Uniform.createFloat2Array( sequence, 'uHammersleySamples' );
                this._uniformHammersleySequence[ nbSamples ] = uniformHammersley;
            }
            var uniformHammerslay = this._uniformHammersleySequence[ nbSamples ];
            uniformHammerslay.dirty();


            this._shaders.forEach( function ( config ) {

                var stateSet = config.stateSet;

                var shaderConfig = osg.objectMix( {
                    nbSamples: nbSamples,
                    environmentType: this._config.environmentType,
                    pbr: this._config.pbr,
                    format: this._config.format,
                    mobile: this._config.mobile
                }, config.config );

                var program = this.createShaderPBR( shaderConfig );

                stateSet.setAttributeAndModes( program );
                stateSet.addUniform( uniformHammerslay );

            }.bind( this ) );

        },

        updateEnvironment: function () {

            if ( this._config.environmentType === 'cubemapSeamless' ) {
                this.setCubemapSeamless();
            } else {
                this.setPanorama();
            }

            this.updateShaderPBR();
        },

        convertColor: function ( color ) {

            var r, g, b;

            if ( color.length === 3 ) { // rgb [255, 255, 255]
                r = color[ 0 ];
                g = color[ 1 ];
                b = color[ 2 ];

            } else if ( color.length === 7 ) { // hex (24 bits style) '#ffaabb'
                var intVal = parseInt( color.slice( 1 ), 16 );
                r = ( intVal >> 16 );
                g = ( intVal >> 8 & 0xff );
                b = ( intVal & 0xff );
            }

            var result = [ 0, 0, 0, 1 ];
            result[ 0 ] = r / 255.0;
            result[ 1 ] = g / 255.0;
            result[ 2 ] = b / 255.0;
            //console.log( result );
            return result;
        }


    };

    // convert rgbe image to float texture
    var TextureRGBEToFloatTexture = function ( texture, dest, textureTarget ) {
        osg.Node.call( this );
        this._texture = texture;
        this._finalTexture = dest;
        this._textureTarget = textureTarget;
        this._defer = Q.defer();

        var self = this;
        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done ) {
                        self._defer.resolve( self._finalTexture );
                        self._finalTexture.dirtyMipmap();
                        node.setNodeMask( 0 );
                    } else {
                        this._done = true;
                    }
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

    };

    TextureRGBEToFloatTexture.prototype = osg.objectInherit( osg.Node.prototype, {

        getPromise: function () {
            return this._defer.promise;
        },

        createSubGraph: function ( sourceTexture, destinationTexture, textureTarget ) {
            var composer = new osgUtil.Composer();
            var reduce = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  //gl_FragColor = vec4(vec3(1.0,0.0,1.0), 1.0);',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture
            } );

            composer.addPass( reduce, destinationTexture, textureTarget );
            composer.build();
            return composer;
        },


        init: function () {

            var sourceTexture = this._texture;
            if ( !this._finalTexture ) {
                var finalTexture = new osg.Texture();
                finalTexture.setTextureSize( sourceTexture.getImage().getWidth(), sourceTexture.getImage().getHeight() );
                finalTexture.setType( 'FLOAT' );
                finalTexture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                finalTexture.setMagFilter( 'LINEAR' );

                this._finalTexture = finalTexture;
            }
            var composer = this.createSubGraph( sourceTexture, this._finalTexture, this._textureTarget );
            this.addChild( composer );
        }


    } );






    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();
