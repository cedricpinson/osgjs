define( [
    'Q',
    'require',
    'osg/Utils',
    'osgNameSpace',
    'osgDB/ReaderParser',
    'osgDB/Options',
    'osg/Notify',
    'osg/Image',
    'osg/BufferArray',
    'osg/DrawArrays',
    'osg/DrawArrayLengths',
    'osg/DrawElements',
    'osg/PrimitiveSet'
], function ( Q, require, MACROUTILS, osgNameSpace, ReaderParser, Options, Notify, Image, BufferArray, DrawArrays, DrawArrayLengths, DrawElements, PrimitiveSet ) {

    var Input = function ( json, identifier ) {
        this._json = json;
        var map = identifier;
        if ( map === undefined ) {
            map = {};
        }
        this._identifierMap = map;
        this._objectRegistry = {};
        // this._progressXHRCallback = undefined;
        // this._prefixURL = '';
        // this.setImageLoadingOptions( {
        //     promise: true,
        //     onload: undefined
        // } );

        this.setOptions ( MACROUTILS.objectMix( {}, Options) );

        // {
        //     prefixURL: '',
        //     progressXHRCallback: undefined,
        //     readImageURL: undefined,
        //     imageLoadingUsePromise: undefined,
        //     imageOnload: undefined,
        // };
    };


    // keep one instance of image fallback
    if ( !Input.imageFallback ) {
        Input.imageFallback = ( function () {
            var fallback = new window.Image();
            fallback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';
            return fallback;
        } )();
    }

    Input.prototype = {

        setOptions: function ( options ) {
            this._defaultOptions = options;
        },
        getOptions: function () {
            return this._defaultOptions;
        },
        setProgressXHRCallback: function ( func ) {
            this._defaultOptions.progressXHRCallback = func;
        },

        // used to override the type from pathname
        // typically if you want to create proxy object
        registerObject: function ( fullyQualifiedObjectname, constructor ) {
            this._objectRegistry[ fullyQualifiedObjectname ] = constructor;
        },

        getJSON: function () {
            return this._json;
        },

        setJSON: function ( json ) {
            this._json = json;
            return this;
        },

        setPrefixURL: function ( prefix ) {
            this._defaultOptions.prefixURL = prefix;
        },
        getPrefixURL: function () {
            return this._defaultOptions.prefixURL;
        },
        computeURL: function ( url ) {
            if ( this._defaultOptions.prefixURL === undefined ) {
                return url;
            }
            return this._defaultOptions.prefixURL + url;
        },
        getObjectWrapper: function ( path ) {
            if ( this._objectRegistry[ path ] !== undefined ) {
                return new( this._objectRegistry[ path ] )();
            }

            var scope = osgNameSpace;
            var splittedPath = path.split( '.' );
            for ( var i = 0, l = splittedPath.length; i < l; i++ ) {
                var obj = scope[ splittedPath[ i ] ];
                if ( obj === undefined ) {
                    return undefined;
                }
                scope = obj;
            }
            var ClassName = scope;
            // create the new obj
            return new( ClassName )();
        },

        fetchImage: function ( image, url, options, defer ) {
            var checkInlineImage = 'data:image/';
            // crossOrigin does not work for inline data image
            var isInlineImage = ( url.substring( 0, checkInlineImage.length ) === checkInlineImage );
            var img = new window.Image();
            img.onerror = function () {
                Notify.warn( 'warning use white texture as fallback instead of ' + url );
                image.setImage( Input.imageFallback );
                if ( defer ) {
                    defer.resolve( image );
                }
            };

            if ( !isInlineImage && options.imageCrossOrigin ) {
                img.crossOrigin = options.imageCrossOrigin;
            }

            img.onload = function () {

                if ( defer ) {
                    if ( options.imageOnload ) options.imageOnload.call( image );
                    defer.resolve( image );
                } else if ( options.imageOnload )
                    options.imageOnload.call( image );

            };

            image.setURL( url );
            image.setImage( img );

            img.src = url;
            return image;
        },

        readImageURL: function ( url, options ) {

            if ( options === undefined ) {
                options = this._defaultOptions;
            }

            // hook reader
            if ( options.readImageURL ) {
                // be carefull if you plan to call hook the call and after
                // call the original readImageURL, you will need to remove
                // from options the readImageURL if you dont want an infinte
                // recursion call
                return options.readImageURL.call(this, url, options );
            }

            // if image is on inline image skip url computation
            if ( url.substr( 0, 10 ) !== 'data:image' ) {
                url = this.computeURL( url );
            }


            var image = new Image();
            if ( options.imageLoadingUsePromise !== true ) {
                return this.fetchImage( image, url, options );
            }

            var defer = Q.defer();
            this.fetchImage( image, url, options, defer );

            return defer.promise;
        },


        readNodeURL: function ( url, options ) {
            url = this.computeURL( url );

            var defer = Q.defer();

            options = options || {};
            var opt = MACROUTILS.objectMix( {}, options );

            // automatic prefix if non specfied
            if ( opt.prefixURL === undefined ) {
                var prefix = this.getPrefixURL();
                var index = url.lastIndexOf( '/' );
                if ( index !== -1 ) {
                    prefix = url.substring( 0, index + 1 );
                }
                opt.prefixURL = prefix;
            }

            var req = new XMLHttpRequest();
            req.open( 'GET', url, true );
            req.onreadystatechange = function ( /*aEvt*/ ) {
                if ( req.readyState === 4 ) {
                    if ( req.status === 200 ) {
                        var ReaderParser = require( 'osgDB/ReaderParser' );
                        Q.when( ReaderParser.parseSceneGraph( JSON.parse( req.responseText ),
                                opt ),
                            function ( child ) {
                                defer.resolve( child );
                                Notify.log( 'loaded ' + url );

                            } ).fail( function ( error ) {
                            defer.reject( error );
                        } );
                    } else {
                        defer.reject( req.status );
                    }
                }
            };
            req.send( null );
            return defer.promise;
        },

        readBinaryArrayURL: function ( url, options ) {

            if ( options === undefined ) {
                options = this._defaultOptions;
            }

            if ( options.readBinaryArrayURL ) {
                return options.readBinaryArrayURL.call( this, url, options );
            }

            url = this.computeURL( url );


            if ( this._identifierMap[ url ] !== undefined ) {
                return this._identifierMap[ url ];
            }
            var defer = Q.defer();
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', url, true );
            xhr.responseType = 'arraybuffer';

            if ( this._defaultOptions.progressXHRCallback ) {
                xhr.addEventListener( 'progress', this._defaultOptions.progressXHRCallback, false );
            }

            xhr.addEventListener( 'error', function () {
                defer.reject();
            }, false );

            var self = this;
            xhr.addEventListener( 'load', function ( /*oEvent */ ) {
                var arrayBuffer = xhr.response; // Note: not oReq.responseText
                if ( arrayBuffer ) {
                    // var byteArray = new Uint8Array(arrayBuffer);
                    self._identifierMap[ url ] = arrayBuffer;
                    defer.resolve( arrayBuffer );
                } else {
                    defer.reject();
                }
            }, false );

            xhr.send( null );
            this._identifierMap[ url ] = defer.promise;
            return defer.promise;
        },

        readBufferArray: function () {
            var jsonObj = this.getJSON();

            var uniqueID = jsonObj.UniqueID;
            var osgjsObject;
            if ( uniqueID !== undefined ) {
                osgjsObject = this._identifierMap[ uniqueID ];
                if ( osgjsObject !== undefined ) {
                    return osgjsObject;
                }
            }

            var check = function ( o ) {
                if ( ( o.Elements !== undefined || o.Array !== undefined ) &&
                    o.ItemSize !== undefined &&
                    o.Type ) {
                    return true;
                }
                return false;
            };

            if ( !check( jsonObj ) ) {
                return undefined;
            }

            var obj, defer;

            // inline array
            if ( jsonObj.Elements !== undefined ) {
                obj = new BufferArray( BufferArray[ jsonObj.Type ], jsonObj.Elements, jsonObj.ItemSize );

            } else if ( jsonObj.Array !== undefined ) {

                var buf = new BufferArray( BufferArray[ jsonObj.Type ] );
                buf.setItemSize( jsonObj.ItemSize );

                var vb, type;
                if ( jsonObj.Array.Float32Array !== undefined ) {
                    vb = jsonObj.Array.Float32Array;
                    type = 'Float32Array';
                } else if ( jsonObj.Array.Uint16Array !== undefined ) {
                    vb = jsonObj.Array.Uint16Array;
                    type = 'Uint16Array';
                } else {
                    Notify.warn( 'Typed Array ' + window.Object.keys( jsonObj.Array )[ 0 ] );
                    type = 'Float32Array';
                }

                if ( vb !== undefined ) {
                    if ( vb.File !== undefined ) {
                        var url = vb.File;

                        defer = Q.defer();
                        Q.when( this.readBinaryArrayURL( url ) ).then( function ( array ) {

                            var typedArray;
                            // manage endianness
                            var bigEndian;
                            ( function () {
                                var a = new Uint8Array( [ 0x12, 0x34 ] );
                                var b = new Uint16Array( a.buffer );
                                bigEndian = ( ( b[ 0 ] ).toString( 16 ) === '1234' );
                            } )();

                            var offset = 0;
                            if ( vb.Offset !== undefined ) {
                                offset = vb.Offset;
                            }

                            var bytesPerElement = MACROUTILS[ type ].BYTES_PER_ELEMENT;
                            var nbItems = vb.Size;
                            var nbCoords = buf.getItemSize();
                            var totalSizeInBytes = nbItems * bytesPerElement * nbCoords;

                            if ( bigEndian ) {
                                Notify.log( 'big endian detected' );
                                var TypedArray = MACROUTILS[ type ];
                                var tmpArray = new TypedArray( nbItems * nbCoords );
                                var data = new DataView( array, offset, totalSizeInBytes );
                                var i = 0,
                                    l = tmpArray.length;
                                if ( type === 'Uint16Array' ) {
                                    for ( ; i < l; i++ ) {
                                        tmpArray[ i ] = data.getUint16( i * bytesPerElement, true );
                                    }
                                } else if ( type === 'Float32Array' ) {
                                    for ( ; i < l; i++ ) {
                                        tmpArray[ i ] = data.getFloat32( i * bytesPerElement, true );
                                    }
                                }
                                typedArray = tmpArray;
                                data = null;
                            } else {
                                typedArray = new MACROUTILS[ type ]( array, offset, nbCoords * nbItems );
                            }

                            buf.setElements( typedArray );
                            defer.resolve( buf );
                        } );
                    } else if ( vb.Elements !== undefined ) {
                        var elements = new MACROUTILS[ type ]( vb.Elements );
                        buf.setElements( elements );
                    }
                }
                obj = buf;
            }

            if ( uniqueID !== undefined ) {
                this._identifierMap[ uniqueID ] = obj;
            }

            if ( defer !== undefined ) {
                return defer.promise;
            }
            return obj;
        },

        readUserDataContainer: function () {
            var jsonObj = this.getJSON();
            var osgjsObject;
            var uniqueID = jsonObj.UniqueID;
            if ( uniqueID !== undefined ) {
                osgjsObject = this._identifierMap[ uniqueID ];
                if ( osgjsObject !== undefined ) {
                    return osgjsObject.Values;
                }
            }

            this._identifierMap[ uniqueID ] = jsonObj;
            return jsonObj.Values;
        },

        readPrimitiveSet: function () {
            var jsonObj = this.getJSON();
            var uniqueID;
            var osgjsObject;

            var obj;
            var defer;
            var mode;
            var first, count;
            var drawElementPrimitive = jsonObj.DrawElementUShort || jsonObj.DrawElementUByte || jsonObj.DrawElementUInt || jsonObj.DrawElementsUShort || jsonObj.DrawElementsUByte || jsonObj.DrawElementsUInt || undefined;
            if ( drawElementPrimitive ) {

                uniqueID = drawElementPrimitive.UniqueID;
                if ( uniqueID !== undefined ) {
                    osgjsObject = this._identifierMap[ uniqueID ];
                    if ( osgjsObject !== undefined ) {
                        return osgjsObject;
                    }
                }

                defer = Q.defer();
                var jsonArray = drawElementPrimitive.Indices;
                var prevJson = jsonObj;

                mode = drawElementPrimitive.Mode;
                if ( !mode ) {
                    mode = PrimitiveSet.TRIANGLES;
                } else {
                    mode = PrimitiveSet[ mode ];
                }
                obj = new DrawElements( mode );

                this.setJSON( jsonArray );
                Q.when( this.readBufferArray() ).then(
                    function ( array ) {
                        obj.setIndices( array );
                        defer.resolve( obj );
                    } );
                this.setJSON( prevJson );
            }

            var drawArrayPrimitive = jsonObj.DrawArray || jsonObj.DrawArrays;
            if ( drawArrayPrimitive ) {

                uniqueID = drawArrayPrimitive.UniqueID;
                if ( uniqueID !== undefined ) {
                    osgjsObject = this._identifierMap[ uniqueID ];
                    if ( osgjsObject !== undefined ) {
                        return osgjsObject;
                    }
                }

                mode = drawArrayPrimitive.Mode || drawArrayPrimitive.mode;
                first = drawArrayPrimitive.First !== undefined ? drawArrayPrimitive.First : drawArrayPrimitive.first;
                count = drawArrayPrimitive.Count !== undefined ? drawArrayPrimitive.Count : drawArrayPrimitive.count;
                var drawArray = new DrawArrays( PrimitiveSet[ mode ], first, count );
                obj = drawArray;
            }

            var drawArrayLengthsPrimitive = jsonObj.DrawArrayLengths || undefined;
            if ( drawArrayLengthsPrimitive ) {

                uniqueID = drawArrayLengthsPrimitive.UniqueID;
                if ( uniqueID !== undefined ) {
                    osgjsObject = this._identifierMap[ uniqueID ];
                    if ( osgjsObject !== undefined ) {
                        return osgjsObject;
                    }
                }

                mode = drawArrayLengthsPrimitive.Mode;
                first = drawArrayLengthsPrimitive.First;
                var array = drawArrayLengthsPrimitive.ArrayLengths;
                var drawArrayLengths = new DrawArrayLengths( PrimitiveSet[ mode ], first, array );
                obj = drawArrayLengths;
            }

            if ( uniqueID !== undefined ) {
                this._identifierMap[ uniqueID ] = obj;
            }

            if ( defer ) {
                return defer.promise;
            }
            return obj;
        },


        readObject: function () {

            var jsonObj = this.getJSON();
            var prop = window.Object.keys( jsonObj )[ 0 ];
            if ( !prop ) {
                Notify.warn( 'can\'t find property for object ' + jsonObj );
                return undefined;
            }

            var uniqueID = jsonObj[ prop ].UniqueID;
            var osgjsObject;
            if ( uniqueID !== undefined ) {
                osgjsObject = this._identifierMap[ uniqueID ];
                if ( osgjsObject !== undefined ) {
                    return osgjsObject;
                }
            }

            var obj = this.getObjectWrapper( prop );
            if ( !obj ) {
                Notify.warn( 'can\'t instanciate object ' + prop );
                return undefined;
            }
            var ReaderParser = require( 'osgDB/ReaderParser' );
            var scope = ReaderParser.ObjectWrapper.serializers;
            var splittedPath = prop.split( '.' );
            for ( var i = 0, l = splittedPath.length; i < l; i++ ) {
                var reader = scope[ splittedPath[ i ] ];
                if ( reader === undefined ) {
                    Notify.warn( 'can\'t find function to read object ' + prop + ' - undefined' );
                    return undefined;
                }
                scope = reader;
            }

            var promise = scope( this.setJSON( jsonObj[ prop ] ), obj );

            if ( uniqueID !== undefined ) {
                this._identifierMap[ uniqueID ] = obj;
                obj._uniqueID = uniqueID;
            }
            return promise;
        }
    };

    return Input;
} );
