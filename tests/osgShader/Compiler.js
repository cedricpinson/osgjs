'use strict';
var assert = require( 'chai' ).assert;
var Light = require( 'osg/Light' );
var Material = require( 'osg/Material' );
var Compiler = require( 'osgShader/Compiler' );
var nodeFactory = require( 'osgShader/nodeFactory' );
var ShadowReceiveAttribute = require( 'osgShadow/ShadowReceiveAttribute' );
var ShadowTexture = require( 'osgShadow/ShadowTexture' );


module.exports = function () {

    test( 'Compiler', function () {

        ( function () {

            var light = new Light( 1 );
            var shadowReceiveAttribute = new ShadowReceiveAttribute( light.getLightNumber() );
            var shadowTexture = new ShadowTexture();
            shadowTexture.setLightUnit( light.getLightNumber() );

            var material = new Material();
            var compiler = new Compiler( [ light, material, shadowReceiveAttribute ], [
                [ shadowTexture ]
            ] );

            var root = compiler.createFragmentShaderGraph();

            var extensions = compiler.evaluateAndGatherField( root, 'getExtensions' );
            assert.isOk( extensions.length === 0, 'Compiler Evaluate And Gather Field: defines rightly so' );
            var defines = compiler.evaluateAndGatherField( root, 'getDefines' );
            assert.isOk( defines.length === 1, 'Compiler Evaluate And Gather Field: defines rightly so' );


            var globalDecl = compiler.evaluateGlobalVariableDeclaration( root );
            assert.isOk( globalDecl.length > 1, 'Compiler Evaluate Global Variables output smth' );

            globalDecl = globalDecl.split( '\n' );
            var hasDoublons = false;
            globalDecl.sort().filter( function ( item, pos ) {
                if ( !hasDoublons && item === globalDecl[ pos - 1 ] ) hasDoublons = true;
                return !pos || item !== globalDecl[ pos - 1 ];
            } );
            assert.isOk( !hasDoublons, 'Compiler Evaluate Global Variables Declaration output no doublons' );


            globalDecl = compiler.evaluateGlobalFunctionDeclaration( root );
            assert.isOk( globalDecl.length > 1, 'Compiler Evaluate Global Functions Declaration output smth' );

            /*
             // sadly doesn't work as is for functions decl.
             // needs glsl parsing...
             var hasDoublons = false;
             globalDecl.sort().filter( function ( item, pos ) {
                if ( !hasDoublons && item === globalDecl[ pos - 1 ] ) hasDoublons = true;
                return !pos || item !== globalDecl[ pos - 1 ];
            } );

            var globalDecl = compiler.evaluateGlobalFunctionDeclaration( root );
            assert.isOk( !hasDoublons, 'Compiler Evaluate Global Functions Declaration output no doublons' );
             */

            var nodes = nodeFactory._nodes;
            var abstractNodeList = [];
            var variableNodeList = [];
            var realNodeList = [];
            nodes.forEach( function ( value /*, key, map*/ ) {
                var instance = Object.create( value.prototype );
                value.apply( instance );
                var t = instance.getType();

                if ( instance.getName() === 'Variable' || ( instance.isUnique && instance.isUnique() ) ) {
                    variableNodeList.push( instance );
                } else if ( t && t !== '' ) {
                    realNodeList.push( t );
                } else {
                    abstractNodeList.push( instance );
                }
            } );

            assert.isOk( abstractNodeList.length === 2, 'Abstract Shader Node count OK. (error here means if you added an abstract node that you need to change the number here, or if you added a new node, you forgot to add a unique type for its class MANDATORY)' );

            //
            var realNodeListUniq = realNodeList.sort().filter( function ( item, pos ) {
                return !pos || item !== realNodeList[ pos - 1 ];
            } );
            assert.isOk( realNodeListUniq.length === realNodeList.length, 'Shader Node Type string duplicate check (type must be unique, MANDATORY for compilation)' );

        } )();

    } );
};
