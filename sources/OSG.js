define( [
    'osgNameSpace',
    'osg/osg',
    'osgAnimation/osgAnimation',
    'osgDB/osgDB',
    'osgGA/osgGA',
    'osgUtil/osgUtil',
    'osgViewer/osgViewer',
    'osgShader/osgShader',
    'osgShadow/osgShadow'
], function ( osgNameSpace, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer, osgShader, osgShadow ) {
    'use strict';

    var openSceneGraph = osgNameSpace;

    openSceneGraph.osg = osg;
    openSceneGraph.osgAnimation = osgAnimation;
    openSceneGraph.osgDB = osgDB;
    openSceneGraph.osgGA = osgGA;
    openSceneGraph.osgUtil = osgUtil;
    openSceneGraph.osgViewer = osgViewer;
    openSceneGraph.osgShader = osgShader;
    openSceneGraph.osgShadow = osgShadow;

    var namespaces = [ 'osg', 'osgAnimation', 'osgDB', 'osgGA', 'osgUtil', 'osgViewer', 'osgShader', 'osgShadow' ];

    // for backward compatibility
    openSceneGraph.globalify = function () {
        namespaces.forEach( function ( namespace ) {
            window[ namespace ] = openSceneGraph[ namespace ];
        } );
    };

    return openSceneGraph;
} );
