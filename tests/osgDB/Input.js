define( [
    'osgDB/Input',
    'vendors/Q',
    'osg/Notify',
    'osg/Image'
], function ( Input, Q, Notify, Image ) {

    return function () {

        module( 'osgDB' );

        var ImageTest = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

        asyncTest( 'Input.readImageURL', function () {

            var input = new Input();
            input.setPrefixURL( 'testXtest' );
            Q.when( input.readImageURL( ImageTest ), function ( image ) {
                ok( image.getURL() === ImageTest, 'check image src' );
                start();
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );

        asyncTest( 'Input.readImageURL with readImageURL replacement', function () {
            var called = false;
            var input = new Input();
            var readImageURLReplacement = function(url, options) {
                called = true;
                return input.readImageURL( url );
            };
            Q.when( input.readImageURL( ImageTest, { readImageURL: readImageURLReplacement} ), function ( image ) {
                equal( called, true, 'check image src' );
                start();
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );


        asyncTest( 'Input.readImageURL inline dataimage with crossOrigin', function () {
            var input = new Input();
            var url = 'error-404';

            var image = input.readImageURL( url, {
                imageCrossOrigin: 'Anonymous'
            } );
            ok( image instanceof Image, 'no promise : returned an Image' );
            // ok(image.src.substr(-9) !== url, 'no promise : used fallback image');  // FIXME: make readImageURL return a proxy osgImage

            Q.when( input.readImageURL( 'error-404', {
                imageCrossOrigin: 'Anonymous',
                imageLoadingUsePromise: true
            } ), function ( image ) {
                ok( image instanceof Image, 'with promise : returned image' );
                ok( image.getImage().src.substr( -9 ) !== url, 'with promise : used fallback image' );

                start();
            } ).fail( function ( error ) {
                Notify.error( error );
            } );
        } );


        test( 'Input.fetchImage', function () {
            var input = new Input();
            input.setPrefixURL( 'testXtest' );

            ( function () {
                var img = new Image();
                input.fetchImage( img, ImageTest, {
                    'imageCrossOrigin': 'anonymous'
                } );
                ok( img.getImage().crossOrigin !== 'anonymous', 'skip crossOrigin for inline image' );
            } )();

            ( function () {
                var img = new Image();
                input.fetchImage( img, 'http://osgjs.org/image.png', {
                    'imageCrossOrigin': 'anonymous'
                } );
                ok( img.getImage().crossOrigin === 'anonymous', 'check crossOrigin' );
            } )();
        } );


        asyncTest( 'Input.readArrayBuffer-old', function () {

            var ba = {
                'Elements': [ 0.01727, -0.00262, 3.0 ],
                'ItemSize': 3,
                'Type': 'ARRAY_BUFFER',
                'UniqueID': 10
            };
            var input = new Input( ba );
            Q.when( input.readBufferArray() ).then( function ( value ) {
                console.log( 'readBufferArray' );
                return input.setJSON( {
                    'UniqueID': 10
                } ).readBufferArray();
            } ).then( function ( o2 ) {
                ok( o2.getElements()[ 2 ] === 3.0, 'readBufferArray check same unique id' );
                start();
            } );

        } );

        asyncTest( 'Input.readBinaryArrayURL with replacement option', function () {
            var calledBinaryArray = false;
            var readBinaryArrayURL = function( url, options ) {
                calledBinaryArray = true;
                return true;
            };
            var input = new Input( );
            Q.when( input.readBinaryArrayURL('toto', { readBinaryArrayURL: readBinaryArrayURL} ) ).then( function ( value ) {
                ok ( calledBinaryArray, true, "readBinaryArray replacement has been called");
                start();
            } );

        } );

        test( 'Input.getObjectWrapper', function () {
            ( function () {
                var input = new Input();
                var obj = input.getObjectWrapper( 'osg.Node' );
                ok( obj.getName() !== '', 'getObjectWrapper check osg.Node.getName' );
                ok( obj.addChild !== undefined, 'getObjectWrapper check osg.addChild' );
            } )();

            ( function () {
                var ProxyNode = function () {
                    this._proxy = true;
                };
                var input = new Input();
                input.registerObject( 'osg.Node', ProxyNode );
                var obj = input.getObjectWrapper( 'osg.Node' );
                ok( obj._proxy === true, 'getObjectWrapper with overridden' );
            } )();
        } );

        asyncTest( 'Input.readObject - Material', function () {
            var obj = {
                'osg.Material': {
                    'UniqueID': 10,
                    'Name': 'FloorBorder1',
                    'Ambient': [ 0.5, 0.5, 0.5, 1 ],
                    'Diffuse': [ 0.1, 0.1, 0.1, 0.1 ],
                    'Emission': [ 0, 0, 0, 0.5 ],
                    'Shininess': 2.5,
                    'Specular': [ 0.5, 0.7, 0.5, 1 ]
                }
            };

            var input = new Input( obj );
            var o = Q.when( input.readObject() ).then( function () {
                return input.setJSON( {
                    'osg.Material': {
                        'UniqueID': 10
                    }
                } ).readObject();
            } ).then( function ( o2 ) {
                ok( o2.getName() === 'FloorBorder1', 'readObject check same unique id' );
                start();
            } );
        } );

        asyncTest( 'Input.computeURL use prefix', function () {
            var input = new Input();
            ok( input.computeURL( 'toto' ) === 'toto', 'check default computeURL' );
            input.setPrefixURL( undefined );
            ok( input.computeURL( 'toto' ) === 'toto', 'check from undefined computeURL' );
            input.setPrefixURL( '/blah/' );
            ok( input.computeURL( 'toto' ) === '/blah/toto', 'check computeURL' );
            start();
        } );

        asyncTest( 'Input.readPrimitiveSet', function () {

            var input = new Input( {
                'DrawArrays': {
                    'UniqueID': 10,
                    'count': 3540,
                    'first': 10,
                    'mode': 'TRIANGLES'
                }
            } );
            Q.when( input.readPrimitiveSet() ).then( function ( value ) {
                return input.setJSON( {
                    'DrawArrays': {
                        'UniqueID': 10
                    }
                } ).readPrimitiveSet();
            } ).then( function ( o2 ) {
                ok( o2.getCount() === 3540, 'readPrimitiveSet check same unique id' );
                start();
            } );
        } );


        asyncTest( 'Input.readBufferArray - inline', function () {
            var ba = {
                'Array': {
                    'Uint16Array': {
                        'Elements': [ 0.01727, -0.00262, 3.0 ],
                        'Size': 3
                    }
                },
                'ItemSize': 3,
                'Type': 'ARRAY_BUFFER',
                'UniqueID': 10
            };
            var input = new Input( ba );
            Q.when( input.readBufferArray() ).then( function () {
                return input.setJSON( {
                    'UniqueID': 10
                } ).readBufferArray();
            } ).then( function ( o2 ) {
                ok( o2.getElements()[ 2 ] === 3.0, 'readBufferArray with new array typed inlined' );
                start();
            } );
        } );

        asyncTest( 'Input.readBufferArray - external', function () {
            var ba = {
                'Array': {
                    'Uint16Array': {
                        'File': 'mockup/stream.bin',
                        'Size': 3
                    }
                },
                'ItemSize': 1,
                'Type': 'ARRAY_BUFFER',
                'UniqueID': 10
            };
            ( function () {
                var input = new Input( ba );
                Q.when( input.readBufferArray() ).then( function ( buffer ) {
                    ok( buffer.getElements()[ 2 ] === 10, 'readBufferArray with new array typed external file' );
                    start();
                } );
            } )();

            ( function () {
                var calledProgress = false;
                var progress = function () {
                    calledProgress = true;
                };
                var input = new Input( ba );
                input.setProgressXHRCallback( progress );
                Q.when( input.readBufferArray() ).then( function ( buffer ) {

                    ok( calledProgress === true, 'readBufferArray check progress callback' );
                    start();
                } );
            } )();
        } );


        asyncTest( 'Input.readBufferArray - external offset', function () {
            var ba = {
                'TexCoord0': {
                    'UniqueID': 202,
                    'Array': {
                        'Float32Array': {
                            'File': 'mockup/multistream.bin',
                            'Offset': 0,
                            'Size': 3
                        }
                    },
                    'ItemSize': 2,
                    'Type': 'ARRAY_BUFFER'
                },
                'Tangent': {
                    'UniqueID': 204,
                    'Array': {
                        'Float32Array': {
                            'File': 'mockup/multistream.bin',
                            'Offset': 24,
                            'Size': 3
                        }
                    },
                    'ItemSize': 3,
                    'Type': 'ARRAY_BUFFER'
                }
            };
            ( function () {
                var input = new Input( ba );
                var arraysPromise = [];
                var buffers = {};

                var createVertexAttribute = function ( name, jsonAttribute ) {
                    var defer = Q.defer();
                    arraysPromise.push( defer.promise );
                    var promise = input.setJSON( jsonAttribute ).readBufferArray();
                    Q.when( promise ).then( function ( buffer ) {
                        if ( buffer !== undefined ) {
                            buffers[ name ] = buffer;
                        }
                        defer.resolve( buffer );
                    } );
                };

                createVertexAttribute( 'Tangent', ba.Tangent );
                createVertexAttribute( 'TexCoord0', ba.TexCoord0 );

                Q.when( Q.all( arraysPromise ) ).then( function () {
                    var tc = buffers.TexCoord0.getElements();
                    var tcl = tc.length;
                    ok( ( tc[ 2 ] === 3438139408384 ) && ( tc[ 1 ] === 14584712192 ) && ( tcl === 6 ), 'readBufferArray with new array typed external file with offset' );
                    var tg = buffers.Tangent.getElements();
                    var tgl = tg.length;
                    ok( ( tg[ 2 ] === 1.6629726922706152e-19 ) && ( tg[ 1 ] === 1.5941142850195433e-10 ) && ( tgl === 9 ), 'readBufferArray with new array typed external file with offset' );
                    start();
                } );
            } )();
        } );
    };
} );
