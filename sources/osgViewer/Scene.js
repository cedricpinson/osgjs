define( [
    'osg/Utils',

    'osg/Object'

], function ( MACROUTILS, Object ) {

    'use strict';

    var Scene = function () {
        Object.call( this );

        this._sceneData = undefined;
    };

    Scene.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        getSceneData: function () {
            return this._sceneData;
        },

        setSceneData: function ( node ) {
            this._sceneData = node;
        },

        // database pager are not implemented yet here
        updateSceneGraph: function ( updateVisitor ) {
            if ( this._sceneData )
                this._sceneData.accept( updateVisitor );
        }


    } ), 'osgViewer', 'Scene' );

    return Scene;

} );
