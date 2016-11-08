( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var osgAnimation = OSG.osgAnimation;
    var createQuatChannel = osgAnimation.Channel.createQuatChannel;
    var createVec3Channel = osgAnimation.Channel.createVec3Channel;

    //var $ = window.$;

    var GLTFLoader = function () {

        // Mappers to extract data correctly
        this.WEBGL_COMPONENT_TYPES = {
            5120: Int8Array,
            5121: Uint8Array,
            5122: Int16Array,
            5123: Uint16Array,
            5125: Uint32Array,
            5126: Float32Array
        };

        this.TYPE_TABLE = {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3,
            VEC4: 4,
            MAT2: 4,
            MAT3: 9,
            MAT4: 16
        };

        this.TEXTURE_FORMAT = {
            6406: osg.Texture.ALPHA,
            6407: osg.Texture.RGB,
            6408: osg.Texture.RGBA,
            6409: osg.Texture.LUMINANCE,
            6410: osg.Texture.LUMINANCE_ALPHA
        };

        this.PBR_EXTENSION = 'FRAUNHOFER_materials_pbr';
        this.PBR_METAL_MODE = 'PBR_metal_roughness';
        this.PBR_SPEC_MODE = 'PBR_specular_glossiness';

        this.ALBEDO_TEXTURE_UNIT = 2;
        this.DIFFUSE_TEXTURE_UNIT = 2;
        this.ROUGHNESS_TEXTURE_UNIT = 3;
        this.METALNESS_TEXTURE_UNIT = 4;
        this.SPECULAR_TEXTURE_UNIT = 4;
        this.NORMAL_TEXTURE_UNIT = 5;
        this.AO_TEXTURE_UNIT = 6;

        // Contains all the needed glTF files (.gltf, .bin, etc...)
        this.FILES = null;
        this.LOADED_GLTF_FILES = {};

        this.basicAnimationManager_ = null;

        this.visitedNodes_ = {};
        this.animatedNodes_ = {};
        this.skeletons_ = {};
        this.bones_ = {};
        this.skeletonToInfluenceMap_ = {};

        this.cachepromise = {};

    };

    GLTFLoader.prototype = {

        getFileName: function ( urlOrFile ) {

            if ( typeof ( urlOrFile ) === 'string' ) {
                var fileName = urlOrFile.split( '/' ).pop();
                return fileName;
            }

            if ( !( urlOrFile instanceof File ) )
                return null;

            return urlOrFile.name;
        },

        findFileFromURI: function ( urlOrFiles, uri ) {

            for ( var i = 0; i < urlOrFiles.length; ++i ) {

                var fileName = this.getFileName( urlOrFiles[ i ] );

                if ( fileName === uri )
                    return urlOrFiles[ i ];

            }

            return null;
        },

        findGLTFFile: function ( urlOrFiles ) {

            for ( var i = 0; i < urlOrFiles.length; ++i ) {

                var fileName = this.getFileName( urlOrFiles[ i ] );

                if ( fileName ) {

                    var ext = fileName.split( '.' ).pop();
                    if ( ext === 'gltf' )
                        return urlOrFiles[ i ];

                }

            }

        },

        getFileType: function ( urlOrFile ) {

            var fileName = this.getFileName( urlOrFile );

            if ( !fileName )
                return null;

            var ext = fileName.split( '.' ).pop();
            if ( ext === 'bin' )
                return 'arraybuffer';
            else if ( ext === 'gltf' )
                return 'text';

            return 'blob';
        },

        loadFile: function ( urlOrFile, uri ) {

            if ( this.cachepromise[ uri ] )
                return this.cachepromise[ uri ];

            var defer = Promise.defer();
            this.cachepromise[ uri ] = defer.promise;

            var fileType = this.getFileType( urlOrFile );

            if ( typeof ( urlOrFile ) === 'string' ) {

                var xhr = new XMLHttpRequest();
                xhr.open( 'GET', urlOrFile, true );
                xhr.responseType = fileType;
                xhr.onload = function () {

                    defer.resolve( xhr.response );

                };

                xhr.send( null );

                return defer.promise;
            }

            if ( !( urlOrFile instanceof File ) )
                return defer.reject();

            var reader = new FileReader();
            reader.onload = function ( data ) {

                if ( fileType !== 'blob' )
                    defer.resolve( data.target.result );
                else {
                    var img = new Image();
                    img.src = data.target.result;
                    defer.resolve( img );
                }

            };

            if ( fileType === 'arraybuffer' ) {

                reader.readAsArrayBuffer( urlOrFile );

            } else if ( fileType === 'text' ) {

                reader.readAsText( urlOrFile );

            } else {

                reader.readAsDataURL( urlOrFile );

            }

            return defer.promise;
        },

        /**
         * Loads a osg.BufferArray from a TypeArray obtained by using a glTF accessor.
         * No memory allocation is done, the result is a subarray obtained from a glTF binary file
         * @param  {Object} accessor
         * @param  {osg.BufferArray.ARRAY_BUFFER | osg.BufferArray.ELEMENT_ARRAY_BUFFER} type WebGL buffer type
         * @param  {TypedArray} BufferType specific TypedArray type used for extraction
         * @return {osg.BufferArray} OSG readable buffer contaning the extracted data
         */
        loadAccessorBuffer: function ( accessor, type ) {
            var json = this.LOADED_GLTF_FILES.glTF;

            var bufferView = json.bufferViews[ accessor.bufferView ];
            var buffer = json.buffers[ bufferView.buffer ];
            var offset = accessor.byteOffset + bufferView.byteOffset;

            var filePromise = this.loadFile( this.findFileFromURI( this.FILES, buffer.uri ), buffer.uri );

            var self = this;
            return filePromise.then( function ( data ) {

                var TypedArray = self.WEBGL_COMPONENT_TYPES[ accessor.componentType ];
                var typedArray = new TypedArray( data, offset, accessor.count * self.TYPE_TABLE[ accessor.type ] );

                if ( type )
                    return Promise.resolve( new osg.BufferArray( type, typedArray, self.TYPE_TABLE[ accessor.type ] ) );

                return Promise.resolve( typedArray );
            } );
        },

        findByKey: function ( obj, key ) {

            if ( !obj )
                return null;

            var keys = window.Object.keys( obj );
            for ( var i = 0; i < keys.length; ++i ) {

                if ( keys[ i ] === key )
                    return obj[ keys[ i ] ];

            }

            return null;

        },

        registerUpdateCallback: function ( callbackName, node ) {

            var json = this.LOADED_GLTF_FILES.glTF;

            var animationCallback = null;
            if ( json.nodes[ callbackName ].jointName )
                animationCallback = new osgAnimation.UpdateBone();
            else
                animationCallback = new osgAnimation.UpdateMatrixTransform();

            animationCallback.setName( callbackName );

            var translation = osg.vec3.create();
            osg.mat4.getTranslation( translation, node.getMatrix() );

            var rotationQuat = osg.quat.create();
            osg.mat4.getRotation( rotationQuat, node.getMatrix() );

            var scale = osg.vec3.create();
            osg.mat4.getScale( scale, node.getMatrix() );

            animationCallback.getStackedTransforms().push( new osgAnimation.StackedTranslate( 'translation', translation ) );
            animationCallback.getStackedTransforms().push( new osgAnimation.StackedQuaternion( 'rotation', rotationQuat ) );
            animationCallback.getStackedTransforms().push( new osgAnimation.StackedScale( 'scale', scale ) );

            node.addUpdateCallback( animationCallback );
        },

        createTextureAndSetAttrib: function ( glTFTextureId, osgStateSet, location, uniform ) {

            var defer = Promise.defer();

            var texture = new osg.Texture();

            var json = this.LOADED_GLTF_FILES.glTF;
            var glTFTexture = json.textures[ glTFTextureId ];
            var image = json.images[ glTFTexture.source ];

            if ( !glTFTexture || !image ) return defer.promise;

            var self = this;
            this.loadFile( this.findFileFromURI( this.FILES, image.uri ), image.uri ).then( function ( data ) {

                texture.setImage( data, self.TEXTURE_FORMAT[ glTFTexture.format ] );
                if ( glTFTexture.flipY )
                    texture.setFlipY( glTFTexture.flipY );

                osgStateSet.setTextureAttributeAndModes( location, texture );

                if ( uniform )
                    osgStateSet.addUniform( osg.Uniform.createInt( location, uniform ) );

                defer.resolve();

            } );

            return defer.promise;

        },

        /**
         * Creates a MatrixTransform node by using
         * glTF node's properties (matrix, translation, rotation, scale)
         * @param  {Object} glTFNode glTF node
         * @return {OSG.MatrixTransform} MatrixTransform node containing the glTF node transform 
         */
        loadTransform: function ( glTFNode ) {

            var mat = osg.mat4.create();

            // The transform is given under a matrix form
            if ( glTFNode.matrix ) {

                osg.mat4.copy( mat, glTFNode.matrix );
                return mat;
            }

            // The transform is given under the form
            // translation, rotation, scale
            var scale = glTFNode.scale || osg.vec3.ONE;
            var rot = glTFNode.rotation || osg.quat.IDENTITY;
            var trans = glTFNode.translation || osg.vec3.ZERO;

            osg.mat4.fromRotationTranslationScale( mat, rot, trans, scale );
            return mat;
        },

        preprocessChannel: function ( glTFChannel, glTFAnim, glTFAnimParams ) {

            var json = this.LOADED_GLTF_FILES.glTF;

            var glTFSampler = glTFAnim.samplers[ glTFChannel.sampler ];

            var timeAccessor = json.accessors[ glTFAnimParams[ glTFSampler.input ] ];
            var valueAccessor = json.accessors[ glTFAnimParams[ glTFSampler.output ] ];

            var timeKeys = this.loadAccessorBuffer( timeAccessor, null );
            var valueKeys = this.loadAccessorBuffer( valueAccessor, null );

            var osgChannel = null;

            if ( this.TYPE_TABLE[ valueAccessor.type ] === 4 ) {

                osgChannel = createQuatChannel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );

            } else if ( this.TYPE_TABLE[ valueAccessor.type ] === 3 ) {

                osgChannel = createVec3Channel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );

            }

            return osgChannel;
        },

        /**
         * Loads all the solid animations registering
         * them in a BasicAnimationManager instance
         * @return {BasicAnimationManager} the animation manager containing the animations
         */
        preprocessAnimations: function () {

            var json = this.LOADED_GLTF_FILES[ 'glTF' ];

            var animationManager = new osgAnimation.BasicAnimationManager();
            var animations = [];

            var animationsObjectKeys = window.Object.keys( json.animations );
            for ( var i = 0; i < animationsObjectKeys.length; ++i ) {

                var glTFAnim = json.animations[ animationsObjectKeys[ i ] ];
                var glTFAnimParams = glTFAnim.parameters;

                var osgChannels = [];

                // Creates each OSGJS channel
                for ( var j = 0; j < glTFAnim.channels.length; ++j ) {

                    var glTFChannel = glTFAnim.channels[ j ];
                    var osgChannel = this.preprocessChannel( glTFChannel, glTFAnim, glTFAnimParams );

                    this.animatedNodes_[ glTFChannel.target.id ] = true;
                    osgChannels.push( osgChannel );
                }

                animations.push( osgAnimation.Animation.createAnimation( osgChannels, animationsObjectKeys[ i ] ) );
            }

            animationManager.init( animations );
            this.basicAnimationManager_ = animationManager;
        },

        loadBone: function ( boneId, skin ) {

            var json = this.LOADED_GLTF_FILES.glTF;
            var node = json.nodes[ boneId ];

            var inverseBindMatricesAccessor = json.accessors[ skin.inverseBindMatrices ];
            var bonePromise = this.loadAccessorBuffer( inverseBindMatricesAccessor, null );
            bonePromise.then(function(data) {

                // Creates the current bone
                // initializing it with initial pose
                for ( var i = 0; i < skin.jointNames.length; ++i ) {

                    if ( skin.jointNames[ i ] === node.jointName ) break;

                }

                var boneNode = new osgAnimation.Bone( node.jointName );
                var invMat = data.subarray( i * 16, i * 16 + 16 );
                boneNode.setInvBindMatrixInSkeletonSpace( invMat );

                return boneNode;
            });

            return bonePromise;
        },

        buildInfluenceMap: function ( rootBoneId, skin ) {

            if ( this.skeletonToInfluenceMap_[ rootBoneId ] )
                return;

            this.skeletonToInfluenceMap_[ rootBoneId ] = {};

            for ( var j = 0; j < skin.jointNames.length; j++ ) {

                var jointName = skin.jointNames[ j ];
                this.skeletonToInfluenceMap_[ rootBoneId ][ jointName ] = j;

            }

        },

        mapBonesToSkin: function () {

            var json = this.LOADED_GLTF_FILES.glTF;

            var boneToSkin = {};

            // Maps each bone ID to its skin
            var skinsKeys = window.Object.keys( json.skins );
            for ( var i = 0; i < skinsKeys.length; ++i ) {

                var skin = json.skins[ skinsKeys[ i ] ];

                for ( var j = 0; j < skin.jointNames.length; ++j ) {

                    var jName = skin.jointNames[ j ];

                    var nodesKeys = window.Object.keys( json.nodes );
                    for ( var k = 0; k < nodesKeys.length; ++k ) {

                        var node = json.nodes[ nodesKeys[ k ] ];

                        if ( node.jointName && node.jointName === jName )
                            boneToSkin[ nodesKeys[ k ] ] = skin;
                    }
                }

            }

            return boneToSkin;

        },

        preprocessBones: function ( bonesToSkin ) {

            var json = this.LOADED_GLTF_FILES.glTF;
            var nodesKeys = window.Object.keys( json.nodes );

            var promises = [];

            for ( var i = 0; i < nodesKeys.length; ++i ) {

                var boneId = nodesKeys[ i ];
                var boneNode = json.nodes[ boneId ];

                if ( !boneNode.jointName )
                    continue;

                var bonePromise = this.loadBone( boneId, bonesToSkin[ boneId ] ).then(function(boneNode) {

                    this.bones_[ boneId ] = boneNode;

                });
                promises.push(bonePromise);

            }

            return Promise.all(promises);

        },

        preprocessSkeletons: function () {

            var json = this.LOADED_GLTF_FILES.glTF;

            var bonesToSkin = this.mapBonesToSkin();

            var promises = [];

            // Saves each skeleton in the skeleton maprep
            var nodesKeys = window.Object.keys( json.nodes );
            for ( var j = 0; j < nodesKeys.length; ++j ) {

                var nodeId = nodesKeys[ j ];
                var node = json.nodes[ nodeId ];
                var skin = json.skins[ node.skin ];

                if ( !node.skeletons )
                    continue;

                for ( var i = 0; i < node.skeletons.length; ++i ) {

                    var rootBoneId = null;
                    var rootJointId = node.skeletons[ i ];

                    for ( var k = 0; k < nodesKeys.length; ++k ) {

                        var subnodeId = nodesKeys[ k ];
                        var subnode = json.nodes[ subnodeId ];

                        if ( !subnode.jointName )
                            continue;

                        if ( subnode.jointName === rootJointId ) {

                            rootBoneId = subnodeId;
                            break;

                        }

                    }

                    if ( rootBoneId && !this.skeletons_[ rootBoneId ] ) {

                        this.skeletons_[ rootJointId ] = new osgAnimation.Skeleton();

                        // Adds missing bone to the boneMap
                        bonesToSkin[ rootBoneId ] = skin;
                    }

                    this.buildInfluenceMap( rootJointId, skin );
                }
            }

            var bonesPromise = this.preprocessBones( bonesToSkin );
            promises.push(bonesPromise);

            return Promise.all(promises);
        },

        loadPBRMaterial: function ( glTFmaterial, geometryNode ) {

            var model = glTFmaterial.materialModel;
            var values = glTFmaterial.values;

            if ( !values ) return Promise.resolve();

            var osgStateSet = geometryNode.getOrCreateStateSet();

            var promises = [];
            if ( model === this.PBR_METAL_MODE ) {

                promises.push( this.createTextureAndSetAttrib( values.baseColorTexture, osgStateSet, this.ALBEDO_TEXTURE_UNIT, 'albedoMap' ) );
                promises.push( this.createTextureAndSetAttrib( values.roughnessTexture, osgStateSet, this.ROUGHNESS_TEXTURE_UNIT, 'roughnessMap' ) );
                promises.push( this.createTextureAndSetAttrib( values.metallicTexture, osgStateSet, this.METALNESS_TEXTURE_UNIT, 'specularMap' ) );
                promises.push( this.createTextureAndSetAttrib( values.normalTexture, osgStateSet, this.NORMAL_TEXTURE_UNIT, 'normalMap' ) );
                promises.push( this.createTextureAndSetAttrib( values.aoTexture, osgStateSet, this.AO_TEXTURE_UNIT, 'aoMap' ) );
            }

            geometryNode.stateset = osgStateSet;

            return Promise.all( promises );
        },

        loadMaterial: function ( materialId, geometryNode ) {

            var json = this.LOADED_GLTF_FILES.glTF;
            var glTFmaterial = json.materials[ materialId ];

            var extension = this.findByKey( glTFmaterial.extensions, this.PBR_EXTENSION );
            if ( extension )
                return this.loadPBRMaterial( extension, geometryNode );

            var values = glTFmaterial.values;
            if ( !values ) return Promise.resolve();

            // Handles basic material attributes
            var osgStateSet = geometryNode.getOrCreateStateSet();
            var osgMaterial = new osg.Material();

            osgStateSet.setAttribute( osgMaterial );
            geometryNode.stateset = osgStateSet;

            if ( values.ambient )
                osgMaterial.setAmbient( values.ambient );
            if ( values.emission )
                osgMaterial.setEmission( values.emission );
            if ( values.shininess )
                osgMaterial.setShininess( values.shininess );
            if ( values.specular )
                osgMaterial.setSpecular( values.specular );

            // Create a texture for the diffuse, if any
            if ( values.diffuse )
                return this.createTextureAndSetAttrib( values.diffuse, osgStateSet, 0 );

            return Promise.resolve();
        },

        createGeometry: function ( primitive, skeletonJointId ) {

            var json = this.LOADED_GLTF_FILES.glTF;

            // Builds the geometry from the extracted vertices & normals
            var geom = new osg.Geometry();
            var rigOrGeom = geom;

            var i = 0;

            var cbSetBuffer = function ( name, buffer ) {
                this.getVertexAttributeList()[ name ] = buffer;
            };

            var promisesArray = [];
            if ( skeletonJointId ) {

                rigOrGeom = new osgAnimation.RigGeometry();
                rigOrGeom._boneNameID = this.skeletonToInfluenceMap_[ skeletonJointId ];

                var jointAccessor = json.accessors[ primitive.attributes.JOINT ];
                var weightAccessor = json.accessors[ primitive.attributes.WEIGHT ];

                var jointPromise = this.loadAccessorBuffer( jointAccessor, osg.BufferArray.ARRAY_BUFFER );
                jointPromise.then( cbSetBuffer.bind( rigOrGeom, 'Bones' ) );

                var weightPromise = this.loadAccessorBuffer( weightAccessor, osg.BufferArray.ARRAY_BUFFER );
                weightPromise.then( function ( data ) {

                    rigOrGeom.getAttributes().Weights = data;

                    var elts = rigOrGeom.getAttributes().Weights.getElements();
                    for ( i = 0; i < elts.length / 4; ++i ) {
                        var sum = elts[ i * 4 ] + elts[ i * 4 + 1 ] + elts[ i * 4 + 2 ] + elts[ i * 4 + 3 ];
                        var correc = 1.0 / sum;
                        elts[ i * 4 ] *= correc;
                        elts[ i * 4 + 1 ] *= correc;
                        elts[ i * 4 + 2 ] *= correc;
                        elts[ i * 4 + 3 ] *= correc;
                    }
                } );

                promisesArray.push( jointPromise, weightPromise );

            }

            var vertexAccessor = json.accessors[ primitive.attributes.POSITION ];
            var normalAccessor = json.accessors[ primitive.attributes.NORMAL ];

            var vertexPromise = this.loadAccessorBuffer( vertexAccessor, osg.BufferArray.ARRAY_BUFFER );
            vertexPromise.then( cbSetBuffer.bind( geom, 'Vertex' ) );

            var normalPromise = this.loadAccessorBuffer( normalAccessor, osg.BufferArray.ARRAY_BUFFER );
            normalPromise.then( cbSetBuffer.bind( geom, 'Normal' ) );

            promisesArray.push( vertexPromise, normalPromise );

            var attributesKeys = window.Object.keys( primitive.attributes );
            // Adds each TexCoords to the geometry
            for ( i = 0; i < attributesKeys.length; ++i ) {

                if ( attributesKeys[ i ].indexOf( 'TEXCOORD' ) === -1 )
                    continue;

                var texCoordId = attributesKeys[ i ].substr( 9 );
                var textCoordAccessor = json.accessors[ primitive.attributes[ attributesKeys[ i ] ] ];

                var texCoordPromise = this.loadAccessorBuffer( textCoordAccessor, osg.BufferArray.ARRAY_BUFFER );
                texCoordPromise.then( cbSetBuffer.bind( geom, 'TexCoord' + texCoordId ) );

                promisesArray.push( texCoordPromise );
            }

            if ( skeletonJointId ) {

                rigOrGeom.setSourceGeometry( geom );
                rigOrGeom.mergeChildrenData();

                // TODO remove blabla
                rigOrGeom.computeBoundingBox = geom.computeBoundingBox;
            }

            var indicesAccessor = json.accessors[ primitive.indices ];
            var indicesPromise = this.loadAccessorBuffer( indicesAccessor, osg.BufferArray.ELEMENT_ARRAY_BUFFER );
            indicesPromise.then( function ( data ) {

                var osgPrimitive = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, data );
                rigOrGeom.getPrimitives().push( osgPrimitive );

            } );

            promisesArray.push( indicesPromise );

            if ( primitive.material )
                promisesArray.push( this.loadMaterial( primitive.material, rigOrGeom ) );


            return Promise.all( promisesArray ).then( function () {

                return rigOrGeom;

            } );
        },

        loadGLTFPrimitives: function ( meshId, resultMeshNode, skeletonJointId ) {

            var json = this.LOADED_GLTF_FILES.glTF;
            var mesh = json.meshes[ meshId ];

            var primitives = mesh.primitives;

            var promisesArray = [];

            for ( var i = 0; i < primitives.length; ++i ) {

                var primitive = primitives[ i ];
                var promiseGeom = this.createGeometry( primitive, skeletonJointId );

                promisesArray.push( promiseGeom );

            }

            return Promise.all( promisesArray ).then( function ( geoms ) {

                for ( var i = 0; i < geoms.length; ++i )
                    resultMeshNode.addChild( geoms[ i ] );

                return geoms;

            } );
        },

        loadGLTFNode: function ( nodeId, root ) {

            if ( this.visitedNodes_[ nodeId ] )
                return;

            var json = this.LOADED_GLTF_FILES[ 'glTF' ];
            var glTFNode = json.nodes[ nodeId ];
            var children = glTFNode.children;

            var i = 0;

            var currentNode = null;

            if ( glTFNode.jointName ) {

                currentNode = this.bones_[ nodeId ];

            } else {

                currentNode = new osg.MatrixTransform();

            }

            if ( glTFNode.jointName && this.skeletons_[ glTFNode.jointName ] ) {

                var skeleton = this.skeletons_[ glTFNode.jointName ];
                skeleton.addChild( currentNode );
                root.addChild( skeleton );

            }

            currentNode.setName( nodeId );
            osg.mat4.copy( currentNode.getMatrix(), this.loadTransform( glTFNode ) );

            // Recurses on children before 
            // processing the current node
            var promises = [];
            if ( children ) {

                for ( i = 0; i < children.length; ++i ) {

                    var nodePromise = this.loadGLTFNode( children[ i ], currentNode );
                    promises.push( nodePromise );

                }

            }

            // Loads meshes contained in the node
            // Adds RigGeometry to corresponding skeleton if any
            if ( glTFNode.meshes ) {

                for ( i = 0; i < glTFNode.meshes.length; ++i ) {

                    var meshId = glTFNode.meshes[ i ];
                    if ( !glTFNode.skeletons ) {

                        var geomPromise = this.loadGLTFPrimitives( meshId, currentNode, null );
                        promises.push( geomPromise );
                        continue;

                    }

                    for ( var j = 0; j < glTFNode.skeletons.length; ++j ) {

                        var rootJointId = glTFNode.skeletons[ j ];
                        var skeletonNode = this.skeletons_[ rootJointId ];

                        var meshTransformNode = new osg.MatrixTransform();
                        osg.mat4.copy( meshTransformNode.getMatrix(), currentNode.getMatrix() );

                        var geomP = this.loadGLTFPrimitives( meshId, meshTransformNode, rootJointId );

                        skeletonNode.addChild( meshTransformNode );

                        promises.push( geomP );
                    }

                }

            }

            // Loads solid animations
            // by adding an update callback
            if ( this.animatedNodes_[ nodeId ] )
                this.registerUpdateCallback( nodeId, currentNode );

            if ( !this.skeletons_[ nodeId ] )
                root.addChild( currentNode );

            this.visitedNodes_[ nodeId ] = true;

            return Promise.all( promises );
        },

        loadGLTF: function ( files ) {

            var self = this;
            this.FILES = files;
            this.LOADED_GLTF_FILES = {};

            var i;

            var glTFFileOrUrl = this.findGLTFFile( this.FILES );
            var glTFFilePromise = this.loadFile( glTFFileOrUrl, 'gltf' );

            // Creates the root node
            // adding a PI / 2 rotation arround the X-axis
            var root = new osg.MatrixTransform();
            root.setName( 'root' );

            osg.mat4.rotateX( root.getMatrix(), root.getMatrix(), Math.PI / 2.0 );

            return glTFFilePromise.then( function ( glTFFile ) {

                self.LOADED_GLTF_FILES.glTF = JSON.parse( glTFFile );
                var json = self.LOADED_GLTF_FILES.glTF;

                // Preprocesses skin animations if any
                var skeletonPromise = null;
                if ( json.skins )
                    skeletonPromise = self.preprocessSkeletons();

                // Preprocesses animations
                //if ( json.animations && Object.keys( json.animations ).length > 0 )
                //  self.preprocessAnimations();

                // Loops through each scene
                // loading geometry nodes, transform nodes, etc...s
                //var scenes = json.scenes;
                var sceneKeys = Object.keys( json.scenes );
                var promises = [];

                for ( i = 0; i < sceneKeys.length; ++i ) {

                    var scene = json.scenes[ sceneKeys[ i ] ];

                    if ( !scene )
                        continue;

                    for ( i = 0; i < scene.nodes.length; ++i ) {

                        var p = self.loadGLTFNode( scene.nodes[ i ], root );
                        promises.push( p );

                    }
                }

                return Promise.all( promises ).then( function () {

                    return root;

                } );
                // Register the animation manager
                // if the glTF file contains animations
                //if ( self.basicAnimationManager_ )
                //  root.addUpdateCallback( self.basicAnimationManager_ );
            } );
        }

    };

    window.GLTFLoader = GLTFLoader;
} )();