define( [
    'bluebird',
    'osgWrappers/serializers/osg'
], function ( P, osgWrapper ) {

    'use strict';

    var osgAnimationWrapper = {};

    osgAnimationWrapper.Animation = function ( input, animation ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Name || !jsonObj.Channels || jsonObj.Channels.length === 0 )
            return P.reject();

        osgWrapper.Object( input, animation );

        var cbSuccess = function ( chan ) {
            if ( chan )
                animation.getChannels().push( chan );
        };
        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            input.setJSON( jsonObj.Channels[ i ] ).readObject().then( cbSuccess );
        }
        return P.resolve( animation );
    };

    osgAnimationWrapper.Vec3LerpChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, channel );

        channel.setTargetName( jsonObj.TargetName );

        // channels
        var keys = channel.getSampler().getKeyframes();
        for ( var i = 0, l = jsonObj.KeyFrames.length; i < l; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            var mykey = nodekey.slice( 1 );
            mykey.t = nodekey[ 0 ];
            keys.push( mykey );
        }
        return P.resolve( channel );
    };

    osgAnimationWrapper.QuatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.Vec3LerpChannel( input, channel );
    };

    osgAnimationWrapper.QuatSlerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.Vec3LerpChannel( input, channel );
    };

    osgAnimationWrapper.FloatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.Vec3LerpChannel( input, channel );
    };

    osgAnimationWrapper.BasicAnimationManager = function ( input, manager ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Animations )
            return P.reject();

        osgWrapper.Object( input, manager );

        var cbRegister = manager.registerAnimation.bind( manager );
        for ( var i = 0, l = jsonObj.Animations.length; i < l; i++ ) {
            input.setJSON( jsonObj.Animations[ i ] ).readObject().then( cbRegister );
        }
        return P.resolve( manager );
    };

    osgAnimationWrapper.UpdateMatrixTransform = function ( input, umt ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Name || !jsonObj.StackedTransforms )
            return P.reject();

        osgWrapper.Object( input, umt );

        var cb = function ( ste ) {
            umt.getStackedTransforms().push( ste );
        };
        for ( var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++ ) {
            input.setJSON( jsonObj.StackedTransforms[ i ] ).readObject().then( cb );
        }
        return P.resolve( umt );
    };

    osgAnimationWrapper.StackedTranslate = function ( input, st ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

        if ( jsonObj.Translate )
            st.setTranslate( jsonObj.Translate );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedQuaternion = function ( input, st ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

        if ( jsonObj.Quaternion ) st.setQuaternion( jsonObj.Quaternion );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedRotateAxis = function ( input, st ) {
        var jsonObj = input.getJSON();
        // check
        if ( !jsonObj.Axis )
            return P.reject();

        osgWrapper.Object( input, st );

        if ( jsonObj.Angle ) st.setAngle( jsonObj.Angle );
        st.setAxis( jsonObj.Axis );
        return P.resolve( st );
    };

    return osgAnimationWrapper;
} );
