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

    var COMPONENT_TYPE_TABLE = {
        5120: 'BYTE',
        5121: 'UNSIGNED_BYTE',
        5122: 'SHORT',
        5123: 'UNSIGNED_SHORT',
        5126: 'FLOAT',
    };

    var loadGeometry = function ( meshId ) {
        var geometry = new osg.Geometry();

        var json = GLTF_FILES[ 'glTF' ];
        var mesh = json.meshes[ meshId ];

        var primitives = mesh.primitives;
        for ( var j = 0; j < primitives.length; ++j ) {
            var normalAccessor = json.accessors[ primitives[ j ].attributes.NORMAL ];
            var positionAccessor = json.accessors[ primitives[ j ].attributes.POSITION ];
            // texCoords accessors

            //var normalBufferView = json.bufferViews[normalAccessor.bufferView];
            var positionBufferView = json.bufferViews[ positionAccessor.bufferView ];
            var positionBuffer = json.buffers[ positionBufferView.buffer ];

        }

        return geometry;
    };

    var loadGLTFNode = function ( nodeId ) {
        var json = GLTF_FILES[ 'glTF' ];
        var node = json.nodes[ nodeId ];

        //console.log( node );

        // Geometry
        if ( node.hasOwnProperty( 'meshes' ) ) {

            for ( var i = 0; i < node.meshes.length; ++i )
            // Creates the geometry associated to the mesh
                var geometry = loadGeometry( node.meshes[ i ] );
        }

        // MatrixTransform
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
            for ( var i = 0; i < scene.nodes.length; ++i )
                loadGLTFNode( scene.nodes[ i ] );
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
            $.get( "scenes/box-animated/BoxAnimated.bin", function ( bin ) {
                GLTF_FILES[ 'glTF' ] = JSON.parse( glTF );
                GLTF_FILES[ 'BoxAnimated.bin' ] = bin;
                viewer.setSceneData( loadGLTF() );
            } );
        } );
    };

    window.addEventListener( 'load', onLoad, true );
} )();