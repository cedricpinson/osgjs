define( [
    'qunit',
    'tests/mockup/mockup',
    'osg/Light',
    'osg/LightSource',
    'osg/Material',
    'osgShader/Compiler',
    'osgShader/nodeFactory',
    'osgShadow/ShadowAttribute',
    'osgShadow/ShadowTexture'
], function ( QUnit, mockup, Light, LightSource, Material, Compiler, nodeFactory, ShadowAttribute, ShadowTexture ) {

    'use strict';

    return function () {

        QUnit.module( 'osgShader' );

        QUnit.test( 'Compiler', function () {

            ( function () {

                var light = new Light( 1 );
                var lightSource = new LightSource();
                lightSource.setLight( light );
                var shadowAttribute = new ShadowAttribute();
                var shadowTexture = new ShadowTexture();
                shadowAttribute.setLight( light );
                shadowTexture.setLightUnit( light.getLightNumber() );

                var material = new Material();
                var compiler = new Compiler( [ light, material, shadowAttribute ], [
                    [ shadowTexture ]
                ] );

                var root = compiler.createFragmentShaderGraph();

                var extensions = compiler.evaluateAndGatherField( root, 'getExtensions' );
                ok( extensions.length === 0, 'Compiler Evaluate And Gather Field: defines rightly so' );
                var defines = compiler.evaluateAndGatherField( root, 'getDefines' );
                ok( defines.length === 1, 'Compiler Evaluate And Gather Field: defines rightly so' );


                var globalDecl = compiler.evaluateGlobalVariableDeclaration( root );
                ok( globalDecl.length > 1, 'Compiler Evaluate Global Variables output smth' );

                globalDecl = globalDecl.split( '\n' );
                var hasDoublons = false;
                globalDecl.sort().filter( function ( item, pos ) {
                    if ( !hasDoublons && item === globalDecl[ pos - 1 ] ) hasDoublons = true;
                    return !pos || item !== globalDecl[ pos - 1 ];
                } );
                ok( !hasDoublons, 'Compiler Evaluate Global Variables Declaration output no doublons' );


                globalDecl = compiler.evaluateGlobalFunctionDeclaration( root );
                ok( globalDecl.length > 1, 'Compiler Evaluate Global Functions Declaration output smth' );

                /*
                 // sadly doesn't work as is for functions decl.
                 // needs glsl parsing...
                 var hasDoublons = false;
                 globalDecl.sort().filter( function ( item, pos ) {
                    if ( !hasDoublons && item === globalDecl[ pos - 1 ] ) hasDoublons = true;
                    return !pos || item !== globalDecl[ pos - 1 ];
                } );

                var globalDecl = compiler.evaluateGlobalFunctionDeclaration( root );
                ok( !hasDoublons, 'Compiler Evaluate Global Functions Declaration output no doublons' );
                 */

                var nodes = nodeFactory._nodes;
                var abstractNodeList = [];
                var variableNodeList = [];
                var realNodeList = [];
                nodes.forEach( function ( value, key, map ) {
                    var instance = Object.create( value.prototype );
                    value.apply( instance );
                    var t = instance.getType();

                    if ( t && t !== '' ) {
                        realNodeList.push( t );
                    } else if ( instance._name === 'Variable' ) {
                        variableNodeList.push( instance );
                    } else {
                        abstractNodeList.push( instance );
                    }
                } );

                ok( abstractNodeList.length === 2, 'Abstract Shader Node count OK. (error here means if you added an abstract node that you need to change the number here, or if you added a new node, you forgot to add a unique type for its class MANDATORY)' );

                //
                var realNodeListUniq = realNodeList.sort().filter( function ( item, pos ) {
                    return !pos || item !== realNodeList[ pos - 1 ];
                } );
                ok( realNodeListUniq.length === realNodeList.length, 'Shader Node Type string duplicate check (type must be unique, MANDATORY for compilation)' );

            } )();

        } );
    };
} );
