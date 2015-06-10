'use strict';

var OSG = window.OSG;
var osg = OSG.osg;

var initTextureFromResult = function ( texture, res ) {
    texture.setFlipY( res.flipY );
    texture.setInternalFormat( res.internalFormat );
    texture.setInternalFormatType( res.internalFormatType );

    var images = res.images;
    if ( images.length > 1 ) {
        texture.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR );
        texture.setMagFilter( osg.Texture.LINEAR );
    } else {
        texture.setMinFilter( osg.Texture.LINEAR );
        texture.setMagFilter( osg.Texture.LINEAR );
    }

    for ( var i = 0, nb = images.length; i < nb; ++i ) {
        var img = images[ i ];
        var osgImage = images[ i ] = new osg.Image( img.data );
        osgImage.setWidth( img.width );
        osgImage.setHeight( img.height );
    }
    texture.setImage( new osg.Image( images ) );

    return texture;
};

var nbWorker = 1; // navigator.hardwareConcurrency || 2;
var workerInstances = new Array( nbWorker );
var getOrCreateWorker = function ( id ) {
    var idWorker = id % nbWorker;
    if ( workerInstances[ idWorker ] )
        return workerInstances[ idWorker ];

    var worker = new Worker( 'decompressCRN.js' );
    workerInstances[ idWorker ] = worker;
    worker.pending = {};
    worker.onmessage = function ( msg ) {
        var id = msg.data.id;
        var tex = this.pending[ id ];
        if ( !tex )
            return;
        // Remove the pending texture from the waiting list.
        initTextureFromResult( this.pending[ id ], msg.data );
        this.pending[ id ] = null;
    };
    return worker;
};

var USE_WORKER = true;
var nbTextures = 0;
window.loadCRN = function ( data, texture, noDxt ) {
    if ( USE_WORKER ) {
        var worker = getOrCreateWorker( nbTextures );
        var id = nbTextures++;
        worker.pending[ id ] = texture;
        worker.postMessage( {
            src: data,
            noDxt: noDxt,
            id: id
        } );
    } else {
        var res = window.decompressCRN( data, noDxt );
        initTextureFromResult( texture, res );
    }
};
