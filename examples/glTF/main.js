( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgAnimation = OSG.osgAnimation;

    var $ = window.$;

    // Mappers to extract data correctly
    var WEBGL_COMPONENT_TYPES = {
        5120: Int8Array,
        5121: Uint8Array,
        5122: Int16Array,
        5123: Uint16Array,
        5125: Uint32Array,
        5126: Float32Array
    };

    var COMPONENT_TYPE_TABLE = {
        5120: 1,
        5121: 1,
        5122: 2,
        5123: 2,
        5126: 4,
    };

    var TYPE_TABLE = {
        SCALAR: 1,
        VEC2: 2,
        VEC3: 3,
        VEC4: 4,
        MAT2: 4,
        MAT3: 9,
        MAT4: 16
    };

    // Contains all the needed glTF files (.gltf, .bin, etc...)
    var GLTF_FILES = {};

    var basicAnimationManager_ = null;

    var visitedNodes_ = {};
    var animatedNodes_ = {};
    var skeletons_ = {};
    var boneToSkin_ = {};
    var skeletonToInfluenceMap_ = {};

    /**
     * Loads a osg.BufferArray from a TypeArray obtained by using a glTF accessor.
     * No memory allocation is done, the result is a subarray obtained from a glTF binary file
     * @param  {Object} accessor
     * @param  {osg.BufferArray.ARRAY_BUFFER | osg.BufferArray.ELEMENT_ARRAY_BUFFER} type WebGL buffer type
     * @return {osg.BufferArray} OSG readable buffer contaning the extracted data
     */
    var loadAccessorBuffer = function ( accessor, type, test ) {
        var json = GLTF_FILES[ 'glTF' ];

        var bufferView = json.bufferViews[ accessor.bufferView ];
        var buffer = json.buffers[ bufferView.buffer ];

        var offset = accessor.byteOffset + bufferView.byteOffset;

        var TypedArray = WEBGL_COMPONENT_TYPES[ accessor.componentType ];

        var typedArray = null;

        if ( test )
            typedArray = new Uint16Array( GLTF_FILES[ buffer.uri ], offset, accessor.count * TYPE_TABLE[ accessor.type ] );
        else
            typedArray = new TypedArray( GLTF_FILES[ buffer.uri ], offset, accessor.count * TYPE_TABLE[ accessor.type ] );

        if ( type && !test)
            return new osg.BufferArray( type, typedArray, TYPE_TABLE[ accessor.type ] );
        else if (test)
            return new osg.BufferArray( type, typedArray, TYPE_TABLE[ accessor.type ], true );

        return typedArray;
    };

    var registerUpdateCallback = function ( callbackName, node ) {

        var animationCallback = new osgAnimation.UpdateMatrixTransform();
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
    };

    /**
     * Creates a MatrixTransform node by using
     * glTF node's properties (matrix, translation, rotation, scale)
     * @param  {Object} glTFNode glTF node
     * @return {OSG.MatrixTransform} MatrixTransform node containing the glTF node transform 
     */
    var loadTransform = function ( glTFNode ) {

        //var node = new osg.MatrixTransform();
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
    };

    /**
     * Loads all the solid animations registering
     * them in a BasicAnimationManager instance
     * @return {BasicAnimationManager} the animation manager containing the animations
     */
    var loadAnimations = function () {

        var json = GLTF_FILES[ 'glTF' ];

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

                var timeAccessor = json.accessors[ glTFAnimParams[ glTFSampler.input ] ];
                var valueAccessor = json.accessors[ glTFAnimParams[ glTFSampler.output ] ];

                var timeKeys = loadAccessorBuffer( timeAccessor, null );
                var valueKeys = loadAccessorBuffer( valueAccessor, null );

                var osgChannel = null;

                if ( TYPE_TABLE[ valueAccessor.type ] === 4 )
                    osgChannel = osgAnimation.Channel.createQuatChannel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );
                else if ( TYPE_TABLE[ valueAccessor.type ] === 3 )
                    osgChannel = osgAnimation.Channel.createVec3Channel( valueKeys, timeKeys, glTFChannel.target.id, glTFSampler.output, null );

                animatedNodes_[ glTFChannel.target.id ] = true;
                osgChannels.push( osgChannel );
            }

            animations.push( osgAnimation.Animation.createAnimation( osgChannels, animationsObjectKeys[ i ] ) );
        }

        animationManager.init( animations );
        return animationManager;
    };

    var loadBone = function ( boneId, skin ) {

        var json = GLTF_FILES[ 'glTF' ];
        var node = json.nodes[ boneId ];

        var inverseBindMatricesAccessor = json.accessors[ skin.inverseBindMatrices ];
        var inverseBindMatrices = loadAccessorBuffer( inverseBindMatricesAccessor, null );

        // Creates the current bone
        // initializing it with initial pose
        for ( var i = 0; i < skin.jointNames.length; ++i )
            if ( skin.jointNames[ i ] === node.jointName )
                break;

        var boneNode = new osgAnimation.Bone( node.jointName );
        boneNode.setInvBindMatrixInSkeletonSpace( inverseBindMatrices.subarray( i * 16, i * 16 + 16 ) );
        boneNode.setMatrixInSkeletonSpace( skin.bindShapeMatrix );

        return boneNode;
    };

    var preprocessSkeletons = function () {

        var json = GLTF_FILES[ 'glTF' ];

        var i;
        var nodeId;
        var node;
        var skin;

        // Maps each bone ID to its skin
        for ( var skinId in json.skins ) {

            skin = json.skins[ skinId ];

            for ( i = 0; i < skin.jointNames.length; ++i ) {
                var jName = skin.jointNames[ i ];

                for ( nodeId in json.nodes ) {

                    node = json.nodes[ nodeId ];

                    if ( node.jointName && node.jointName === jName ) {
                        boneToSkin_[ nodeId ] = skin;
                    }
                }
            }

        }

        // Saves each skeleton in the skeleton map
        for ( nodeId in json.nodes ) {

            node = json.nodes[ nodeId ];

            if ( !node.skeletons )
                continue;

            for ( i = 0; i < node.skeletons.length; ++i ) {

                var rootBoneId;
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

                if ( rootBoneId && !skeletons_[ rootBoneId ] ) {
                    skeletons_[ rootBoneId ] = new osgAnimation.Skeleton();

                    skin = json.skins[ node.skin ];
                    boneToSkin_[ rootBoneId ] = skin;

                    // Builds influence map
                    skeletonToInfluenceMap_[ rootJointId ] = {};
                    for ( var j = 0; j < skin.jointNames.length; j++ )
                        skeletonToInfluenceMap_[ rootJointId ][ skin.jointNames[ j ] ] = skin.jointNames.length - 1 - j;
                }

            }

        }

    };


    var createGeometry = function ( primitive, skeletonJointId ) {

        var json = GLTF_FILES[ 'glTF' ];

        // Builds the geometry from the extracted vertices & normals
        var g = new osg.Geometry();
        var r = null;

        if ( skeletonJointId ) {

            r = new osgAnimation.RigGeometry();
            r._boneNameID = skeletonToInfluenceMap_[ skeletonJointId ];

            var jointAccessor = json.accessors[ primitive.attributes.JOINT ];
            var weightAccessor = json.accessors[ primitive.attributes.WEIGHT ];

            var tmp = loadAccessorBuffer( jointAccessor, osg.BufferArray.ARRAY_BUFFER, true );

            r.getAttributes().Bones = tmp;
            r.getAttributes().Weights = loadAccessorBuffer( weightAccessor, osg.BufferArray.ARRAY_BUFFER );

        }
        /*else {
                   g = new osg.Geometry();
               }*/

        var vertexAccessor = json.accessors[ primitive.attributes.POSITION ];
        var normalAccessor = json.accessors[ primitive.attributes.NORMAL ];

        g.getAttributes().Vertex = loadAccessorBuffer( vertexAccessor, osg.BufferArray.ARRAY_BUFFER );
        g.getAttributes().Normal = loadAccessorBuffer( normalAccessor, osg.BufferArray.ARRAY_BUFFER );

        var attributesKeys = window.Object.keys( primitive.attributes );
        // Adds each TexCoords to the geometry
        for ( var i = 0; i < attributesKeys.length; ++i ) {

            if ( !/^TEXCOORD/.test( attributesKeys[ i ] ) )
                continue;

            var texCoordId = attributesKeys[ i ].split( '_' )[ 1 ];
            var textCoordAccessor = json.accessors[ primitive.attributes[ attributesKeys[ i ] ] ];
            g.getAttributes()[ 'TexCoord' + texCoordId ] = loadAccessorBuffer( textCoordAccessor, osg.BufferArray.ARRAY_BUFFER );
        }

        if ( skeletonJointId ) {
            r.setSourceGeometry( g );
            r.mergeChildrenData();
            return r;
        }


        return g;
    };

    var loadGeometry = function ( meshId, resultMeshNode, skeletonJointId ) {
        var json = GLTF_FILES[ 'glTF' ];
        var mesh = json.meshes[ meshId ];

        var ii = 0;

        var primitives = mesh.primitives;
        var processedPrimitives = new Array( primitives.length );
        for ( var i = 0; i < primitives.length; ++i ) {

            if ( processedPrimitives[ i ] )
                continue;

            var primitive = primitives[ i ];
            var attributesKeys = window.Object.keys( primitive.attributes );

            var g = createGeometry( primitive, skeletonJointId );

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
                    targetAttributesKeys.length !== attributesKeys.length )
                    continue;

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
                var osgPrimitive = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, loadAccessorBuffer( indicesAccessor, osg.BufferArray.ELEMENT_ARRAY_BUFFER ) );
                g.getPrimitives().push( osgPrimitive );

                processedPrimitives[ ii ] = true;
            }
            processedPrimitives[ i ] = true;

            resultMeshNode.addChild( g );
        }
    };

    var loadGLTFNode = function ( nodeId, root ) {

        if ( visitedNodes_[ nodeId ] )
            return;

        var json = GLTF_FILES[ 'glTF' ];
        var glTFNode = json.nodes[ nodeId ];

        var i = 0;

        // Creates either a bone or a matrix transform
        // according to the glTF node
        var currentNode = null;
        if ( skeletons_[ nodeId ] ) {
            // Creates the root bone and adds it
            // to the previously created skeleton
            var skeleton = skeletons_[ nodeId ];
            currentNode = loadBone( nodeId, boneToSkin_[ nodeId ] );
            skeleton.addChild( currentNode );
            // Adds the skeleton and the bone hierarchy
            // to the local parent node
            root.addChild( skeleton );
        } else if ( glTFNode.jointName ) {
            currentNode = loadBone( nodeId, boneToSkin_[ nodeId ] );
        } else {
            currentNode = new osg.MatrixTransform();
        }
        currentNode.setName( nodeId );
        osg.mat4.copy( currentNode.getMatrix(), loadTransform( glTFNode ) );

        var children = glTFNode.children;
        // Recurses on children before processing the current node
        for ( i = 0; i < children.length; ++i )
            loadGLTFNode( children[ i ], currentNode );

        // Loads geometry
        if ( glTFNode.meshes ) {

            for ( i = 0; i < glTFNode.meshes.length; ++i ) {

                if ( !glTFNode.skeletons ) {
                    loadGeometry( glTFNode.meshes[ i ], currentNode, null );
                    continue;
                }

                for ( var j = 0; j < glTFNode.skeletons.length; ++j ) {

                    var skin = boneToSkin_[ glTFNode.skeletons[ j ] ];
                    var skeletonNode = skeletons_[ glTFNode.skeletons[ j ] ];

                    var meshTransformNode = new osg.MatrixTransform();
                    osg.mat4.copy( meshTransformNode.getMatrix(), currentNode.getMatrix() );

                    //loadGeometry( glTFNode.meshes[ i ], skeletonNode, glTFNode.skeletons[ j ] );
                    loadGeometry( glTFNode.meshes[ i ], meshTransformNode, glTFNode.skeletons[ j ] );

                    skeletonNode.addChild( meshTransformNode );
                }

            }

        }

        // Loads solid animations
        // by adding an update callback
        if ( animatedNodes_[ nodeId ] )
            registerUpdateCallback( nodeId, currentNode );

        if ( !skeletons_[ nodeId ] )
            root.addChild( currentNode );

        visitedNodes_[ nodeId ] = true;
    };

    var loadGLTF = function () {

        // Creates the root node
        // adding a PI / 2 rotation arround the X-axis
        var root = new osg.MatrixTransform();
        root.setName( 'root' );

        osg.mat4.rotateX( root.getMatrix(), root.getMatrix(), Math.PI / 2.0 );

        var json = GLTF_FILES[ 'glTF' ];
        console.log( json );

        var i;

        // Preprocesses skin animations if any
        if ( json.skins )
            preprocessSkeletons();

        // Preprocesses animations
        if ( Object.keys( json.animations ).length > 0 )
            basicAnimationManager_ = loadAnimations();

        // Loops through each scene
        // loading geometry nodes, transform nodes, etc...s
        var scenes = json.scenes;
        for ( var sceneId in scenes ) {

            if ( !scenes[ sceneId ] )
                continue;

            var scene = scenes[ sceneId ];

            // Creates OSG nodes from glTF nodes
            for ( i = 0; i < scene.nodes.length; ++i )
                loadGLTFNode( scene.nodes[ i ], root );
        }

        // Register the animation manager
        // if the glTF file contains animations
        if ( basicAnimationManager_ )
            root.addUpdateCallback( basicAnimationManager_ );

        return root;
    };

    var loadSample = function ( path, sampleName, callback ) {

        $.get( path + '/' + sampleName + '.gltf', function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', path + '/' + sampleName + '.bin', true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );
            xhr.onload = function () {
                GLTF_FILES[ 'glTF' ] = JSON.parse( glTF );
                GLTF_FILES[ sampleName + '.bin' ] = xhr.response;

                callback( loadGLTF() );
            };
        } );
    };

    var onLoad = function () {
        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setupManipulator();

        loadSample( 'scenes/brain-stem', 'BrainStem', function ( scene ) {
            console.log( scene );
            viewer.setSceneData( scene );
            viewer.run();

            var displayGraph = OSG.osgUtil.DisplayGraph.instance();
            displayGraph.setDisplayGraphRenderer( true );
            displayGraph.createGraph( scene );

            //basicAnimationManager_.playAnimation( 'animation_0', true );
        } );

    };


    window.addEventListener( 'load', onLoad, true );
} )();