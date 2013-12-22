define( [
    'osg/StateSet',
    'osg/Uniform',
    'osg/Texture'
], function ( StateSet, Uniform, Texture ) {

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
                ss.setTextureAttributeAndMode( 1, t );

                ok( ss.getTextureAttribute( 1, 'Texture' ) === t, 'Check texture attribute accessors' );

                ss.removeTextureAttribute( 1, 'Texture' );
                ok( ss.getTextureAttribute( 1, 'Texture' ) === undefined, 'Check texture attribute has been removed' );
            } )();
        } );
    };
} );
