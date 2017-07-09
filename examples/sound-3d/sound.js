var osg = window.OSG.osg;
var Sound = function(domElement, url, panner) {
    this._player = domElement;
    this._mediaElement = undefined;
    this._panner = panner;
    this._player.setAttribute('src', url);
};

Sound.prototype = {
    play: function() {
        if (this._player) this._player.play();
    },

    pause: function() {
        if (this._player) this._player.pause();
    },

    update: (function() {
        var matrixWorldSpace = osg.mat4.create();
        var position = osg.vec3.create();

        return function(node, nv) {
            if (!this._panner) return true;

            osg.computeLocalToWorld(nv.nodePath, true, osg.mat4.identity(matrixWorldSpace));

            osg.mat4.getTranslation(position, matrixWorldSpace);
            var soundPosition = this._panner;
            soundPosition.setPosition(position[0], position[1], position[2]);
            return true;
        };
    })()
};

var SoundManager = function() {
    var AudioConstructor = window.AudioContext || window.webkitAudioContext;
    this._context = new AudioConstructor();
};

SoundManager.prototype = {
    create3DSound: function(player, url) {
        var panner = this._context.createPanner();

        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 1000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.setPosition(0, 0, 0);

        var sound = new Sound(player, url, panner);

        // panner.orientationX.value = 1;
        // panner.orientationY.value = 0;
        // panner.orientationZ.value = 0;
        // panner.positionX.value = 0.0;
        // panner.positionY.value = 0.0;
        // panner.positionZ.value = 0.0;
        sound._panner = panner;

        var source = this._context.createMediaElementSource(player);
        sound._mediaElement = source;

        source.connect(panner);
        panner.connect(this._context.destination);
        return sound;
    },

    createAmbientSound: function(player, url) {
        var sound = new Sound(player, url);
        sound._mediaElement = this._context.createMediaElementSource(player);
        return sound;
    },

    releaseSound: function(sound) {
        if (!sound) return;

        sound.pause();
        if (sound._mediaElement) sound._mediaElement.disconnect(sound._panner);
        if (sound._panner) sound._panner.disconnect(this._context);
        sound._panner = undefined;
        sound._mediaElement = undefined;
    },

    update: (function() {
        var eye = osg.vec3.create();
        var center = osg.vec3.create();
        var up = osg.vec3.create();

        return function() {
            var camera = this._camera;

            if (camera) {
                osg.mat4.getLookAt(eye, center, up, camera.getViewMatrix());
                osg.vec3.sub(center, center, eye);
                var listener = this._context.listener;
                listener.setPosition(eye[0], eye[1], eye[2]);
                listener.setOrientation(center[0], center[1], center[2], up[0], up[1], up[2]);
            }

            return true;
        };
    })()
};
