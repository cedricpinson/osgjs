define( [
    'bluebird',
    'osg/Notify',
    'osgWrappers/serializers/osg',
    'osgAnimation/Channel',
    'osgAnimation/Animation',
    'osgDB/ReaderParser',
    'osgAnimation/StackedMatrix', // for backward compatibility
    'osgAnimation/StackedScale', // for backward compatibility
    'osgAnimation/MorphGeometry',
    'osg/Geometry'
], function ( P, Notify, osgWrapper, Channel, Animation, ReaderParser, StackedMatrix, StackedScale, MorphGeometry, Geometry ) {

    'use strict';

    var osgAnimationWrapper = {};

    var channelCtor = function () {};

    var registry = ReaderParser.registry();
    registry.registerObject( 'osgAnimation.Vec3LerpChannel', channelCtor );
    registry.registerObject( 'osgAnimation.FloatLerpChannel', channelCtor );
    registry.registerObject( 'osgAnimation.QuatSlerpChannel', channelCtor );
    registry.registerObject( 'osgAnimation.QuatLerpChannel', channelCtor );
    registry.registerObject( 'osgAnimation.FloatCubicBezierChannel', channelCtor );
    registry.registerObject( 'osgAnimation.Vec3CubicBezierChannel', channelCtor );
    // needs to be cleaned in c++
    registry.registerObject( 'osgAnimation.StackedMatrixElement', StackedMatrix );
    registry.registerObject( 'osgAnimation.StackedScaleElement', StackedScale );

    osgAnimationWrapper.Animation = function ( input ) {
        var jsonObj = input.getJSON();
        if ( jsonObj.Name === undefined || !jsonObj.Channels || jsonObj.Channels.length === 0 )
            return P.reject();

        var arrayChannelsPromise = [];

        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            var promise = input.setJSON( jsonObj.Channels[ i ] ).readObject();
            arrayChannelsPromise.push( promise );
        }

        return P.all( arrayChannelsPromise ).then( function ( channels ) {
            return Animation.createAnimation( channels, jsonObj.Name );
        } );
    };

    osgAnimationWrapper.StandardVec3Channel = function ( input, channel, creator ) {
        var jsonObj = input.getJSON();
        if ( jsonObj.TargetName === undefined || !jsonObj.KeyFrames || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 3 )
            return P.reject();

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        var jsKeyX = input.setJSON( jsonObj.KeyFrames.Key[ 0 ] ).readBufferArray();
        var jsKeyY = input.setJSON( jsonObj.KeyFrames.Key[ 1 ] ).readBufferArray();
        var jsKeyZ = input.setJSON( jsonObj.KeyFrames.Key[ 2 ] ).readBufferArray();

        return P.all( [ jsTime, jsKeyX, jsKeyY, jsKeyZ ] ).then( function ( pArray ) {
            var eTime = pArray[ 0 ].getElements();
            var eKeyX = pArray[ 1 ].getElements();
            var eKeyY = pArray[ 2 ].getElements();
            var eKeyZ = pArray[ 3 ].getElements();

            var size = eTime.length;
            var keys = new Float32Array( size * 3 );
            var times = new Float32Array( size );

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
        if ( jsonObj.TargetName === undefined || !jsonObj.KeyFrames || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key || jsonObj.KeyFrames.Key.length !== 4 )
            return P.reject();

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        var jsKeyX = input.setJSON( jsonObj.KeyFrames.Key[ 0 ] ).readBufferArray();
        var jsKeyY = input.setJSON( jsonObj.KeyFrames.Key[ 1 ] ).readBufferArray();
        var jsKeyZ = input.setJSON( jsonObj.KeyFrames.Key[ 2 ] ).readBufferArray();
        var jsKeyW = input.setJSON( jsonObj.KeyFrames.Key[ 3 ] ).readBufferArray();

        return P.all( [ jsTime, jsKeyX, jsKeyY, jsKeyZ, jsKeyW ] ).then( function ( pArray ) {
            var eTime = pArray[ 0 ].getElements();
            var eKeyX = pArray[ 1 ].getElements();
            var eKeyY = pArray[ 2 ].getElements();
            var eKeyZ = pArray[ 3 ].getElements();
            var eKeyW = pArray[ 4 ].getElements();

            var size = eTime.length;
            var times = new Float32Array( size );
            var keys = new Float32Array( size * 4 );

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
        if ( jsonObj.TargetName === undefined || !jsonObj.KeyFrames || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Key )
            return P.reject();

        var jsTime = input.setJSON( jsonObj.KeyFrames.Time ).readBufferArray();
        var jsKey = input.setJSON( jsonObj.KeyFrames.Key ).readBufferArray();

        return P.all( [ jsTime, jsKey ] ).then( function ( pArray ) {
            var eTime = pArray[ 0 ].getElements();
            var eKey = pArray[ 1 ].getElements();

            var size = eTime.length;
            var times = new Float32Array( size );
            var keys = new Float32Array( size );

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
        // nlerp is less expensive than slerp
        return osgAnimationWrapper.StandardQuatChannel( input, channel, Channel.createQuatChannel );
        // return osgAnimationWrapper.StandardQuatChannel( input, channel, Channel.createQuatSlerpChannel );
    };

    osgAnimationWrapper.FloatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.StandardFloatChannel( input, channel, Channel.createFloatChannel );
    };

    osgAnimationWrapper.FloatCubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();

        if ( jsonObj.TargetName === undefined || !jsonObj.KeyFrames || !jsonObj.Name ||
            !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Position ||
            !jsonObj.KeyFrames.ControlPointOut || !jsonObj.KeyFrames.ControlPointIn )
            return P.reject();

        var arrayPromise = [];
        var keyFrames = Object.keys( jsonObj.KeyFrames );
        for ( var i = 0; i < keyFrames.length; i++ )
            arrayPromise.push( input.setJSON( jsonObj.KeyFrames[ keyFrames[ i ] ] ).readBufferArray() );

        return P.all( arrayPromise ).then( function ( pArray ) {
            var controlPointIn = pArray[ 0 ].getElements();
            var controlPointOut = pArray[ 1 ].getElements();
            var position = pArray[ 2 ].getElements();
            var time = pArray[ 3 ].getElements();

            var size = time.length;
            var keys = new Float32Array( size * 3 );
            var times = new Float32Array( size );

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

        if ( jsonObj.TargetName === undefined || !jsonObj.KeyFrames || !jsonObj.Name || !jsonObj.KeyFrames.Time || !jsonObj.KeyFrames.Position || !jsonObj.KeyFrames.ControlPointOut || !jsonObj.KeyFrames.ControlPointIn || jsonObj.KeyFrames.Position.length !== 3 || jsonObj.KeyFrames.ControlPointIn.length !== 3 || jsonObj.KeyFrames.ControlPointOut.length !== 3 )
            return P.reject();

        var arrayPromise = [];

        //Reads all keyframes
        var keyFrames = Object.keys( jsonObj.KeyFrames );
        for ( var i = 0; i < keyFrames.length; i++ ) {
            var key = keyFrames[ i ];
            var jsonAttribute = jsonObj.KeyFrames[ key ];
            if ( key !== 'Time' ) {
                arrayPromise.push( input.setJSON( jsonAttribute[ 0 ] ).readBufferArray() );
                arrayPromise.push( input.setJSON( jsonAttribute[ 1 ] ).readBufferArray() );
                arrayPromise.push( input.setJSON( jsonAttribute[ 2 ] ).readBufferArray() );
            } else
                arrayPromise.push( input.setJSON( jsonAttribute ).readBufferArray() );
        }

        return P.all( arrayPromise ).then( function ( pArray ) {
            var cpi0 = pArray[ 0 ].getElements();
            var cpi1 = pArray[ 1 ].getElements();
            var cpi2 = pArray[ 2 ].getElements();
            var cpo0 = pArray[ 3 ].getElements();
            var cpo1 = pArray[ 4 ].getElements();
            var cpo2 = pArray[ 5 ].getElements();
            var p0 = pArray[ 6 ].getElements();
            var p1 = pArray[ 7 ].getElements();
            var p2 = pArray[ 8 ].getElements();
            var time = pArray[ 9 ].getElements();

            var size = time.length;
            var keys = new Float32Array( size * 9 );
            var times = new Float32Array( size );

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

        var animPromises = [];

        for ( var i = 0, l = jsonObj.Animations.length; i < l; i++ ) {
            var prim = input.setJSON( jsonObj.Animations[ i ] ).readObject();
            if ( prim.isRejected() ) {
                Notify.warn( 'An Animation failed on the parsing!' );
                continue;
            }
            animPromises.push( prim );
        }

        return P.all( animPromises ).then( function ( animations ) {
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

        var promiseArray = [];
        for ( var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++ ) {
            promiseArray.push( input.setJSON( jsonObj.StackedTransforms[ i ] ).readObject() );
        }

        // when UpdateMatrixTransform is ready
        // compute the default value data
        return P.all( promiseArray ).then( function ( array ) {
            var stack = umt.getStackedTransforms();
            for ( var i = 0, l = array.length; i < l; i++ ) stack.push( array[ i ] );
            umt.computeChannels();
            return umt;
        } );
    };

    osgAnimationWrapper.StackedTranslate = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Translate )
            return P.reject();

        osgWrapper.Object( input, st );

        st.init( jsonObj.Translate );

        return P.resolve( st );
    };

    osgAnimationWrapper.StackedQuaternion = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Quaternion )
            return P.reject();

        osgWrapper.Object( input, st );

        st.init( jsonObj.Quaternion );

        return P.resolve( st );
    };

    osgAnimationWrapper.StackedRotateAxis = function ( input, st ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Axis || jsonObj.Angle === undefined )
            return P.reject();

        osgWrapper.Object( input, st );

        st.init( jsonObj.Axis, jsonObj.Angle );

        return P.resolve( st );
    };

    osgAnimationWrapper.StackedMatrix = function ( input, sme ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Matrix )
            return P.reject();

        osgWrapper.Object( input, sme );

        sme.init( jsonObj.Matrix );

        return P.resolve( sme );
    };

    osgAnimationWrapper.StackedScale = function ( input, stc ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.Name || !jsonObj.Scale )
            return P.reject();

        osgWrapper.Object( input, stc );

        stc.init( jsonObj.Scale );

        return P.resolve( stc );
    };

    osgAnimationWrapper.Bone = function ( input, bone ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.InvBindMatrixInSkeletonSpace )
            return P.reject();

        var promise = osgWrapper.MatrixTransform( input, bone );

        bone.setInvBindMatrixInSkeletonSpace( jsonObj.InvBindMatrixInSkeletonSpace );

        if ( jsonObj.BoundingBox ) {
            // It is mandatory because we need it for shadows and culling
            var bbox = bone.getBoneBoundingBox();
            bbox.setMax( jsonObj.BoundingBox.max );
            bbox.setMin( jsonObj.BoundingBox.min );
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

        if ( !jsonObj.SourceGeometry ) // check boneMap
            return P.reject();

        if ( !jsonObj.BoneMap )
            Notify.warn( 'No boneMap found in a RigGeometry !' );

        //Import rigGeometry as Geometry + BoneMap
        var rigPromise = osgWrapper.Geometry( input, rigGeom );
        rigGeom._boneNameID = jsonObj.BoneMap;

        var mergeGeometry = function ( from, to ) {
            // Merge rigGeometry and sourceGeometry, we keep source instance and adds
            // some references to the rigGeometry

            //Merge primitives
            to.primitives = from.primitives;

            //Merge Attributes
            var keys = Object.keys( from.attributes );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                to.attributes[ key ] = from.attributes[ key ];
            }

            //Merge state set
            to.stateset = from.stateset;

            //@TODO Think to merge more stuff here
        };

        //Import source geometry and merge it with the rigGeometry
        var sourceGeometry = jsonObj.SourceGeometry[ 'osg.Geometry' ];
        var geomPromise;
        if ( sourceGeometry ) {
            input.setJSON( sourceGeometry );
            rigGeom.setSourceGeometry( new Geometry() );
            geomPromise = osgWrapper.Geometry( input, rigGeom.getSourceGeometry() );
        } else {
            sourceGeometry = jsonObj.SourceGeometry[ 'osgAnimation.MorphGeometry' ];
            if ( sourceGeometry ) {
                input.setJSON( sourceGeometry );
                rigGeom.setSourceGeometry( new MorphGeometry() );
                geomPromise = osgAnimationWrapper.MorphGeometry( input, rigGeom.getSourceGeometry() );
            } else {
                Notify.warn( 'SourceGeometry type no recognized' );
            }
        }

        return P.all( [ rigPromise, geomPromise ] ).then( function ( promises ) {
            mergeGeometry( promises[ 0 ].getSourceGeometry(), promises[ 0 ] );
            return rigGeom;
        } );
    };

    osgAnimationWrapper.MorphGeometry = function ( input, morphGeom ) {
        var jsonObj = input.getJSON();

        if ( /*!jsonObj.Name ||*/ !jsonObj.MorphTargets )
            return P.reject();

        var morphTargets = jsonObj.MorphTargets;
        var arrayPromise = [];

        arrayPromise.push( osgWrapper.Geometry( input, morphGeom ) );

        for ( var i = 0, l = morphTargets.length; i < l; i++ ) {
            if ( i >= 4 ) break; //Clamps the targets count
            var promise = input.setJSON( morphTargets[ i ] ).readObject();
            arrayPromise.push( promise );
        }

        return P.all( arrayPromise ).then( function ( pArray ) {
            var geom = pArray[ 0 ];
            var geomAttr = geom.attributes;
            var targets = geom._targets;
            for ( var i = 1, l = pArray.length; i < l; i++ ) {

                var target = pArray[ i ];
                var attributes = target.attributes;
                var keys = Object.keys( attributes );

                for ( var j = 0, k = keys.length; j < k; j++ ) {
                    var key = keys[ j ];
                    geomAttr[ key + '_' + i ] = attributes[ key ];
                }

                targets.push( target );
            }
            return morphGeom;
        } );
    };

    osgAnimationWrapper.UpdateMorph = function ( input, updateMorph ) {
        var jsonObj = input.getJSON();
        if ( !jsonObj.TargetMap )
            return P.reject();

        osgWrapper.Object( input, updateMorph );

        var keys = Object.keys( jsonObj.TargetMap );
        for ( var i = 0, l = keys.length; i < l; i++ ) {
            var key = keys[ i ];
            updateMorph.addTarget( jsonObj.TargetMap[ key ], parseInt( key, 10 ) );
        }

        return P.resolve( updateMorph );
    };

    osgAnimationWrapper.StackedMatrixElement = osgAnimationWrapper.StackedMatrix;
    osgAnimationWrapper.StackedScaleElement = osgAnimationWrapper.StackedScale;

    return osgAnimationWrapper;
} );
