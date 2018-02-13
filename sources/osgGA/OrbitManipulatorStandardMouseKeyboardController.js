import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import osgMath from 'osg/math';
import OrbitManipulatorEnums from 'osgGA/orbitManipulatorEnums';
import InputGroups from 'osgViewer/input/InputConstants';

var OrbitManipulatorStandardMouseKeyboardController = function(manipulator) {
    Controller.call(this, manipulator);
    this._zoomFactor = 40;
    this.init();
};

utils.createPrototypeObject(
    OrbitManipulatorStandardMouseKeyboardController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._mode = undefined;
            this._inMotion = false;

            this._initInputs(
                InputGroups.ORBIT_MANIPULATOR_MOUSEKEYBOARD,
                InputGroups.ORBIT_MANIPULATOR_RESETTOHOME
            );
        },

        _initInputs: function(globalGroup, resetToHomeGroup) {
            var manager = this._manipulator.getInputManager();
            var setRotationMode = this.setMode.bind(
                this,
                OrbitManipulatorEnums.ROTATE,
                this._manipulator.getRotateInterpolator()
            );
            var setPanMode = this.setMode.bind(
                this,
                OrbitManipulatorEnums.PAN,
                this._manipulator.getPanInterpolator()
            );
            var setZoomMode = this.setMode.bind(
                this,
                OrbitManipulatorEnums.ZOOM,
                this._manipulator.getZoomInterpolator()
            );

            manager.group(globalGroup).addMappings(
                {
                    move: 'mousemove',
                    startPan: ['mousedown shift 0', 'mousedown 1', 'mousedown 2'],
                    startZoom: ['mousedown ctrl 0', 'mousedown ctrl 2'],
                    startRotate: 'mousedown 0 !shift !ctrl',
                    stopMotion: ['mouseup', 'mouseout', 'keyup a', 'keyup s', 'keyup d'],
                    zoom: 'wheel'
                },
                this
            );

            manager.group(resetToHomeGroup).addMappings(
                {
                    reset: 'keydown space'
                },
                this
            );

            manager
                .group(globalGroup)
                .addMappings({ setRotationMode: 'keydown a' }, setRotationMode);
            manager.group(globalGroup).addMappings({ setPanMode: 'keydown d' }, setPanMode);
            manager.group(globalGroup).addMappings({ setZoomMode: 'keydown s' }, setZoomMode);
        },

        getMode: function() {
            return this._mode;
        },

        setMode: function(mode, interpolator) {
            if (this.getMode() === mode) {
                return;
            }
            this._mode = mode;
            interpolator.reset();
            this._inMotion = true;
        },

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;
        },

        getZoomFactor: function() {
            return this._zoomFactor;
        },

        setZoomFactor: function(factor) {
            this._zoomFactor = factor;
        },

        move: function(ev) {
            if (this._inMotion === false) {
                return;
            }

            var posX = ev.glX;
            var posY = ev.glY;

            var manipulator = this._manipulator;
            if (osgMath.isNaN(posX) === false && osgMath.isNaN(posY) === false) {
                var mode = this.getMode();
                if (mode === OrbitManipulatorEnums.ROTATE) {
                    manipulator.getRotateInterpolator().setTarget(posX, posY);
                } else if (mode === OrbitManipulatorEnums.PAN) {
                    manipulator.getPanInterpolator().setTarget(posX, posY);
                } else if (mode === OrbitManipulatorEnums.ZOOM) {
                    var zoom = manipulator.getZoomInterpolator();
                    if (zoom.isReset()) {
                        zoom.setStart(posY);
                        zoom.set(0.0);
                    }
                    var dy = posY - zoom.getStart();
                    zoom.setStart(posY);
                    var v = zoom.getTarget()[0];
                    zoom.setTarget(v - dy / 20.0);
                }
            }
        },

        startPan: function(ev) {
            var pan = this._manipulator.getPanInterpolator();
            this.setMode(OrbitManipulatorEnums.PAN, pan);
            pan.reset();
            pan.set(ev.glX, ev.glY);
        },

        startRotate: function(ev) {
            var rotate = this._manipulator.getRotateInterpolator();
            this.setMode(OrbitManipulatorEnums.ROTATE, rotate);
            rotate.reset();
            rotate.set(ev.glX, ev.glY);
        },

        startZoom: function(ev) {
            var zoom = this._manipulator.getZoomInterpolator();
            this.setMode(OrbitManipulatorEnums.ZOOM, zoom);
            zoom.setStart(ev.glY);
            zoom.set(0.0);
        },

        stopMotion: function() {
            this._inMotion = false;
            this._mode = undefined;
        },

        zoom: function(ev) {
            var intDelta = -ev.deltaY / this._zoomFactor;
            var manipulator = this._manipulator;
            var zoomTarget = manipulator.getZoomInterpolator().getTarget()[0] - intDelta;
            manipulator.getZoomInterpolator().setTarget(zoomTarget);
        },

        reset: function() {
            this._manipulator.computeHomePosition();
        },
    })
);
export default OrbitManipulatorStandardMouseKeyboardController;
