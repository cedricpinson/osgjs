'use strict';

var P = require( 'bluebird' );
var requestFile = require( 'osgDB/requestFile.js' );
var Notify = require( 'osg/notify' );
var Registry = require( 'osgDB/Registry' );
var ReaderWriterB3DM = require( 'osgPlugins/ReaderWriterB3DM' );
var MatrixTransform = require( 'osg/MatrixTransform' );
var PagedLOD = require( 'osg/PagedLOD' );
var BoundingBox = require( 'osg/BoundingBox' );
var vec3 = require( 'osg/glMatrix' ).vec3;

var ReaderWriter3DTiles = function () {
    this._b3dmReader = new ReaderWriterB3DM();
    this._databasePath = '';
};

ReaderWriter3DTiles.prototype = {

    readNodeURL: function ( url, options ) {

        if ( options && options.databasePath !== undefined ) {
            this._databasePath = options.databasePath;
        }

        var self = this;
        // remove pseudoloader .3dt
        url = url.substr( 0, url.lastIndexOf( '.' ) );
        var filePromise = requestFile( url );

        return filePromise.then( function ( file ) {
            return self.readTileSet( file );
        } );
    },

    readTileSet: function ( file ) {
        var tilesetJson = JSON.parse( file );
        var rootTile = this.readRootTile( tilesetJson.root );
        return rootTile;
    },


    readChildrenTiles: function ( parent ) {
        var defer = P.defer();
        var numChilds = 0;
        var group = new MatrixTransform();

        var createTileLOD = function ( tileLOD, contentURL, rw ) {
            var b3dmrw = new ReaderWriterB3DM();
            b3dmrw.readNodeURL( rw._databasePath + contentURL ).then( function ( child ) {
                var rangeMin = ( tileLOD.json.geometricError !== undefined ) ? tileLOD.json.geometricError : 0;
                tileLOD.addChild( child, rangeMin, Number.MAX_VALUE );
                if ( tileLOD.json.children !== undefined ) {
                    tileLOD.setFunction( 1, rw.readChildrenTiles.bind( rw ) );
                    tileLOD.setRange( 1, 0, rangeMin );
                }
                numChilds--;
                if ( numChilds <= 0 )
                    defer.resolve( group );
            } );
        };

        var childrenJson = parent.json.children;
        numChilds = childrenJson.length;
        for ( var i = 0; i < childrenJson.length; i++ ) {
            var contentURL = childrenJson[ i ].content.url;
            var tileLOD = new PagedLOD();
            tileLOD.setName( contentURL );
            tileLOD.setDatabasePath( parent.getDatabasePath() );
            if ( contentURL === undefined ) break;
            tileLOD.json = childrenJson[ i ];
            createTileLOD( tileLOD, contentURL, this );
            group.addChild( tileLOD );
        }
        return defer.promise;
    },

    readRootTile: function ( tileJson ) {
        var self = this;
        var tileTransform = new MatrixTransform();
        var tileLOD = new PagedLOD();
        tileLOD.setDatabasePath( this._databasePath );
        tileTransform.addChild( tileLOD );
        // FIXME: transforms seems to be column major
        // So no transforms right now
        // tileTransform.setMatrix( tileJson.transform );
        this.readBoundingVolume( tileJson, tileLOD );
        var contentURL = tileJson.content.url;
        if ( contentURL === undefined ) return;
        this._b3dmReader.readNodeURL( this._databasePath + contentURL ).then( function ( node ) {
            tileLOD.addChild( node, tileJson.geometricError, Number.MAX_VALUE );
            tileLOD.json = tileJson;
            tileLOD.setFunction( 1, self.readChildrenTiles.bind( self ) );
            tileLOD.setRange( 1, 0, tileJson.geometricError );
        } );
        return tileTransform;
    },

    readBoundingVolume: function ( tileJson, tileLOD ) {
        if ( tileJson.boundingVolume.box !== undefined ) {
            var box = tileJson.boundingVolume.box;
            // It's a box
            var bbox = new BoundingBox();
            bbox.expandByvec3( vec3.fromValues( box[ 3 ], box[ 7 ], box[ 11 ] ) );
            bbox.expandByvec3( vec3.fromValues( -box[ 3 ], -box[ 7 ], -box[ 11 ] ) );
            tileLOD.setCenter( bbox.center( vec3.create() ) );
            tileLOD.setRadius( bbox.radius() );
        } else {
            Notify.error( 'this bounding volume is not implement yet' );
        }
    }
};

Registry.instance().addReaderWriter( '3dt', new ReaderWriter3DTiles() );

module.exports = ReaderWriter3DTiles;
