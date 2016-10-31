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
    var boneToSkin_ = {};
    var skeletons_ = {};

    var convertibleToSkeleton = function ( node ) {

        var json = GLTF_FILES[ 'glTF' ];

        for ( var i = 0; i < node.children.length; ++i ) {

            var child = json.nodes[ node.children[ i ] ];

            if ( child.jointName )
                return true;

        }

        return false;

    };

    /**
     * Loads a osg.BufferArray from a TypeArray obtained by using a glTF accessor.
     * No memory allocation is done, the result is a subarray obtained from a glTF binary file
     * @param  {Object} accessor
     * @param  {osg.BufferArray.ARRAY_BUFFER | osg.BufferArray.ELEMENT_ARRAY_BUFFER} type WebGL buffer type
     * @return {osg.BufferArray} OSG readable buffer contaning the extracted data
     */
    var loadAccessorBuffer = function ( accessor, type ) {
        var json = GLTF_FILES[ 'glTF' ];

        var bufferView = json.bufferViews[ accessor.bufferView ];
        var buffer = json.buffers[ bufferView.buffer ];

        var offset = accessor.byteOffset + bufferView.byteOffset;

        var TypedArray = WEBGL_COMPONENT_TYPES[ accessor.componentType ];

        var typedArray = new TypedArray( GLTF_FILES[ buffer.uri ], offset, accessor.count * TYPE_TABLE[ accessor.type ] );

        if ( type )
            return new osg.BufferArray( type, typedArray, TYPE_TABLE[ accessor.type ] );

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

        var node = new osg.MatrixTransform();

        // The transform is given under a matrix form
        if ( glTFNode.hasOwnProperty( 'matrix' ) ) {

            osg.mat4.copy( node.getMatrix(), glTFNode.matrix );
            return node;
        }

        // The transform is given under the form
        // translation, rotation, scale
        var scale = glTFNode.scale || osg.vec3.ONE;
        var rot = glTFNode.rotation || osg.quat.IDENTITY;
        var trans = glTFNode.translation || osg.vec3.ZERO;

        osg.mat4.fromRotationTranslationScale( node.getMatrix(), rot, trans, scale );
        return node;
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

    var loadBone = function ( boneId ) {

        var json = GLTF_FILES[ 'glTF' ];
        var node = json.nodes[ boneId ];

        var skin = json.skins[ boneToSkin_[ boneId ] ];
        var inverseBindMatricesAccessor = json.accessors[ skin.inverseBindMatrices ];
        var inverseBindMatrices = loadAccessorBuffer( inverseBindMatricesAccessor, null );

        // Creates the current bone
        // initializing it with initial pose
        for ( var i = 0; i < skin.jointNames.length; ++i )
            if ( skin.jointNames[ i ] === node.jointName )
                break;

        var boneNode = new osgAnimation.Bone( node.jointName );
        boneNode.setInvBindMatrixInSkeletonSpace( inverseBindMatrices.subarray( i * 16, 16 ) );

        return boneNode;
    };

    var createGeometry = function ( primitive, isRiggedGeometry ) {

        var json = GLTF_FILES[ 'glTF' ];

        // Builds the geometry from the extracted vertices & normals
        var g = null;
        if ( !isRiggedGeometry )
            g = new osg.Geometry();
        else {
            g = new osgAnimation.RigGeometry();

            var jointAccessor = json.accessors[ primitive.attributes.JOINT ];
            var weightAccessor = json.accessors[ primitive.attributes.WEIGHT ];

            g.getAttributes().Bones = loadAccessorBuffer( jointAccessor, osg.BufferArray.ARRAY_BUFFER );
            g.getAttributes().Weights = loadAccessorBuffer( weightAccessor, osg.BufferArray.ARRAY_BUFFER );
        }

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

        return g;
    };

    var loadGeometry = function ( meshId, resultMeshNode, isRiggedGeometry ) {
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

            var g = createGeometry( primitive, isRiggedGeometry );
            if ( isRiggedGeometry )
                g.setSkeleton( resultMeshNode );

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
        if ( glTFNode.jointName ) {

            currentNode = loadBone( nodeId );

        } else if ( glTFNode.skeletons ) {

            currentNode = new osgAnimation.Skeleton();
            for ( i = 0; i < glTFNode.skeletons.length; ++i ) {

                var skeletonId = glTFNode.skeletons[ i ];

                if ( !skeletons_[ skeletonId ] ) {
                    loadGLTFNode( skeletonId, currentNode );
                    skeletons_[ skeletonId ] = currentNode.children[ currentNode.children.length - 1 ];
                } else
                    currentNode.addChild( skeletons_[ glTFNode.skeletons[ i ] ] );
            }

        } else {

            if ( !convertibleToSkeleton( glTFNode ) )
                currentNode = loadTransform( glTFNode );
            else
                currentNode = new osgAnimation.Skeleton();
        }
        currentNode.setName( nodeId );

        var children = glTFNode.children;
        // Recurses on children before processing the current node
        for ( i = 0; i < children.length; ++i )
            loadGLTFNode( children[ i ], currentNode );

        // Loads geometry
        if ( glTFNode.meshes && !glTFNode.skeletons ) {

            for ( i = 0; i < glTFNode.meshes.length; ++i )
                loadGeometry( glTFNode.meshes[ i ], currentNode );

        }

        // Loads solid animations
        // by adding an update callback
        if ( animatedNodes_[ nodeId ] )
            registerUpdateCallback( nodeId, currentNode );

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
        if ( json.skins ) {

            var skinsKeys = Object.keys( json.skins );
            for ( i = 0; i < skinsKeys.length; ++i ) {
                var skin = json.skins[ skinsKeys[ i ] ];
                for ( var j = 0; j < skin.jointNames.length; ++j )
                    boneToSkin_[ skin.jointNames[ j ] ] = skinsKeys[ i ];
            }
        }

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

        loadSample( 'scenes/rigged-simple', 'RiggedSimple', function ( scene ) {
            viewer.setSceneData( scene );
            viewer.run();

            //basicAnimationManager_.playAnimation( 'animation_1', true );
        } );

    };


    window.addEventListener( 'load', onLoad, true );
} )();