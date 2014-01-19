define( [
    'Q',
    'osg/Notify',
    'osgWrappers/serializers/osg'
], function ( Q, Notify, osgWrapper ) {

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

        var createPromiseCallback = function( animation ) {
            return function( chan ) {
                if ( chan ) {
                    animation.getChannels().push( chan );
                }
            };
        };
        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            Q.when( input.setJSON( jsonObj.Channels[ i ] ).readObject() ).then( createPromiseCallback( animation ) );
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
            if ( o.Name && o.StackedTransforms ) {
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

    return osgAnimationWrapper;
} );
