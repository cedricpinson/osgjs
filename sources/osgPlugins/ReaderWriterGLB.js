'use strict';
var requestFile = require( 'osgDB/requestFile.js' );
var Notify = require( 'osg/notify' );
var Registry = require( 'osgDB/Registry' );
var BinaryDecoder = require( 'osgDB/BinaryDecoder' );
var ReaderWriterGLTF = require( 'osgPlugins/ReaderWriterGLTF' );

var ReaderWriterGLB = function () {
    this._decoder = new BinaryDecoder();
    this._decoder.setLittleEndian( true );
    this._gltfReader = new ReaderWriterGLTF();
};

var GLBHeader = function () {
    this.magic = ''; // is the ASCII string 'glTF', and can be used to identify the arraybuffer as Binary glTF.
    this.version = 0; // is an uint32 that indicates the version of the Binary glTF container format
    this.length = 0; // is the total length of the Binary glTF, including header, content, and body, in bytes.
    this.contentLength = 0; // is the length, in bytes, of the glTF content. It must be greater than zero.
    this.contentFormat = 0; // specifies the format of the glTF content
};

var GLBModel = function () {
    this.header = new GLBHeader();
    this.json = undefined;
    this.binary = undefined;
};

ReaderWriterGLB.prototype = {

    readNodeURL: function ( url /*, options*/ ) {
        var self = this;
        var filePromise = requestFile( url, {
            responseType: 'arraybuffer'
        } );

        return filePromise.then( function ( file ) {
            return self.readBinaryArray( file );
        } );
    },

    readBinaryArray: function ( bufferArray ) {
        var model = new GLBModel();
        this.readHeader( bufferArray, model );
        this.readJson( bufferArray, model );
        this.readBuffers( bufferArray, model );
        this._gltfReader.init();
        this._gltfReader.setGLBModel( model );
        return this._gltfReader.readJSON( model.json );
    },

    readHeader: function ( bufferArray, model ) {

        this._decoder.setBuffer( bufferArray );

        model.header.magic = this._decoder.decodeStringArray( 4 );
        if ( model.header.magic !== 'glTF' ) {
            Notify.error( 'Invalid GLTF 3D Model.  Expected magic=glTF.  Read magic=' + model.header.magic );
            return;
        }

        model.header.version = this._decoder.getUint32Value();
        if ( model.header.version !== 1 ) {
            Notify.error( 'Only Batched 3D Model version 1 is supported.  Version' + model.header.version + ' is not.' );
            return;
        }

        model.header.length = this._decoder.getUint32Value();
        model.header.contentLength = this._decoder.getUint32Value();
        model.header.contentFormat = this._decoder.getUint32Value();
    },

    readJson: function ( bufferArray, model ) {
        model.json = this._decoder.decodeStringArray( model.header.contentLength );
    },

    readBuffers: function ( bufferArray, model ) {
        model.binary = bufferArray.slice( 20 + model.header.contentLength );
    },

};

Registry.instance().addReaderWriter( 'glb', new ReaderWriterGLB() );

module.exports = ReaderWriterGLB;
