define( [
    'osg/Notify',
    'osg/Matrix',
    'osg/Options',
    'osg/Stats',
    'osg/Timer',
    'osg/UpdateVisitor',
    'osg/Utils',
    'osg/Texture',
    'osgGA/OrbitManipulator',

    'osgViewer/CanvasStats',
    'osgViewer/eventProxy/EventProxy',
    'osgViewer/View',
    'osgViewer/webgl-utils',
    'osgViewer/webgl-debug'

], function ( Notify, Matrix, Options, Stats, Timer, UpdateVisitor, MACROUTILS, Texture, OrbitManipulator, CanvasStats, EventProxy, View, WebGLUtils, WebGLDebugUtils ) {

    'use strict';

    var OptionsURL = ( function () {
        var options = {};
        ( function ( options ) {
            var vars = [],
                hash;
            var indexOptions = window.location.href.indexOf( '?' );
            if ( indexOptions < 0 ) return;

            var hashes = window.location.href.slice( indexOptions + 1 ).split( '&' );
            for ( var i = 0; i < hashes.length; i++ ) {
                hash = hashes[ i ].split( '=' );
                var element = hash[ 0 ];
                vars.push( element );
                var result = hash[ 1 ];
                if ( result === undefined ) {
                    result = '1';
                }
                options[ element ] = result;
            }
        } )( options );

        if ( options.log !== undefined ) {
            var level = options.log.toLowerCase();

            switch ( level ) {
            case 'debug':
                Notify.setNotifyLevel( Notify.DEBUG );
                break;
            case 'info':
                Notify.setNotifyLevel( Notify.INFO );
                break;
            case 'notice':
                Notify.setNotifyLevel( Notify.NOTICE );
                break;
            case 'warn':
                Notify.setNotifyLevel( Notify.WARN );
                break;
            case 'error':
                Notify.setNotifyLevel( Notify.ERROR );
                break;
            case 'html':
                ( function () {
                    var logContent = [];
                    var divLogger = document.createElement( 'div' );
                    var codeElement = document.createElement( 'pre' );
                    document.addEventListener( 'DOMContentLoaded', function () {
                        document.body.appendChild( divLogger );
                        divLogger.appendChild( codeElement );
                    } );
                    var logFunc = function ( str ) {
                        logContent.unshift( str );
                        codeElement.innerHTML = logContent.join( '\n' );
                    };
                    divLogger.style.overflow = 'hidden';
                    divLogger.style.position = 'absolute';
                    divLogger.style.zIndex = '10000';
                    divLogger.style.height = '100%';
                    divLogger.style.maxWidth = '600px';
                    codeElement.style.overflow = 'scroll';
                    codeElement.style.width = '105%';
                    codeElement.style.height = '100%';
                    codeElement.style.fontSize = '10px';

                    [ 'log', 'error', 'warn', 'info', 'debug' ].forEach( function ( value ) {
                        window.console[ value ] = logFunc;
                    } );
                } )();
                break;
            }
        }

        return options;
    } )();


    var Viewer = function ( canvas, userOptions, error ) {
        View.call( this );

        this._startFrameTick = undefined;
        this._startTick = Timer.instance().tick();
        this._stats = new Stats( 'Viewer' );
        this._canvasStats = undefined;
        this._done = false;

        var options = this.initOptions( userOptions );
        var gl = this.initWebGLContext( canvas, options, error );

        if ( !gl )
            throw 'No WebGL implementation found';

        // this MACROUTILS.init(); should be removed and replace by something
        // more natural
        MACROUTILS.init();

        this.initDeviceEvents( options, canvas );
        this.initStats( options, canvas );

        this._updateVisitor = new UpdateVisitor();

        this.setUpView( gl.canvas, options );
    };


    Viewer.prototype = MACROUTILS.objectInherit( View.prototype, {

        initDeviceEvents: function ( options, canvas ) {

            // default argument for mouse binding
            var defaultMouseEventNode = options.mouseEventNode || canvas;

            var eventsBackend = options.EventBackend || {};
            if ( !options.EventBackend ) options.EventBackend = eventsBackend;
            eventsBackend.StandardMouseKeyboard = options.EventBackend.StandardMouseKeyboard || {};
            var mouseEventNode = eventsBackend.StandardMouseKeyboard.mouseEventNode || defaultMouseEventNode;
            eventsBackend.StandardMouseKeyboard.mouseEventNode = mouseEventNode;
            eventsBackend.StandardMouseKeyboard.keyboardEventNode = eventsBackend.StandardMouseKeyboard.keyboardEventNode || document;

            // hammer, Only activate it if we have a touch device in order to fix problems with IE11
            if ( 'ontouchstart' in window ) {
                eventsBackend.Hammer = eventsBackend.Hammer || {};
                eventsBackend.Hammer.eventNode = eventsBackend.Hammer.eventNode || defaultMouseEventNode;
            }
            // gamepad
            eventsBackend.GamePad = eventsBackend.GamePad || {};

            this._eventProxy = this.initEventProxy( options );
        },

        initOptions: function ( userOptions ) {
            // use default options
            var options = new Options();

            if ( userOptions ) {
                // user options override by user options
                options.extend( userOptions );
            }

            // if url options override url options
            options.extend( OptionsURL );


            // Check if Frustum culling is enabled to calculate the clip planes
            if ( options.getBoolean( 'enableFrustumCulling' ) === true )
                this.getCamera().getRenderer().getCullVisitor().setEnableFrustumCulling( true );


            return options;
        },

        initWebGLContext: function ( canvas, options, error ) {

            // #FIXME see tojiro's blog for webgl lost context stuffs
            if ( options.get( 'SimulateWebGLLostContext' ) ) {
                canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas( canvas );
                canvas.loseContextInNCalls( options.get( 'SimulateWebGLLostContext' ) );
            }

            var gl = WebGLUtils.setupWebGL( canvas, options, error );

            canvas.addEventListener( 'webglcontextlost', function ( event ) {
                this.contextLost();
                event.preventDefault();
            }.bind( this ), false );

            canvas.addEventListener( 'webglcontextrestored', function () {
                this.contextRestored();
            }.bind( this ), false );

            if ( Notify.reportWebGLError || options.get( 'reportWebGLError' ) ) {
                gl = WebGLDebugUtils.makeDebugContext( gl );
            }

            this.initWebGLCaps( gl );
            this.setGraphicContext( gl );

            return gl;
        },

        contextLost: function () {
            Notify.log( 'webgl context lost' );
            window.cancelRequestAnimFrame( this._requestID );
        },
        contextRestored: function () {
            Notify.log( 'webgl context restored, but not supported - reload the page' );
        },

        init: function () {
            //this._done = false;
        },

        getState: function () {
            return this.getCamera().getRenderer().getState();
        },

        initStats: function ( options, canvas ) {

            if ( !options.getBoolean( 'stats' ) )
                return;

            var maxMS = 20;
            var stepMS = 2;
            //var fontsize = 14;

            if ( options.statsMaxMS !== undefined ) {
                maxMS = parseInt( options.statsMaxMS, 10 );
            }
            if ( options.statsStepMS !== undefined ) {
                stepMS = parseInt( options.statsStepMS, 10 );
            }

            var createDomElements = function ( elementToAppend ) {
                var id = Math.floor( Math.random() * 1000 );

                var gridID = 'StatsCanvasGrid' + id.toString();
                var statsCanvasID = 'StatsCanvas' + id.toString();
                var statsCanvasTextID = 'StatsCanvasText' + id.toString();

                var dom = [
                    '<div style="top: 0; position: absolute; width: 300px; height: 150px; z-index: 10;">',
                    '<div style="position: relative;">',
                    options.getBoolean( 'statsNoGraph' ) ? '' : '<canvas id="' + gridID + '" width="300" height="150" style="z-index:-1; position: absolute; background: rgba(14,14,14,0.8); " ></canvas>',
                    options.getBoolean( 'statsNoGraph' ) ? '' : '<canvas id="' + statsCanvasID + '" width="300" height="150" style="z-index:8; position: absolute;" ></canvas>',
                    '<canvas id="' + statsCanvasTextID + '" width="300" height="150" style="z-index:9; position: absolute;" ></canvas>',
                    '</div>',

                    '</div>'
                ].join( '\n' );


                var parent;

                if ( elementToAppend === undefined ) {
                    parent = document.body;
                } else {
                    parent = elementToAppend;
                }

                var mydiv = document.createElement( 'div' );
                mydiv.innerHTML = dom;
                parent.appendChild( mydiv );

                if ( options.getBoolean( 'statsNoGraph' ) ) {
                    return {
                        text: document.getElementById( statsCanvasTextID )
                    };
                }

                var grid = document.getElementById( gridID );
                var ctx = grid.getContext( '2d' );
                ctx.clearRect( 0, 0, grid.width, grid.height );

                var step = Math.floor( maxMS / stepMS ).toFixed( 0 );
                var r = grid.height / step;
                ctx.strokeStyle = 'rgb(70,70,70)';
                for ( var i = 0, l = step; i < l; i++ ) {
                    ctx.beginPath();
                    ctx.moveTo( 0, i * r );
                    ctx.lineTo( grid.width, i * r );
                    ctx.stroke();
                }

                return {
                    graph: document.getElementById( statsCanvasID ),
                    text: document.getElementById( statsCanvasTextID )
                };
            };

            var elementToAttach = canvas.parentNode;
            var domStats = createDomElements( elementToAttach );
            var canvasStats = new CanvasStats( domStats.graph, domStats.text );

            canvasStats.addLayer( '#ff0fff', 65,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var value = this.getViewerStats().getAveragedAttribute( fn - 25, fn, 'Frame rate' );
                    return value;
                }.bind( this ),
                function ( a ) {
                    return 'FrameRate: ' + ( a ).toFixed( 0 ) + ' fps';
                } );

            canvasStats.addLayer( '#ffff00', maxMS,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var value = this.getViewerStats().getAttribute( fn, 'Frame duration' );
                    return value * 1000.0;
                }.bind( this ),
                function ( a ) {
                    return 'FrameTime: ' + a.toFixed( 2 ) + ' ms';
                } );

            canvasStats.addLayer( '#d07b1f', maxMS,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var value = this.getViewerStats().getAttribute( fn, 'Update duration' );
                    return value * 1000.0;
                }.bind( this ),
                function ( a ) {
                    return 'UpdateTime: ' + a.toFixed( 2 ) + ' ms';
                } );

            canvasStats.addLayer( '#73e0ff', maxMS,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var value = this.getViewerStats().getAttribute( fn, 'Cull duration' );
                    return value * 1000.0;
                }.bind( this ),
                function ( a ) {
                    return 'CullTime: ' + a.toFixed( 2 ) + ' ms';
                } );

            canvasStats.addLayer( '#ff0000', maxMS,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var value = this.getViewerStats().getAttribute( fn, 'Draw duration' );
                    return value * 1000.0;
                }.bind( this ),
                function ( a ) {
                    return 'DrawTime: ' + a.toFixed( 2 ) + ' ms';
                } );

            canvasStats.addLayer( '#f0f000', 256,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var stats = Texture.getTextureManager( this.getGraphicContext() ).getStats();
                    var value = stats.getAttribute( fn, 'Texture used' );
                    return value / ( 1024 * 1024 );
                }.bind( this ),
                function ( a ) {
                    return 'Texture used: ' + a.toFixed( 2 ) + ' MB';
                } );

            canvasStats.addLayer( '#f00f00', 256,
                function ( /*t*/) {
                    var fn = this.getFrameStamp().getFrameNumber() - 1;
                    var stats = Texture.getTextureManager( this.getGraphicContext() ).getStats();
                    var value = stats.getAttribute( fn, 'Texture total' );
                    return value / ( 1024 * 1024 );
                }.bind( this ),
                function ( a ) {
                    return 'Texture total: ' + a.toFixed( 2 ) + ' MB';
                } );

            if ( window.performance && window.performance.memory && window.performance.memory.totalJSHeapSize ) {
                canvasStats.addLayer( '#00ff00',
                    window.performance.memory.totalJSHeapSize,
                    function ( /*t*/) {
                        var fn = this.getFrameStamp().getFrameNumber() - 1;
                        var value = this.getViewerStats().getAttribute( fn, 'Heap size' );
                        return value;
                    }.bind( this ),
                    function ( a ) {
                        var v = a / ( 1024 * 1024 );
                        return 'Memory : ' + v.toFixed( 2 ) + ' Mb';
                    } );
            }
            this._canvasStats = canvasStats;

        },

        getViewerStats: function () {
            return this._stats;
        },

        renderingTraversal: function () {

            var frameNumber = this.getFrameStamp().getFrameNumber();

            if ( this.getScene().getSceneData() )
                this.getScene().getSceneData().getBound();

            if ( this.getCamera() ) {

                var tick0 = Timer.instance().tick();
                this.getCamera().getRenderer().cull();

                var tick1 = Timer.instance().tick();
                this.getViewerStats().setAttribute( frameNumber, 'Cull duration', Timer.instance().deltaS( tick0, tick1 ) );

                this.getCamera().getRenderer().draw();

                var tick2 = Timer.instance().tick();
                this.getViewerStats().setAttribute( frameNumber, 'Draw duration', Timer.instance().deltaS( tick1, tick2 ) );
            }
        },


        updateTraversal: function () {

            var startTraversal = Timer.instance().tick();
            // update the scene
            this.getScene().updateSceneGraph( this._updateVisitor );
            // Remove ExpiredSubgraphs from DatabasePager
            this.getDatabasePager().releaseGLExpiredSubgraphs( 0.005 );
            // In OSG this.is deferred until the draw traversal, to handle multiple contexts
            this.flushDeletedGLObjects( 0.005 );
            var deltaS = Timer.instance().deltaS( startTraversal, Timer.instance().tick() );

            this.getViewerStats().setAttribute( this.getFrameStamp().getFrameNumber(), 'Update duration', deltaS );
        },

        advance: function ( simulationTime ) {

            var sTime = simulationTime;

            if ( sTime === undefined )
                sTime = Number.MAX_VALUE;

            var frameStamp = this._frameStamp;
            var previousReferenceTime = frameStamp.getReferenceTime();
            var previousFrameNumber = frameStamp.getFrameNumber();

            frameStamp.setFrameNumber( previousFrameNumber + 1 );

            var deltaS = Timer.instance().deltaS( this._startTick, Timer.instance().tick() );
            frameStamp.setReferenceTime( deltaS );

            // reference time
            if ( sTime === Number.MAX_VALUE )
                frameStamp.setSimulationTime( frameStamp.getReferenceTime() );
            else
                frameStamp.setSimulationTime( sTime );

            var deltaFrameTime = frameStamp.getReferenceTime() - previousReferenceTime;
            this.getViewerStats().setAttribute( previousFrameNumber, 'Frame rate', 1.0 / deltaFrameTime );
        },

        beginFrame: function () {
            this._startFrameTick = Timer.instance().tick();
        },

        endFrame: function () {

            var frameNumber = this.getFrameStamp().getFrameNumber();

            if ( window.performance &&
                window.performance.memory &&
                window.performance.memory.usedJSHeapSize ) {
                var mem = window.performance.memory.usedJSHeapSize;
                this.getViewerStats().setAttribute( frameNumber, 'Heap size', mem );
            }

            this.getViewerStats().setAttribute( frameNumber, 'Frame duration', Timer.instance().deltaS( this._startFrameTick, Timer.instance().tick() ) );

            if ( this._canvasStats ) { // update ui stats
                Texture.getTextureManager( this.getGraphicContext() ).updateStats( frameNumber );
                this._canvasStats.update();
            }
        },

        checkNeedToDoFrame: function () {
            return this._requestContinousUpdate || this._requestRedraw;
        },

        frame: function () {

            this.beginFrame();

            this.advance();

            // update viewport if a resize occured
            var canvasSizeChanged = this.updateViewport();

            // update inputs devices
            this.updateEventProxy( this._eventProxy, this.getFrameStamp() );

            // setup framestamp
            this._updateVisitor.setFrameStamp( this.getFrameStamp() );
            // Update Manipulator/Event
            if ( this.getManipulator() ) {
                this.getManipulator().update( this._updateVisitor );
                Matrix.copy( this.getManipulator().getInverseMatrix(), this.getCamera().getViewMatrix() );
            }

            if ( this.checkNeedToDoFrame() || canvasSizeChanged ) {
                this._requestRedraw = false;
                this.updateTraversal();
                this.renderingTraversal();
            }

            this.endFrame();
        },

        setDone: function ( bool ) {
            this._done = bool;
        },
        done: function () {
            return this._done;
        },

        run: function () {
            var self = this;
            var render = function () {
                if ( !self.done() ) {
                    self._requestID = window.requestAnimationFrame( render, self.getGraphicContext().canvas );
                    self.frame();
                }
            };
            render();
        },

        setupManipulator: function ( manipulator /*, dontBindDefaultEvent */ ) {
            if ( manipulator === undefined ) {
                manipulator = new OrbitManipulator();
            }

            if ( manipulator.setNode !== undefined ) {
                manipulator.setNode( this.getSceneData() );
            } else {
                // for backward compatibility
                manipulator.view = this;
            }

            manipulator.setCamera( this.getCamera() );
            this.setManipulator( manipulator );
        },


        // updateViewport
        updateViewport: function () {

            var gl = this.getGraphicContext();
            var canvas = gl.canvas;

            var hasChanged = this.computeCanvasSize( canvas );
            if ( !hasChanged )
                return false;

            var camera = this.getCamera();
            var vp = camera.getViewport();

            var prevWidth = vp.width();
            var prevHeight = vp.height();

            var widthChangeRatio = canvas.width / prevWidth;
            var heightChangeRatio = canvas.height / prevHeight;
            var aspectRatioChange = widthChangeRatio / heightChangeRatio;
            vp.setViewport( vp.x() * widthChangeRatio, vp.y() * heightChangeRatio, vp.width() * widthChangeRatio, vp.height() * heightChangeRatio );

            if ( aspectRatioChange !== 1.0 ) {
                Matrix.preMult( camera.getProjectionMatrix(), Matrix.makeScale( 1.0 / aspectRatioChange, 1.0, 1.0, Matrix.create() ) );
            }

            return true;
        },

        // intialize all input devices
        initEventProxy: function ( argsObject ) {
            var args = argsObject || {};
            var deviceEnabled = {};

            var lists = EventProxy;
            var argumentEventBackend = args.EventBackend;


            // loop on each devices and try to initialize it
            var keys = window.Object.keys( lists );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var device = keys[ i ];

                // check if the config has a require
                var initialize = true;
                var argDevice = {};
                if ( argumentEventBackend && ( argumentEventBackend[ device ] !== undefined ) ) {
                    initialize = argumentEventBackend[ device ].enable || true;
                    argDevice = argumentEventBackend[ device ];
                }

                // extend argDevice with regular options eg:
                // var options = {
                //     EventBackend: {
                //         Hammer: {
                //             drag_max_touches: 4,
                //             transform_min_scale: 0.08,
                //             transform_min_rotation: 180,
                //             transform_always_block: true
                //         }
                //     },
                //     zoomscroll: false
                // };

                // to options merged:
                // var options = {
                //     drag_max_touches: 4,
                //     transform_min_scale: 0.08,
                //     transform_min_rotation: 180,
                //     transform_always_block: true,
                //     zoomscroll: false
                // };
                //
                var options = new Options();
                options.extend( argDevice ).extend( argsObject );
                delete options.EventBackend;

                if ( initialize ) {
                    var inputDevice = new lists[ device ]( this );
                    inputDevice.init( options );
                    deviceEnabled[ device ] = inputDevice;
                }
            }
            return deviceEnabled;
        },
        updateEventProxy: function ( list, frameStamp ) {
            var keys = window.Object.keys( list );
            keys.forEach( function ( key ) {
                var device = list[ key ];
                if ( device.update )
                    device.update( frameStamp );
            } );
        },
        setManipulator: function ( manipulator ) {
            if ( this._manipulator )
                this.removeEventProxy();
            View.prototype.setManipulator.call( this, manipulator );
        },
        removeEventProxy: function () {
            var list = this._eventProxy;
            var keys = window.Object.keys( list );
            keys.forEach( function ( key ) {
                var device = list[ key ];
                if ( device.remove )
                    device.remove();
            } );
        },
        getEventProxy: function () {
            return this._eventProxy;
        }

    } );

    return Viewer;
} );
