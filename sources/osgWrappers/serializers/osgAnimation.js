define( [
    'q',
    'osg/Notify',
    'osgWrappers/serializers/osg',
], function ( Q, Notify, osgWrapper ) {

    'use strict';

    var osgAnimationWrapper = {};

    osgAnimationWrapper.Animation = function ( input, animation ) {
        var jsonObj = input.getJSON();
        // check
        //
        var check = function ( o ) {
            if ( o.Name && o.Channels && o.Channels.length > 0 ) {
                return true;
            }
            if ( !o.Name ) {
                Notify.log( 'animation has field Name, error' );
                return false;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        if ( !osgWrapper.Object( input, animation ) ) {
            return undefined;
        }


        var cb = function ( chan ) {
            if ( chan ) {
                animation.getChannels().push( chan );
            }
        };
        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            Q( input.setJSON( jsonObj.Channels[ i ] ).readObject() ).then( cb );
        }
        return animation;
    };

    osgAnimationWrapper.Vec3LerpChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();
        // check
        //
        var check = function ( o ) {
            if ( o.KeyFrames && o.TargetName && o.Name ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        // doit
        if ( !osgWrapper.Object( input, channel ) ) {
            return undefined;
        }

        channel.setTargetName( jsonObj.TargetName );

        // channels
        var keys = channel.getSampler().getKeyframes();
        for ( var i = 0, l = jsonObj.KeyFrames.length; i < l; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            var mykey = nodekey.slice( 1 );
            mykey.t = nodekey[ 0 ];
            keys.push( mykey );
        }
        return channel;
    };

    osgAnimationWrapper.QuatLerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.Vec3LerpChannel( input, channel );
    };

    osgAnimationWrapper.QuatSlerpChannel = function ( input, channel ) {
        return osgAnimationWrapper.Vec3LerpChannel( input, channel );
    };

    osgAnimationWrapper.FloatLerpChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();
        // check
        //
        var check = function ( o ) {
            if ( o.KeyFrames && o.TargetName && o.Name ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        // doit
        if ( !osgWrapper.Object( input, channel ) ) {
            return;
        }

        channel.setTargetName( jsonObj.TargetName );

        // channels
        var keys = channel.getSampler().getKeyframes();
        for ( var i = 0, l = jsonObj.KeyFrames.length; i < l; i++ ) {
            var nodekey = jsonObj.KeyFrames[ i ];
            var mykey = nodekey.slice( 1 );
            mykey.t = nodekey[ 0 ];
            keys.push( mykey );
        }
        return channel;
    };

    osgAnimationWrapper.BasicAnimationManager = function ( input, manager ) {
        var jsonObj = input.getJSON();
        // check
        //
        var check = function ( o ) {
            if ( o.Animations ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        for ( var i = 0, l = jsonObj.Animations.length; i < l; i++ ) {
            var entry = jsonObj.Animations[ i ];
            var anim = input.setJSON( entry ).readObject();
            if ( anim ) {
                manager.registerAnimation( anim );
            }
        }
        return manager;
    };

    osgAnimationWrapper.UpdateMatrixTransform = function ( input, umt ) {
        var jsonObj = input.getJSON();
        // check
        var check = function ( o ) {
            if ( /*o.Name &&*/ o.StackedTransforms ) {
                if(!o.Name)
                    o.Name = 'Empty';
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( osgWrapper.Object( input, umt ) === undefined ) {
            return;
        }

        for ( var i = 0, l = jsonObj.StackedTransforms.length; i < l; i++ ) {
            var entry = jsonObj.StackedTransforms[ i ];
            var ste = input.setJSON( entry ).readObject();
            if ( ste ) {
                umt.getStackedTransforms().push( ste );
            }
        }
        return umt;
    };

    osgAnimationWrapper.UpdateBone = function ( input, updateBone ) {
        if ( osgAnimationWrapper.UpdateMatrixTransform( input, updateBone ) === undefined ) {
            return;
        }
        return updateBone;
    };

    osgAnimationWrapper.StackedTranslate = function ( input, st ) {
        var jsonObj = input.getJSON();

        // check
        var check = function ( o ) {
            if ( o.Name ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( !osgWrapper.Object( input, st ) ) {
            return;
        }

        if ( jsonObj.Translate ) {
            st.setTranslate( jsonObj.Translate );
        }
        return st;
    };

    osgAnimationWrapper.StackedMatrixElement = function ( input, sme ) {
        var jsonObj = input.getJSON();

        //check
        var check = function ( o ) {
            if ( o.Name && o.Matrix ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( !osgWrapper.Object( input, sme ) ) {
            return;
        }

        if ( jsonObj.Matrix ) {
            sme.setMatrix( jsonObj.Matrix );
        }
        return sme;
    };

    osgAnimationWrapper.StackedQuaternion = function ( input, st ) {
        var jsonObj = input.getJSON();
        // check
        var check = function ( o ) {
            if ( o.Name ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( !osgWrapper.Object( input, st ) ) {
            return;
        }

        if ( jsonObj.Quaternion ) {
            st.setQuaternion( jsonObj.Quaternion );
        }
        return st;
    };

    osgAnimationWrapper.StackedRotateAxis = function ( input, st ) {
        var jsonObj = input.getJSON();
        // check
        var check = function ( o ) {
            if ( o.Axis ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( !osgWrapper.Object( input, st ) ) {
            return;
        }

        if ( jsonObj.Angle ) {
            st.setAngle( jsonObj.Angle );
        }

        st.setAxis( jsonObj.Axis );

        return st;
    };

    osgAnimationWrapper.Bone = function ( input, bone ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.InvBindMatrixInSkeletonSpace && o.MatrixInSkeletonSpace ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        osgWrapper.MatrixTransform( input, bone );

        if ( jsonObj.InvBindMatrixInSkeletonSpace !== undefined ) {
            bone.setInvBindMatrixInSkeletonSpace( jsonObj.InvBindMatrixInSkeletonSpace );
        }
        if ( jsonObj.BoneInSkeletonSpace !== undefined ) {
            bone.setMatrixInSkeletonSpace( jsonObj.MatrixInSkeletonSpace );
        }
        return bone;
    };

    osgAnimationWrapper.Skeleton = function ( input, skl ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.Matrix ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }
        return osgWrapper.MatrixTransform( input, skl );
    };

    osgAnimationWrapper.FloatCubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.KeyFrames && o.TargetName && o.Name ) {
                var KeyFrames = o.KeyFrames;
                if ( KeyFrames.Time && KeyFrames.Position && KeyFrames.ControlPointOut && KeyFrames.ControlPointIn ) {
                    return true;
                }
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        //doit
        if ( !osgWrapper.Object( input, channel ) ) {
            return;
        }

        channel.setTargetName( jsonObj.TargetName );

        //Keys building
        var keys = channel.getSampler().getKeyframes();

        var bezierChannel = {};
        var arraysPromise = [];

        var createChannelAttribute = function ( name, jsonAttribute ) {
            var defer = Q.defer();
            arraysPromise.push( defer.promise );

            var promise = input.setJSON( jsonAttribute ).readBufferArray();
            Q( promise ).then( function ( buffer ) {
                if ( buffer !== undefined ) {
                    bezierChannel[ name ] = buffer._elements;
                }
                defer.resolve( buffer );
            } );
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

            for ( var i = 0, l = time.length; i < l; i++ ) {
                var keyPos = [ position[ i ], controlPointIn[ i ], controlPointOut[ i ] ];
                var mykey = keyPos;
                mykey.t = time[ i ];
                keys.push( mykey );
            }
        };

        var defer = Q.defer();
        Q.all( arraysPromise ).then( function () {
            defer.resolve( bezierChannel );
            interlaceKeyFrames();
        } );

        return channel;
    };

    osgAnimationWrapper.Vec3CubicBezierChannel = function ( input, channel ) {
        var jsonObj = input.getJSON();

        var check = function ( o ) {
            if ( o.KeyFrames && o.TargetName && o.Name ) {
                var KeyFrames = o.KeyFrames;
                if ( KeyFrames.Time && KeyFrames.Position && KeyFrames.ControlPointOut && KeyFrames.ControlPointIn &&
                    KeyFrames.Position.length === 3 && KeyFrames.ControlPointIn.length === 3 &&
                    KeyFrames.ControlPointOut.length === 3 ) {
                    return true;
                }
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        //doit
        if ( !osgWrapper.Object( input, channel ) ) {
            return;
        }

        channel.setTargetName( jsonObj.TargetName );

        //Keys building
        var keys = channel.getSampler().getKeyframes();

        var bezierChannel = {};
        var arraysPromise = [];

        var createChannelAttribute = function ( name, jsonAttribute ) {
            var defer = Q.defer();
            var promise;
            arraysPromise.push( defer.promise );

            if ( name !== 'Time' ) {
                bezierChannel[ name ] = [];

                promise = input.setJSON( jsonAttribute[ 0 ] ).readBufferArray();
                Q( promise ).then( function ( buffer ) {
                    if ( buffer !== undefined ) {
                        bezierChannel[ name ].push( buffer._elements );
                    }
                    defer.resolve( buffer );
                } );

                promise = input.setJSON( jsonAttribute[ 1 ] ).readBufferArray();
                Q( promise ).then( function ( buffer ) {
                    if ( buffer !== undefined ) {
                        bezierChannel[ name ].push( buffer._elements );
                    }
                    defer.resolve( buffer );
                } );

                promise = input.setJSON( jsonAttribute[ 2 ] ).readBufferArray();
                Q( promise ).then( function ( buffer ) {
                    if ( buffer !== undefined ) {
                        bezierChannel[ name ].push( buffer._elements );
                    }
                    defer.resolve( buffer );
                } );
            } else {
                promise = input.setJSON( jsonAttribute ).readBufferArray();
                Q( promise ).then( function ( buffer ) {

                    if ( buffer !== undefined ) {
                        bezierChannel[ name ] = buffer._elements;
                    }
                    defer.resolve( buffer );
                } );
            }
        };

        //Reads all keyframes
        var keyFrames = Object.keys( jsonObj.KeyFrames );
        for ( var i = 0; i < keyFrames.length; i++ ) {
            var key = keyFrames[ i ];
            var value = jsonObj.KeyFrames[ key ];
            //console.log( key );
            createChannelAttribute( key, value );
        }

        var interlaceKeyFrames = function () {
            var controlPointIn = bezierChannel.ControlPointIn;
            var controlPointOut = bezierChannel.ControlPointOut;
            var position = bezierChannel.Position;
            var time = bezierChannel.Time;

            for ( var i = 0, l = time.length; i < l; i++ ) {
                var _position = [ position[ 0 ][ i ], position[ 1 ][ i ], position[ 2 ][ i ] ];
                var _controlPointIn = [ controlPointIn[ 0 ][ i ], controlPointIn[ 1 ][ i ], controlPointIn[ 2 ][ i ] ];
                var _controlPointOut = [ controlPointOut[ 0 ][ i ], controlPointOut[ 1 ][ i ], controlPointOut[ 2 ][ i ] ];

                var keyPos = [ _position, _controlPointIn, _controlPointOut ];
                var mykey = keyPos;
                mykey.t = time[ i ];
                keys.push( mykey );
                //console.log( mykey );
            }
        };

        var defer = Q.defer();
        Q.all( arraysPromise ).then( function () {
            defer.resolve( bezierChannel );
            interlaceKeyFrames();
        } );

        return channel;
    };

    osgAnimationWrapper.UpdateSkeleton = function ( input, upSkl ) {
        if ( !osgWrapper.Object( input, upSkl ) ) {
            return;
        }

        return upSkl;
    };

    osgAnimationWrapper.RigGeometry = function ( input, rigGeom ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.InfluenceMap && o.SourceGeometry )
                return true;
            return false;
        };

        if ( !check( jsonObj ) ) {
            return undefined;
        }

        if ( !osgWrapper.Geometry( input, rigGeom ) ) {
            return;
        }

        input.setJSON( jsonObj.SourceGeometry );
        if ( !osgWrapper.Geometry( input, rigGeom.getOrCreateSourceGeometry() ) )
            return undefined;

        var explodeInfluenceMap = {};
        var arraysPromise = [];

        var createVertexInfluence = function ( name, jsonAttribute ) {
            //Get Index array
            var deferIndex = Q.defer();
            arraysPromise.push( deferIndex.promise );
            var promiseIndex = input.setJSON( jsonAttribute[ 'Index' ] ).readBufferArray();
            Q( promiseIndex ).then( function ( buffer ) {
                if ( buffer !== undefined ) {
                    if ( !explodeInfluenceMap[ name ] )
                        explodeInfluenceMap[ name ] = {};
                    explodeInfluenceMap[ name ][ 'Index' ] = buffer;
                }
                deferIndex.resolve( buffer );
            } );

            //Get weigth array
            var deferWeight = Q.defer();
            arraysPromise.push( deferWeight.promise );
            var promiseWeight = input.setJSON( jsonAttribute[ 'Weight' ] ).readBufferArray();
            Q( promiseWeight ).then( function ( buffer ) {
                if ( buffer !== undefined ) {
                    if ( !explodeInfluenceMap[ name ] )
                        explodeInfluenceMap[ name ] = {};

                    explodeInfluenceMap[ name ][ 'Weight' ] = buffer;
                }
                deferWeight.resolve( buffer );
            } );
        };

        var keys = Object.keys( jsonObj.InfluenceMap );
        var InfluenceMap = jsonObj.InfluenceMap;

        for ( var i = 0, l = keys.length; i < l; i++ ) {
            var key = keys[ i ];
            var vertexInfluence = InfluenceMap[ key ];
            createVertexInfluence( key, vertexInfluence );
        }

        //Build influence Map
        var makeVertexInfluence = function ( name ) {
            var vertexInfluence = explodeInfluenceMap[ name ];
            var index = vertexInfluence[ 'Index' ]._elements;
            var weight = vertexInfluence[ 'Weight' ]._elements;
            var res = {};

            for ( var i = 0, l = index.length; i < l; i++ ) {
                res[ index[ i ] ] = weight[ i ];
            }
            return res;
        };

        var rebuildInfluenceMap = {};

        var defer = Q.defer();
        Q.all( arraysPromise ).then( function () {
            defer.resolve( explodeInfluenceMap );

            var keys = Object.keys( explodeInfluenceMap );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                rebuildInfluenceMap[ key ] = makeVertexInfluence( key );
            }

            rigGeom.setInfluenceMap( rebuildInfluenceMap );
        } );

        return rigGeom;
    };

    return osgAnimationWrapper;
} );
