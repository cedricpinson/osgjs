define( [
    'osgNameSpace',
    'osg/osg',
    'osgAnimation/osgAnimation',
    'osgDB/osgDB',
    'osgGA/osgGA',
    'osgUtil/osgUtil',
    'osgViewer/osgViewer'
], function ( osgNameSpace, osg, osgAnimation, osgDB, osgGA, osgUtil, osgViewer ) {

    var openSceneGraph = osgNameSpace;

    openSceneGraph.version = '0.0.9';
    openSceneGraph.copyright = 'Cedric Pinson - trigrou@gmail.com';

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
