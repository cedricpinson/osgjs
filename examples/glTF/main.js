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

        // Contains all the needed glTF files (.gltf, .bin, etc...)
        this.GLTF_FILES = {};

        this.basicAnimationManager_ = null;

        this.visitedNodes_ = {};
        this.animatedNodes_ = {};
        this.skeletons_ = {};
        this.bones_ = {};
        this.skeletonToInfluenceMap_ = {};

    };

    GLTFLoader.prototype = {

        /**
         * Loads a osg.BufferArray from a TypeArray obtained by using a glTF accessor.
         * No memory allocation is done, the result is a subarray obtained from a glTF binary file
         * @param  {Object} accessor
         * @param  {osg.BufferArray.ARRAY_BUFFER | osg.BufferArray.ELEMENT_ARRAY_BUFFER} type WebGL buffer type
         * @param  {TypedArray} BufferType specific TypedArray type used for extraction
         * @return {osg.BufferArray} OSG readable buffer contaning the extracted data
         */
        loadAccessorBuffer: function ( accessor, type ) {
            var json = this.GLTF_FILES[ 'glTF' ];

            var bufferView = json.bufferViews[ accessor.bufferView ];
            var buffer = json.buffers[ bufferView.buffer ];
            var offset = accessor.byteOffset + bufferView.byteOffset;

            var TypedArray = this.WEBGL_COMPONENT_TYPES[ accessor.componentType ];
            var typedArray = new TypedArray( this.GLTF_FILES[ buffer.uri ], offset, accessor.count * this.TYPE_TABLE[ accessor.type ] );

            if ( type )
                return new osg.BufferArray( type, typedArray, this.TYPE_TABLE[ accessor.type ] );

            return typedArray;
        },

        registerUpdateCallback: function ( callbackName, node ) {

            var json = this.GLTF_FILES.glTF;

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

        /**
         * Loads all the solid animations registering
         * them in a BasicAnimationManager instance
         * @return {BasicAnimationManager} the animation manager containing the animations
         */
        loadAnimations: function () {

            var json = this.GLTF_FILES[ 'glTF' ];

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
                    var glTFSampler = glTFAnim.samplers[ glTFChannel.sampler ];

                    var timeAccessor = json.accessors[ glTFAnimParams[
                        glTFSampler.input ] ];
                    var valueAccessor = json.accessors[ glTFAnimParams[
                        glTFSampler.output ] ];

                    var timeKeys = this.loadAccessorBuffer( timeAccessor, null );
                    var valueKeys = this.loadAccessorBuffer( valueAccessor, null );

                    var osgChannel = null;

                    if ( this.TYPE_TABLE[ valueAccessor.type ] === 4 ) {

                        osgChannel = createQuatChannel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );

                    } else if ( this.TYPE_TABLE[ valueAccessor.type ] === 3 ) {

                        osgChannel = createVec3Channel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );

                    }

                    this.animatedNodes_[ glTFChannel.target.id ] = true;
                    osgChannels.push( osgChannel );
                }

                animations.push( osgAnimation.Animation.createAnimation( osgChannels, animationsObjectKeys[ i ] ) );
            }

            animationManager.init( animations );
            return animationManager;
        },

        loadBone: function ( boneId, skin ) {

            var json = this.GLTF_FILES[ 'glTF' ];
            var node = json.nodes[ boneId ];

            var inverseBindMatricesAccessor = json.accessors[ skin.inverseBindMatrices ];
            var inverseBindMatrices = this.loadAccessorBuffer( inverseBindMatricesAccessor, null );

            // Creates the current bone
            // initializing it with initial pose
            for ( var i = 0; i < skin.jointNames.length; ++i )
                if ( skin.jointNames[ i ] === node.jointName )
                    break;

            var boneNode = new osgAnimation.Bone( node.jointName );
            var invMat = inverseBindMatrices.subarray( i * 16, i * 16 + 16 );
            boneNode.setInvBindMatrixInSkeletonSpace( invMat );
            //boneNode.setMatrixInSkeletonSpace( skin.bindShapeMatrix );

            return boneNode;
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

            var json = this.GLTF_FILES[ 'glTF' ];

            var boneToSkin = {};

            // Maps each bone ID to its skin
            for ( var skinId in json.skins ) {

                var skin = json.skins[ skinId ];

                for ( var i = 0; i < skin.jointNames.length; ++i ) {

                    var jName = skin.jointNames[ i ];

                    for ( var nodeId in json.nodes ) {

                        var node = json.nodes[ nodeId ];

                        if ( node.jointName && node.jointName === jName )
                            boneToSkin[ nodeId ] = skin;
                    }
                }

            }

            return boneToSkin;

        },

        preprocessBones: function ( bonesToSkin ) {

            var json = this.GLTF_FILES.glTF;

            for ( var boneId in json.nodes ) {

                var boneNode = json.nodes[ boneId ];
                if ( !boneNode.jointName )
                    continue;

                this.bones_[ boneId ] = this.loadBone( boneId, bonesToSkin[ boneId ] );

            }

        },

        preprocessSkeletons: function () {

            var json = this.GLTF_FILES.glTF;

            var bonesToSkin = this.mapBonesToSkin();

            // Saves each skeleton in the skeleton map
            for ( var nodeId in json.nodes ) {

                var node = json.nodes[ nodeId ];
                var skin = json.skins[ node.skin ];

                if ( !node.skeletons )
                    continue;

                for ( var i = 0; i < node.skeletons.length; ++i ) {

                    var rootBoneId = null;
                    var rootJointId = node.skeletons[ i ];
                    for ( var subnodeId in json.nodes ) {

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

            this.preprocessBones( bonesToSkin );

        },

        createGeometry: function ( primitive, skeletonJointId ) {

            var json = this.GLTF_FILES.glTF;

            // Builds the geometry from the extracted vertices & normals
            var geom = new osg.Geometry();
            var rigGeom = null;

            var i = 0;

            if ( skeletonJointId ) {

                rigGeom = new osgAnimation.RigGeometry();
                rigGeom._boneNameID = this.skeletonToInfluenceMap_[ skeletonJointId ];

                var jointAccessor = json.accessors[ primitive.attributes.JOINT ];
                var weightAccessor = json.accessors[ primitive.attributes.WEIGHT ];

                rigGeom.getAttributes().Bones = this.loadAccessorBuffer( jointAccessor, osg.BufferArray.ARRAY_BUFFER );
                rigGeom.getAttributes().Weights = this.loadAccessorBuffer( weightAccessor, osg.BufferArray.ARRAY_BUFFER );

                var elts = rigGeom.getAttributes().Weights.getElements();
                for ( i = 0; i < elts.length / 4; ++i ) {
                    var sum = elts[ i * 4 ] + elts[ i * 4 + 1 ] + elts[ i * 4 + 2 ] + elts[ i * 4 + 3 ];
                    var correc = 1.0 / sum;
                    elts[ i * 4 ] *= correc;
                    elts[ i * 4 + 1 ] *= correc;
                    elts[ i * 4 + 2 ] *= correc;
                    elts[ i * 4 + 3 ] *= correc;
                }
            }

            var vertexAccessor = json.accessors[ primitive.attributes.POSITION ];
            var normalAccessor = json.accessors[ primitive.attributes.NORMAL ];

            geom.getAttributes().Vertex = this.loadAccessorBuffer( vertexAccessor, osg.BufferArray.ARRAY_BUFFER );
            geom.getAttributes().Normal = this.loadAccessorBuffer( normalAccessor, osg.BufferArray.ARRAY_BUFFER );

            var attributesKeys = window.Object.keys( primitive.attributes );
            // Adds each TexCoords to the geometry
            for ( i = 0; i < attributesKeys.length; ++i ) {

                if ( attributesKeys[ i ].indexOf( 'TEXCOORD' ) === -1 )
                    continue;

                var texCoordId = attributesKeys[ i ].substr( 9 );
                var textCoordAccessor = json.accessors[ primitive.attributes[ attributesKeys[ i ] ] ];
                geom.getAttributes()[ 'TexCoord' + texCoordId ] = this.loadAccessorBuffer( textCoordAccessor, osg.BufferArray.ARRAY_BUFFER );
            }

            if ( skeletonJointId ) {

                rigGeom.setSourceGeometry( geom );
                rigGeom.mergeChildrenData();

                // TODO remove blabla
                rigGeom.computeBoundingBox = geom.computeBoundingBox;

                return rigGeom;
            }


            return geom;
        },

        loadGeometry: function ( meshId, resultMeshNode, skeletonJointId ) {

            var json = this.GLTF_FILES.glTF;
            var mesh = json.meshes[ meshId ];

            var primitives = mesh.primitives;
            var processedPrimitives = new Array( primitives.length );

            var ii = 0;
            for ( var i = 0; i < primitives.length; ++i ) {

                if ( processedPrimitives[ i ] )
                    continue;

                var primitive = primitives[ i ];
                var attributesKeys = window.Object.keys( primitive.attributes );

                var g = this.createGeometry( primitive, skeletonJointId );

                // Checks whether there are other primitives using
                // the same vertices and normals
                for ( ii = 0; ii < primitives.length; ++ii ) {

                    if ( processedPrimitives[ ii ] )
                        continue;

                    var targetPrimitive = primitives[ ii ];
                    var targetAttributesKeys = window.Object.keys( targetPrimitive.attributes );

                    // Primitives are non-mergeable if the materials or the
                    // attributes are different among them
                    if ( targetPrimitive.material !== primitive.material ||
                        targetAttributesKeys.length !== attributesKeys.length ) {

                        continue;

                    }

                    var mergePossible = true;
                    for ( var j = 0; j < attributesKeys.length; ++j ) {

                        if ( attributesKeys[ j ] !== targetAttributesKeys[ j ] ||

                            primitive.attributes[ attributesKeys[ j ] ] !== targetPrimitive.attributes[ targetAttributesKeys[ j ] ] ) {

                            mergePossible = false;
                            break;

                        }
                    }

                    if ( !mergePossible )
                        continue;

                    var indicesAccessor = json.accessors[ primitives[ ii ].indices ];
                    var osgPrimitive = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, this.loadAccessorBuffer( indicesAccessor, osg.BufferArray.ELEMENT_ARRAY_BUFFER ) );
                    g.getPrimitives().push( osgPrimitive );

                    processedPrimitives[ ii ] = true;
                }
                processedPrimitives[ i ] = true;

                resultMeshNode.addChild( g );
            }
        },

        loadGLTFNode: function ( nodeId, root ) {

            if ( this.visitedNodes_[ nodeId ] )
                return;

            var json = this.GLTF_FILES[ 'glTF' ];
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
            if ( children ) {

                for ( i = 0; i < children.length; ++i ) {

                    this.loadGLTFNode( children[ i ], currentNode );

                }

            }

            // Loads meshes contained in the node
            // Adds RigGeometry to corresponding skeleton if any
            if ( glTFNode.meshes ) {

                for ( i = 0; i < glTFNode.meshes.length; ++i ) {

                    var meshId = glTFNode.meshes[ i ];
                    if ( !glTFNode.skeletons ) {

                        this.loadGeometry( meshId, currentNode, null );
                        continue;

                    }

                    for ( var j = 0; j < glTFNode.skeletons.length; ++j ) {

                        var rootJointId = glTFNode.skeletons[ j ];
                        var skeletonNode = this.skeletons_[ rootJointId ];

                        var meshTransformNode = new osg.MatrixTransform();
                        osg.mat4.copy( meshTransformNode.getMatrix(), currentNode.getMatrix() );

                        this.loadGeometry( meshId, meshTransformNode, rootJointId );

                        skeletonNode.addChild( meshTransformNode );
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
        },

        loadGLTF: function ( files ) {

            this.GLTF_FILES = {};

            var i;

            var fileKeys = Object.keys( files );
            for ( i = 0; i < fileKeys.length; ++i ) {

                if ( fileKeys[ i ].indexOf( '.gltf' ) !== -1 )
                    this.GLTF_FILES.glTF = JSON.parse( files[ fileKeys[ i ] ] );
                else
                    this.GLTF_FILES[ fileKeys[ i ] ] = files[ fileKeys[ i ] ];

            }


            // Creates the root node
            // adding a PI / 2 rotation arround the X-axis
            var root = new osg.MatrixTransform();
            root.setName( 'root' );

            osg.mat4.rotateX( root.getMatrix(), root.getMatrix(), Math.PI / 2.0 );

            var json = this.GLTF_FILES.glTF;
            console.log( json );

            // Preprocesses skin animations if any
            if ( json.skins )
                this.preprocessSkeletons();

            // Preprocesses animations
            if ( json.animations && Object.keys( json.animations ).length > 0 )
                this.basicAnimationManager_ = this.loadAnimations();

            // Loops through each scene
            // loading geometry nodes, transform nodes, etc...s
            var scenes = json.scenes;
            for ( var sceneId in scenes ) {

                var scene = scenes[ sceneId ];

                if ( !scene )
                    continue;

                for ( i = 0; i < scene.nodes.length; ++i ) {

                    this.loadGLTFNode( scene.nodes[ i ], root );

                }
            }

            // Register the animation manager
            // if the glTF file contains animations
            if ( this.basicAnimationManager_ )
                root.addUpdateCallback( this.basicAnimationManager_ );

            return root;
        }

    };

    window.GLTFLoader = GLTFLoader;

    /*var loadSample = function ( path, sampleName, callback ) {

        var loader = new GLTFLoader();

        $.get( path + '/' + sampleName + '.gltf', function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', path + '/' + sampleName + '.bin',
                true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );
            xhr.onload = function () {

                var files = {};
                files[ path + '/' + sampleName + '.gltf' ] = glTF;
                files[ sampleName + '.bin' ] = xhr.response;

                callback( loader, loader.loadGLTF( files ) );
            };
        } );
    };

    var onLoad = function () {
        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setupManipulator();

        //loadSample( 'scenes/brain-stem', 'BrainStem', function ( loader, scene ) {
        loadSample( 'scenes/helmet', 'Helmet', function ( loader, scene ) {
            //loadSample( 'scenes/rigged-simple', 'RiggedSimple', function ( scene ) {
            //loadSample( 'scenes/box-animated', 'BoxAnimated', function ( scene ) {
            //loadSample( 'scenes/cesium-man', 'CesiumMan', function ( scene ) {
            //loadSample( 'scenes/rigged-figure', 'RiggedFigure', function ( scene ) {
            console.log( scene );

            viewer.setSceneData( scene );
            viewer.run();

            for ( var i = 0; i <= 18; ++i ) {
                loader.basicAnimationManager_.playAnimation( 'animation_' + i, true );
            }

            loader.basicAnimationManager_.setTimeFactor( 0.5 );

            window.setTimeout( function () {

                var displayGraph = OSG.osgUtil.DisplayGraph.instance();
                displayGraph.setDisplayGraphRenderer( true );
                displayGraph.createGraph( scene );

                var visitor = new osgUtil.DisplayGeometryVisitor();
                visitor.setSkinningDebug( scene );

            }, 0 );
        } );

    };

    window.addEventListener( 'load', onLoad, true );*/
} )();