(function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgAnimation = OSG.osgAnimation;
    var osgUtil = OSG.osgUtil;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var Object = window.Object;

    var FindAnimationManagerVisitor = function() {
        osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN);
        this._cb = undefined;
    };
    FindAnimationManagerVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        getAnimationManager: function() {
            return this._cb;
        },
        apply: function(node) {
            var cbs = node.getUpdateCallbackList();
            for (var i = 0, l = cbs.length; i < l; i++) {
                if (cbs[0] instanceof osgAnimation.BasicAnimationManager) {
                    this._cb = cbs[0];
                    return;
                }
            }
            this.traverse(node);
        }
    });

    var HideCullCallback = function() {};
    HideCullCallback.prototype = {
        cull: function() {
            return false;
        }
    };
    var hideCullCallback = new HideCullCallback();

    var HideBBVisitor = function() {
        osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN);
    };
    HideBBVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        apply: function(node) {
            if (node instanceof osgAnimation.RigGeometry) {
                node._boundingSphereComputed = true;
                node._boundingBoxComputed = true;
            } else if (node instanceof osg.Geometry) {
                var parents = node.getParents();
                for (var i = 0, nbParents = parents.length; i < nbParents; ++i) {
                    if (parents[i].getName().indexOf('AABB_') !== -1) {
                        node.setCullCallback(hideCullCallback);
                        break;
                    }
                }
            }
            this.traverse(node);
        }
    });

    var FindBoneVisitor = function() {
        osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN);
        this._bones = [];
    };
    FindBoneVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        init: function() {},
        apply: function(node) {
            if (node.className() === 'Bone') {
                this._bones.push(node);
            }
            this.traverse(node);
        },
        getBones: function() {
            return this._bones;
        },
        getBone: function(name) {
            var bones = this.getBones();
            for (var i = 0, l = bones.length; i < l; i++) {
                var bone = bones[i];
                if (bone.getName() === name) {
                    return bone;
                }
            }
            return undefined;
        }
    });

    var FindSkeletonVisitor = function() {
        osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN);
    };
    FindSkeletonVisitor.prototype = osg.objectInherit(osg.NodeVisitor.prototype, {
        apply: function(node) {
            if (node instanceof osgAnimation.Skeleton) {
                this.skl = node;
                return;
            }
            this.traverse(node);
        }
    });

    var createScene = function(viewer, root, url, config, controller) {
        //init controller
        controller.count = 0;
        controller.timeFactor = 1.0;
        controller.isPlaying = false;
        //controller.times = config.time;

        // var root = new osg.MatrixTransform();
        osg.mat4.fromRotation(root.getMatrix(), Math.PI * 0.5, [1, 0, 0]);

        var request = osgDB.readNodeURL('../media/models/animation/' + url);
        root.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace(osg.CullFace.DISABLE));

        request.then(function(node) {
            var i = 0;
            var l = 0;

            root.addChild(node);

            var bfinder = new FindBoneVisitor();
            root.accept(bfinder);
            node.accept(new HideBBVisitor());

            var bones = bfinder.getBones();

            if (config['axis']) {
                var axisSize = config['axisSize'];
                var geom = osg.createAxisGeometry(axisSize);
                for (i = 0, l = bones.length; i < l; i++) {
                    var bone = bones[i];
                    console.log(bone.getName());
                    var tnode = new osg.Node();
                    tnode.addChild(geom);
                    //tnode.addChild( osg.createTexturedBoxGeometry(100) );
                    bone.addChild(tnode);
                }
            }

            window.listBones = function() {
                for (i = 0, l = bones.length; i < l; i++) {
                    var b = bones[i];
                    console.log(b.getName(), b.getMatrix());
                }
            };

            // viewer.getCamera().setComputeNearFar( false );

            viewer.getManipulator().computeHomePosition();
            var finder = new FindAnimationManagerVisitor();
            node.accept(finder);

            var animationManager = finder.getAnimationManager();

            var skletonFinder = new FindSkeletonVisitor();
            node.accept(skletonFinder);
            var skl = skletonFinder.skl;

            if (animationManager) {
                //console.log( animationManager.getAnimations() );
                var animations = Object.keys(animationManager.getAnimations());
                var firstAnimation = animations.length ? animations[0] : undefined;
                config.currentAnim = config.anim || firstAnimation;
                if (config.currentAnim) {
                    controller.play = function() {
                        animationManager.stopAllAnimation();
                        animationManager.playAnimation(config.currentAnim);
                    };
                    controller.stop = function() {
                        animationManager.stopAnimation(config.currentAnim);

                        var animationList = animationManager._activeAnimationList;
                        var hash = '#PlayingAnimations:';
                        for (i = 0, l = animationList.length; i < l; i++)
                            hash += animationList[i].name + ';';
                        window.location.hash = hash;
                    };
                    controller.pause = function() {
                        animationManager.togglePause();
                    };
                    controller.bind = function() {
                        animationManager.stopAllAnimation();
                        skl.setRestPose();
                    };
                    window.animationManager = animationManager;
                    animationManager.playAnimation(config.currentAnim);

                    if (config['time']) {
                        var nv = {
                            getFrameStamp: function() {
                                return {
                                    getSimulationTime: function() {
                                        return 0;
                                    }
                                };
                            }
                        };
                        animationManager._dirty = false;
                        animationManager.update(null, nv);
                        animationManager._dirty = true;
                        animationManager.togglePause();
                        animationManager.setSimulationTime(config['time']);
                        controller.times = config.time;
                    }

                    var anims = (controller.anims = {});
                    l = animations.length;
                    for (i = 0, l = animations.length; i < l; i++) {
                        anims[animations[i]] = animations[i];
                    }

                    var animsController = controller.gui.add(
                        controller,
                        'anims',
                        Object.keys(controller.anims)
                    );
                    animsController.setValue(config.currentAnim);
                    animsController.onFinishChange(function(value) {
                        //animationManager.stopAnimation( config.currentAnim );
                        config.currentAnim = value;
                        controller.play();

                        var animationList = animationManager._activeAnimationList;
                        var hash = '#PlayingAnimations:';
                        var found = false;
                        for (i = 0, l = animationList.length; i < l; i++) {
                            var name = animationList[i].name;
                            if (name === value) found = true;
                            hash += name + ';';
                        }
                        if (!found) hash += value;
                        window.location.hash = hash;
                    });
                }
            }

            var graphDebug = window.graphDebug;
            graphDebug.reset();
            if (controller.debugScene) {
                graphDebug.createGraph(root);
            }
        });
        return root;
    };

    var onLoad = function() {
        var canvas = document.getElementById('View');
        var viewer = new osgViewer.Viewer(canvas);
        viewer.init();
        var root = new osg.MatrixTransform();
        viewer.setSceneData(root);
        viewer.setupManipulator();
        viewer.run();

        //Manage Args in url
        var queryDict = {};
        window.location.search.substr(1).split('&').forEach(function(item) {
            queryDict[item.split('=')[0]] = item.split('=')[1];
        });

        var config = (this._config = {
            axis: false, //Debug axis on bone
            axisSize: 5, //Size of debug axis
            debug: false, //Debug scene graph
            url: undefined, //Relative path to the model
            time: undefined, //Stop time on loading t € [ 0, anim.duration ]
            anim: undefined, //Name of anim to play
            playMode: 0, //0 -> loop; 1 -> once; 2 -> twice; ...
            currentAnim: undefined
        });

        var controller = (this._controller = {
            debugScene: !!this._config['debug'],
            play: function() {},
            stop: function() {},
            pause: function() {},
            bind: function() {},
            count: 0,
            timeFactor: 1.0,
            isPlaying: false,
            times: 0.0,
            models: {
                character: 'character.osgjs'
            }
        });

        this.models = this._controller.models;

        //Load args in the _config Obj
        var keys = Object.keys(queryDict);
        for (var i = 0; i < keys.length; i++) {
            var property = keys[i];
            this._config[property] = queryDict[property];
        }

        //GUI SETUP
        var gui = (controller.gui = new window.dat.GUI());

        var defaultChoice = Object.keys(controller.models)[0];

        var overrideURL = this._config['url'];
        if (overrideURL) {
            var filename = overrideURL.replace(/^.*[\\\/]/, '').replace(' ', '_');
            var dot = filename.indexOf('.');
            if (dot !== -1) filename = filename.substring(0, dot);
            if (this.models[filename] === undefined) this.models[filename] = overrideURL;

            defaultChoice = filename;
        }

        this.graphDebug = new osgUtil.DisplayGraph();

        var currentAnim = this._config['currentAnim'];
        this._config.currentAnim = this._config['anim'];

        var playMode = this._config['playMode'];
        if (playMode) {
            if (!window.animationManager) return;
            window.animationManager.setLoopNum(currentAnim, playMode);
        }

        var modelController = gui.add(
            this._controller,
            'models',
            Object.keys(this._controller.models)
        );
        //modelController.listen();
        modelController.onFinishChange(function(value) {
            if (value !== 'undefined' && value !== defaultChoice) {
                var search = '?url=' + controller.models;
                window.location.href = window.location.origin + window.location.pathname + search;
            } else {
                root.removeChildren();
                createScene(viewer, root, window.models[controller.models], config, controller);
            }
        });

        var load = function(/*value*/) {
            root.removeChildren();
            createScene(viewer, root, window.models[controller.models], config, controller);
        };
        load = load.bind(this);

        //modelController.onFinishChange( load );
        //modelController.setValue( '_44f5d95ddb794570a441fce7513bf5d1' );
        modelController.setValue(defaultChoice);

        var debugSceneController = gui.add(this._controller, 'debugScene');
        debugSceneController.onFinishChange(load);

        gui.add(this._controller, 'play');

        gui.add(this._controller, 'stop');

        gui.add(this._controller, 'pause');

        gui.add(this._controller, 'bind');

        var speed = gui.add(this._controller, 'timeFactor');
        speed.onFinishChange(function(value) {
            window.animationManager.setTimeFactor(value);
        });

        var times = gui.add(this._controller, 'times', 0, 10).listen();
        times.onChange(function(value) {
            var activeAnimation = window.animationManager._activeAnimationList[0];
            var animation = window.animationManager._instanceAnimations[activeAnimation.name];
            var ratio = value / 10.0;
            var currentTime = ratio * animation.duration + animation.start;
            var timeFactor = window.animationManager.getTimeFactor();
            console.log(currentTime);
            if (window.animationManager._pause) {
                window.animationManager.setSimulationTime(currentTime / timeFactor); // * timeFactor );
            } else {
                window.animationManager.setSeekTime(currentTime / timeFactor); // * timeFactor );
            }
        });

        gui.add(this._controller, 'isPlaying').listen();

        var update = function() {
            requestAnimationFrame(update);
            if (!window.animationManager) return;
            controller.isPlaying = window.animationManager.isPlaying(config.currentAnim);
        };
        update();
    };

    window.addEventListener('load', onLoad, true);
})();
