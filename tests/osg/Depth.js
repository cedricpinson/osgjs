'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var Depth = require( 'osg/Depth' );
var State = require( 'osg/State' );
var ShaderGeneratorProxy = require( 'osgShader/ShaderGeneratorProxy' );


module.exports = function () {

    test( 'Depth', function () {

        var n = new Depth();
        assert.isOk( n._near === 0.0, 'Check near' );
        assert.isOk( n._far === 1.0, 'Check far' );
        assert.isOk( n._func === Depth.LESS, 'Check function' );
        assert.isOk( n._writeMask === true, 'Check write mask' );

        var state = new State( new ShaderGeneratorProxy() );
        state.setGraphicContext( mockup.createFakeRenderer() );

        n.apply( state );

        n = new Depth( Depth.DISABLE );
        n.apply( state );
    } );
};
