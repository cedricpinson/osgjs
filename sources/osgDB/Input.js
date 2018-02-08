import P from 'bluebird';
import utils from 'osg/utils';
import osgNameSpace from 'osgNameSpace';
import _requestFile from 'osgDB/requestFile';
import Options from 'osgDB/options';
import zlib from 'osgDB/zlib';
import notify from 'osg/notify';
import Image from 'osg/Image';
import BufferArray from 'osg/BufferArray';
import DrawArrays from 'osg/DrawArrays';
import DrawArrayLengths from 'osg/DrawArrayLengths';
import DrawElements from 'osg/DrawElements';
import primitiveSet from 'osg/primitiveSet';

var rejectObject = utils.rejectObject;

var Input = function (json, identifier) {
    this._json = json;
    var map = identifier;
    if (map === undefined) {
        map = {};
    }
    this._identifierMap = map;
    this._objectRegistry = {};

    this._cacheReadObject = {}; //wrappers

    // this._progressXHRCallback = undefined;
    // this._prefixURL = '';
    // this.setImageLoadingOptions( {
    //     promise: true,
    //     onload: undefined
    // } );

    this.setOptions(utils.objectMix({}, Options));

    // {
    //     prefixURL: '',
    //     progressXHRCallback: undefined,
    //     readImageURL: undefined,
    //     imageLoadingUsePromise: undefined,
    //     imageOnload: undefined,
    // };
};

// keep one instance of image fallback
if (!Input.imageFallback) {
    Input.imageFallback = (function () {
        var fallback = new window.Image();
        fallback.src =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';
        return fallback;
    })();
}

