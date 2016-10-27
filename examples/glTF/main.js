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
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        'MAT2': 4,
        'MAT3': 9,
        'MAT4': 16
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

    var loadGeometry = function ( meshId, resultMeshNode ) {
        var json = GLTF_FILES[ 'glTF' ];
        var mesh = json.meshes[ meshId ];
        //console.log( mesh );

        var primitives = mesh.primitives;
        var processedPrimitives = new Array( primitives.length );
        for ( var i = 0; i < primitives.length; ++i ) {

            if ( processedPrimitives[ i ] )
                continue;

            var vertexAccessor = json.accessors[ primitives[ i ].attributes.POSITION ];
            var normalAccessor = json.accessors[ primitives[ i ].attributes.NORMAL ];
            var indexAccessor = json.accessors[ primitives[ i ].indices ];

            // Builds the geometry from the extracted vertices & normals
            var g = new osg.Geometry();
            g.getAttributes().Vertex = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, loadAccessorBuffer( vertexAccessor ), TYPE_TABLE[ vertexAccessor.type ] );
            g.getAttributes().Normal = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, loadAccessorBuffer( normalAccessor ), TYPE_TABLE[ normalAccessor.type ] );

            var p = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, new osg.BufferArray( osg.BufferArray.ELEMENT_ARRAY_BUFFER, loadAccessorBuffer( indexAccessor ), 1 ) );
            g.getPrimitives().push( p );

            // Checks whether there are other primitives using
            // the same vertices and normals
            for ( var ii = 0; ii < primitives.length; ++ii ) {

                if ( ii === i || processedPrimitives[ ii ] )
                    continue;

                if ( primitives[ i ].attributes.NORMAL !== primitives[ ii ].attributes.NORMAL ||
                    primitives[ i ].attributes.POSITION !== primitives[ ii ].attributes.POSITION )
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

        var json = GLTF_FILES[ 'glTF' ];
        var node = json.nodes[ nodeId ];

        //console.log( visitedNodes_.get(node) );
        if ( visitedNodes_[ nodeId ] )
            return;

        var parentNode = new osg.Node();

        var i = 0;
        // Recurses on children before processing the current node
        var children = node.children;
        for ( i = 0; i < children.length; ++i ) {
            loadGLTFNode( children[ i ], parentNode );
        }

        // Geometry
        if ( node.hasOwnProperty( 'meshes' ) ) {

            for ( i = 0; i < node.meshes.length; ++i ) {
                var meshNode = new osg.Node();

                // Creates the geometry associated to the mesh
                loadGeometry( node.meshes[ i ], meshNode );
                root.addChild( meshNode );
            }
        }

        // MatrixTransform
        root.addChild(parentNode);
        visitedNodes_[ nodeId ] = true;
    };

    var loadGLTF = function () {
        var root = new osg.Node();

        var json = GLTF_FILES[ 'glTF' ];
        //console.log( json );

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

        $.get( "scenes/brain-stem/BrainStem.gltf", function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', "scenes/brain-stem/BrainStem.bin", true );
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