define( [
    'osg/Utils'
], function ( MACROUTILS ) {

    'use strict';

    var NodeCallback = function () {

    };

    NodeCallback.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        // var _NodeCallback = undefined;
    } ), 'osg', 'NodeCallback' );

} );
