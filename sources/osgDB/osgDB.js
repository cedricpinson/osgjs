define( [
    'osg/Utils',
    'osgDB/Input',
    'osgDB/ReaderParser',
    'osgDB/DatabasePager',
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation',
    'osgWrappers/serializers/osgText'
], function ( MACROUTILS, Input, ReaderParser, DatabasePager, osgWrappers, osgAnimationWrappers, osgTextWrappers ) {

    var osgDB = {};
    osgDB.Input = Input;
    MACROUTILS.objectMix( osgDB, ReaderParser );
    osgDB.DatabasePager = DatabasePager;
    osgDB.ObjectWrapper.serializers.osg = osgWrappers;
    osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;
    osgDB.ObjectWrapper.serializers.osgText = osgTextWrappers;

    return osgDB;
} );
