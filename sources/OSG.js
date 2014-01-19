define( [
    'osgNameSpace',
    'osg/osg',
    'osgAnimation/osgAnimation',
    'osgDB/osgDB',
    'osgGA/osgGA',
    'osgUtil/osgUtil',
    'osgViewer/osgViewer'
], function ( osgNameSpace, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {


    /*jshint unused: true */
    var Q = require('Q');
    /*jshint unused: false */
    var openSceneGraph = osgNameSpace;

    openSceneGraph.osg = osg;
    openSceneGraph.osgAnimation = osgAnimation;
    openSceneGraph.osgDB = osgDB;
    openSceneGraph.osgGA = osgGA;
    openSceneGraph.osgUtil = osgUtil;
    openSceneGraph.osgViewer = osgViewer;

    var namespaces = [ 'osg', 'osgAnimation', 'osgDB', 'osgGA', 'osgUtil', 'osgViewer' ];

    // for backward compatibility
    openSceneGraph.globalify = function () {
        namespaces.forEach( function ( namespace ) {
            window[ namespace ] = openSceneGraph[ namespace ];
        } );
    };

    return openSceneGraph;
} );
