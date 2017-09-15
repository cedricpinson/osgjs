(function() {
    'use strict';

    var SoundCloudID = '237d195ad90846f5e6294ade2e8cf87b';

    var P = window.P;
    var OSG = window.OSG;
    var osgText = OSG.osgText;
    var osgGA = OSG.osgGA;
    var osg = OSG.osg;
    var ExampleOSGJS = window.ExampleOSGJS;
    var SC = window.SC;
    var SoundManager = window.SoundManager;

    var Example = function() {
        this._soundList = [
            {
                url: 'https://soundcloud.com/wearecc/mdg-banana-man',
                pos: [15, 0, 0],
                audio: undefined
            },
            {
                url: 'https://soundcloud.com/kodak-black/kodak-black-22-no-flocking',
                pos: [-15, 0, 0],
                audio: undefined
            },
            {
                url: 'https://soundcloud.com/championdnb/true-survivor-champion',
                pos: [0, -20, 0],
                audio: undefined
            }
        ];

        ExampleOSGJS.call(this);
        this.initializeSoundCloud();
    };

    Example.prototype = osg.objectInherit(ExampleOSGJS.prototype, {
        initializeSoundCloud: function() {
            SC.initialize({
                client_id: SoundCloudID
            });
        },

        // helpers
        createSound: function(sound) {
            // create the audio element in the dom
            var audio = document.createElement('audio');
            sound.audio = audio;
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous';

            var url = sound.url;
            var self = this;
            return new P(function(resolve, reject) {
                SC.get(
                    '/resolve',
                    {
                        url: url
                    },
                    function(soundCloudResult) {
                        if (soundCloudResult.errors) {
                            var errors = '';
                            for (var i = 0; i < soundCloudResult.errors.length; i++) {
                                errors += soundCloudResult.errors[i]['error_message'] + '\n';
                            }

                            reject(errors);
                        } else {
                            var soundCloudURL =
                                soundCloudResult['stream_url'] + '?client_id=' + SoundCloudID;
                            osg.log('stream ' + soundCloudURL + ' ready');

                            var soundUpdateCallback = self._soundManager.create3DSound(
                                audio,
                                soundCloudURL
                            );
                            sound.sound = soundUpdateCallback;

                            resolve(sound);
                        }
                    }
                );
            });
        },

        run: function() {
            ExampleOSGJS.prototype.run.call(this);

            this._viewer.getManipulator().strafeVertical(5);
        },

        createScene: function() {
            this._soundManager = new SoundManager();
            this._soundManager._camera = this._viewer.getCamera();

            // the root node
            var scene = new osg.Node();
            scene.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace(0));
            scene.addUpdateCallback(this._soundManager);

            var addSoundInScene = function(sound) {
                var node = new osg.MatrixTransform();
                var sphere = osg.createTexturedSphere(1, 15, 15);
                node.addChild(sphere);
                osg.mat4.fromTranslation(node.getMatrix(), sound.pos);
                scene.addChild(node);

                node.addUpdateCallback(sound.sound);
                var strArray = sound.url.split('/');
                var text = strArray.slice(strArray.length - 2).join('/');
                var textNode = new osgText.Text(text);
                textNode.setAutoRotateToScreen(true);
                textNode.setPosition(osg.vec3.fromValues(0, 0, 1.1));
                textNode.setCharacterSize(0.5);
                node.addChild(textNode);

                sound.sound.play();
                // if ( !window.soundsList ) window.soundsList = [];
                // window.soundsList.push( sound );
            };

            // window.soundManager = this._soundManager;

            var mt = new osg.MatrixTransform();
            var grid = osg.createGridGeometry(-30, -40, -3, 60, 0, 0, 0, 60, 0, 15, 15);
            mt.addChild(grid);
            scene.addChild(mt);

            this.getRootNode().addChild(scene);

            this._manipulator = new osgGA.FirstPersonManipulator();
            this._viewer.setManipulator(this._manipulator);
            this._viewer.getManipulator().setNode(scene);
            this._viewer.getManipulator().computeHomePosition();

            for (var i = 0, l = this._soundList.length; i < l; i++) {
                var sound = this._soundList[i];
                this.createSound(sound).then(addSoundInScene).catch(osg.error);
            }
        }
    });

    window.addEventListener(
        'load',
        function() {
            var example = new Example();
            example.run();
            window.example = example;
        },
        true
    );
})();
