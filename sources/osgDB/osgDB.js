define( [
    'osg/Utils',
    'osgDB/Input',
    'osgDB/ReaderParser',
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation'
], function ( MACROUTILS, Input, ReaderParser, osgWrappers, osgAnimationWrappers ) {


    var osgDB = {};
    osgDB.Input = Input;
    MACROUTILS.objectMix( osgDB, ReaderParser );
    osgDB.ObjectWrapper.serializers.osg = osgWrappers;
    osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;

    return osgDB;
} );
