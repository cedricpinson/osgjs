'use strict';
var assert = require( 'chai' ).assert;
var StateSet = require( 'osg/StateSet' );
var Uniform = require( 'osg/Uniform' );
var Shader = require( 'osg/Shader' );
var Program = require( 'osg/Program' );
var Texture = require( 'osg/Texture' );


module.exports = function () {

    test( 'StateSet', function () {

        ( function () {
            var stateset = new StateSet();
            var uniform;
            uniform = stateset.getUniform( 'test' );
            assert.isOk( uniform === undefined, 'Check getting an non existant uniform' );

            stateset.addUniform( Uniform.createFloat1( 1.0, 'test' ) );
            uniform = stateset.getUniform( 'test' );
            assert.isOk( uniform !== undefined, 'Check getting an existant uniform' );

        } )();

        ( function () {
            var ss = new StateSet();
            var t = new Texture();
            ss.setTextureAttributeAndModes( 1, t );

            assert.isOk( ss.getTextureAttribute( 1, 'Texture' ) === t, 'Check texture attribute accessors' );

            ss.removeTextureAttribute( 1, 'Texture' );
            assert.isOk( ss.getTextureAttribute( 1, 'Texture' ) === undefined, 'Check texture attribute has been removed' );
        } )();

        ( function () {
            var ss = new StateSet();


            function getShader() {
                var vertexshader = [
                    '',
                    'attribute vec3 Vertex;',
                    'varying vec4 position;',
                    'void main(void) {',
                    '  gl_Position = vec4(Vertex,1.0);',
                    '}'
                ].join( '\n' );

                var fragmentshader = [
                    '',
                    'precision highp float;',
                    'varying vec4 position;',
                    'void main(void) {',
                    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
                    '}',
                    ''
                ].join( '\n' );

                var program = new Program(
                    new Shader( 'VERTEX_SHADER', vertexshader ),
                    new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                program.trackAttributes = {};
                program.trackAttributes.attributeKeys = [];

                return program;
            }

            var s = getShader();
            ss.setAttributeAndModes( s );

            assert.isOk( ss.getAttribute( 'Program' ) === s, 'Check stateset program' );

            ss.removeAttribute( 'Program' );
            assert.isOk( ss.getAttribute( 'Program' ) === undefined, 'Check program has been removed' );


        } )();
    } );
};
