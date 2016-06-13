'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var State = require( 'osg/State' );
var StateSet = require( 'osg/StateSet' );
var Material = require( 'osg/Material' );
var Shader = require( 'osg/Shader' );
var Program = require( 'osg/Program' );
var Texture = require( 'osg/Texture' );
var ShaderGeneratorProxy = require( 'osgShader/ShaderGeneratorProxy' );


module.exports = function () {

    test( 'ShaderGenerator', function () {


        ( function () {
            var state = new State( new ShaderGeneratorProxy() );
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function () {
                return true;
            };
            fakeRenderer.getProgramParameter = function () {
                return true;
            };
            fakeRenderer.isContextLost = function () {
                return false;
            };
            state.setGraphicContext( fakeRenderer );

            var stateSet0 = new StateSet();
            stateSet0.setAttributeAndModes( new Material() );

            var stateSet1 = new StateSet();
            stateSet1.setTextureAttributeAndModes( 0, new Texture( undefined ) );

            state.pushStateSet( stateSet0 );
            state.pushStateSet( stateSet1 );
            state.apply();
            assert.isOk( true, 'check not exception on material generator use' );

        } )();

        ( function () {
            var state = new State( new ShaderGeneratorProxy() );
            var fakeRenderer = mockup.createFakeRenderer();
            fakeRenderer.validateProgram = function () {
                return true;
            };
            fakeRenderer.getProgramParameter = function () {
                return true;
            };
            fakeRenderer.isContextLost = function () {
                return false;
            };
            state.setGraphicContext( fakeRenderer );

            var stateSet = new StateSet();

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

                program.setTrackAttributes( {} );
                program.getTrackAttributes().attributeKeys = [];

                return program;
            }
            stateSet.setAttributeAndModes( getShader() );


            state.pushStateSet( stateSet );
            state.apply();
            assert.isOk( true, 'check not exception on stateset generator use' );

        } )();

    } );
};
