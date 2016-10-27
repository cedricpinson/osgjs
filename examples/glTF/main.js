( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    //var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    //var osgDB = OSG.osgDB;
    var $ = window.$;

    // Contains all the needed
    // glTF files (.gltf, .bin, etc...)
    var GLTF_FILES = {};

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

    var extractData = function ( accessorId ) {
        var json = GLTF_FILES[ 'glTF' ];
        var accessor = json.accessors[ accessorId ];

        var bufferView = json.bufferViews[ accessor.bufferView ];
        var buffer = json.buffers[ bufferView.buffer ];

        var offset = accessor.byteOffset + bufferView.byteOffset;

        var TypedArray = WEBGL_COMPONENT_TYPES[accessor.componentType];
        return new TypedArray( GLTF_FILES[ buffer.uri ], offset, accessor.count * TYPE_TABLE[ accessor.type] );
    };

    var loadGeometry = function ( meshId, resultMeshNode ) {
        var json = GLTF_FILES[ 'glTF' ];
        var mesh = json.meshes[ meshId ];
        console.log( mesh.name );

        var primitives = mesh.primitives;
        for ( var i = 0; i < primitives.length; ++i ) {
            var normals = extractData( primitives[ i ].attributes.NORMAL );
            var indices = new osg.Float32Array(extractData( primitives[ i ].indices ));
            var vertices = new osg.Float32Array(extractData( primitives[ i ].attributes.POSITION ));

            var g = new osg.Geometry();
            g.getAttributes().Vertex = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, vertices, 3 );
            g.getAttributes().Normal = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 );
            //g.getAttributes().Normal = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 );
            var primitive = new osg.DrawElements( osg.PrimitiveSet.TRIANGLES, new osg.BufferArray( osg.BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1 ) );
            g.getPrimitives().push( primitive );

            resultMeshNode.addChild(g);

            //console.log( indices );
            //console.log( vertices );
        }
    };

    var loadGLTFNode = function ( nodeId ) {
        var resultNode = new osg.Node();

        var json = GLTF_FILES[ 'glTF' ];
        var node = json.nodes[ nodeId ];

        console.log( node );

        // Geometry
        if ( node.hasOwnProperty( 'meshes' ) ) {

            for ( var i = 0; i < node.meshes.length; ++i ) {
                var meshNode = new osg.Node();

                // Creates the geometry associated to the mesh
                loadGeometry( node.meshes[ i ], meshNode );
                resultNode.addChild( meshNode );
            }
        }

        return resultNode;

        // MatrixTransform
    };

    var loadGLTF = function () {
        var root = new osg.Node();

        var json = GLTF_FILES[ 'glTF' ];
        console.log( json );

        // Loops through each scene
        var scenes = json.scenes;
        for ( var sceneId in scenes ) {

            if ( !scenes.hasOwnProperty( sceneId ) )
                continue;

            var scene = scenes[ sceneId ];
            // Loop through each node in current scene
            for ( var i = 0; i < scene.nodes.length; ++i )
                root.addChild(loadGLTFNode( scene.nodes[ i ] ));
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
        $.get( "scenes/box-animated/BoxAnimated.gltf", function ( glTF ) {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', "scenes/box-animated/BoxAnimated.bin", true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );
            xhr.onload = function () {
                GLTF_FILES[ 'glTF' ] = JSON.parse( glTF );
                GLTF_FILES[ 'BoxAnimated.bin' ] = xhr.response;
                viewer.setSceneData( loadGLTF() );
            };
        } );
    };

    window.addEventListener( 'load', onLoad, true );
} )();