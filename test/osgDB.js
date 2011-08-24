test("osgDB.ObjectWrapper.getObject", function() {
    var obj = osgDB.ObjectWrapper.getObject("osg.Node");
    ok(obj.getName() !== "", "check osg.Node.getName");
    ok(obj.addChild !== undefined, "check osg.addChild");
});

test("osgDB.parseSceneGraph", function() {

    (function() {
        var tree =  { 

            "stateset": {
                "material": {
                    "ambient": [ 0.5, 0.5, 0.5, 1], 
                    "diffuse": [ .1, .1, .1, .1], 
                    "emission": [ 0, 0, 0, .5], 
                    "name": "FloorBorder1", 
                    "shininess": 2.5, 
                    "specular": [ 0.5, 0.7, 0.5, 1]
                }, 
                "textures": 
                [ {
                    "file": "textures/sol_2.png", 
                    "mag_filter": "LINEAR", 
                    "min_filter": "LINEAR_MIPMAP_LINEAR"
                }, 
                  {
                      "file": "textures/floor_shadow.png", 
                      "mag_filter": "NEAREST", 
                      "min_filter": "NEAREST",
                      "wrap_s": "REPEAT",
                      "wrap_t": "MIRRORED_REPEAT"
                  }
                ]
            }
        };

        var result = osgDB.parseSceneGraph(tree);
        ok(result.getStateSet() !== undefined, "check old stateset");
        var material = result.getStateSet().getAttribute('Material');
        var materialCheck = ( material !== undefined &&
                              check_near(material.getAmbient(), [0.5, 0.5, 0.5, 1]) && 
                              check_near(material.getDiffuse(), [0.1, 0.1, 0.1, .1]) && 
                              check_near(material.getEmission(), [0.0, 0.0, 0.0, .5]) && 
                              check_near(material.getSpecular(), [0.5, 0.7, 0.5, 1]) &&
                              check_near(material.getShininess(), 2.5) && 
                              material.getName() === "FloorBorder1");

        ok(materialCheck, "check old material");
        var texture = result.getStateSet().getTextureAttribute(1, 'Texture');
        var textureCheck = (texture !== undefined && 
                            texture.getWrapS() === osg.Texture.REPEAT && 
                            texture.getWrapT() === osg.Texture.MIRRORED_REPEAT &&
                            texture.getMinFilter() === osg.Texture.NEAREST && 
                            texture.getMagFilter() === osg.Texture.NEAREST);
        ok(textureCheck, "check old texture");

    })();


    (function() {
        var tree = { 'osg.Node': 
                     {
                         'StateSet': { 
                             'osg.StateSet': {
                                 'AttributeList': [
                                     { 'osg.BlendFunc': {
                                         'SourceRGB': 'SRC_ALPHA',
                                         'DestinationRGB': 'ONE_MINUS_SRC_ALPHA',
                                         'SourceAlpha': 'SRC_ALPHA',
                                         'DestinationAlpha': 'ONE_MINUS_SRC_ALPHA'
                                     } 
                                     } ,
                                     {
                                         "osg.Material": {
                                             "Name": "FloorBorder1", 
                                             "Ambient": [ 0.5, 0.5, 0.5, 1], 
                                             "Diffuse": [ .1, .1, .1, .1], 
                                             "Emission": [ 0, 0, 0, .5], 
                                             "Shininess": 2.5, 
                                             "Specular": [ 0.5, 0.7, 0.5, 1]
                                         }
                                     }],
                                 "TextureAttributeList": [ [ {
                                     "osg.Texture": {
                                         "File": "/unknown.png", 
                                         "MagFilter": "LINEAR", 
                                         "MinFilter": "LINEAR_MIPMAP_LINEAR", 
                                         "WrapS": "REPEAT", 
                                         "WrapT": "CLAMP_TO_EDGE"
                                     }
                                 } ] ]
                             }
                         }
                     }
                   };

        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getStateSet() !== undefined, "check last StateSet");
        ok(result.getStateSet().getAttribute('BlendFunc') !== undefined, "check BlendFunc");
        var material = result.getStateSet().getAttribute('Material');
        var materialCheck = ( material !== undefined &&
                              check_near(material.getAmbient(), [0.5, 0.5, 0.5, 1]) && 
                              check_near(material.getDiffuse(), [0.1, 0.1, 0.1, .1]) && 
                              check_near(material.getEmission(), [0.0, 0.0, 0.0, .5]) && 
                              check_near(material.getSpecular(), [0.5, 0.7, 0.5, 1]) &&
                              check_near(material.getShininess(), 2.5) && 
                              material.getName() === "FloorBorder1");

        ok(materialCheck, "check Material");
        var texture = result.getStateSet().getTextureAttribute(0,"Texture")
        ok( texture !== undefined, "Check texture");
        ok( texture.getWrapS() === osg.Texture.REPEAT, "Check wraps texture");
        ok( texture.getWrapT() === osg.Texture.CLAMP_TO_EDGE, "Check wrapt texture");
        ok( texture.getMinFilter() === osg.Texture.LINEAR_MIPMAP_LINEAR, "Check min filter texture");
        ok( texture.getMagFilter() === osg.Texture.LINEAR, "Check mag filter texture");
    })();


    (function() {
        var tree = {
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
                    } ]
                  }
                };

        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getStateSet() !== undefined, "check geometry StateSet");
        ok(result.getPrimitiveSetList().length == 1, "check primitives");
        ok(result.getPrimitiveSetList()[0].getMode() === osg.PrimitiveSet.TRIANGLES, "check triangles primitive");
        ok(result.getPrimitiveSetList()[0].getFirst() === 0, "check triangles first index");
        ok(result.getPrimitiveSetList()[0].getIndices().getElements().length === 36, "check triangles indices");
        ok(result.getPrimitiveSetList()[0].getIndices().getElements().length === result.getPrimitiveSetList()[0].getCount(), "check triangles count");
        ok(Object.keys(result.getVertexAttributeList()).length === 2, "check vertex attributes");

    })();


    (function() {
        var tree = {
          "osg.MatrixTransform": {
            "Name": "Lamp", 
            "Matrix": [ -0.2909, 0.9552, -0.0552, 0, -0.7711, -0.1999, 0.6045, 0, 0.5664, 0.2184, 0.7947, 0, 4.0762, 1.0055, 5.9039, 1 ], 
            "Children": [ {
              "osg.Node": {
                "Name": "Lamp"
              }
            } ]
          }
        };

        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getName() === "Lamp", "check matrix transform");
        ok(result.getMatrix()[0] === -0.2909, "check matrix transform content");

    })();


    (function() {
        var tree = {
            "osg.Node": {
                "Name": "Root", 
                "UpdateCallbacks": [ {
                    "osgAnimation.BasicAnimationManager": {
                        "Animations": [ {
                            "osgAnimation.Animation": {
                                "Name": "Test",
                                "Channels": [ {
                                    "osgAnimation.Vec3LinearChannel": {
                                        "Name": "translate", 
                                        "KeyFrames": [ [ 0, 
                                                         -15.7923, 
                                                         781.26, 
                                                         136.075 ] ], 
                                        "TargetName": "Zeppelin_2"
                                    }
                                }, {
                                    "osgAnimation.Vec3LinearChannel": {
                                        "Name": "scale", 
                                        "KeyFrames": [ [ 0, 
                                                         1, 
                                                         1, 
                                                         1 ], 
                                                       [ 39.96, 
                                                         1, 
                                                         1, 
                                                         1 ] ], 
                                        "TargetName": "Zeppelin_2"
                                    }
                                } ]
                            }
                        } ]
                    }
                } ], 
            }
        };


        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getUpdateCallbackList().length === 1, "check update callback");

        ok(result.getUpdateCallback().getAnimationMap()['Test'] !== undefined, "check animation list");
        var animation =  result.getUpdateCallback().getAnimationMap()['Test'];
        ok(animation !== undefined, "check animation");        
        ok(animation.getChannels().length === 2, "check channels");
        ok(animation.getChannels()[1].getName() === "scale", "check channel 1");
        ok(animation.getChannels()[1].getTargetName() === "Zeppelin_2", "check taget channel 1");
        ok(animation.getChannels()[1].getSampler().getKeyframes().length === 2, "check keyframes on channel 1");

    })();




    (function() {
        var tree = {
            "osgAnimation.FloatLinearChannel": {
                "Name": "euler_x", 
                "TargetName": "Cube", 
                "KeyFrames": [
                    [ -0.04, 0],
                    [ 0.36, -0] ]
            }
        };

        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getKeyframes().length === 2, "Check keyframes FloatLinearChannel");
        ok(result.getTargetName() === "Cube", "Check TargetName FloatLinearChannel");
        ok(result.getName() === "euler_x", "Check Name FloatLinearChannel");

    })();

    (function() {
        var tree = { 
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
                        }, {
                            "osgAnimation.StackedRotateAxis": {
                                "Name": "euler_z", 
                                "Angle": 0, 
                                "Axis": [ 0, 0, 1]
                            }
                        }, {
                            "osgAnimation.StackedRotateAxis": {
                                "Name": "euler_y", 
                                "Angle": 0, 
                                "Axis": [ 0, 1, 0]
                            }
                        }, {
                            "osgAnimation.StackedRotateAxis": {
                                "Name": "euler_x", 
                                "Angle": 0, 
                                "Axis": [ 1, 0, 0]
                            }
                        } ]
                    }
                } ], 
            }
        };

        var result = osgDB.ObjectWrapper.readObject(tree);
        ok(result.getUpdateCallbackList().length === 1, "check osgAnimation.UpdateMatrixTransform callback");
        ok(result.getUpdateCallback().getStackedTransforms().length === 4, "check osgAnimation.UpdateMatrixTransform stacked transform");

    })();

});
