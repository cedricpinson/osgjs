define( [
    'osg/NodeVisitor',
    'osg/Node',
    'osg/Utils'
], function ( NodeVisitor, Node, MACROUTILS ) {

    return function () {

        module( 'osg' );

        test( 'NodeVisitor', function () {

            var FindItemAnchor = function ( search ) {
                NodeVisitor.call( this );
                this.search = search;
                this.result = [];
            };

            FindItemAnchor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node.getName !== undefined ) {
                        var name = node.getName();
                        if ( name !== undefined && name === this.search ) {
                            this.result.push( node );
                        }
                    }
                    this.traverse( node );
                }
            } );

            var root = new Node();
            root.setName( 'a' );
            var b = new Node();
            b.setName( 'b' );
            var c = new Node();
            c.setName( 'c' );
            root.addChild( b );
            root.addChild( c );

            var v = new FindItemAnchor( 'c' );
            v.apply( root );
            ok( v.result[ 0 ] === c, 'Should find item named "c" ' + v.result[ 0 ].name );

            c.setNodeMask( 0x0 );
            v = new FindItemAnchor( 'c' );
            root.accept( v );
            ok( v.result.length === 0, 'Should not find item named "c" because of node mask' );


            ( function () {
                // test visit parents
                var GetRootItem = function () {
                    NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
                    this.node = undefined;
                };
                GetRootItem.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                    apply: function ( node ) {
                        this.node = node;
                        this.traverse( node );
                    }
                } );

                var root = new Node();
                root.setName( 'root' );
                var child0 = new Node();
                var child1 = new Node();
                var child2 = new Node();

                root.addChild( child0 );
                root.addChild( child1 );
                child1.addChild( child2 );

                var visit = new GetRootItem();
                child2.accept( visit );

                ok( visit.node.getName() === 'root', 'Should get the root node' );

            } )();
        } );
    };
} );
