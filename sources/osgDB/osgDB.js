import utils from 'osg/utils';
import Input from 'osgDB/Input';
import ReaderParser from 'osgDB/readerParser';
import DatabasePager from 'osgDB/DatabasePager';
import osgWrappers from 'osgWrappers/serializers/osg';
import osgAnimationWrappers from 'osgWrappers/serializers/osgAnimation';
import osgTextWrappers from 'osgWrappers/serializers/osgText';
import Registry from 'osgDB/Registry';
import FileHelper from 'osgDB/FileHelper';
import requestFile from 'osgDB/requestFile';
import zlib from 'osgDB/zlib';

var osgDB = {};
osgDB.Input = Input;
utils.objectMix(osgDB, ReaderParser);
osgDB.DatabasePager = DatabasePager;
osgDB.ObjectWrapper.serializers.osg = osgWrappers;
osgDB.ObjectWrapper.serializers.osgAnimation = osgAnimationWrappers;
osgDB.ObjectWrapper.serializers.osgText = osgTextWrappers;
osgDB.Registry = Registry;
osgDB.FileHelper = FileHelper;
osgDB.requestFile = requestFile;

utils.objectMix(osgDB, zlib);

export default osgDB;
