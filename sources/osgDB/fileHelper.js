import P from 'bluebird';

import readerParser from 'osgDB/readerParser';
import Registry from 'osgDB/Registry';
import requestFile from 'osgDB/requestFile.js';
import notify from 'osg/notify';

var isString = function(str) {
    return typeof str === 'string' || str instanceof String;
};

var isBlobURL = function(str) {
    return str.substr(0, 9) === 'blob:http';
};

var isHttpURL = function(str) {
    return str.substr(0, 7) === 'http://' || str.substr(0, 8) === 'https://';
};

var isURL = function(str) {
    if (!isString(str)) return false;

    return isBlobURL(str) || isHttpURL(str);
};

var zip = window.zip;

var mimeTypes = new window.Map();

var createImageFromURL = function(url) {
    return new P(function(resolve, reject) {
        var img = new window.Image();
        img.onerror = function() {
            reject(img);
        };

        img.onload = function() {
            resolve(img);
        };
        img.src = url;
    });
};

var createImageFromBlob = function(blob) {
    var privateURL = window.URL.createObjectURL(blob);
    var promise = createImageFromURL(privateURL);

    promise.finally(function() {
        window.URL.revokeObjectURL(privateURL);
    });
    return promise;
};

var createArrayBufferFromBlob = function(blob) {
    return new P(function(resolve, reject) {
        var fr = new window.FileReader();

        fr.onerror = function() {
            reject(fr);
        };

        fr.onload = function() {
            resolve(this.result);
        };
        fr.readAsArrayBuffer(blob);
    });
};

var createArrayBufferFromURL = function(url) {
    return requestFile(url, {
        responseType: 'arraybuffer'
    });
};

var createJSONFromURL = function(url) {
    return requestFile(url).then(function(string) {
        return JSON.parse(string);
    });
};

var createJSONFromString = function(str) {
    var obj = JSON.parse(str);
    return P.resolve(obj);
};

