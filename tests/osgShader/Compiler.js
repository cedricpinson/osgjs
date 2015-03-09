define( [
    'tests/mockup/mockup',
    'osg/Light',
    'osg/LightSource',
    'osg/Material',
    'osgShader/Compiler',
    'osgShadow/ShadowAttribute',
    'osgShadow/ShadowTexture'
], function ( mockup, Light, LightSource, Material, Compiler, ShadowAttribute, ShadowTexture ) {

    return function () {

        module( 'osgShader' );

        test( 'Compiler', function () {

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

                var extensions = compiler.evaluateAndGatherField( root, 'extensions' );
                ok( extensions.length === 0, 'Compiler Evaluate And Gather Field: defines rightly so' );
                var defines = compiler.evaluateAndGatherField( root, 'defines' );
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

            } )();

        } );
    };
} );
