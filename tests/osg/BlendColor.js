define( [
    'tests/mockup/mockup',
    'osg/BlendColor',
    'osg/State'
], function ( mockup, BlendColor, State ) {

    return function () {

        module( 'osg' );

        test( 'BlendColor', function () {

            var n = new BlendColor();
            ok( n.getConstantColor()[ 0 ] === 1.0 &&
                n.getConstantColor()[ 1 ] === 1.0 &&
                n.getConstantColor()[ 2 ] === 1.0 &&
                n.getConstantColor()[ 3 ] === 1.0, 'Check default constantColor' );

            n.setConstantColor( [ 0, 0.5, 0, 0.5 ] );
            ok( n.getConstantColor()[ 0 ] === 0.0 &&
                n.getConstantColor()[ 1 ] === 0.5 &&
                n.getConstantColor()[ 2 ] === 0.0 &&
                n.getConstantColor()[ 3 ] === 0.5, 'Check set constant color' );

            var state = new State();
            state.setGraphicContext( mockup.createFakeRenderer() );

            n.apply( state );
        } );
    };
} );
