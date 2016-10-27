( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    //var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    //var osgDB = OSG.osgDB;
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

    var visitedNodes_ = {};

    var loadAccessorBuffer = function ( accessor ) {
        var json = GLTF_FILES[ 'glTF' ];

        var bufferView = json.bufferViews[ accessor.bufferView ];
        var buffer = json.buffers[ bufferView.buffer ];

        var offset = accessor.byteOffset + bufferView.byteOffset;

        var TypedArray = WEBGL_COMPONENT_TYPES[ accessor.componentType ];
        return new TypedArray( GLTF_FILES[ buffer.uri ], offset, accessor.count * TYPE_TABLE[ accessor.type ] );
    };

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

    var loadGeometry = function ( meshId, resultMeshNode ) {
        var json = GLTF_FILES[ 'glTF' ];
        var mesh = json.meshes[ meshId ];
        //console.log( mesh );

        var primitives = mesh.primitives;
        var processedPrimitives = new Array( primitives.length );
        for ( var i = 0; i < primitives.length; ++i ) {

            if ( processedPrimitives[ i ] )
                continue;

            console.log( primitives[ i ] );
            var primitiveAttributes = primitives[ i ].attributes;

            var vertexAccessor = json.accessors[ primitiveAttributes.POSITION ];
            var normalAccessor = json.accessors[ primitiveAttributes.NORMAL ];
            var indexAccessor = json.accessors[ primitives[ i ].indices ];

            // Builds the geometry from the extracted vertices & normals
            var g = new osg.Geometry();
            g.getAttributes().Vertex = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, loadAccessorBuffer( vertexAccessor ), TYPE_TABLE[ vertexAccessor.type ] );
            g.getAttributes().Normal = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, loadAccessorBuffer( normalAccessor ), TYPE_TABLE[ normalAccessor.type ] );

            var p = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, new osg.BufferArray( osg.BufferArray.ELEMENT_ARRAY_BUFFER, loadAccessorBuffer( indexAccessor ), 1 ) );
            g.getPrimitives().push( p );

            var attributesKeys = window.Object.keys( primitiveAttributes );
            // Checks whether there are other primitives using
            // the same vertices and normals
            for ( var ii = 0; ii < primitives.length; ++ii ) {

                if ( ii === i || processedPrimitives[ ii ])
                    continue;

                var targetAttributeKeys = window.Object.keys( primitives[ ii ].attributes );

                // Primitives are non-mergeable if the materials or the
                // attributes are different among them
                if ( primitives[ ii ].material !== primitives[ i ].material ||
                    targetAttributeKeys.length !== attributesKeys.length )
                    continue;

                var mergePossible = true;
                for ( var j = 0; j < attributesKeys.length; ++j ) {

                    if ( attributesKeys[ j ] !== targetAttributeKeys[ j ] ||
                        primitives[ i ].attributes[ attributesKeys[ j ] ] !== primitives[ ii ].attributes[ attributesKeys[ j ] ] ) {
                        mergePossible = false;
                        break;
                    }

                }

                if ( !mergePossible )
                    continue;

                var indices = loadAccessorBuffer( json.accessors[ primitives[ ii ].indices ] );
                var primitive = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, new osg.BufferArray( osg.BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1 ) );
                g.getPrimitives().push( primitive );

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

        var parentNode = loadTransform( glTFNode );

        var i = 0;
        // Recurses on children before processing the current node
        var children = glTFNode.children;
        for ( i = 0; i < children.length; ++i )
            loadGLTFNode( children[ i ], parentNode );

        // Geometry
        if ( glTFNode.hasOwnProperty( 'meshes' ) ) {

            for ( i = 0; i < glTFNode.meshes.length; ++i ) {
                var meshNode = new osg.Node();

                // Creates the geometry associated to the mesh
                loadGeometry( glTFNode.meshes[ i ], meshNode );
                root.addChild( meshNode );
            }
        }

        // MatrixTransform
        root.addChild( parentNode );
        visitedNodes_[ nodeId ] = true;
    };

    var loadGLTF = function () {

        // Creates the root node
        // adding a PI / 2 rotation arround the X-axis
        var root = new osg.MatrixTransform();
        osg.mat4.rotateX( root.getMatrix(), root.getMatrix(), Math.PI / 2.0 );

        var json = GLTF_FILES[ 'glTF' ];

        // Loops through each scene
        var scenes = json.scenes;
        for ( var sceneId in scenes ) {

            if ( !scenes.hasOwnProperty( sceneId ) )
                continue;

            var scene = scenes[ sceneId ];
            // Loop through each node in current scene
            for ( var i = 0; i < scene.nodes.length; ++i ) {
                loadGLTFNode( scene.nodes[ i ], root );
            }
        }

        return root;
    };

    var onLoad = function () {
        var canvas = document.getElementById( 'View' );

        var viewer = new osgViewer.Viewer( canvas );
        viewer.init();
        viewer.setupManipulator();
        viewer.run();

        // Gets the glTF files
        /*$.get( "scenes/box-animated/BoxAnimated.gltf", function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', "scenes/box-animated/BoxAnimated.bin", true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );
            xhr.onload = function () {
                GLTF_FILES[ 'glTF' ] = JSON.parse( glTF );
                GLTF_FILES[ 'BoxAnimated.bin' ] = xhr.response;
                viewer.setSceneData( loadGLTF() );
            };
        } );*/

        $.get( 'scenes/brain-stem/BrainStem.gltf', function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', 'scenes/brain-stem/BrainStem.bin', true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );
            xhr.onload = function () {
                GLTF_FILES[ 'glTF' ] = JSON.parse( glTF );
                GLTF_FILES[ 'BrainStem.bin' ] = xhr.response;
                viewer.setSceneData( loadGLTF() );
            };
        } );

    };

    window.addEventListener( 'load', onLoad, true );
} )();