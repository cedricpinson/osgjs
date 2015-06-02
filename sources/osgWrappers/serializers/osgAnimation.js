define( [
    'bluebird',
    'osgWrappers/serializers/osg',
    'osgAnimation/Channel',
    'osgAnimation/Animation'
], function ( P, osgWrapper, Channel, Animation ) {

    'use strict';

    var osgAnimationWrapper = {};

    osgAnimationWrapper.Animation = function ( input, animation ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Channels || jsonObj.Channels.length === 0 )
            return P.reject();

        var channels = [];
        var cb = channels.push.bind( channels );

        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            input.setJSON( jsonObj.Channels[ i ] ).readObject().then( cb );
        }

        animation = Animation.createAnimation( channels, jsonObj.Name );
        return P.resolve( animation );
    };

    osgAnimationWrapper.StandardVec3Channel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name )
            return P.reject();

        var size = jsonObj.KeyFrames.length;

        // channels
        var keys = new Float32Array( size * 3 );
        var times = new Float32Array( size );

        for ( var i = 0; i < size; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            var id = i * 3;
            times[ i ] = nodekey[ 0 ];

            keys[ id ] = nodekey[ 1 ];
            keys[ id + 1 ] = nodekey[ 2 ];
            keys[ id + 2 ] = nodekey[ 3 ];
        }

        channel = creator( keys, times );
        return P.resolve( channel );
    };

    osgAnimationWrapper.StandardQuatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name )
            return P.reject();

        var size = jsonObj.KeyFrames.length;

        // channels
        var keys = new Float32Array( size * 4 );
        var times = new Float32Array( size );

        for ( var i = 0; i < size; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            var id = i * 4;
            times[ i ] = nodekey[ 0 ];

            keys[ id ] = nodekey[ 1 ];
            keys[ id + 1 ] = nodekey[ 2 ];
            keys[ id + 2 ] = nodekey[ 3 ];
            keys[ id + 3 ] = nodekey[ 4 ];
        }

        channel = creator( keys, times );
        return P.resolve( channel );
    };

    osgAnimationWrapper.StandardFloatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name )
            return P.reject();

        var size = jsonObj.KeyFrames.length;

        // channels
        var keys = new Float32Array( size );
        var times = new Float32Array( size );

        for ( var i = 0; i < size; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            times[ i ] = nodekey[ 0 ];
            keys[ i ] = nodekey[ 1 ];
        }

        channel = creator( keys, times );
        return P.resolve( channel );
    };

    osgAnimationWrapper.Vec3LerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.StandardVec3Channel( input, channel, Channel.createVec3Channel );
    };

    osgAnimationWrapper.QuatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.StandardQuatChannel( input, channel, Channel.createQuatChannel );
    };

    osgAnimationWrapper.QuatSlerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.StandardQuatChannel( input, channel, Channel.createQuatChannel );
    };

    osgAnimationWrapper.FloatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.StandardFloatChannel( input, channel, Channel.createFloatChannel );
    };

    osgAnimationWrapper.BasicAnimationManager = function ( input, manager ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Animations )
            return P.reject();

        osgWrapper.Object( input, manager );

        var animations = [];
        var animPromises = [];
        var pushAnimCb = animations.push.bind( animations ); // <=> function( anim ) { animations.push( anim ); }

        for ( var i = 0, l = jsonObj.Animations.length; i < l; i++ ) {
            var prim = input.setJSON( jsonObj.Animations[ i ] ).readObject();
            if ( prim.isRejected() )
                continue;
            animPromises.push( prim );
            prim.then( pushAnimCb );
        }

        P.all( animPromises ).then( function () {
            manager.init( animations );
        } );

        return P.resolve( manager );
    };

    osgAnimationWrapper.UpdateMatrixTransform = function ( input, umt ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.StackedTransforms )
            return P.reject();

        osgWrapper.Object( input, umt );

        var stack = umt.getStackedTransforms();
        var cb = stack.push.bind( stack );

        for ( var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++ ) {
            input.setJSON( jsonObj.StackedTransforms[ i ] ).readObject().then( cb );
        }
        return P.resolve( umt );
    };

    osgAnimationWrapper.StackedTranslate = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

        st.setName( jsonObj.Name );
        if ( jsonObj.Translate ) st.setTranslate( jsonObj.Translate );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedQuaternion = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

        st.setName( jsonObj.Name );
        if ( jsonObj.Quaternion ) st.setQuaternion( jsonObj.Quaternion );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedRotateAxis = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Axis )
            return P.reject();

        osgWrapper.Object( input, st );

        if ( jsonObj.Angle ) st.setAngle( jsonObj.Angle );
        st.setAxis( jsonObj.Axis );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedMatrixElement = function ( input, sme ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Matrix )
            return P.reject();

        osgWrapper.Object( input, sme );

        sme.setName( jsonObj.Name );
        if ( jsonObj.Matrix ) sme.setMatrix( jsonObj.Matrix );

        return P.resolve( sme );
    };

    osgAnimationWrapper.Bone = function ( input, bone ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.InvBindMatrixInSkeletonSpace || !jsonObj.MatrixInSkeletonSpace )
            return P.reject();

        osgWrapper.MatrixTransform( input, bone );

        if ( jsonObj.InvBindMatrixInSkeletonSpace ) {
            bone.setInvBindMatrixInSkeletonSpace( jsonObj.InvBindMatrixInSkeletonSpace );
        }
        if ( jsonObj.BoneInSkeletonSpace ) {
            bone.setMatrixInSkeletonSpace( jsonObj.MatrixInSkeletonSpace );
        }
        return P.resolve( bone );
    };

    osgAnimationWrapper.Skeleton = osgWrapper.MatrixTransform;

    return osgAnimationWrapper;
} );
