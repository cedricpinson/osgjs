'use strict';
var assert = require( 'chai' ).assert;
var Node = require( 'osg/Node' );


module.exports = function () {

    test( 'Node', function () {

        var n = new Node();
        assert.isOk( n.children.length === 0, 'number of children must be 0' );
        assert.isOk( n.parents.length === 0, 'number of parents must be 0' );
        assert.isOk( n.nodeMask === ~0, 'nodemask must be ~0' );
        assert.isOk( n._boundingSphere !== undefined, 'boundingSphere must not be undefined' );
        assert.isOk( n._boundingSphereComputed === false, 'boundingSphereComputed must be false' );
        n.getBound();
        assert.isOk( n._boundingSphereComputed === true, 'boundingSphereComputed must be true' );

        var n1 = new Node();
        n.addChild( n1 );
        assert.isOk( n.children.length === 1, 'n must have 1 child' );
        assert.isOk( n1.parents.length === 1, 'n1 must have 1 parent' );
        assert.isOk( n._boundingSphereComputed === false, 'boundingSphereComputed must be false after adding child' );
        n.getBound();
        assert.isOk( n._boundingSphereComputed === true, 'boundingSphereComputed must be true after calling getBound' );


        n1.dirtyBound();
        assert.isOk( n._boundingSphereComputed === false, 'boundingSphereComputed must be true if a child call dirtyBound' );

        var matrixes = n1.getWorldMatrices();
        assert.isOk( ( matrixes.length === 1 ) && ( matrixes[ 0 ][ 0 ] === 1.0 ) && ( matrixes[ 0 ][ 5 ] === 1.0 ) && ( matrixes[ 0 ][ 10 ] === 1.0 ) && ( matrixes[ 0 ][ 15 ] === 1.0 ), 'getWorldMatrices should return one identity matrix' );
        // Test culling active, we need a valid bounding sphere
        n1.getBound()._radius = 1;
        n1.setCullingActive( false );
        assert.isOk( n.isCullingActive() === false, 'culling should be disabled because n has a child with the culling disabled' );
        n1.setCullingActive( true );
        assert.isOk( n.isCullingActive() === true, 'culling should be enabled because all of the children have their culling active' );
    } );
};
