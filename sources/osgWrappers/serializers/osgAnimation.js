/*global define */

define( [
    'osg/Notify',
    'vendors/Q',
    'osgWrappers/serializers/osg'
], function ( Notify, Q, osgWrapper ) {

    /** -*- compile-command: "jslint-cli osgAnimation.js" -*-
     *
     *  Copyright (C) 2010-2011 Cedric Pinson
     *
     *                  GNU LESSER GENERAL PUBLIC LICENSE
     *                      Version 3, 29 June 2007
     *
     * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
     * Everyone is permitted to copy and distribute verbatim copies
     * of this license document, but changing it is not allowed.
     *
     * This version of the GNU Lesser General Public License incorporates
     * the terms and conditions of version 3 of the GNU General Public
     * License
     *
     * Authors:
     *  Cedric Pinson <cedric.pinson@plopbyte.com>
     *
     */

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
                Notify.log( "animation has field Name, error" );
                return false;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        if ( !osgWrapper.Object( input, animation ) ) {
            return;
        }

        // channels
        for ( var i = 0, l = jsonObj.Channels.length; i < l; i++ ) {
            Q.when( input.setJSON( jsonObj.Channels[ i ] ).readObject() ).then( function ( channel ) {
                if ( channel ) {
                    animation.getChannels().push( channel );
                }
            } );
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