define( [
    'osg/StateSet',
    'osg/Uniform',
    'osg/Shader',
    'osg/Program',
    'osg/Texture'
], function ( StateSet, Uniform, Shader, Program, Texture ) {

    return function () {

        module( 'osg' );

        test( 'StateSet', function () {

            ( function () {
                var stateset = new StateSet();
                var uniform;
                uniform = stateset.getUniform( 'test' );
                ok( uniform === undefined, 'Check getting an non existant uniform' );

                stateset.addUniform( Uniform.createFloat1( 1.0, 'test' ) );
                uniform = stateset.getUniform( 'test' );
                ok( uniform !== undefined, 'Check getting an existant uniform' );

            } )();

            ( function () {
                var ss = new StateSet();
                var t = new Texture();
                ss.setTextureAttributeAndModes( 1, t );

                ok( ss.getTextureAttribute( 1, 'Texture' ) === t, 'Check texture attribute accessors' );

                ss.removeTextureAttribute( 1, 'Texture' );
                ok( ss.getTextureAttribute( 1, 'Texture' ) === undefined, 'Check texture attribute has been removed' );
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

                ok( ss.getAttribute( 'Program' ) === s, 'Check stateset program' );

                ss.removeAttribute( 'Program' );
                ok( ss.getAttribute( 'Program' ) === undefined, 'Check program has been removed' );


            } )();
        } );
    };
} );
