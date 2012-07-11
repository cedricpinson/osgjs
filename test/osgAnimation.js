module("osgAnimation");
asyncTest("BasicAnimationManager", function() {
    var tree =  {
        "Generator": "OpenSceneGraph 3.1.0", 
        "Version": 1, 
        "osg.Node": {
            "Children": [ {
                "osg.Node": {
                    "Name": "Root", 
                    "UpdateCallbacks": [ {
                        "osgAnimation.BasicAnimationManager": {
                            "Animations": [ {
                                "osgAnimation.Animation": {
                                    "Name": "Cube", 
                                    "Channels": [ {
                                        "osgAnimation.Vec3LerpChannel": {
                                            "Name": "translate", 
                                            "TargetName": "Cube", 
                                            "KeyFrames": [
                                                [ -0.04, 0, 0, 0],
                                                [ 0, 0.0232, 0, 0],
                                                [ 0.76, 4.0612, 0, 0] ]
                                        }
                                    },
                                                  {
                                                      "osgAnimation.FloatLerpChannel": {
                                                          "Name": "euler_x", 
                                                          "TargetName": "Cube", 
                                                          "KeyFrames": [
                                                              [ -0.04, 0],
                                                              [ 0, 0],
                                                              [ 0.76, 1.5708] ]
                                                      }
                                                  },
                                                  {
                                                      "osgAnimation.FloatLerpChannel": {
                                                          "Name": "euler_y", 
                                                          "TargetName": "Cube", 
                                                          "KeyFrames": [
                                                              [ -0.04, 0],
                                                              [ 0, 0],
                                                              [ 0.76, -0] ]
                                                      }
                                                  },
                                                  {
                                                      "osgAnimation.FloatLerpChannel": {
                                                          "Name": "euler_z", 
                                                          "TargetName": "Cube", 
                                                          "KeyFrames": [
                                                              [ -0.04, 0],
                                                              [ 0, 0],
                                                              [ 0.76, 0] ]
                                                      }
                                                  } ]
                                }
                            } ]
                        }
                    } ], 
                    "Children": [ {
                        "osg.MatrixTransform": {
                            "Name": "Cube", 
                            "Matrix": [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ], 
                            "UpdateCallbacks": [ {
                                "osgAnimation.UpdateMatrixTransform": {
                                    "Name": "Cube", 
                                    "StackedTransforms": [ {
                                        "osgAnimation.StackedTranslate": {
                                            "Name": "translate", 
                                            "Translate": [ 0, 0, 0]
                                        }
                                    },
                                                           {
                                                               "osgAnimation.StackedRotateAxis": {
                                                                   "Name": "euler_z", 
                                                                   "Angle": 0, 
                                                                   "Axis": [ 0, 0, 1]
                                                               }
                                                           },
                                                           {
                                                               "osgAnimation.StackedRotateAxis": {
                                                                   "Name": "euler_y", 
                                                                   "Angle": 0, 
                                                                   "Axis": [ 0, 1, 0]
                                                               }
                                                           },
                                                           {
                                                               "osgAnimation.StackedRotateAxis": {
                                                                   "Name": "euler_x", 
                                                                   "Angle": 0, 
                                                                   "Axis": [ 1, 0, 0]
                                                               }
                                                           } ]
                                }
                            } ], 
                            "Children": [ {
                                "osg.Node": {
                                    "Name": "GeodeCube", 
                                    "Children": [ {
                                        "osg.Geometry": {
                                            "Name": "Cube", 
                                            "StateSet": {
                                                "osg.StateSet": {
                                                    "Name": "Material", 
                                                    "AttributeList": [ {
                                                        "osg.Material": {
                                                            "Name": "Material", 
                                                            "Ambient": [ 0.8, 0.8, 0.8, 1], 
                                                            "Diffuse": [ 0.64, 0.64, 0.64, 1], 
                                                            "Emission": [ 0, 0, 0, 1], 
                                                            "Shininess": 12.5, 
                                                            "Specular": [ 0.5, 0.5, 0.5, 1]
                                                        }
                                                    } ]
                                                }
                                            }, 
                                            "PrimitiveSetList": [ {
                                                "DrawElementUShort": {
                                                    "Indices": {
                                                        "Elements": [ 0, 1, 3, 1, 2, 3, 4, 5, 7, 5, 6, 7, 8, 9, 11, 9, 10, 11, 12, 13, 15, 13, 14, 15, 16, 17, 19, 17, 18, 19, 20, 21, 23, 21, 22, 23 ], 
                                                        "ItemSize": 1, 
                                                        "Type": "ELEMENT_ARRAY_BUFFER"
                                                    }, 
                                                    "Mode": "TRIANGLES"
                                                }
                                            } ], 
                                            "VertexAttributeList": {
                                                "Normal": {
                                                    "Elements": [ 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -0, 1, 0, -0, 1, 0, -0, 1, 0, -0, 1, 1, -0, 0, 1, -0, 0, 1, -0, 0, 1, -0, 0, -0, -1, -0, -0, -1, -0, -0, -1, -0, -0, -1, -0, -1, 0, -0, -1, 0, -0, -1, 0, -0, -1, 0, -0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ], 
                                                    "ItemSize": 3, 
                                                    "Type": "ARRAY_BUFFER"
                                                }, 
                                                "Vertex": {
                                                    "Elements": [ 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1 ], 
                                                    "ItemSize": 3, 
                                                    "Type": "ARRAY_BUFFER"
                                                }
                                            }
                                        }
                                    } ]
                                }
                            } ]
                        }
                    } ]
                }
            } ]
        }
    };

    (function() {
        osgDB.Promise.when(osgDB.parseSceneGraph(tree)).then(function(result) {

            var FindAnimationManagerVisitor = function() { 
                osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN); 
                this._cb = undefined;
            };
            FindAnimationManagerVisitor.prototype = osg.objectInehrit( osg.NodeVisitor.prototype, {
                init: function() {
                    this.found = [];
                },
                apply: function(node) {
                    var cbs = node.getUpdateCallbackList();
                    for (var i = 0, l = cbs.length; i < l; i++) {
                        if ( cbs[0] instanceof osgAnimation.BasicAnimationManager ) {
                            this._cb = cbs[0];
                            return;
                        }
                    }
                    this.traverse(node);
                }
            });
            var finder = new FindAnimationManagerVisitor();
            result.accept(finder);
            var animationManager = finder._cb;
            var lv = new osgAnimation.LinkVisitor();
            lv.setAnimationMap(animationManager.getAnimationMap());
            result.accept(lv);
            animationManager.buildTargetList();
            ok(animationManager._targets.length === 4, "Check targets");

            animationManager.playAnimation("Cube");
            animationManager.updateManager(0);
            animationManager.updateManager(0.5);
            osg.log("value " + animationManager._targets[0].getValue());
            animationManager.updateManager(1.0);
            ok(check_near(animationManager._targets[0].getValue(), [1.085831578947368, 0, 0]) , "Check animation loop result");

            animationManager.stopAnimation("Cube");
            animationManager.updateManager(2.0);
            animationManager.playAnimation({ name: "Cube", loop: 1 } );
            animationManager.updateManager(2.5);
            osg.log("value " + animationManager._targets[0].getValue());
            animationManager.updateManager(3.0);
            ok(animationManager.isPlaying("Cube"), false, "Check animation is not active");
            ok(check_near(animationManager._targets[0].getValue(), [2.6797789473684217, 0, 0]) , "Check animation once result");
            start();
        });
    })();
});

