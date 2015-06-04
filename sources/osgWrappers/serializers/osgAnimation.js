define( [
    'bluebird',
    'osgWrappers/serializers/osg',
    'osgAnimation/Channel',
    'osgAnimation/Animation'
], function ( P, osgWrapper, Channel, Animation ) {

    'use strict';

    var osgAnimationWrapper = {};

    osgAnimationWrapper.Animation = function ( input ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Channels || jsonObj.Channels.length === 0 )
            return P.reject();

        var channels = [];
        var cb = channels.push.bind( channels );

        var arrayChannelsPromise = [];

        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            var promise = input.setJSON( jsonObj.Channels[ i ] ).readObject();
            promise.then( cb );
            arrayChannelsPromise.push( promise );
        }

        var defer = P.defer();
        P.all( arrayChannelsPromise ).then( function () {
            var animation = Animation.createAnimation( channels, jsonObj.Name );
            defer.resolve( animation );
        } );

        return defer.promise;
    };

    osgAnimationWrapper.StandardVec3Channel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 3 )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size * 3 );
        var times = new Float32Array( size );

        var jsTime = jsonObj.KeyFrames.Time.Array.Float32Array.Elements;
        var jsKeyX = jsonObj.KeyFrames.Key[ 0 ].Array.Float32Array.Elements;
        var jsKeyY = jsonObj.KeyFrames.Key[ 1 ].Array.Float32Array.Elements;
        var jsKeyZ = jsonObj.KeyFrames.Key[ 2 ].Array.Float32Array.Elements;

        for ( var i = 0; i < size; i++ ) {
            var id = i * 3;
            times[ i ] = jsTime[ i ];
            keys[ id++ ] = jsKeyX[ i ];
            keys[ id++ ] = jsKeyY[ i ];
            keys[ id ] = jsKeyZ[ i ];
        }

        channel = creator( keys, times, jsonObj.TargetName, jsonObj.Name );
        return P.resolve( channel );
    };

    osgAnimationWrapper.StandardQuatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 4 )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size * 4 );
        var times = new Float32Array( size );

        var jsTime = jsonObj.KeyFrames.Time.Array.Float32Array.Elements;
        var jsKeyX = jsonObj.KeyFrames.Key[ 0 ].Array.Float32Array.Elements;
        var jsKeyY = jsonObj.KeyFrames.Key[ 1 ].Array.Float32Array.Elements;
        var jsKeyZ = jsonObj.KeyFrames.Key[ 2 ].Array.Float32Array.Elements;
        var jsKeyW = jsonObj.KeyFrames.Key[ 3 ].Array.Float32Array.Elements;

        for ( var i = 0; i < size; i++ ) {
            var id = i * 4;
            times[ i ] = jsTime[ i ];
            keys[ id++ ] = jsKeyX[ i ];
            keys[ id++ ] = jsKeyY[ i ];
            keys[ id++ ] = jsKeyZ[ i ];
            keys[ id ] = jsKeyW[ i ];
        }

        channel = creator( keys, times, jsonObj.TargetName, jsonObj.Name );
        return P.resolve( channel );
    };

    osgAnimationWrapper.StandardFloatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size );
        var times = new Float32Array( size );

        var jsTime = jsonObj.KeyFrames.Time.Array.Float32Array.Elements;
        var jsKey = jsonObj.KeyFrames.Key.Array.Float32Array.Elements;

        for ( var i = 0; i < size; i++ ) {
            times[ i ] = jsTime[ i ];
            keys[ i ] = jsKey[ i ];
        }

        channel = creator( keys, times, jsonObj.TargetName, jsonObj.Name );
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

    osgAnimationWrapper.FloatCubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();

        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name ||
            !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Position ||
            !jsonObj.KeyFrames.ControlPointOut || !jsonObj.KeyFrames.ControlPointIn )
            return P.reject();

        var bezierChannel = {};
        var arraysPromise = [];
        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;
        var keys = new Float32Array( size * 3 );
        var times = new Float32Array( size );


        var createChannelAttribute = function ( name, jsonAttribute ) {
            var promise = input.setJSON( jsonAttribute ).readBufferArray().then( function ( buffer ) {
                bezierChannel[ name ] = buffer._elements;
            } );
            arraysPromise.push( promise );
        };

        var keyFrames = Object.keys( jsonObj.KeyFrames );
        for ( var i = 0; i < keyFrames.length; i++ ) {
            var key = keyFrames[ i ];
            var value = jsonObj.KeyFrames[ key ];
            createChannelAttribute( key, value );
        }

        var interlaceKeyFrames = function () {
            var controlPointIn = bezierChannel.ControlPointIn;
            var controlPointOut = bezierChannel.ControlPointOut;
            var position = bezierChannel.Position;
            var time = bezierChannel.Time;

            for ( var i = 0; i < size; i++ ) {
                var id = i * 3;

                times[ i ] = time[ i ];
                keys[ id++ ] = position[ i ];
                keys[ id++ ] = controlPointIn[ i ];
                keys[ id ] = controlPointOut[ i ];
            }
        };

        P.all( arraysPromise ).then( function () {
            interlaceKeyFrames();
        } );

        channel = Channel.createFloatCubicBezierChannel( keys, times, jsonObj.TargetName, jsonObj.Name );
        return P.resolve( channel );
    };

    osgAnimationWrapper.Vec3CubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();

        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Position || !jsonObj.KeyFrames.ControlPointOut || !jsonObj.KeyFrames.ControlPointIn || jsonObj.KeyFrames.Position.length !== 3 || jsonObj.KeyFrames.ControlPointIn.length !== 3 || jsonObj.KeyFrames.ControlPointOut.length !== 3 )
            return P.reject();

        var bezierChannel = {};
        var arraysPromise = [];
        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;
        var keys = new Float32Array( size * 9 );
        var times = new Float32Array( size );


        var createChannelAttribute = function ( name, jsonAttribute ) {
            var promise;

            if ( name !== 'Time' ) {
                var bChannel = bezierChannel[ name ] = [];

                promise = input.setJSON( jsonAttribute[ 0 ] ).readBufferArray();
                promise.then( function ( buffer ) {
                    bChannel[ 0 ] = buffer._elements;
                } );
                arraysPromise.push( promise );

                promise = input.setJSON( jsonAttribute[ 1 ] ).readBufferArray();
                promise.then( function ( buffer ) {
                    bChannel[ 1 ] = buffer._elements;
                } );
                arraysPromise.push( promise );

                promise = input.setJSON( jsonAttribute[ 2 ] ).readBufferArray();
                promise.then( function ( buffer ) {
                    bChannel[ 2 ] = buffer._elements;
                } );
                arraysPromise.push( promise );
            } else {
                promise = input.setJSON( jsonAttribute ).readBufferArray();
                promise.then( function ( buffer ) {
                    bezierChannel.Time = buffer._elements;
                } );
                arraysPromise.push( promise );
            }
        };

        //Reads all keyframes
        var keyFrames = Object.keys( jsonObj.KeyFrames );
        for ( var i = 0; i < keyFrames.length; i++ ) {
            var key = keyFrames[ i ];
            var value = jsonObj.KeyFrames[ key ];
            createChannelAttribute( key, value );
        }

        var interlaceKeyFrames = function () {
            var controlPointIn = bezierChannel.ControlPointIn;
            var controlPointOut = bezierChannel.ControlPointOut;
            var position = bezierChannel.Position;
            var time = bezierChannel.Time;

            for ( var i = 0; i < size; i++ ) {
                var id = i * 9;

                times[ i ] = time[ i ];
                keys[ id++ ] = position[ 0 ][ i ];
                keys[ id++ ] = position[ 1 ][ i ];
                keys[ id++ ] = position[ 2 ][ i ];

                keys[ id++ ] = controlPointIn[ 0 ][ i ];
                keys[ id++ ] = controlPointIn[ 1 ][ i ];
                keys[ id++ ] = controlPointIn[ 2 ][ i ];

                keys[ id++ ] = controlPointOut[ 0 ][ i ];
                keys[ id++ ] = controlPointOut[ 1 ][ i ];
                keys[ id ] = controlPointOut[ 2 ][ i ];
            }
        };

        P.all( arraysPromise ).then( interlaceKeyFrames );

        channel = Channel.createVec3CubicBezierChannel( keys, times, jsonObj.TargetName, jsonObj.Name );
        return P.resolve( channel );
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
        //  some stackedTransform on bones has no name but the transform is usefull
        if ( /*!jsonObj.Name ||*/ !jsonObj.StackedTransforms )
            return P.reject();

        osgWrapper.Object( input, umt );

        var stack = umt.getStackedTransforms();

        var cb = function ( stackTransfrom ) {
            stack.push( stackTransfrom );
        };

        var promiseArray = [];
        for ( var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++ ) {
            var promise = input.setJSON( jsonObj.StackedTransforms[ i ] ).readObject();
            promise.then( cb );
            promiseArray.push( promise );
        }

        // when UpdateMatrixTransform is ready
        // compute the default value data
        var all = P.all( promiseArray );
        all.then( function () {
            umt.computeChannels();
        } );

        return P.resolve( umt );
    };

    osgAnimationWrapper.StackedTranslate = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

        if ( jsonObj.Translate ) st.setTranslate( jsonObj.Translate );
        return P.resolve( st );
    };

    osgAnimationWrapper.StackedQuaternion = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name )
            return P.reject();

        osgWrapper.Object( input, st );

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

        if ( jsonObj.Matrix ) sme.setMatrix( jsonObj.Matrix );

        return P.resolve( sme );
    };

    osgAnimationWrapper.Bone = function ( input, bone ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.InvBindMatrixInSkeletonSpace /*|| !jsonObj.MatrixInSkeletonSpace*/ )
            return P.reject();

        osgWrapper.MatrixTransform( input, bone );

        if ( jsonObj.InvBindMatrixInSkeletonSpace ) {
            bone.setInvBindMatrixInSkeletonSpace( jsonObj.InvBindMatrixInSkeletonSpace );
        }
        // if ( jsonObj.BoneInSkeletonSpace ) {
        //     bone.setMatrixInSkeletonSpace( jsonObj.MatrixInSkeletonSpace );
        // }
        return P.resolve( bone );
    };

    osgAnimationWrapper.UpdateBone = function ( input, updateBone ) {
        osgAnimationWrapper.UpdateMatrixTransform( input, updateBone );
        return P.resolve( updateBone );
    };

    osgAnimationWrapper.UpdateSkeleton = function ( input, upSkl ) {
        osgWrapper.Object( input, upSkl );
        return P.resolve( upSkl );
    };

    osgAnimationWrapper.Skeleton = osgWrapper.MatrixTransform;

    osgAnimationWrapper.RigGeometry = function ( input, rigGeom ) {
        var jsonObj = input.getJSON();

        osgWrapper.Geometry( input, rigGeom );

        input.setJSON( jsonObj.SourceGeometry );
        if ( !osgWrapper.Geometry( input, rigGeom.getOrCreateSourceGeometry() ) )
            return P.reject();

        return P.resolve( rigGeom );
    };

    return osgAnimationWrapper;
} );
