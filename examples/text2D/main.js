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
        this._textArray = [ 'osgjs rocks!', 'hello world', 'oh yeah!' ];
        this._textColors = [ 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)' ];
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
                rotateToScreen: true
            };

            var that = this;

            var textController = this.gui.add( this.params, 'text' );
            textController.onChange( function ( value ) {
                that.changeTexts( value );
            } );

            var rotationController = this.gui.add( this.params, 'rotateToScreen' );
            rotationController.onChange( function ( value ) {
                that.changeRotateToScreen( value );
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
                    var x = Math.random() * 1000;
                    var y = Math.random() * 1000;
                    var z = Math.random() * 1000;
                    var size = Math.random() * 50;
                    text.setFontSize( size );
                    osg.Matrix.makeTranslate( x, y, z, text.getMatrix() );
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
        }
    };

    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );
} )();