var fileHelper = {
    createJSONFromURL: createJSONFromURL,
    createArrayBufferFromURL: createArrayBufferFromURL,
    createArrayBufferFromBlob: createArrayBufferFromBlob,
    createImageFromBlob: createImageFromBlob,
    createImageFromURL: createImageFromURL,

    requestURI: requestFile,
    requestResource: function(uri, options) {
        var extension = fileHelper.getExtension(uri);
        var mimetype = fileHelper.getMimeType(extension);

        var responseType =
            options && options.responseType ? options.responseType.toLowerCase() : undefined;
        if (responseType) return requestFile(uri, options);

        if (mimetype) {
            if (mimetype.match('image')) return createImageFromURL(uri);
            else if (mimetype.match('binary')) return createArrayBufferFromURL(uri);
            else if (mimetype.match('json')) return createJSONFromURL(uri);
            else if (mimetype.match('text')) return requestFile(uri);
        }

        return requestFile(uri);
    },

    //     file.png :  url          -> fetch/createImage            ->   Image
    //     file.png :  blob         -> createImage                  ->   Image
    //     file.png :  Image        -> passthroug                   ->   Image
    //     file.txt :  blob         -> FileReader                   ->   String
    //     file.txt :  string       -> passthroug                   ->   String
    //     file.txt :  url          -> fetch                        ->   String
    //     file.json:  string       -> JSON.parse                   ->   Object
    //     file.json:  url          -> fetch/JSON.parse             ->   Object
    //     file.json:  blob         -> FileReader/JSON.parse        ->   Object
    //     file.bin :  blob         -> FileReader/readAsArrayBuffer ->   arrayBuffer
    //     file.bin :  url          -> fetch as arra yBuffer        ->   arrayBuffer
    //     file.bin :  arrayBuffer  -> passthroug                   ->   arrayBuffer
    resolveData: function(uri, data) {
        var extension = fileHelper.getExtension(uri);
        var mimetype = fileHelper.getMimeType(extension);
        var createData;

        if (mimetype) {
            if (mimetype.match('image')) {
                if (isString(data)) createData = createImageFromURL;
                else if (data instanceof window.Blob) createData = createImageFromBlob;
            } else if (mimetype.match('json')) {
                if (isURL(data)) createData = createJSONFromURL;
                else createData = createJSONFromString;
            } else if (mimetype.match('binary')) {
                if (isString(data)) createData = createArrayBufferFromURL;
                else if (data instanceof window.Blob) createData = createArrayBufferFromBlob;
            }
        }

        var promise;
        if (createData) {
            promise = createData(data);
        } else {
            promise = P.resolve(data);
        }
        return promise;
    },

    resolveFilesMap: function(filesMap) {
        var promises = [];

        for (var filename in filesMap) {
            var data = filesMap[filename];
            var promise = fileHelper.resolveData(filename, data).then(
                function(fname, dataResolved) {
                    this[fname] = dataResolved;
                }.bind(filesMap, filename)
            );
            promises.push(promise);
        }

        return P.all(promises).then(function() {
            return filesMap;
        });
    },

    _unzipEntry: function(entry) {
        return new P(function(resolve) {
            var filename = entry.filename;
            var extension = fileHelper.getExtension(filename);
            var mimetype = fileHelper.getMimeType(extension);

            var Writer = zip.BlobWriter;
            if (mimetype.match('text') !== null || mimetype.match('json') !== null)
                Writer = zip.TextWriter;
            // get data from the first file
            entry.getData(new Writer(mimetype), function(data) {
                resolve({
                    filename: filename,
                    data: data
                });
            });
        });
    },

    unzipBlob: function(blob) {
        return new P(function(resolve, reject) {
            // use a zip.BlobReader object to read zipped data stored into blob variable
            var filesMap = {};
            var filePromises = [];
            zip.createReader(
                new zip.BlobReader(blob),
                function(zipReader) {
                    // get entries from the zip file
                    zipReader.getEntries(function(entries) {
                        for (var i = 0; i < entries.length; i++) {
                            if (entries[i].directory) continue;

                            var promise = fileHelper._unzipEntry(entries[i]);
                            promise.then(function(result) {
                                filesMap[result.filename] = result.data;
                            });
                            filePromises.push(promise);
                        }

                        P.all(filePromises).then(function() {
                            zipReader.close();
                            fileHelper.resolveFilesMap(filesMap).then(function(filesMapResolved) {
                                resolve(filesMapResolved);
                            });
                        });
                    });
                },
                function() {
                    reject(this);
                }
            );
        });
    },

    unzip: function(input) {
        if (!window.zip)
            return P.reject(
                'missing deps to unzip, require https://github.com/gildas-lormeau/zip.js'
            );

        if (isString(input)) {
            return fileHelper.requestResource(input).then(function(arrayBuffer) {
                var blob = new window.Blob([arrayBuffer], { type: mimeTypes.get('zip') });
                return fileHelper.unzipBlob(blob);
            });
        } else if (input instanceof window.Blob) {
            return fileHelper.unzipBlob(input);
        } else if (input instanceof window.ArrayBuffer) {
            var blob = new window.Blob([input], { type: mimeTypes.get('zip') });
            return fileHelper.unzipBlob(blob);
        }
        return P.reject('cant unzip input');
    },

    readFileList: function(fileList) {
        var fileName;
        var filesMap = {};
        var promiseArray = [];
        var i;

        for (i = 0; i < fileList.length; ++i) {
            var ext = fileHelper.getExtension(fileList[i].name);
            var readerWriter = Registry.instance().getReaderWriterForExtension(ext);
            // We need a hack for osgjs til it is converted to a readerwriter
            if (readerWriter !== undefined || ext === 'osgjs') {
                // So this is the main file to read
                fileName = fileList[i].name;
            }

            var mimeType = fileHelper.getMimeType(ext);
            var type;
            if (mimeType.match('image')) type = 'blob';
            else if (mimeType.match('json') || mimeType.match('text')) type = 'string';
            else type = 'arraybuffer';

            promiseArray.push(
                requestFile(fileList[i], {
                    responseType: type
                })
            );
        }

        return P.all(promiseArray).then(function(files) {
            for (i = 0; i < files.length; ++i) {
                filesMap[fileList[i].name] = files[i];
            }
            return fileHelper.resolveFilesMap(filesMap).then(function(filesMapResolved) {
                return readerParser.readNodeURL(fileName, {
                    filesMap: filesMapResolved
                });
            });
        });
    },

    getMimeType: function(extension) {
        return mimeTypes.get(extension);
    },

    getExtension: function(url) {
        return url.substr(url.lastIndexOf('.') + 1);
    },

    addMimeTypeForExtension: function(extension, mimeType) {
        if (mimeTypes.has(extension) !== undefined) {
            notify.warn(
                "the '" + extension + "' already has a mimetype: " + mimeTypes.get(extension)
            );
        }
        mimeTypes.set(extension, mimeType);
    }
};

mimeTypes.set('bin', 'application/octet-binary');
mimeTypes.set('b3dm', 'application/octet-binary');
mimeTypes.set('glb', 'application/octet-binary');
mimeTypes.set('zip', 'application/octet-binary');
mimeTypes.set('gz', 'application/octet-binary');
// Image
mimeTypes.set('png', 'image/png');
mimeTypes.set('jpg', 'image/jpeg');
mimeTypes.set('jpeg', 'image/jpeg');
mimeTypes.set('gif', 'image/gif');
// Text
mimeTypes.set('json', 'application/json');
mimeTypes.set('gltf', 'application/json');
mimeTypes.set('osgjs', 'application/json');
mimeTypes.set('txt', 'text/plain');
mimeTypes.set('glsl', 'text/plain');

export default fileHelper;
