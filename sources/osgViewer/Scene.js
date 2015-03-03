define( [
    'osg/Utils',
    'osg/Object',
    'osgDB/DatabasePager'
], function ( MACROUTILS, Object, DatabasePager ) {

    'use strict';

    var Scene = function () {
        Object.call( this );
        this._databasePager = new DatabasePager();
        this._sceneData = undefined;
    };

    Scene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        getSceneData: function () {
            return this._sceneData;
        },

        setSceneData: function ( node ) {
            this._sceneData = node;
        },

        setDatabasePager: function ( dbpager ) {
            this._databasePager = dbpager;
        },

        getDatabasePager: function () {
            return this._databasePager;
        },

        // database pager are not implemented yet here
        updateSceneGraph: function ( updateVisitor ) {
            if ( this._databasePager)
                this._databasePager.updateSceneGraph( updateVisitor.getFrameStamp() );
            if ( this._sceneData )
                this._sceneData.accept( updateVisitor );
        }


    } ), 'osgViewer', 'Scene' );

    return Scene;

} );
