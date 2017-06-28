'use strict';
var P = require( 'bluebird' );
var requestFile = require( 'osgDB/requestFile.js' );
var Notify = require( 'osg/notify' );
var Registry = require( 'osgDB/Registry' );
var ReaderParser = require( 'osgDB/readerParser' );
var FileHelper = require( 'osgDB/FileHelper' );
var JSZip = window.JSZip;

var ReaderWriterZIP = function () {
    this._options = undefined;
    this._filesMap = new window.Map();
    this._fileName = ''; // The file containing the model of the archive ( gltf, glb, osgjs, b3dm, etc )
};


ReaderWriterZIP.prototype = {

    readNodeURL: function ( url, options ) {
        return new P( this._readNodeURLPromiseHandler.bind( this, url, options ) );
    },

    _readNodeURLPromiseHandler: function ( url, options, resolve, reject ) {
        if ( JSZip === undefined ) {
            Notify.error( 'You need to add JSZip as a dependency' );
            return reject();
        }
        Notify.log( 'starting to read: ' + url );
        // Check if we already have the file
        var self = this;
        if ( options && options.filesMap !== undefined ) {
            // it comes  from drag'n drop
            if ( options.filesMap.has( url ) ) {
                // Now url is a File
                var file = options.filesMap.get( url );
                return this.readZipFile( file ).then( function () {

                    if ( !self._fileName.length ) return P.reject( self );

                    // At this point we have the main file name and a Map containing all the resources
                    return ReaderParser.readNodeURL( self._fileName, {
                        filesMap: self._filesMap
                    } );
                } );
            }
        }

        var filePromise = requestFile( url, {
            responseType: 'blob'
        } );

        filePromise.then( function ( file ) {
            self.readZipFile( file ).then( function () {
                // At this point we have the main file name and a Map containing all the resources
                resolve( ReaderParser.readNodeURL( self._fileName, {
                    filesMap: self._filesMap
                } ) );
            } );
        } );
    },

    _registerZipImage: function ( fileName, type, extension, fileData ) {
        var data = fileData;
        // Is an image
        if ( type === 'base64' ) {
            data = new window.Image();
            data.src = 'data:image/' + extension + ';base64,' + fileData;
        }
        this._filesMap.set( fileName, data );
    },

    readZipFile: function ( fileOrBlob ) {
        return new P( this._readZipFilePromiseHandler.bind( this, fileOrBlob ) );

    },
    _readZipFilePromiseHandler: function ( fileOrBlob, resolve ) {
        JSZip.loadAsync( fileOrBlob ).then( this._readLoadedZipFile.bind( this, resolve ) );
    },
    _readLoadedZipFile: function ( resolve, zip ) {
        var promisesArray = [];

        for ( var i = 0; i < zip.files.length; i = i + 1 ) {
            var fileName = zip.files[ i ];
            var extension = fileName.substr( fileName.lastIndexOf( '.' ) + 1 );
            // Check if the file is readable by any osgDB plugin
            var readerWriter = Registry.instance().getReaderWriterForExtension( extension );
            // We need a hack for osgjs til it is converted to a readerwriter
            if ( readerWriter !== undefined || extension === 'osgjs' ) {
                // So this is the main file to read
                this._fileName = fileName;
            }

            var type = FileHelper.getTypeForExtension( extension );
            // We don't need to parse this file
            if ( type === undefined ) continue;
            if ( type === 'blob' ) type = 'base64'; // Images are base64 encoded in ZIP files

            var p = zip.file( fileName ).async( type ).then( this._registerZipImage.bind( this, fileName, type, extension ) );
            promisesArray.push( p );
        }

        P.all( promisesArray ).then( resolve );
    }
};

Registry.instance().addReaderWriter( 'zip', new ReaderWriterZIP() );

module.exports = ReaderWriterZIP;
