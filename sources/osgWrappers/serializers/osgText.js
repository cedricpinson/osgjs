define( [
    'bluebird',
    'osgWrappers/serializers/osg'
], function ( P, osgWrapper ) {
    'use strict';

    var osgTextWrapper = {};

    osgTextWrapper.Text = function ( input, node ) {

        var jsonObj = input.getJSON();
        if ( !jsonObj.Text )
            return P.reject();

        var promise = osgWrapper.Node( input, node );
        node.setColor( jsonObj.Color );
        node.setText( jsonObj.Text );
        node.setAutoRotateToScreen( jsonObj.AutoRotateToScreen );
        node.setPosition( jsonObj.Position );
        node.setCharacterSize( jsonObj.CharacterSize );
        return promise;
    };


    return osgTextWrapper;
} );