test("Vec3Keyframe", function() {
    var k = new osgAnimation.createVec3Keyframe(0.2, [ 0, 1, 2]);
    ok(k.length === 3, "Check size");
    ok(k.t === 0.2, "Check time");
});

test("Animation", function() {
    ok(true);
});


test("Channel", function() {
    var keys = [];
    keys.push(osgAnimation.createVec3Keyframe(0, [ 1,1,1]));
    keys.push(osgAnimation.createVec3Keyframe(1, [ 0,0,0]));
    keys.push(osgAnimation.createVec3Keyframe(2, [ 3,3,3]));

    var channel = new osgAnimation.Vec3LerpChannel(keys);
    channel.update(1.0);
    ok(check_near(channel.getTarget().getValue(), [ 0.0, 0.0, 0.0]), "Check vec3 channel update");

    keys.length = 0;
    keys.push(osgAnimation.createFloatKeyframe(0, 1));
    keys.push(osgAnimation.createFloatKeyframe(1, 0));
    keys.push(osgAnimation.createFloatKeyframe(2, 3));

    channel = new osgAnimation.FloatLerpChannel(keys);
    channel.update(1.0);
    ok(check_near(channel.getTarget().getValue(), 0.0), "Check float channel update");

});


test("Sampler", function() {
    var keys = [];
    keys.push(osgAnimation.createVec3Keyframe(0.1, [ 1,1,1]));
    keys.push(osgAnimation.createVec3Keyframe(1, [ 0,0,0]));
    keys.push(osgAnimation.createVec3Keyframe(2.1, [ 3,3,3]));

    var sampler = new osgAnimation.Sampler(keys, osgAnimation.Vec3LerpInterpolator);
    ok(sampler.getStartTime() === 0.1, "Check Start Time");
    ok(sampler.getEndTime() === 2.1, "Check End Time");

    var result = { 'value':0, 'key': 0 };
    sampler.getValueAt(1.0, result);
    ok(check_near(result.value, [ 0.0, 0.0, 0.0]), "Check value when time == 1.0");

    sampler.setKeyframes([]);
    ok(sampler.getStartTime() === undefined, "Check Start Time without keyframes");
    ok(sampler.getEndTime() === undefined, "Check End Time without keyframes");
});


