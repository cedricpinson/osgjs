( function () {
    /**
     * @author Jordi Torres
     */
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgText = OSG.osgText;

    var Example = function () {
        this.gui = undefined;
        this._mobileDevice = /(iPad|iPhone|iPod|Android)/g.test( navigator.userAgent );
        this._textArray = [ 'osgjs rocks!', 'hello world', 'oh yeah!' ];
        this._textColors = [
            [ 1, 0, 0, 0.5 ],
            [ 0, 1, 0, 0.6 ],
            [ 0, 0, 1, 0.8 ]
        ];
    };

    Example.prototype = {

        initGui: function () {
            this.gui = new window.dat.GUI( {
                autoPlace: false
            } );
            var self = this;
            this._text = 'say what?'

            this.params = {
                text: this._text,
                rotateToScreen: true,
                font: 'monospace',
                layout: 'LEFT_TO_RIGHT',
                alignment: 'CENTER_CENTER',
                fontResolution: 32,
                characterSize: 1,
                characterSizeMode: 'OBJECT_COORDS'
            };
            var layouts = [ 'LEFT_TO_RIGHT', 'RIGHT_TO_LEFT' ];
            var alignments = {
                CENTER_CENTER: osgText.Text.CENTER_CENTER,
                LEFT_TOP: osgText.Text.LEFT_TOP,
                LEFT_CENTER: osgText.Text.LEFT_CENTER,
                LEFT_BOTTOM: osgText.Text.LEFT_BOTTOM,
                CENTER_TOP: osgText.Text.CENTER_TOP,
                CENTER_BOTTOM: osgText.Text.CENTER_BOTTOM,
                RIGHT_TOP: osgText.Text.RIGHT_TOP,
                RIGHT_CENTER: osgText.Text.RIGHT_CENTER,
                RIGHT_BOTTOM: osgText.Text.RIGHT_BOTTOM
            };

            var characterSizeModes = {
                OBJECT_COORDS: osgText.Text.OBJECT_COORDS,
                SCREEN_COORDS: osgText.Text.SCREEN_COORDS,
                SCREEN_SIZE_CAPPED: osgText.Text.OBJECT_COORDS_WITH_MAXIMUM_SCREEN_SIZE_CAPPED_BY_FONT_HEIGHT
            }
            var fonts = [ 'monospace', 'Andale Mono', 'Arial', 'Comic Sans MS', 'Courier New', ' Lucida Console', 'Impact, fantasy' ];
            var that = this;

            var textController = this.gui.add( this.params, 'text' );
            textController.onChange( function ( value ) {
                that.changeTexts( value );
            } );

            var rotationController = this.gui.add( this.params, 'rotateToScreen' );
            rotationController.onChange( function ( value ) {
                that.changeRotateToScreen( value );
            } );

            var fontController = this.gui.add( this.params, 'font', fonts );
            fontController.onChange( function ( value ) {
                that.changeFontFamily( value );
            } );

            var layoutController = this.gui.add( this.params, 'layout', layouts );
            layoutController.onChange( function ( value ) {
                that.changeLayout( value );
            } );

            var alignmentController = this.gui.add( this.params, 'alignment', Object.keys( alignments ) );
            alignmentController.onChange( function ( value ) {
                that.changeAlignment( value );
            } );

            var fontResController = this.gui.add( this.params, 'fontResolution', 2, 128 );
            fontResController.onChange( function ( value ) {
                that.changeFontresolution( value );
            } );

            var CharSizeController = this.gui.add( this.params, 'characterSize', 1, 10 );
            CharSizeController.onChange( function ( value ) {
                that.changeCharacterSize( value );
            } );

            var characterSizeModeController = this.gui.add( this.params, 'characterSizeMode', Object.keys( characterSizeModes ) );
            characterSizeModeController.onChange( function ( value ) {
                that.changeCharacterSizeMode( value );
            } );
        },
        createTextScene: function () {
            var model = this.createItems( 20 );
            return model;
        },
        setDebugSphere: function ( n, alpha ) {
            var bbs = n.getBound();
            var bs = osg.createTexturedSphere( bbs.radius() );
            var ss = bs.getOrCreateStateSet();
            ss.setRenderingHint( 'TRANSPARENT_BIN' );
            ss.setAttributeAndModes( new osg.BlendFunc( 'ONE', 'ONE_MINUS_SRC_ALPHA' ) );
            var material = new osg.Material();
            material.setTransparency( alpha );
            material.setDiffuse( [ 1.0, 1.0, 1.0, alpha ] );
            ss.setAttributeAndModes( material );
            var transformSphere = new osg.MatrixTransform();
            transformSphere.setMatrix( osg.Matrix.makeTranslate( bbs._center[ 0 ], bbs._center[ 1 ], bbs._center[ 2 ], [] ) );
            transformSphere.addChild( bs );
            return transformSphere;
        },
        createItems: function ( value ) {
            var root = new osg.Node();
            for ( var i = 0, l = value; i < l; i++ ) {
                for ( var j = 0, m = value; j < m; j++ ) {
                    var rand = this._textArray[ Math.floor( Math.random() * this._textArray.length ) ];
                    var randColor = this._textColors[ Math.floor( Math.random() * this._textColors.length ) ];
                    var text = new osgText.Text( rand );
                    text.setColor( randColor );
                    text.setAutoRotateToScreen( true );
                    // Check if we need to force POT Textures
                    if ( this._mobileDevice ) text.setForcePowerOfTwo( true );
                    var x = Math.random() * 100;
                    var y = Math.random() * 100;
                    var z = Math.random() * 100;
                    var size = Math.random() * 5;
                    text.setCharacterSize( size );
                    text.setPosition( [ x, y, z ] );
                    //root.addChild( this.setDebugSphere( text, 0.2) );
                    root.addChild( text );
                }
            }
            return root;
        },
        changeTexts: function ( text ) {
            var TextVisitor = function ( text ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._text = text;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setText( this._text );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( text );
            this._scene.accept( tv );
        },

        changeFontresolution: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._fontResolution = value;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setFontResolution( this._fontResolution );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        changeCharacterSize: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._characterSize = value;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setCharacterSize( this._characterSize );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        changeFontFamily: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._fontFamily = value;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setFont( this._fontFamily );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },
        changeRotateToScreen: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._rotateToScreen = value;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setAutoRotateToScreen( this._rotateToScreen );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        changeLayout: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                if ( value === 'LEFT_TO_RIGHT' )
                    this._layout = osgText.Text.LEFT_TO_RIGHT;
                else
                    this._layout = osgText.Text.RIGHT_TO_LEFT;
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setLayout( this._layout );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        changeAlignment: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._alignment = parseInt( value );
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setAlignment( this._alignment );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        changeCharacterSizeMode: function ( value ) {
            var TextVisitor = function ( value ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._characterSizeMode = parseInt( value );
            };
            TextVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                apply: function ( node ) {
                    if ( node instanceof osgText.Text ) {
                        node.setCharacterSizeMode( this._characterSizeMode );
                    }
                    this.traverse( node );
                }
            } );
            var tv = new TextVisitor( value );
            this._scene.accept( tv );
        },

        onMouseClick: function ( canvas, viewer, ev ) {
            var ratioX = canvas.width / canvas.clientWidth;
            var ratioY = canvas.height / canvas.clientHeight;

            var hits = this.viewer.computeIntersections( ev.clientX * ratioX, ( canvas.clientHeight - ev.clientY ) * ratioY );

            hits.sort( function ( a, b ) {
                return a.ratio - b.ratio;
            } );

            if ( hits.length === 0 )
                return;
            // search in the node path the text node
            for ( var i = 0; i < hits[ 0 ].nodepath.length; i++ ) {
                if ( hits[ 0 ].nodepath[ i ] instanceof osgText.Text ) {
                    osg.log( 'Text picked: ' + hits[ 0 ].nodepath[ i ].getText() );
                    return;
                }
            }
        },

        run: function () {

            this.initGui();
            // Use a custom container so the key letters 'a' 's' 'd' and spacebar works in dat.gui.
            var customContainer = document.getElementById( 'gui-container' );
            customContainer.appendChild( this.gui.domElement );
            customContainer.addEventListener( 'keydown', function ( e ) {
                e.stopPropagation();
            }, false );
            // The 3D canvas.
            var canvas = document.getElementById( 'View' );
            // The viewer
            this.viewer = new osgViewer.Viewer( canvas, {
                'enableFrustumCulling': true
            } );

            this.viewer.init();

            this._scene = this.createTextScene();

            this.viewer.setSceneData( this._scene );

            this.viewer.setupManipulator();
            this.viewer.getManipulator().setDistance( this._scene.getBound().radius() * 1.5 );
            this.viewer.getManipulator().setTarget( this._scene.getBound().center() );
            this.viewer.run();
            // Check if autorotate and autoscale works with picking
            canvas.addEventListener( 'click', this.onMouseClick.bind( this, canvas, this.viewer ), true );
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );
} )();
