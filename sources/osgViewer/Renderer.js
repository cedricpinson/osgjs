define( [
    'osg/Utils',
    'osg/CullSettings',
    'osg/CullVisitor',
    'osg/Matrix',
    'osg/Object',
    'osg/RenderStage',
    'osg/State',
    'osg/StateGraph',

    'osgShader/osgShader',

], function ( MACROUTILS, CullSettings, CullVisitor, Matrix, Object, RenderStage, State, StateGraph, osgShader ) {

    'use strict';

    var Renderer = function ( camera ) {
        Object.call( this );

        this._state = undefined;
        this._camera = camera;
        this._renderStage = undefined;
        this._stateGraph = undefined;

        this._frameStamp = undefined;

        this.setDefaults();
    };

    Renderer.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Object.prototype, {

        setDefaults: function () {

            this._state = new State( new osgShader.ShaderGeneratorProxy() );

            this._cullVisitor = new CullVisitor();
            this._cullVisitor.setRenderer( this );
            this._renderStage = new RenderStage();
            this._stateGraph = new StateGraph();

            this.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );


            var osg = require( 'osg/osg' );
            var stateSet = this.getCamera().getOrCreateStateSet(); //new osg.StateSet();
            stateSet.setAttributeAndModes( new osg.Material() );
            stateSet.setAttributeAndModes( new osg.Depth() );
            stateSet.setAttributeAndModes( new osg.BlendFunc() );
            stateSet.setAttributeAndModes( new osg.CullFace() );

        },

        getCullVisitor: function () {
            return this._cullVisitor;
        },

        setCullVisitor: function ( cv ) {
            if ( cv && !cv.getRenderer() ) cv.setRenderer( this );
            this._cullVisitor = cv;
        },

        getCamera: function () {
            return this._camera;
        },

        setFrameStamp: function ( fs ) {
            this._frameStamp = fs;
        },

        getFrameStamp: function () {
            return this._frameStamp;
        },

        getState: function () {
            return this._state;
        },

        setState: function ( state ) {
            this._state = state;
        },

        setGraphicContext: function ( gc ) {
            this._state.setGraphicContext( gc );
        },

        getGraphicContext: function () {
            return this._state.getGraphicContext();
        },

        cullAndDraw: function () {
            this.cull();
            this.draw();
        },

        cull: function () {

            var camera = this.getCamera();
            var view = camera.getView();

            this._cullVisitor.setFrameStamp( this._frameStamp );

            // this part of code should be called for each view
            // right now, we dont support multi view
            this._stateGraph.clean();
            this._renderStage.reset();

            this._cullVisitor.reset();
            this._cullVisitor.setStateGraph( this._stateGraph );
            this._cullVisitor.setRenderStage( this._renderStage );

            this._cullVisitor.pushStateSet( camera.getStateSet() );

            // save cullSettings
            var previousCullsettings = new CullSettings();
            previousCullsettings.setCullSettings( this._cullVisitor );
            this._cullVisitor.setCullSettings( camera );
            if ( previousCullsettings.getSettingSourceOverrider() === this._cullVisitor && previousCullsettings.getEnableFrustumCulling() ) {
                this._cullVisitor.setEnableFrustumCulling( true );
            }

            // Push reference on the projection stack, it means that if compute near/far
            // is activated, it will update the projection matrix of the camera
            this._cullVisitor.pushCameraModelViewProjectionMatrix( camera, camera.getViewMatrix(), camera.getProjectionMatrix() );

            // update bound
            camera.getBound();

            var light = view.getLight();
            var View = require( 'osgViewer/View' );

            if ( light ) {

                switch ( view.getLightingMode() ) {

                case View.LightingMode.HEADLIGHT:
                    this._cullVisitor.addPositionedAttribute( null, light );
                    break;

                case View.LightingMode.SKY_LIGHT:
                    this._cullVisitor.addPositionedAttribute( camera.getViewMatrix(), light );
                    break;

                default:
                    break;
                }
            }

            this._cullVisitor.pushViewport( camera.getViewport() );



            this._renderStage.setClearDepth( camera.getClearDepth() );
            this._renderStage.setClearColor( camera.getClearColor() );
            this._renderStage.setClearMask( camera.getClearMask() );
            this._renderStage.setViewport( camera.getViewport() );

            // pass de dbpager to the cullvisitor, so plod's can do the requests
            this._cullVisitor.setDatabaseRequestHandler( this._camera.getView().getDatabasePager() );
            // dont add camera on the stack just traverse it
            this._cullVisitor.handleCullCallbacksAndTraverse( camera );

            // fix projection matrix if camera has near/far auto compute
            this._cullVisitor.popCameraModelViewProjectionMatrix( camera );

            // Important notes about near/far
            // If you are using the picking on the main camera and
            // you use only children sub camera for RTT, your
            // main camera will keep +/-infinity for near/far because
            // the computation of near/far is done by camera and use Geometry


            // restore previous state of the camera
            this._cullVisitor.setCullSettings( previousCullsettings );

            this._cullVisitor.popViewport();
            this._cullVisitor.popStateSet();

            this._renderStage.sort();

        },

        draw: function () {

            var state = this.getState();

            state.resetCacheFrame(); // important because cache are used in cullvisitor

            this._renderStage.setCamera( this._camera );
            this._renderStage.draw( state );
            this._renderStage.setCamera( undefined );

            state.applyDefault();

        }


    } ), 'osgViewer', 'Renderer' );

    return Renderer;

} );
