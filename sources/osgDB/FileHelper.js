import P from 'bluebird';

import ReaderParser from 'osgDB/readerParser';
import Registry from 'osgDB/Registry';
import requestFile from 'osgDB/requestFile.js';
import notify from 'osg/notify';

// Drag'n Drop file helper
// it also holds a list of basic types per extension to do requests.
var FileHelper = {
    readFileList: function(fileList) {
        var fileName;
        var filesMap = new window.Map();
        var promiseArray = [];
        var i;

        for (i = 0; i < fileList.length; ++i) {
            var ext = fileList[i].name.substr(fileList[i].name.lastIndexOf('.') + 1);
            var readerWriter = Registry.instance().getReaderWriterForExtension(ext);
            // We need a hack for osgjs til it is converted to a readerwriter
            if (readerWriter !== undefined || ext === 'osgjs') {
                // So this is the main file to read
                fileName = fileList[i].name;
            }

            var type = FileHelper.getTypeForExtension(ext);
            promiseArray.push(
                requestFile(fileList[i], {
                    responseType: type
                })
            );
        }

        return P.all(promiseArray).then(function(files) {
            for (i = 0; i < files.length; ++i) {
                filesMap.set(fileList[i].name, files[i]);
            }

            return ReaderParser.readNodeURL(fileName, {
                filesMap: filesMap
            });
        });
    },

    // Adds basic types
    init: function() {
        FileHelper._typesMap = new window.Map();
        // Binary
        FileHelper._typesMap.set('bin', 'arraybuffer');
        FileHelper._typesMap.set('b3dm', 'arraybuffer');
        FileHelper._typesMap.set('glb', 'arraybuffer');
        FileHelper._typesMap.set('zip', 'arraybuffer');
        // Image
        FileHelper._typesMap.set('png', 'blob');
        FileHelper._typesMap.set('jpg', 'blob');
        FileHelper._typesMap.set('jpeg', 'blob');
        FileHelper._typesMap.set('gif', 'blob');
        // Text
        FileHelper._typesMap.set('json', 'string');
        FileHelper._typesMap.set('gltf', 'string');
        FileHelper._typesMap.set('osgjs', 'string');
    },

    // To add user defined types
    addTypeForExtension: function(type, extension) {
        if (!FileHelper._typesMap) FileHelper.init();
        if (FileHelper._typesMap.get(extension) !== undefined) {
            notify.warn("the '" + extension + "' already has a type");
        }
        FileHelper._typesMap.set(extension, type);
    },

    getTypeForExtension: function(extension) {
        if (!FileHelper._typesMap) {
            FileHelper.init();
        }
        return this._typesMap.get(extension);
    }
};

export default FileHelper;
