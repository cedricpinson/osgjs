( function () {
    'use strict';


    // various osg shortcuts
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgAnimation = OSG.osgAnimation;
    var ExampleOSGJS = window.ExampleOSGJS;

    var FindAnimationManagerVisitor = function () {
        osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._cb = undefined;
    };
    FindAnimationManagerVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
        getAnimationManager: function () {
            return this._cb;
        },
        apply: function ( node ) {
            var cbs = node.getUpdateCallbackList();
            for ( var i = 0, l = cbs.length; i < l; i++ ) {
                if ( cbs[ i ] instanceof osgAnimation.BasicAnimationManager ) {
                    this._cb = cbs[ i ];
                    return;
                }
            }
            this.traverse( node );
        }
    } );


    // inherits for the ExampleOSGJS prototype
    var Example = function () {
        ExampleOSGJS.call( this );

        // can be overriden with url parm ?&scale=1
        this._config = {
            models: {
                morph: 'morph.osgjs',
                skinmorph: 'skinmorph.osgjs'
            },
            currentModel: 'morph'
        };

        this.models = this._config.models;

        this._modelPath = '../media/models/animation/';
    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {


        initDatGUI: function () {

            // config to let data gui change the scale
            this._gui = new window.dat.GUI();

            var controller = this._gui.add( this._config, 'models', Object.keys( this._config.models ) );
            var self = this;

            controller.onChange( function ( value ) {
                self._config.currentModel = value;
                self.createScene();
            } );

        },

        postLoadingModel: function ( node ) {

            var visitor = new FindAnimationManagerVisitor();
            node.accept( visitor );

            var manager = visitor.getAnimationManager();
            if ( !manager ) return;
            var animations = manager.getAnimations();
            var keys = Object.keys( animations );
            if ( keys.length === 0 ) return;
            manager.playAnimation( animations[ keys[ 0 ] ].name );

        },

        createScene: function () {

            // the root node
            var root = new osg.Node();

            // create the model
            var model = this.getOrCreateModel( this._modelPath + this.models[ this._config.currentModel ] );

            root.addChild( model );
            this._viewer.getManipulator().computeHomePosition();

            this.getRootNode().addChild( root );
        },

        getOrCreateModel: function ( modelName ) {

            var self = this;
            if ( !this._model ) {
                this._model = new osg.MatrixTransform();
            } else {
                this._model.removeChildren();
            }
            if ( modelName ) {

                // ../media/models/animation/' + modelName ?
                var request = osgDB.readNodeURL( modelName );
                request.then( function ( node ) {

                    self._model.addChild( node );
                    self.postLoadingModel( node );

                } );
            } else {

                var size = 10;
                var geom = osg.createTexturedBoxGeometry( 0, 0, 0,
                    size, size, size );
                this._model.addChild( geom );

            }

            return this._model;
        },
    } );


    window.addEventListener( 'load', function () {
        var example = new Example();
        example.run();
    }, true );

} )();
