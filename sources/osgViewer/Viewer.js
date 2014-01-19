define( [
    'osg/Notify',
    'osg/Utils',
    'osg/UpdateVisitor',
    'osg/CullVisitor',
    'osgUtil/osgUtil',
    'osgViewer/View',
    'osg/RenderStage',
    'osg/StateGraph',
    'osg/Matrix',
    'osg/State',
    'osgGA/OrbitManipulator',
    'osgViewer/eventProxy/EventProxy',
    'osgViewer/webgl-utils',
    'osgViewer/webgl-debug',
    'osgViewer/stats'
], function ( Notify, MACROUTILS, UpdateVisitor, CullVisitor, osgUtil, View, RenderStage, StateGraph, Matrix, State, OrbitManipulator, EventProxy, WebGLUtils, WebGLDebugUtils, Stats ) {

    ( function () {

        // install an html console logger for mobile
        var optionsURL = function () {
            var vars = [],
                hash;
            var hashes = window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ).split( '&' );
            for ( var i = 0; i < hashes.length; i++ ) {
                hash = hashes[ i ].split( '=' );
                var element = hash[ 0 ].toLowerCase();
                vars.push( element );
                var result = hash[ 1 ];
                if ( result === undefined ) {
                    result = '1';
                }
                vars[ element ] = result.toLowerCase();

            }
            return vars;
        };

        var options = optionsURL();

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

    } )();

    var Viewer = function ( canvas, options, error ) {
        View.call( this );

        if ( options === undefined ) {
            options = {
                antialias: true
            };
        }
        this._options = options;

        // #FIXME see tojiro's blog for webgl lost context stuffs
        if ( options.SimulateWebGLLostContext ) {
            canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas( canvas );
            canvas.loseContextInNCalls( options.SimulateWebGLLostContext );
        }

        var gl = WebGLUtils.setupWebGL( canvas, options, error );
        var self = this;
        canvas.addEventListener( 'webglcontextlost', function ( event ) {
            self.contextLost();
            event.preventDefault();
        }, false );

        canvas.addEventListener( 'webglcontextrestored', function () {
            self.contextRestored();
        }, false );


        if ( Notify.reportWebGLError || options.reportWebGLError ) {
            gl = WebGLDebugUtils.makeDebugContext( gl );
        }


        if ( gl ) {
            this.setGraphicContext( gl );
            MACROUTILS.init();
            this._canvas = canvas;
            this._frameRate = 60.0;
            osgUtil.UpdateVisitor = UpdateVisitor;
            osgUtil.CullVisitor = CullVisitor;
            this._urlOptions = true;

            // default argument for mouse binding
            var eventsBackend = this._options.EventBackend || {};
            this._options.EventBackend = eventsBackend;

            eventsBackend.StandardMouseKeyboard = this._options.EventBackend.StandardMouseKeyboard || {};
            var mouseEventNode = eventsBackend.StandardMouseKeyboard.mouseEventNode || options.mouseEventNode || canvas;
            eventsBackend.StandardMouseKeyboard.mouseEventNode = mouseEventNode;
            eventsBackend.StandardMouseKeyboard.keyboardEventNode = eventsBackend.StandardMouseKeyboard.keyboardEventNode || document;

            // hammer
            eventsBackend.Hammer = eventsBackend.Hammer || {};
            eventsBackend.Hammer.eventNode = eventsBackend.Hammer.eventNode || options.mouseEventNode || canvas;

            // gamepade
            eventsBackend.GamePad = eventsBackend.GamePad || {};

            this.setUpView( canvas );
        } else {
            throw 'No WebGL implementation found';
        }
    };


    Viewer.prototype = MACROUTILS.objectInehrit( View.prototype, {

        contextLost: function () {
            Notify.log( 'webgl context lost' );
            window.cancelRequestAnimFrame( this._requestID );
        },
        contextRestored: function () {
            Notify.log( 'webgl context restored, but not supported - reload the page' );
        },

        init: function () {
            this._done = false;
            this._state = new State();

            var gl = this.getGraphicContext();
            this._state.setGraphicContext( gl );
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );

            this._updateVisitor = new osgUtil.UpdateVisitor();
            this._cullVisitor = new osgUtil.CullVisitor();

            this._renderStage = new RenderStage();
            this._stateGraph = new StateGraph();

            if ( this._urlOptions ) {
                this.parseOptions();
            }

            this.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
            this._eventProxy = this.initEventProxy( this._options );
        },
        getState: function () {
            // would have more sense to be in view
            // but I would need to put cull and draw on lower Object
            // in View or a new Renderer object
            return this._state;
        },
        parseOptions: function () {

            var optionsURL = function () {
                var vars = [],
                    hash;
                var hashes = window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ).split( '&' );
                for ( var i = 0; i < hashes.length; i++ ) {
                    hash = hashes[ i ].split( '=' );
                    var element = hash[ 0 ].toLowerCase();
                    vars.push( element );
                    var result = hash[ 1 ];
                    if ( result === undefined ) {
                        result = '1';
                    }
                    vars[ element ] = result.toLowerCase();

                }
                return vars;
            };

            var options = optionsURL();

            if ( options.stats === '1' ) {
                this.initStats( options );
            }

            var gl = this.getGraphicContext();
            // not the best way to do it
            if ( options['depth_test'] === '0' ) {
                this.getGraphicContext().disable( gl.DEPTH_TEST );
            }
            if ( options['blend'] === '0' ) {
                this.getGraphicContext().disable( gl.BLEND );
            }
            if ( options['cull_face'] === '0' ) {
                this.getGraphicContext().disable( gl.CULL_FACE );
            }
            if ( options['light'] === '0' ) {
                this.setLightingMode( View.LightingMode.NO_LIGHT );
            }

        },

        initStats: function ( options ) {

            var maxMS = 35;
            var stepMS = 5;
            //var fontsize = 14;

            if ( options.statsMaxMS !== undefined ) {
                maxMS = parseInt( options.statsMaxMS, 10 );
            }
            if ( options.statsStepMS !== undefined ) {
                stepMS = parseInt( options.statsStepMS, 10 );
            }

            var createDomElements = function ( elementToAppend ) {
                var dom = [
                    '<div id="StatsDiv" style="top: 0; position: absolute; width: 300px; height: 150px; z-index: 10;">',

                    '<div id="StatsCanvasDiv" style="position: relative;">',
                    '<canvas id="StatsCanvasGrid" width="300" height="150" style="z-index:-1; position: absolute; background: rgba(14,14,14,0.8); " ></canvas>',
                    '<canvas id="StatsCanvas" width="300" height="150" style="z-index:8; position: absolute;" ></canvas>',
                    '<canvas id="StatsCanvasText" width="300" height="150" style="z-index:9; position: absolute;" ></canvas>',
                    '</div>',

                    '</div>'
                ].join( '\n' );
                var parent;
                if ( elementToAppend === undefined ) {
                    parent = document.body;
                    //elementToAppend = 'body';
                } else {
                    parent = document.getElementById( elementToAppend );
                }

                //jQuery(dom).appendTo(elementToAppend);
                var mydiv = document.createElement( 'div' );
                mydiv.innerHTML = dom;
                parent.appendChild( mydiv );

                var grid = document.getElementById( 'StatsCanvasGrid' );
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
                    graph: document.getElementById( 'StatsCanvas' ),
                    text: document.getElementById( 'StatsCanvasText' )
                };
            };

            if ( this._canvasStats === undefined || this._canvasStats === null ) {
                var domStats = createDomElements();
                this._canvasStats = domStats.graph;
                this._canvasStatsText = domStats.text;
            }
            this._stats = new Stats.Stats( this._canvasStats, this._canvasStatsText );
            var that = this;
            this._frameRate = 1;
            this._frameTime = 0;
            this._updateTime = 0;
            this._cullTime = 0;
            this._drawTime = 0;
            this._stats.addLayer( '#ff0fff', 120,
                                  function ( /*t*/ ) {
                                      return ( 1000.0 / that._frameRate );
                                  },
                                  function ( a ) {
                                      return 'FrameRate: ' + ( a ).toFixed( 0 ) + ' fps';
                                  } );

            this._stats.addLayer( '#ffff00', maxMS,
                                  function ( /*t*/ ) {
                                      return that._frameTime;
                                  },
                                  function ( a ) {
                                      return 'FrameTime: ' + a.toFixed( 2 ) + ' ms';
                                  } );

            this._stats.addLayer( '#d07b1f', maxMS,
                                  function ( /*t*/ ) {
                                      return that._updateTime;
                                  },
                                  function ( a ) {
                                      return 'UpdateTime: ' + a.toFixed( 2 ) + ' ms';
                                  } );

            this._stats.addLayer( '#73e0ff', maxMS,
                                  function ( /*t*/ ) {
                                      return that._cullTime;
                                  },
                                  function ( a ) {
                                      return 'CullTime: ' + a.toFixed( 2 ) + ' ms';
                                  } );

            this._stats.addLayer( '#ff0000',
                                  maxMS,
                                  function ( /*t*/ ) {
                                      return that._drawTime;
                                  },
                                  function ( a ) {
                                      return 'DrawTime: ' + a.toFixed( 2 ) + ' ms';
                                  } );

            if ( window.performance && window.performance.memory && window.performance.memory.totalJSHeapSize )
                this._stats.addLayer( '#00ff00',
                                      window.performance.memory.totalJSHeapSize * 2,
                                      function ( /*t*/ ) {
                                          return that._memSize;
                                      },
                                      function ( a ) {
                                          return 'Memory : ' + a.toFixed( 0 ) + ' b';
                                      } );

        },

        update: function () {
            this.getScene().accept( this._updateVisitor );
        },
        cull: function () {
            // this part of code should be called for each view
            // right now, we dont support multi view
            this._stateGraph.clean();
            this._renderStage.reset();

            this._cullVisitor.reset();
            this._cullVisitor.setStateGraph( this._stateGraph );
            this._cullVisitor.setRenderStage( this._renderStage );
            var camera = this.getCamera();
            this._cullVisitor.pushStateSet( camera.getStateSet() );
            this._cullVisitor.pushProjectionMatrix( camera.getProjectionMatrix() );

            // update bound
            camera.getBound();

            var identity = Matrix.makeIdentity( [] );
            this._cullVisitor.pushModelviewMatrix( identity );

            if ( this._light ) {
                this._cullVisitor.addPositionedAttribute( this._light );
            }

            this._cullVisitor.pushModelviewMatrix( camera.getViewMatrix() );
            this._cullVisitor.pushViewport( camera.getViewport() );
            this._cullVisitor.setCullSettings( camera );

            this._renderStage.setClearDepth( camera.getClearDepth() );
            this._renderStage.setClearColor( camera.getClearColor() );
            this._renderStage.setClearMask( camera.getClearMask() );
            this._renderStage.setViewport( camera.getViewport() );

            //CullVisitor.prototype.handleCullCallbacksAndTraverse.call(this._cullVisitor,camera);
            this.getScene().accept( this._cullVisitor );

            // fix projection matrix if camera has near/far auto compute
            this._cullVisitor.popModelviewMatrix();
            this._cullVisitor.popProjectionMatrix();
            this._cullVisitor.popViewport();
            this._cullVisitor.popStateSet();

            this._renderStage.sort();
        },
        draw: function () {
            var state = this.getState();
            this._renderStage.draw( state );

            // noticed that we accumulate lot of stack, maybe because of the stateGraph
            state.popAllStateSets();
            state.applyWithoutProgram(); //state.apply(); // apply default state (global)
        },

        frame: function () {
            var frameTime, beginFrameTime;
            frameTime = MACROUTILS.performance.now();
            if ( this._lastFrameTime === undefined ) {
                this._lastFrameTime = 0;
            }
            this._frameRate = frameTime - this._lastFrameTime;
            this._lastFrameTime = frameTime;
            beginFrameTime = frameTime;

            var frameStamp = this.getFrameStamp();

            if ( frameStamp.getFrameNumber() === 0 ) {
                frameStamp.setReferenceTime( frameTime / 1000.0 );
                this._numberFrame = 0;
            }

            frameStamp.setSimulationTime( frameTime / 1000.0 - frameStamp.getReferenceTime() );

            // setup framestamp
            this._updateVisitor.setFrameStamp( frameStamp );
            //this._cullVisitor.setFrameStamp(this.getFrameStamp());

            // update inputs devices
            this.updateEventProxy( this._eventProxy, frameStamp );

            // Update Manipulator/Event
            // should be merged with the update of game pad below
            if ( this.getManipulator() ) {
                this.getManipulator().update( this._updateVisitor );
                Matrix.copy( this.getManipulator().getInverseMatrix(), this.getCamera().getViewMatrix() );
            }

            if ( this._stats === undefined ) {
                // time the update
                this.update();
                this.cull();
                this.draw();
                frameStamp.setFrameNumber( frameStamp.getFrameNumber() + 1 );
                this._numberFrame++;
                this._frameTime = MACROUTILS.performance.now() - beginFrameTime;
            } else {
                this._updateTime = MACROUTILS.performance.now();
                this.update();
                this._updateTime = MACROUTILS.performance.now() - this._updateTime;


                this._cullTime = MACROUTILS.performance.now();
                this.cull();
                this._cullTime = MACROUTILS.performance.now() - this._cullTime;

                this._drawTime = MACROUTILS.performance.now();
                this.draw();
                this._drawTime = MACROUTILS.performance.now() - this._drawTime;

                frameStamp.setFrameNumber( frameStamp.getFrameNumber() + 1 );

                this._numberFrame++;
                this._frameTime = MACROUTILS.performance.now() - beginFrameTime;

                if ( window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize )
                    this._memSize = window.performance.memory.usedJSHeapSize;
                this._stats.update();
            }
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
                    self._requestID = window.requestAnimationFrame( render, self.canvas );
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

            this.setManipulator( manipulator );

            var self = this;
            var resize = function ( /*ev*/ ) {
                var w = window.innerWidth;
                var h = window.innerHeight;

                var camera = self.getCamera();
                var vp = camera.getViewport();

                var prevWidth = vp.width();
                var prevHeight = vp.height();
                self._canvas.width = w;
                self._canvas.height = h;
                self._canvas.style.width = w;
                self._canvas.style.height = h;
                Notify.debug( 'window resize ' + prevWidth + 'x' + prevHeight + ' to ' + w + 'x' + h );
                var widthChangeRatio = w / prevWidth;
                var heightChangeRatio = h / prevHeight;
                var aspectRatioChange = widthChangeRatio / heightChangeRatio;
                vp.setViewport( vp.x() * widthChangeRatio, vp.y() * heightChangeRatio, vp.width() * widthChangeRatio, vp.height() * heightChangeRatio );

                if ( aspectRatioChange !== 1.0 ) {
                    Matrix.preMult( camera.getProjectionMatrix(), Matrix.makeScale( 1.0 / aspectRatioChange, 1.0, 1.0, [] ) );
                }
            };
            window.onresize = resize;
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

                if ( initialize ) {
                    var inputDevice = new lists[ device ]( this );
                    inputDevice.init( argDevice );
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
        }

    } );

    return Viewer;
} );
