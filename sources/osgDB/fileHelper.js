'use strict';
var P = require( 'bluebird' );

var ReaderParser = require( 'osgDB/readerParser' );
var Registry = require( 'osgDB/Registry' );
var requestFile = require( 'osgDB/requestFile.js' );
var FileHelper = {};

FileHelper.readFileList = function ( fileList ) {
    var defer = P.defer();
    var fileName;
    var filesMap = new window.Map();
    var promiseArray = [];
    for ( var i = 0; i < fileList.length; ++i ) {
        var ext = fileList[ i ].name.substr( fileList[ i ].name.lastIndexOf( '.' ) + 1 );
        var readerWriter = Registry.instance().getReaderWriterForExtension( ext );
        // We need a hack for osgjs til it is converted to a readerwriter
        if ( readerWriter !== undefined || ext === 'osgjs' ) {
            // So this is the main file to read
            fileName = fileList[ i ].name;
        }
        var type = FileHelper.getTypeForExtension( ext );
        promiseArray.push( requestFile( fileList[ i ], {
            responseType: type
        } ) );
    }
    Promise.all( promiseArray ).then( function ( files ) {
        for ( var i = 0; i < files.length; ++i ) {
            filesMap.set( fileList[ i ].name, files[ i ] );
        }
        ReaderParser.readNodeURL( fileName, {
            filesMap: filesMap
        } ).then( function ( node ) {
            defer.resolve( node );
        } );
    } );
    return defer.promise;
};


FileHelper.getTypeForExtension = function ( ext ) {
    var type;
    switch ( ext ) {
    case 'bin':
    case 'b3dm':
    case 'glb':
        type = 'arraybuffer';
        break;
    case 'zip':
        type = 'blob';
        break;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
        type = 'base64';
        break;
    case 'gltf':
    case 'osgjs':
        type = 'text';
        break;
    }
    return type;
};

module.exports = FileHelper;
