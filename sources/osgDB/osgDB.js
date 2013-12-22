define( [
    'osg/Utils',
    'vendors/Q',
    'osgDB/Input',
    'osgDB/ReaderParser',
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation'
], function ( MACROUTILS, Q, Input, ReaderParser, osgWrappers, osgAnimationWrappers ) {


    var osgDB = {};
    osgDB.Promise = Q;
    osgDB.Input = Input;
    MACROUTILS.objectMix( osgDB, ReaderParser );
    osgDB.ObjectWrapper.serializers.osg = osgWrappers;
    osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;

    return osgDB;
} );
