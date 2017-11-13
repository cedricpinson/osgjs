import P from 'bluebird';
import notify from 'osg/notify';
import fileHelper from 'osgDB/fileHelper.js';
import Registry from 'osgDB/Registry';
import ReaderParser from 'osgDB/readerParser';
var JSZip = window.JSZip;

var ReaderWriterZIP = function() {
    this._options = undefined;
    this._filesMap = new window.Map();
    this._fileName = ''; // The file containing the model of the archive ( gltf, glb, osgjs, b3dm, etc )
};

ReaderWriterZIP.prototype = {
    readNodeURL: function(url, options) {
        if (JSZip === undefined) {
            notify.error('You need to add JSZip as a dependency');
            return P.reject(this);
        }
        notify.log('starting to read: ' + url);
        // Check if we already have the file
        var self = this;
        if (options && options.filesMap !== undefined) {
            // it comes  from drag'n drop
            if (options.filesMap.has(url)) {
                // Now url is a File
                var file = options.filesMap.get(url);
                return this.readZipFile(file).then( function() {
                    if (!self._fileName) return P.reject(self);
                    // At this point we have the main file name and a Map containing all the resources
                    return ReaderParser.readNodeURL(self._fileName, {
                        filesMap: self._filesMap
                    });
                });
            }
        }

        var filePromise = fileHelper.requestURI(url, {
            responseType: 'blob'
        });

        return filePromise.then(function(zfile) {
            self.readZipFile(zfile).then(function() {
                // At this point we have the main file name and a Map containing all the resources
                return ReaderParser.readNodeURL(self._fileName, {
                    filesMap: self._filesMap
                });
            });
        });
    },

    readZipFile: function(fileOrBlob) {
        fileHelper.unzipFile(fileOrBlob).then(
            function(filesMap) {
                for (var fileName in filesMap) {
                    var extension = fileHelper.getExtension(fileName);
                    // Check if the file is readable by any osgDB plugin
                    var readerWriter = Registry.instance().getReaderWriterForExtension(extension);

                    // We need a hack for osgjs til it is converted to a readerwriter
                    if (readerWriter !== undefined || extension === 'osgjs') {
                        // So this is the main file to read
                        this._fileName = fileName;
                        break;
                    }
                }
            }.bind(this)
        );
    }
};

Registry.instance().addReaderWriter('zip', new ReaderWriterZIP());

export default ReaderWriterZIP;
