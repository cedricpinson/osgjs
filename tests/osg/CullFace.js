'use strict';
var QUnit = require( 'qunit' );
var mockup = require( 'tests/mockup/mockup' );
var CullFace = require( 'osg/CullFace' );
var State = require( 'osg/State' );
var ShaderGeneratorProxy = require( 'osgShader/ShaderGeneratorProxy' );


module.exports = function () {

    QUnit.module( 'osg' );

    QUnit.test( 'CullFace', function () {

        var n = new CullFace();
        ok( n.getMode() === CullFace.BACK, 'Check default mode' );

        var state = new State( new ShaderGeneratorProxy() );
        state.setGraphicContext( mockup.createFakeRenderer() );

        n.apply( state );

        n = new CullFace( CullFace.DISABLE );
        n.apply( state );

        var n2 = new CullFace( 'FRONT' );
        ok( n2.getMode() === CullFace.FRONT, 'Check string parameter' );
    } );
};