Input.prototype = {
    clone: function () {
        var input = new Input();
        input._objectRegistry = this._objectRegistry;
        input._cacheReadObject = this._cacheReadObject;
        return input;
    },

    setOptions: function (options) {
        this._defaultOptions = options;
    },
    getOptions: function () {
        return this._defaultOptions;
    },
    setProgressXHRCallback: function (func) {
        this._defaultOptions.progressXHRCallback = func;
    },
    setReadNodeURLCallback: function (func) {
        this._defaultOptions.readNodeURL = func;
    },
    // used to override the type from pathname
    // typically if you want to create proxy object
    registerObject: function (fullyQualifiedObjectname, constructor) {
        this._objectRegistry[fullyQualifiedObjectname] = constructor;
    },

    getJSON: function () {
        return this._json;
    },

    setJSON: function (json) {
        this._json = json;
        return this;
    },

    setPrefixURL: function (prefix) {
        this._defaultOptions.prefixURL = prefix;
    },

    getPrefixURL: function () {
        return this._defaultOptions.prefixURL;
    },

    setDatabasePath: function (path) {
        this._defaultOptions.databasePath = path;
    },

    getDatabasePath: function () {
        return this._defaultOptions.databasePath;
    },

    computeURL: function (url) {
        if (
            typeof this._defaultOptions.prefixURL === 'string' &&
            this._defaultOptions.prefixURL.length > 0
        ) {
            return this._defaultOptions.prefixURL + url;
        }

        return url;
    },

    requestFile: function (url, options) {
        return _requestFile(url, options);
    },

    getObjectWrapper: function (path) {
        if (this._objectRegistry[path]) {
            return new this._objectRegistry[path]();
        }

        var scope = osgNameSpace;
        var splittedPath = path.split('.');
        for (var i = 0, l = splittedPath.length; i < l; i++) {
            var obj = scope[splittedPath[i]];
            if (obj === undefined) {
                return undefined;
            }
            scope = obj;
        }
        this._objectRegistry[path] = scope;
        // create the new obj
        return new scope();
    },

    fetchImage: function (image, url, options) {
        var checkInlineImage = 'data:image/';
        // crossOrigin does not work for inline data image
        var isInlineImage = url.substring(0, checkInlineImage.length) === checkInlineImage;
        var img = new window.Image();
        if (!isInlineImage && options.imageCrossOrigin) {
            img.crossOrigin = options.imageCrossOrigin;
        }
        image.setURL(url);
        image.setImage(img);
        img.src = url;

        return new P(function (resolve) {
            img.onerror = function () {
                notify.warn('warning use white texture as fallback instead of ' + url);
                image.setImage(Input.imageFallback);
                resolve(image);
            };

            img.onload = function () {
                if (options.imageOnload) options.imageOnload.call(image);
                resolve(image);
            };
        });
    },

    getruldds: function (buffer, loadMipmaps) {

        var dds = {mipmaps: [], width: 0, height: 0, format: null, mipmapCount: 1};

        // Adapted from @toji's DDS utils
        // https://github.com/toji/webgl-texture-utils/blob/master/texture-util/dds.js

        // All values and structures referenced from:
        // http://msdn.microsoft.com/en-us/library/bb943991.aspx/

        var DDS_MAGIC = 0x20534444;

        var DDSD_MIPMAPCOUNT = 0x20000;


        var DDSCAPS2_CUBEMAP = 0x200,
            DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
            DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
            DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
            DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
            DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
            DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000;

        var DDPF_FOURCC = 0x4;

        function fourCCToInt32(value) {

            return value.charCodeAt(0) +
                ( value.charCodeAt(1) << 8 ) +
                ( value.charCodeAt(2) << 16 ) +
                ( value.charCodeAt(3) << 24 );

        }

        function int32ToFourCC(value) {

            return String.fromCharCode(
                value & 0xff,
                ( value >> 8 ) & 0xff,
                ( value >> 16 ) & 0xff,
                ( value >> 24 ) & 0xff
            );

        }

        function loadARGBMip(buffers, dataOffset, width, height) {

            var dataLength = width * height * 4;
            var srcBuffer = new Uint8Array(buffers, dataOffset, dataLength);
            var byteArray = new Uint8Array(dataLength);
            var dst = 0;
            var src = 0;
            for (var y = 0; y < height; y++) {

                for (var x = 0; x < width; x++) {

                    var b = srcBuffer[src];
                    src++;
                    var g = srcBuffer[src];
                    src++;
                    var r = srcBuffer[src];
                    src++;
                    var a = srcBuffer[src];
                    src++;
                    byteArray[dst] = r;
                    dst++;	//r
                    byteArray[dst] = g;
                    dst++;	//g
                    byteArray[dst] = b;
                    dst++;	//b
                    byteArray[dst] = a;
                    dst++;	//a

                }

            }
            return byteArray;

        }

        var FOURCC_DXT1 = fourCCToInt32("DXT1");
        var FOURCC_DXT3 = fourCCToInt32("DXT3");
        var FOURCC_DXT5 = fourCCToInt32("DXT5");
        var FOURCC_ETC1 = fourCCToInt32("ETC1");

        var headerLengthInt = 31; // The header length in 32 bit ints

        // Offsets into the header array

        var off_magic = 0;

        var off_size = 1;
        var off_flags = 2;
        var off_height = 3;
        var off_width = 4;

        var off_mipmapCount = 7;

        var off_pfFlags = 20;
        var off_pfFourCC = 21;
        var off_RGBBitCount = 22;
        var off_RBitMask = 23;
        var off_GBitMask = 24;
        var off_BBitMask = 25;
        var off_ABitMask = 26;


        var off_caps2 = 28;


        // Parse header

        var header = new Int32Array(buffer, 0, headerLengthInt);

        if (header[off_magic] !== DDS_MAGIC) {

            console.error('THREE.DDSLoader.parse: Invalid magic number in DDS header.');
            return dds;

        }

        if (!header[off_pfFlags] & DDPF_FOURCC) {

            console.error('THREE.DDSLoader.parse: Unsupported format, must contain a FourCC code.');
            return dds;

        }

        var blockBytes;

        var fourCC = header[off_pfFourCC];

        var isRGBAUncompressed = false;

        switch (fourCC) {

            case FOURCC_DXT1:

                blockBytes = 8;
                dds.format = 0x83F1;
                break;

            case FOURCC_DXT3:

                blockBytes = 16;
                dds.format = 0x83F2;
                break;

            case FOURCC_DXT5:

                blockBytes = 16;
                dds.format = 0x83F3;
                break;

            case FOURCC_ETC1:

                blockBytes = 8;
                dds.format = 0x8D64;
                break;

            default:

                if (header[off_RGBBitCount] === 32
                    && header[off_RBitMask] & 0xff0000
                    && header[off_GBitMask] & 0xff00
                    && header[off_BBitMask] & 0xff
                    && header[off_ABitMask] & 0xff000000) {

                    isRGBAUncompressed = true;
                    blockBytes = 64;
                    dds.format = 0x8C93;

                } else {

                    console.error('THREE.DDSLoader.parse: Unsupported FourCC code ', int32ToFourCC(fourCC));
                    return dds;

                }
        }

        dds.mipmapCount = 1;

        if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {

            dds.mipmapCount = Math.max(1, header[off_mipmapCount]);

        }

        var caps2 = header[off_caps2];
        dds.isCubemap = caps2 & DDSCAPS2_CUBEMAP ? true : false;
        if (dds.isCubemap && (
                !( caps2 & DDSCAPS2_CUBEMAP_POSITIVEX ) ||
                !( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEX ) ||
                !( caps2 & DDSCAPS2_CUBEMAP_POSITIVEY ) ||
                !( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEY ) ||
                !( caps2 & DDSCAPS2_CUBEMAP_POSITIVEZ ) ||
                !( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEZ )
            )) {

            console.error('THREE.DDSLoader.parse: Incomplete cubemap faces');
            return dds;

        }

        dds.width = header[off_width];
        dds.height = header[off_height];

        var dataOffset = header[off_size] + 4;

        // Extract mipmaps buffers

        var faces = dds.isCubemap ? 6 : 1;

        for (var face = 0; face < faces; face++) {

            var width = dds.width;
            var height = dds.height;

            for (var i = 0; i < dds.mipmapCount; i++) {
                var byteArray;
                var dataLength;
                if (isRGBAUncompressed) {

                    byteArray = loadARGBMip(buffer, dataOffset, width, height);
                    dataLength = byteArray.length;

                } else {

                    dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
                    byteArray = new Uint8Array(buffer, dataOffset, dataLength);


                }


                var mipmap = {
                    data: byteArray,
                    width: width,
                    height: height,
                    getWidth: function () {
                        return this.width;
                    },
                    getHeight: function () {
                        return this.height;
                    },
                    getImage: function () {
                        return this.data;
                    }
                };

                dds.mipmaps.push(mipmap);

                dataOffset += dataLength;

                width = Math.max(width >> 1, 1);
                height = Math.max(height >> 1, 1);

            }

        }

        return dds;

    },

    readImageURL: function (url, options) {
        if (options === undefined) {
            options = this._defaultOptions;
        }

        // hook reader
        if (options.readImageURL) {
            // be carefull if you plan to call hook the call and after
            // call the original readImageURL, you will need to remove
            // from options the readImageURL if you dont want an infinte
            // recursion call
            return options.readImageURL.call(this, url, options);
        }

        // if image is on inline image skip url computation
        if (url.substr(0, 10) !== 'data:image') {
            url = this.computeURL(url);
        }
        var that = this;
        var image = new Image();

        if (url.indexOf('.dds') !== -1) {
            var defer = P.defer();
            var ddsXhr = new XMLHttpRequest();
            ddsXhr.open('GET', url, true);
            ddsXhr.responseType = "arraybuffer";
            ddsXhr.onload = function () {
                var texDatas = that.getruldds(this.response, true);
                image.setURL = url;
                image.setImagedds(texDatas);
                defer.resolve(image);
            };
            ddsXhr.send(null);

            return defer.promise;
        }

        return this.fetchImage(image, url, options);
    },


    readNodeURL: function (url, opt) {
        var options = opt;
        if (options === undefined) {
            options = this._defaultOptions;
        }

        // hook reader
        if (options.readNodeURL) {
            // be carefull if you plan to call hook the call and after
            // call the original readNodeURL, you will need to remove
            // from options the readNodeURL if you dont want an infinte
            // recursion call
            return options.readNodeURL.call(this, url, options);
        }

        url = this.computeURL(url);
        var that = this;
        // copy because we are going to modify it to have relative prefix to load assets
        options = utils.objectMix({}, options);

        // automatic prefix if non specfied
        if (!options.prefixURL) {
            var prefix = that.getPrefixURL();
            var index = url.lastIndexOf('/');
            if (index !== -1) {
                prefix = url.substring(0, index + 1);
            }
            options.prefixURL = prefix;
            options.databasePath = prefix;

        }

        var ReaderParser = require('osgDB/readerParser').default;

        var readSceneGraph = function (data) {
            return ReaderParser.parseSceneGraph(data, options).then(function (child) {
                notify.log('loaded ' + url);
                return child;
            });
        };

        var ungzipFile = function (arrayBuffer) {
            function pad(n) {
                return n.length < 2 ? '0' + n : n;
            }

            function uintToString(uintArray) {
                var str = '';
                for (var i = 0, len = uintArray.length; i < len; ++i) {
                    str += '%' + pad(uintArray[i].toString(16));
                }
                str = decodeURIComponent(str);
                return str;
            }

            var unpacked = arrayBuffer;
            if (zlib.isGunzipBuffer(arrayBuffer)) {
                unpacked = zlib.gunzip(arrayBuffer);
            }

            var typedArray = new Uint8Array(unpacked);
            var str = uintToString(typedArray);
            return str;
        };

        utils.time('osgjs.metric:Input.readNodeURL', notify.INFO);
        // try to get the file as responseText to parse JSON
        var fileTextPromise = that.requestFile(url);
        return fileTextPromise
            .then(function (str) {
                var data;
                try {
                    data = JSON.parse(str);
                } catch (error) {
                    // can't parse try with ungzip code path

                    notify.error('cant parse url ' + url + ' try to gunzip');
                }
                // we have the json, read it
                if (data) return readSceneGraph(data);

                // no data try with gunzip
                var fileGzipPromise = that.requestFile(url, {
                    responseType: 'arraybuffer'
                });
                return fileGzipPromise
                    .then(function (file) {
                        var strUnzip = ungzipFile(file);
                        data = JSON.parse(strUnzip);
                        return readSceneGraph(data);
                    })
                    .catch(function (status) {
                        var err = 'cant read file ' + url + ' status ' + status;
                        notify.error(err);
                        return err;
                    });
            })
            .catch(function (status) {
                var err = 'cant get file ' + url + ' status ' + status;
                notify.error(err);
                return err;
            })
            .finally(function () {
                // Stop the timer
                utils.timeEnd('osgjs.metric:Input.readNodeURL');
            });
    },

    _unzipTypedArray: function (binary) {
        var typedArray = new Uint8Array(binary);

        // check magic number 1f8b
        if (typedArray[0] === 0x1f && typedArray[1] === 0x8b) {
            var _zlib = require('zlib');

            if (!_zlib) {
                notify.error(
                    'osg failed to use a gunzip.min.js to uncompress a gz file.\n You can add this vendors to enable this feature or adds the good header in your gzip file served by your server'
                );
            }

            var zdec = new _zlib.Gunzip(typedArray);
            var result = zdec.decompress();
            return result.buffer;
        }

        return binary;
    },

    readBinaryArrayURL: function (url, options) {
        if (options === undefined) {
            options = this._defaultOptions;
        }

        if (options.readBinaryArrayURL) {
            return options.readBinaryArrayURL.call(this, url, options);
        }

        url = this.computeURL(url);

        if (this._identifierMap[url] !== undefined) {
            return this._identifierMap[url];
        }

        var filePromise = this.requestFile(url, {
            responseType: 'arraybuffer',
            progress: this._defaultOptions.progressXHRCallback
        });

        var that = this;
        this._identifierMap[url] = filePromise.then(function (file) {
            return that._unzipTypedArray(file);
        });

        return this._identifierMap[url];
    },

    initializeBufferArray: function (vb, type, buf, options) {
        if (options === undefined) options = this.getOptions();

        if (options.initializeBufferArray) {
            return options.initializeBufferArray.call(this, vb, type, buf);
        }

        var url = vb.File;

        return this.readBinaryArrayURL(url).then(function (array) {
            var typedArray;
            // manage endianness
            var bigEndian;
            (function () {
                var a = new Uint8Array([0x12, 0x34]);
                var b = new Uint16Array(a.buffer);
                bigEndian = b[0].toString(16) === '1234';
            })();

            var offset = 0;
            if (vb.Offset !== undefined) {
                offset = vb.Offset;
            }

            var bytesPerElement = utils[type].BYTES_PER_ELEMENT;
            var nbItems = vb.Size;
            var nbCoords = buf.getItemSize();
            var totalSizeInBytes = nbItems * bytesPerElement * nbCoords;

            if (bigEndian) {
                notify.log('big endian detected');
                var TypedArray = utils[type];
                var tmpArray = new TypedArray(nbItems * nbCoords);
                var data = new DataView(array, offset, totalSizeInBytes);
                var i = 0,
                    l = tmpArray.length;
                if (type === 'Uint16Array') {
                    for (; i < l; i++) {
                        tmpArray[i] = data.getUint16(i * bytesPerElement, true);
                    }
                } else if (type === 'Float32Array') {
                    for (; i < l; i++) {
                        tmpArray[i] = data.getFloat32(i * bytesPerElement, true);
                    }
                }
                typedArray = tmpArray;
                data = null;
            } else {
                typedArray = new utils[type](array, offset, nbCoords * nbItems);
            }

            buf.setElements(typedArray);
            return buf;
        });
    },

    readBufferArray: function (options) {
        var jsonObj = this.getJSON();

        var uniqueID = jsonObj.UniqueID;
        var osgjsObject;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject;
            }
        }

        if (options === undefined) options = this.getOptions();
        if (options.readBufferArray) return options.readBufferArray.call(this);

        if ((!jsonObj.Elements && !jsonObj.Array) || !jsonObj.ItemSize || !jsonObj.Type) {
            return rejectObject('BufferArray', jsonObj);
        }

        var promise;

        // inline array
        if (jsonObj.Elements) {
            promise = P.resolve(
                new BufferArray(BufferArray[jsonObj.Type], jsonObj.Elements, jsonObj.ItemSize)
            );
        } else if (jsonObj.Array) {
            var buf = new BufferArray(BufferArray[jsonObj.Type]);
            buf.setItemSize(jsonObj.ItemSize);

            var vb, type;
            if (jsonObj.Array.Float32Array) {
                vb = jsonObj.Array.Float32Array;
                type = 'Float32Array';
            } else if (jsonObj.Array.Uint16Array) {
                vb = jsonObj.Array.Uint16Array;
                type = 'Uint16Array';
            } else if (jsonObj.Array.Uint8Array) {
                vb = jsonObj.Array.Uint8Array;
                type = 'Uint8Array';
            }

            if (vb === undefined) {
                return rejectObject('Typed Array ' + window.Object.keys(jsonObj.Array)[0]);
            }

            if (vb.File) {
                promise = this.initializeBufferArray(vb, type, buf);
            } else if (vb.Elements) {
                buf.setElements(new utils[type](vb.Elements));
                promise = P.resolve(buf);
            }
        }

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = promise;
        }
        return promise;
    },

    readUserDataContainer: function () {
        var jsonObj = this.getJSON();
        var osgjsObject;
        var uniqueID = jsonObj.UniqueID;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject.Values;
            }
        }

        this._identifierMap[uniqueID] = jsonObj;
        return jsonObj.Values;
    },

    readPrimitiveSet: function () {
        var jsonObj = this.getJSON();
        var uniqueID;
        var osgjsObject;

        var promise;
        var obj, mode, first, count;
        var drawElements =
            jsonObj.DrawElementUShort ||
            jsonObj.DrawElementUByte ||
            jsonObj.DrawElementUInt ||
            jsonObj.DrawElementsUShort ||
            jsonObj.DrawElementsUByte ||
            jsonObj.DrawElementsUInt;
        var drawArray = jsonObj.DrawArray || jsonObj.DrawArrays;
        var drawArrayLengths = jsonObj.DrawArrayLengths;

        if (drawElements) {
            uniqueID = drawElements.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            mode = drawElements.Mode ? primitiveSet[drawElements.Mode] : primitiveSet.TRIANGLES;
            obj = new DrawElements(mode);

            this.setJSON(drawElements.Indices);
            promise = this.readBufferArray().then(function (array) {
                obj.setIndices(array);
                return obj;
            });
            this.setJSON(jsonObj);
        } else if (drawArray) {
            uniqueID = drawArray.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            mode = drawArray.Mode || drawArray.mode;
            first = drawArray.First !== undefined ? drawArray.First : drawArray.first;
            count = drawArray.Count !== undefined ? drawArray.Count : drawArray.count;
            obj = new DrawArrays(primitiveSet[mode], first, count);
            promise = P.resolve(obj);
        } else if (drawArrayLengths) {
            uniqueID = drawArrayLengths.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            mode = drawArrayLengths.Mode;
            first = drawArrayLengths.First;
            var array = drawArrayLengths.ArrayLengths;
            obj = new DrawArrayLengths(primitiveSet[mode], first, array);
            promise = P.resolve(obj);
        } else {
            promise = rejectObject('PrimitiveSet', jsonObj);
        }

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = promise;
        }

        return promise;
    },

    readObject: function () {
        var jsonObj = this.getJSON();
        var objKeys = window.Object.keys(jsonObj);
        var prop = objKeys[0];
        if (!prop) {
            return rejectObject("can't find property for object " + objKeys);
        }

        var uniqueID = jsonObj[prop].UniqueID;
        var osgjsObject;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject;
            }
        }

        var obj = this.getObjectWrapper(prop);

        if (!obj) {
            return rejectObject("can't instanciate object " + prop);
        }

        var ReaderParser = require('osgDB/readerParser').default;
        var scope = ReaderParser.ObjectWrapper.serializers;

        if (this._cacheReadObject[prop]) {
            scope = this._cacheReadObject[prop];
        } else {
            var splittedPath = prop.split('.');
            for (var i = 0, l = splittedPath.length; i < l; i++) {
                var sub = splittedPath[i];
                var reader = scope[sub];
                if (!reader) {
                    return rejectObject('Unknown scope ' + prop + '(' + sub + ')');
                }
                scope = reader;
            }
            this._cacheReadObject[prop] = scope;
        }

        var promise = scope(this.setJSON(jsonObj[prop]), obj);

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = promise;
            obj._uniqueID = uniqueID;
        }

        return promise;
    }
};

export default Input;
