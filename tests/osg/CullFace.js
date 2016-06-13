'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var CullFace = require( 'osg/CullFace' );
var State = require( 'osg/State' );
var ShaderGeneratorProxy = require( 'osgShader/ShaderGeneratorProxy' );


module.exports = function () {

    test( 'CullFace', function () {

        var n = new CullFace();
        assert.isOk( n.getMode() === CullFace.BACK, 'Check default mode' );

        var state = new State( new ShaderGeneratorProxy() );
        state.setGraphicContext( mockup.createFakeRenderer() );

        n.apply( state );

        n = new CullFace( CullFace.DISABLE );
        n.apply( state );

        var n2 = new CullFace( 'FRONT' );
        assert.isOk( n2.getMode() === CullFace.FRONT, 'Check string parameter' );
    } );
};
