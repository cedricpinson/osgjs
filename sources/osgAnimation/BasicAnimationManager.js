define( [
    'osg/Notify',
    'osg/Utils',
    'osg/Object'
], function ( Notify, MACROUTILS, Object ) {

    /**
     *  BasicAnimationManager
     *  @class BasicAnimationManager
     */
    var BasicAnimationManager = function () {
        Object.call( this );
        this._animations = {};

        this._actives = {};
        this._actives._keys = [];

        this._lastUpdate = undefined;
        this._targets = [];
    };

    /** @lends BasicAnimationManager.prototype */
    BasicAnimationManager.prototype = MACROUTILS.objectInehrit( Object.prototype, {
        _updateAnimation: function ( animationParameter, t, priority ) {
            var duration = animationParameter.duration;
            var weight = animationParameter.weight;
            var animation = animationParameter.anim;
            var start = animationParameter.start;
            var loop = animationParameter.loop;

            if ( loop > 0 ) {
                var playedTimes = t - start;
                if ( playedTimes >= loop * duration ) {
                    return true;
                }
            }

            t = ( t - start ) % duration;
            var callback = animationParameter.callback;
            if ( callback ) {
                callback( t );
            }

            var channels = animation.getChannels();
            for ( var i = 0, l = channels.length; i < l; i++ ) {
                var channel = channels[ i ];
                channel.update( t, weight, priority );
            }
            return false;
        },
        update: function ( node, nv ) {
            var t = nv.getFrameStamp().getSimulationTime();
            this.updateManager( t );
            return true;
        },
        updateManager: function ( t ) {

            var targets = this._targets;
            for ( var i = 0, l = targets.length; i < l; i++ ) {
                targets[ i ].reset();
            }
            if ( this._actives._keys.length > 0 ) {
                var pri = this._actives._keys.length - 1;
                while ( pri >= 0 ) {
                    var layer = this._actives[ pri ];
                    var keys = this._actives[ pri ]._keys;
                    var removes = [];
                    for ( var ai = 0, al = keys.length; ai < al; ai++ ) {
                        var key = keys[ ai ];
                        var anim = layer[ key ];
                        if ( anim.start === undefined ) {
                            anim.start = t;
                        }
                        var remove = this._updateAnimation( anim, t, pri );
                        if ( remove ) {
                            removes.push( ai );
                        }
                    }

                    // remove finished animation
                    for ( var j = removes.length - 1; j >= 0; j-- ) {
                        var k = keys[ j ];
                        keys.splice( j, 1 );
                        delete layer[ k ];
                    }

                    pri--;
                }
            }
        },

        stopAll: function () {},
        isPlaying: function ( name ) {
            if ( this._actives._keys.length > 0 ) {
                var pri = this._actives._keys.length - 1;
                while ( pri >= 0 ) {
                    if ( this._actives[ pri ][ name ] ) {
                        return true;
                    }
                    pri--;
                }
            }
            return false;
        },
        stopAnimation: function ( name ) {
            if ( this._actives._keys.length > 0 ) {
                var pri = this._actives._keys.length - 1;
                var filterFunction = function ( element /*, index , array */ ) {
                    return element !== '_keys';
                };
                while ( pri >= 0 ) {
                    if ( this._actives[ pri ][ name ] ) {
                        delete this._actives[ pri ][ name ];
                        this._actives[ pri ]._keys = window.Object.keys( this._actives[ pri ] ).filter( filterFunction );
                        return;
                    }
                    pri--;
                }
            }
        },
        playAnimationObject: function ( obj ) {
            if ( obj.name === undefined ) {
                return;
            }

            var anim = this._animations[ obj.name ];
            if ( anim === undefined ) {
                Notify.info( 'no animation ' + obj.name + ' found' );
                return;
            }

            if ( this.isPlaying( obj.name ) ) {
                return;
            }

            if ( obj.priority === undefined ) {
                obj.priority = 0;
            }

            if ( obj.weight === undefined ) {
                obj.weight = 1.0;
            }

            if ( obj.timeFactor === undefined ) {
                obj.timeFactor = 1.0;
            }

            if ( obj.loop === undefined ) {
                obj.loop = 0;
            }

            if ( this._actives[ obj.priority ] === undefined ) {
                this._actives[ obj.priority ] = {};
                this._actives[ obj.priority ]._keys = [];
                this._actives._keys.push( obj.priority ); // = window.Object.keys(this._actives);
            }

            obj.start = undefined;
            obj.duration = anim.getDuration();
            obj.anim = anim;
            this._actives[ obj.priority ][ obj.name ] = obj;
            this._actives[ obj.priority ]._keys.push( obj.name );
        },

        playAnimation: function ( name, priority, weight ) {
            var animName = name;
            if ( typeof name === 'object' ) {
                if ( name.getName === undefined ) {
                    return this.playAnimationObject( name );
                } else {
                    animName = name.getName();
                }
            }
            var obj = {
                'name': animName,
                'priority': priority,
                'weight': weight
            };

            return this.playAnimationObject( obj );
        },

        registerAnimation: function ( anim ) {
            this._animations[ anim.getName() ] = anim;
            this.buildTargetList();
        },
        getAnimationMap: function () {
            return this._animations;
        },
        buildTargetList: function () {
            this._targets.length = 0;
            var keys = window.Object.keys( this._animations );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var a = this._animations[ keys[ i ] ];
                var channels = a.getChannels();
                for ( var c = 0, lc = channels.length; c < lc; c++ ) {
                    var channel = channels[ c ];
                    this._targets.push( channel.getTarget() );
                }
            }
        }

    } );

    return BasicAnimationManager;
} );
