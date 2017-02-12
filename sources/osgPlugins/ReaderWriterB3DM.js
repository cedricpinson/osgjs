'use strict';
var requestFile = require( 'osgDB/requestFile.js' );
var Notify = require( 'osg/notify' );
var Registry = require( 'osgDB/Registry' );
var BinaryDecoder = require( 'osgDB/BinaryDecoder' );
var ReaderWriterGLB = require( 'osgPlugins/ReaderWriterGLB' );

var ReaderWriterB3DM = function () {
    this._decoder = new BinaryDecoder();
    this._decoder.setLittleEndian( true );
    this._glbReader = new ReaderWriterGLB();
};

var B3DMHeader = function () {
    this.magic = ''; // 4-byte ANSI string "b3dm"
    this.version = 0; // uint32 The version of the Batched 3D Model format. It is currently 1
    this.byteLength = 0; // uint32 The length of the entire tile, including the header, in bytes.
    this.batchTableJSONByteLength = 0; // uint32 The length of the batch table JSON section in bytes. Zero indicates there is no batch table.
    this.batchTableBinaryByteLength = 0; // uint32 The length of the batch table binary section in bytes. If batchTableJSONByteLength is zero, this will also be zero.
    this.batchLength = 0; //uint32 The number of models, also called features, in the batch.
};

var B3DMBatchTable = function () {
    this.header = undefined;
    this.binaryBody = undefined;
};

var B3DMModel = function () {
    this.header = new B3DMHeader();
    this.batchTable = new B3DMBatchTable();
    // Several gltf files in a B3DM model?
    // this.gltf = [];
};

ReaderWriterB3DM.prototype = {

    readNodeURL: function ( url /*, options*/ ) {
        var self = this;
        var model = new B3DMModel();
        var filePromise = requestFile( url, {
            responseType: 'arraybuffer'
        } );
        return filePromise.then( function ( file ) {
            self.readHeader( file, model );
            if ( model.header.batchTableJSONByteLength > 0 ) {
                self.readBatchTable( file, model );
            }
            return self.readGLTFB( file, model );
        } );
    },

    readHeader: function ( bufferArray, model ) {

        this._decoder.setBuffer( bufferArray );

        model.header.magic = this._decoder.decodeStringArray( 4 );
        if ( model.header.magic !== 'b3dm' ) {
            Notify.error( 'Invalid Batched 3D Model.  Expected magic=b3dm.  Read magic=' + model.header.magic );
            return;
        }

        model.header.version = this._decoder.getUint32Value();
        if ( model.header.version !== 1 ) {
            Notify.error( 'Only Batched 3D Model version 1 is supported.  Version' + model.header.version + ' is not.' );
            return;
        }

        model.header.byteLength = this._decoder.getUint32Value();
        model.header.batchTableJsonByteLength = this._decoder.getUint32Value();
        model.header.batchTableBinaryByteLength = this._decoder.getUint32Value();
        model.header.batchLength = this._decoder.getUint32Value();
    },

    readBatchTable: function ( /*bufferArray, model*/) {
        Notify.error( 'batch table reading not implemented yet' );
    },

    readGLTFB: function ( bufferArray, model ) {
        var gltfArray = bufferArray.slice( 24 + model.header.batchTableBinaryByteLength );
        return this._glbReader.readBinaryArray( gltfArray );
    }
};

Registry.instance().addReaderWriter( 'b3dm', new ReaderWriterB3DM() );

module.exports = ReaderWriterB3DM;
