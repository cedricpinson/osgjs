define( [
    'osg/Utils',
    'osgDB/Input',
    'osgDB/ReaderParser',
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation',
    'osgWrappers/serializers/osgText'
], function ( MACROUTILS, Input, ReaderParser, osgWrappers, osgAnimationWrappers, osgTextWrappers ) {


    var osgDB = {};
    osgDB.Input = Input;
    MACROUTILS.objectMix( osgDB, ReaderParser );
    osgDB.ObjectWrapper.serializers.osg = osgWrappers;
    osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;
    osgDB.ObjectWrapper.serializers.osgText = osgTextWrappers;
    return osgDB;
} );