test("Vec3LerpInterpolator", function() {
    var keys = [];
    keys.push(osgAnimation.createVec3Keyframe(0, [ 1,1,1]));
    keys.push(osgAnimation.createVec3Keyframe(1, [ 0,0,0]));
    keys.push(osgAnimation.createVec3Keyframe(2, [ 3,3,3]));

    var result = { 'value':0, 'key': 0 };

    osgAnimation.Vec3LerpInterpolator(keys, -1, result);
    ok(check_near(result.value, [ 1,1,1]), "Check value when time < first key");
    ok(result.key === 0, "Check key when time < first key");

    osgAnimation.Vec3LerpInterpolator(keys, 3, result);
    ok(check_near(result.value, [ 3,3,3]), "Check value when time > last key");
    ok(result.key === 0, "Check key when time > last key");

    osgAnimation.Vec3LerpInterpolator(keys, 0.5, result);
    ok(check_near(result.value, [ 0.5, 0.5, 0.5]), "Check value when time == 0.5");
    ok(result.key === 0, "Check key when time == 0.5");

    osgAnimation.Vec3LerpInterpolator(keys, 1.5, result);
    ok(check_near(result.value, [ 1.5, 1.5, 1.5]), "Check value when time == 1.5");
    ok(result.key === 1, "Check key when time == 1.5");

    // with 2 keys only
    keys = keys.slice(1);
    result.key = 0;
    osgAnimation.Vec3LerpInterpolator(keys, 1.5, result);
    ok(check_near(result.value, [ 1.5, 1.5, 1.5]), "Check value when time == 1.5 with 2 keyframes");
    ok(result.key === 0, "Check key when time == 1.5 with 2 keyframes");

    // with 1 key only
    keys = keys.slice(1);
    result.key = 0;
    osgAnimation.Vec3LerpInterpolator(keys, 2.0, result);
    ok(check_near(result.value, [ 3.0, 3.0, 3.0]), "Check value when time == 2.0 with 1 keyframe");
    ok(result.key === 0, "Check key when time == 2.0 with 1 keyframe");
    
});

test("FloatLerpInterpolator", function() {
    var keys = [];
    keys.push(osgAnimation.createFloatKeyframe(0, 1));
    keys.push(osgAnimation.createFloatKeyframe(1, 0));
    keys.push(osgAnimation.createFloatKeyframe(2, 3));

    var result = { 'value':0, 'key': 0 };

    osgAnimation.FloatLerpInterpolator(keys, -1, result);
    ok(check_near(result.value, 1), "Check value when time < first key");
    ok(result.key === 0, "Check key when time < first key");

    osgAnimation.FloatLerpInterpolator(keys, 3, result);
    ok(check_near(result.value, 3), "Check value when time > last key");
    ok(result.key === 0, "Check key when time > last key");

    osgAnimation.FloatLerpInterpolator(keys, 0.5, result);
    ok(check_near(result.value, 0.5), "Check value when time == 0.5");
    ok(result.key === 0, "Check key when time == 0.5");

    osgAnimation.FloatLerpInterpolator(keys, 1.5, result);
    ok(check_near(result.value, 1.5), "Check value when time == 1.5");
    ok(result.key === 1, "Check key when time == 1.5");

    // with 2 keys only
    keys = keys.slice(1);
    result.key = 0;
    osgAnimation.FloatLerpInterpolator(keys, 1.5, result);
    ok(check_near(result.value, 1.5), "Check value when time == 1.5 with 2 keyframes");
    ok(result.key === 0, "Check key when time == 1.5 with 2 keyframes");

    // with 1 key only
    keys = keys.slice(1);
    result.key = 0;
    osgAnimation.FloatLerpInterpolator(keys, 2.0, result);
    ok(check_near(result.value, 3.0), "Check value when time == 2.0 with 1 keyframe");
    ok(result.key === 0, "Check key when time == 2.0 with 1 keyframe");
    
});
