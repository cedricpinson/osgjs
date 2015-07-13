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

        return P.all( arrayChannelsPromise ).then( function () {
            return Animation.createAnimation( channels, jsonObj.Name );
        } );
    };

    osgAnimationWrapper.StandardVec3Channel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 3 )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size * 3 );
        var times = new Float32Array( size );

        var eTime, eKeyX, eKeyY, eKeyZ;

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        jsTime.then( function ( buffer ) {
            eTime = buffer._elements;
        } );
        var jsKeyX = input.setJSON( jsonObj.KeyFrames.Key[ 0 ] ).readBufferArray();
        jsKeyX.then( function ( buffer ) {
            eKeyX = buffer._elements;
        } );
        var jsKeyY = input.setJSON( jsonObj.KeyFrames.Key[ 1 ] ).readBufferArray();
        jsKeyY.then( function ( buffer ) {
            eKeyY = buffer._elements;
        } );
        var jsKeyZ = input.setJSON( jsonObj.KeyFrames.Key[ 2 ] ).readBufferArray();
        jsKeyZ.then( function ( buffer ) {
            eKeyZ = buffer._elements;
        } );

        return P.all( [ jsTime, jsKeyX, jsKeyY, jsKeyZ ] ).then( function () {
            for ( var i = 0; i < size; i++ ) {
                var id = i * 3;
                times[ i ] = eTime[ i ];
                keys[ id++ ] = eKeyX[ i ];
                keys[ id++ ] = eKeyY[ i ];
                keys[ id ] = eKeyZ[ i ];
            }

            creator( keys, times, jsonObj.TargetName, jsonObj.Name, channel );
            return channel;
        } );
    };

    osgAnimationWrapper.StandardQuatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 4 )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size * 4 );
        var times = new Float32Array( size );

        var eTime, eKeyX, eKeyY, eKeyZ, eKeyW;

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        jsTime.then( function ( buffer ) {
            eTime = buffer._elements;
        } );
        var jsKeyX = input.setJSON( jsonObj.KeyFrames.Key[ 0 ] ).readBufferArray();
        jsKeyX.then( function ( buffer ) {
            eKeyX = buffer._elements;
        } );
        var jsKeyY = input.setJSON( jsonObj.KeyFrames.Key[ 1 ] ).readBufferArray();
        jsKeyY.then( function ( buffer ) {
            eKeyY = buffer._elements;
        } );
        var jsKeyZ = input.setJSON( jsonObj.KeyFrames.Key[ 2 ] ).readBufferArray();
        jsKeyZ.then( function ( buffer ) {
            eKeyZ = buffer._elements;
        } );
        var jsKeyW = input.setJSON( jsonObj.KeyFrames.Key[ 3 ] ).readBufferArray();
        jsKeyW.then( function ( buffer ) {
            eKeyW = buffer._elements;
        } );

        return P.all( [ jsKeyX, jsKeyY, jsKeyZ, jsKeyW, jsTime ] ).then( function () {
            for ( var i = 0; i < size; i++ ) {
                var id = i * 4;
                times[ i ] = eTime[ i ];
                keys[ id++ ] = eKeyX[ i ];
                keys[ id++ ] = eKeyY[ i ];
                keys[ id++ ] = eKeyZ[ i ];
                keys[ id ] = eKeyW[ i ];
            }
            creator( keys, times, jsonObj.TargetName, jsonObj.Name, channel );
            return channel;
        } );
    };

    osgAnimationWrapper.StandardFloatChannel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key )
            return P.reject();

        var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;

        // channels
        var keys = new Float32Array( size );
        var times = new Float32Array( size );
        var eTime, eKey;

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        jsTime.then( function ( buffer ) {
            eTime = buffer._elements;
        } );
        var jsKey = input.setJSON( jsonObj.KeyFrames.Key ).readBufferArray();
        jsKey.then( function ( buffer ) {
            eKey = buffer._elements;
        } );

        return P.all( [ jsTime, jsKey ] ).then( function () {
            for ( var i = 0; i < size; i++ ) {
                times[ i ] = eTime[ i ];
                keys[ i ] = eKey[ i ];
            }

            creator( keys, times, jsonObj.TargetName, jsonObj.Name, channel );
            return channel;
        } );
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


        return P.all( arraysPromise ).then( function () {
            var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;
            var keys = new Float32Array( size * 3 );
            var times = new Float32Array( size );

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
            Channel.createFloatCubicBezierChannel( keys, times, jsonObj.TargetName, jsonObj.Name, channel );
            return channel;
        } );
    };

    osgAnimationWrapper.Vec3CubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();

        if ( !jsonObj.KeyFrames || !jsonObj.TargetName || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Position || !jsonObj.KeyFrames.ControlPointOut || !jsonObj.KeyFrames.ControlPointIn || jsonObj.KeyFrames.Position.length !== 3 || jsonObj.KeyFrames.ControlPointIn.length !== 3 || jsonObj.KeyFrames.ControlPointOut.length !== 3 )
            return P.reject();

        var bezierChannel = {};
        var arraysPromise = [];

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

        return P.all( arraysPromise ).then( function () {
            var size = jsonObj.KeyFrames.Time.Array.Float32Array.Size;
            var keys = new Float32Array( size * 9 );
            var times = new Float32Array( size );

            var controlPointIn = bezierChannel.ControlPointIn;
            var controlPointOut = bezierChannel.ControlPointOut;
            var position = bezierChannel.Position;
            var time = bezierChannel.Time;

            var p0 = position[ 0 ];
            var p1 = position[ 1 ];
            var p2 = position[ 2 ];

            var cpi0 = controlPointIn[ 0 ];
            var cpi1 = controlPointIn[ 1 ];
            var cpi2 = controlPointIn[ 2 ];

            var cpo0 = controlPointOut[ 0 ];
            var cpo1 = controlPointOut[ 1 ];
            var cpo2 = controlPointOut[ 2 ];

            for ( var i = 0; i < size; i++ ) {
                var id = i * 9;

                times[ i ] = time[ i ];
                keys[ id++ ] = p0[ i ];
                keys[ id++ ] = p1[ i ];
                keys[ id++ ] = p2[ i ];

                keys[ id++ ] = cpi0[ i ];
                keys[ id++ ] = cpi1[ i ];
                keys[ id++ ] = cpi2[ i ];

                keys[ id++ ] = cpo0[ i ];
                keys[ id++ ] = cpo1[ i ];
                keys[ id ] = cpo2[ i ];
            }
            Channel.createVec3CubicBezierChannel( keys, times, jsonObj.TargetName, jsonObj.Name, channel );
            return channel;
        } );
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

        return P.all( animPromises ).then( function () {
            manager.init( animations );
            return manager;
        } );
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
        return P.all( promiseArray ).then( function () {
            umt.computeChannels();
            return umt;
        } );
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

        sme.setMatrix( jsonObj.Matrix );

        return P.resolve( sme );
    };

    osgAnimationWrapper.StackedScaleElement = function ( input, stc ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Scale )
            return P.reject();

        osgWrapper.Object( input, stc );

        stc.setScale( jsonObj.Scale );

        return P.resolve( stc );
    };

    osgAnimationWrapper.Bone = function ( input, bone ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.InvBindMatrixInSkeletonSpace )
            return P.reject();

        var promise = osgWrapper.MatrixTransform( input, bone );

        bone.setInvBindMatrixInSkeletonSpace( jsonObj.InvBindMatrixInSkeletonSpace );

        var AABBonBone = jsonObj.AABBonBone;
        if ( AABBonBone ) {
            bone.BoundingBox = {
                min: AABBonBone.min,
                max: AABBonBone.max
            };
        }
        return promise;
    };

    osgAnimationWrapper.UpdateBone = osgAnimationWrapper.UpdateMatrixTransform;

    osgAnimationWrapper.UpdateSkeleton = function ( input, upSkl ) {
        osgWrapper.Object( input, upSkl );
        return P.resolve( upSkl );
    };

    osgAnimationWrapper.Skeleton = osgWrapper.MatrixTransform;

    osgAnimationWrapper.RigGeometry = function ( input, rigGeom ) {
        var jsonObj = input.getJSON();

        if ( !jsonObj.BoneMap || !jsonObj.SourceGeometry ) // check boneMap
            return P.reject();

        //Import rigGeometry as Geometry + BoneMap
        var rigPromise = osgWrapper.Geometry( input, rigGeom );
        rigGeom._boneNameID = jsonObj.BoneMap;

        //Import source geometry and merge it with the rigGeometry
        var sourceGeometry = jsonObj.SourceGeometry[ 'osg.Geometry' ];
        var geomPromise;
        if ( sourceGeometry ) {
            input.setJSON( sourceGeometry );
            geomPromise = osgWrapper.Geometry( input, rigGeom );
        }

        return P.all( [ rigPromise, geomPromise ] ).then( function () {
            return rigGeom;
        } );
    };

    return osgAnimationWrapper;
} );
