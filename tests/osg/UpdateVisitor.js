define( [
    'osg/UpdateVisitor',
    'osg/Node'
], function ( UpdateVisitor, Node ) {

    'use strict';

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
            var stateSetUpdateCallbackCalled = 0;

            var StateSetUpdateCallback = function () {
                this.update = function ( /*stateset, nv */) {
                    stateSetUpdateCallbackCalled += 1;
                };
            };
            var ss = b.getOrCreateStateSet();
            ss.addUpdateCallback( new StateSetUpdateCallback() );

            var Froot = function () {};
            Froot.prototype = {
                update: function ( node, nv ) {
                    callRoot = 1;
                    node.traverse( nv );
                }
            };

            var Fb = function () {};
            Fb.prototype = {
                update: function ( /*node, nv */) {
                    callb = 1;
                    return false;
                }
            };

            var Fc = function () {};
            Fc.prototype = {
                update: function ( /*node, nv */) {
                    callc = 1;
                    return true;
                }
            };

            root.setUpdateCallback( new Froot() );
            b.setUpdateCallback( new Fb() );
            c.setUpdateCallback( new Fc() );

            uv.apply( root );

            ok( stateSetUpdateCallbackCalled > 0, 'Called stateSet update callback' );

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
