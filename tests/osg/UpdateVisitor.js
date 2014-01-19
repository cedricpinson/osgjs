define( [
    'osg/UpdateVisitor',
    'osg/Node'
], function ( UpdateVisitor, Node ) {

    return function () {

        module( 'osg' );

        test( 'UpdateVisitor', function () {

            var uv = new UpdateVisitor();

            var root = new Node();
            root.setName( 'a' );
            var b = new Node();
            b.setName( 'b' );
            var c = new Node();
            c.setName( 'c' );
            root.addChild( b );
            b.addChild( c );

            var callRoot = 0;
            var callb = 0;
            var callc = 0;

            var froot = function () {};
            froot.prototype = {
                update: function ( node, nv ) {
                    callRoot = 1;
                    node.traverse( nv );
                }
            };

            var fb = function () {};
            fb.prototype = {
                update: function ( node, nv ) {
                    callb = 1;
                    return false;
                }
            };

            var fc = function () {};
            fc.prototype = {
                update: function ( node, nv ) {
                    callc = 1;
                    return true;
                }
            };

            root.setUpdateCallback( new froot() );
            b.setUpdateCallback( new fb() );
            c.setUpdateCallback( new fc() );

            uv.apply( root );

            ok( callRoot === 1, 'Called root update callback' );
            ok( callb === 1, 'Called b update callback' );
            ok( callc === 0, 'Did not Call c update callback as expected' );

            root.setNodeMask( ~0 );
            ok( callRoot === 1, 'Called root update callback' );
            ok( callb === 1, 'Called b update callback' );
            ok( callc === 0, 'Did not Call c update callback as expected' );
        } );
    };
} );
