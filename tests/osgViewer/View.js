'use strict';
var QUnit = require( 'qunit' );
var View = require( 'osgViewer/View' );
var mockup = require( 'tests/mockup/mockup' );


module.exports = function () {

    QUnit.module( 'osgViewer' );

    QUnit.test( 'View', function () {
        var gc = mockup.createFakeRenderer();
        var view = new View();
        view.setGraphicContext( gc );
        ok( view.getGraphicContext() === gc, 'Check graphic context' );

        ok( view.getFrameStamp() !== undefined, 'Check FrameStamp' );

        ok( view.getScene() !== undefined, 'Check scene' );
        ok( view.getSceneData() === undefined, 'Check scene data' );
    } );
};
