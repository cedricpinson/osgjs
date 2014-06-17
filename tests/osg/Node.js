define( [
    'osg/Node'
], function ( Node ) {

    return function () {

        module( 'osg' );

        test( 'Node', function () {

            var n = new Node();
            ok( n.children.length === 0, 'number of children must be 0' );
            ok( n.parents.length === 0, 'number of parents must be 0' );
            ok( n.nodeMask === ~0, 'nodemask must be ~0' );
            ok( n.boundingSphere !== undefined, 'boundingSphere must not be undefined' );
            ok( n.boundingSphereComputed === false, 'boundingSphereComputed must be false' );
            n.getBound();
            ok( n.boundingSphereComputed === true, 'boundingSphereComputed must be true' );

            var n1 = new Node();
            n.addChild( n1 );
            ok( n.children.length === 1, 'n must have 1 child' );
            ok( n1.parents.length === 1, 'n1 must have 1 parent' );
            ok( n.boundingSphereComputed === false, 'boundingSphereComputed must be false after adding child' );
            n.getBound();
            ok( n.boundingSphereComputed === true, 'boundingSphereComputed must be true after calling getBound' );


            n1.dirtyBound();
            ok( n.boundingSphereComputed === false, 'boundingSphereComputed must be true if a child call dirtyBound' );

            var matrixes = n1.getWorldMatrices();
            ok( ( matrixes.length === 1 ) && ( matrixes[ 0 ][ 0 ] === 1.0 ) && ( matrixes[ 0 ][ 5 ] === 1.0 ) && ( matrixes[ 0 ][ 10 ] === 1.0 ) && ( matrixes[ 0 ][ 15 ] === 1.0 ), 'getWorldMatrices should return one identity matrix' );
            // Test culling active, we need a valid bounding sphere
            n1.getBound()._radius = 1 ;
            n1.setCullingActive ( false );
            ok ( n.isCullingActive() === false, 'culling should be disabled because n has a child with the culling disabled');
            n1.setCullingActive ( true );
            ok ( n.isCullingActive() === true, 'culling should be enabled because all of the children have their culling active');
        } );
    };
} );
