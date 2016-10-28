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

    var loadGeometry = function ( meshId, resultMeshNode ) {
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

            var vertexAccessor = json.accessors[ primitive.attributes.POSITION ];
            var normalAccessor = json.accessors[ primitive.attributes.NORMAL ];

            // Builds the geometry from the extracted vertices & normals
            var g = new osg.Geometry();
            g.getAttributes().Vertex = loadAccessorBuffer( vertexAccessor, osg.BufferArray.ARRAY_BUFFER );
            g.getAttributes().Normal = loadAccessorBuffer( normalAccessor, osg.BufferArray.ARRAY_BUFFER );
            // Adds each TexCoords to the geometry
            for ( ii = 0; ii < attributesKeys.length; ++ii ) {

                if ( !/^TEXCOORD/.test( attributesKeys[ ii ] ) )
                    continue;

                var texCoordId = attributesKeys[ ii ].split( '_' )[ 1 ];
                var textCoordAccessor = json.accessors[ primitive.attributes[ attributesKeys[ ii ] ] ];
                g.getAttributes()[ 'TexCoord' + texCoordId ] = loadAccessorBuffer( textCoordAccessor, osg.BufferArray.ARRAY_BUFFER );
            }

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

        // Node parent containing the [children]
        // of the glTF nodes
        var parentNode = loadTransform( glTFNode );

        var i = 0;
        // Recurses on children before processing the current node
        var children = glTFNode.children;
        for ( i = 0; i < children.length; ++i )
            loadGLTFNode( children[ i ], parentNode );

        // Loads geometry
        if ( glTFNode.meshes ) {

            for ( i = 0; i < glTFNode.meshes.length; ++i ) {
                var meshNode = new osg.Node();

                // Creates the geometry associated to the mesh
                loadGeometry( glTFNode.meshes[ i ], meshNode );
                parentNode.addChild( meshNode );
            }
        }

        // Loads animations
        // by adding an update callback
        if ( animatedNodes_[ nodeId ] ) {

            var animationCallback = new osgAnimation.UpdateMatrixTransform();
            animationCallback.setName( nodeId );

            var translation = osg.vec3.create();
            osg.mat4.getTranslation( translation, parentNode.getMatrix() );

            var rotationQuat = osg.quat.create();
            osg.mat4.getRotation( rotationQuat, parentNode.getMatrix() );

            var scale = osg.vec3.create();
            osg.mat4.getScale( scale, parentNode.getMatrix() );

            var stackedTranslate = new osgAnimation.StackedTranslate( 'translation', translation );
            var stackedRotate = new osgAnimation.StackedQuaternion( 'rotation', rotationQuat );
            var stackedScale = new osgAnimation.StackedScale( 'scale', scale );

            animationCallback.getStackedTransforms().push( stackedTranslate );
            animationCallback.getStackedTransforms().push( stackedRotate );
            animationCallback.getStackedTransforms().push( stackedScale );

            parentNode.addUpdateCallback( animationCallback );
        }

        root.addChild( parentNode );
        visitedNodes_[ nodeId ] = true;
    };

    var loadGLTF = function () {

        // Creates the root node
        // adding a PI / 2 rotation arround the X-axis
        var root = new osg.MatrixTransform();
        osg.mat4.rotateX( root.getMatrix(), root.getMatrix(), Math.PI / 2.0 );

        var json = GLTF_FILES[ 'glTF' ];
        console.log( json );


        // Creates OSG animations from glTF animations
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
            for ( var i = 0; i < scene.nodes.length; ++i )
                loadGLTFNode( scene.nodes[ i ], root );
        }

        if ( basicAnimationManager_ ) {

            /*basicAnimationManager._findAnimationUpdateCallback( root );
            basicAnimationManager._registerTargetFoundInAnimationCallback();
            basicAnimationManager._registerAnimations();*/

            root.addUpdateCallback( basicAnimationManager_ );
        }

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

        loadSample( 'scenes/box-animated', 'BoxAnimated', function ( scene ) {
            viewer.setSceneData( scene );
            viewer.run();

            basicAnimationManager_.playAnimation( 'animation_1', true );
        } );

    };


    window.addEventListener( 'load', onLoad, true );
} )();