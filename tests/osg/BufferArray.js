define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/BufferArray',
    'osgShader/ShaderGeneratorProxy',
    'osg/State'
], function ( QUnit, mockup, BufferArray, ShaderGeneratorProxy, State ) {

    'use strict';

    return function () {

        QUnit.module( 'osg' );

        QUnit.test( 'BufferArray', function () {

            ( function () {
                var gl = mockup.createFakeRenderer();
                gl.createBuffer = function () {
                    return {};
                };

                var content = [];
                for ( var i = 0, l = 3 * 50; i < l; i++ ) {
                    content.push( i );
                }
                var b = new BufferArray( BufferArray.ARRAY_BUFFER, content, 3 );
                b.bind( gl );
                ok( b._buffer !== undefined, 'Check we created gl buffer' );
                b.releaseGLObjects();
                ok( b._buffer === undefined, 'Check we released gl buffer' );
            } )();
        } );
    };
} );
