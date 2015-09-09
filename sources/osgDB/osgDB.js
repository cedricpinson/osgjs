define( [
    'osg/Utils',
    'osgDB/Input',
    'osgDB/ReaderParser',
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation',
    'osgDB/DatabasePager'
], function ( MACROUTILS, Input, ReaderParser, osgWrappers, osgAnimationWrappers, DatabasePager ) {


    var osgDB = {};
    osgDB.Input = Input;
    MACROUTILS.objectMix( osgDB, ReaderParser );
    osgDB.ObjectWrapper.serializers.osg = osgWrappers;
    osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;
    osgDB.DatabasePager = DatabasePager;
    return osgDB;
} );
