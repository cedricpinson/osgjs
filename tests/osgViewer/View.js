'use strict';
var assert = require( 'chai' ).assert;
var View = require( 'osgViewer/View' );
var mockup = require( 'tests/mockup/mockup' );

module.exports = function () {

    test( 'View', function () {
        var gc = mockup.createFakeRenderer();
        var view = new View();
        view.setGraphicContext( gc );
        assert.isOk( view.getGraphicContext() === gc, 'Check graphic context' );

        assert.isOk( view.getFrameStamp() !== undefined, 'Check FrameStamp' );

        assert.isOk( view.getScene() !== undefined, 'Check scene' );
        assert.isOk( view.getSceneData() === undefined, 'Check scene data' );
    } );
};
