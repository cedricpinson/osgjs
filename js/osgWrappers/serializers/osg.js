/** -*- compile-command: "jslint-cli osg.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

osgDB.ObjectWrapper.serializers.osg = {};

osgDB.ObjectWrapper.serializers.osg.Object = function(input, obj) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }
    
    if (jsonObj.Name) {
        obj.setName(jsonObj.Name);
    }

    if (jsonObj.UserDataContainer) {
        var userdata = input.setJSON(jsonObj.UserDataContainer).readUserDataContainer();
        if (userdata !== undefined) {
            obj.setUserData(userdata);
        }
    }

    return obj;
};

osgDB.ObjectWrapper.serializers.osg.Node = function(input, node) {
    var jsonObj = input.getJSON();

    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, node);

    var promiseArray = [];

    var createCallback = function(jsonCallback) {
        var promise = input.setJSON(jsonCallback).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(cb) {
            if (cb) {
                node.addUpdateCallback(cb);
            }
            df.resolve();
        });
    };

    if (jsonObj.UpdateCallbacks) {
        for (var j = 0, l = jsonObj.UpdateCallbacks.length; j < l; j++) {
            createCallback(jsonObj.UpdateCallbacks[j]);
        }
    }


    if (jsonObj.StateSet) {
        var pp = input.setJSON(jsonObj.StateSet).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(pp).then(function(stateset) {
            node.setStateSet(stateset);
            df.resolve();
        });
    }

    var createChildren = function(jsonChildren) {
        var promise = input.setJSON(jsonChildren).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(obj) {
            if (obj) {
                node.addChild(obj);
            }
            df.resolve(obj);
        });
    };

    if (jsonObj.Children) {
        for (var i = 0, k = jsonObj.Children.length; i < k; i++) {
            createChildren(jsonObj.Children[i]);
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(promiseArray).then(function() {
        defer.resolve(node);
    });

    return defer.promise;
};

osgDB.ObjectWrapper.serializers.osg.StateSet = function(input, stateSet) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        return true;
    };

    if (!check(jsonObj)) {
        return;
    }
    
    osgDB.ObjectWrapper.serializers.osg.Object(input, stateSet);

    if (jsonObj.RenderingHint !== undefined) {
        stateSet.setRenderingHint(jsonObj.RenderingHint);
    }

    var createAttribute = function(jsonAttribute) {
        var promise = input.setJSON(jsonAttribute).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(attribute) {
            if (attribute !== undefined) {
                stateSet.setAttributeAndMode(attribute);
            }
            df.resolve();
        });
    };

    var promiseArray = [];

    if (jsonObj.AttributeList !== undefined) {
        for (var i = 0, l = jsonObj.AttributeList.length; i < l; i++) {
            createAttribute(jsonObj.AttributeList[i]);
        }
    }

    var createTextureAttribute = function(unit, textureAttribute) {
        var promise = input.setJSON(textureAttribute).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(attribute) {
            if (attribute)
                stateSet.setTextureAttributeAndMode(unit, attribute);
            df.resolve();
        });
    };

    if (jsonObj.TextureAttributeList) {
        var textures = jsonObj.TextureAttributeList;
        for (var t = 0, lt = textures.length; t < lt; t++) {
            var textureAttributes = textures[t];
            for (var a = 0, al = textureAttributes.length; a < al; a++) {
                createTextureAttribute(t, textureAttributes[a]);
            }
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(promiseArray).then(function() {
        defer.resolve(stateSet);
    });

    return defer.promise;
};

osgDB.ObjectWrapper.serializers.osg.Material = function(input, material) {
    var jsonObj = input.getJSON();

    var check = function(o) {
        if (o.Diffuse !== undefined && 
            o.Emission !== undefined && 
            o.Specular !== undefined && 
            o.Shininess !== undefined) {
            return true;
        }
        return false;
    };

    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, material);

    material.setAmbient(jsonObj.Ambient);
    material.setDiffuse(jsonObj.Diffuse);
    material.setEmission(jsonObj.Emission);
    material.setSpecular(jsonObj.Specular);
    material.setShininess(jsonObj.Shininess);
    return material;
};


osgDB.ObjectWrapper.serializers.osg.BlendFunc = function(input, blend) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.SourceRGB && o.SourceAlpha && o.DestinationRGB && o.DestinationAlpha) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, blend);

    blend.setSourceRGB(jsonObj.SourceRGB);
    blend.setSourceAlpha(jsonObj.SourceAlpha);
    blend.setDestinationRGB(jsonObj.DestinationRGB);
    blend.setDestinationAlpha(jsonObj.DestinationAlpha);
    return blend;
};

osgDB.ObjectWrapper.serializers.osg.CullFace = function(input, attr) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.Mode !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, attr);
    attr.setMode(jsonObj.Mode);
    return attr;
};

osgDB.ObjectWrapper.serializers.osg.BlendColor = function(input, attr) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.ConstantColor !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, attr);
    attr.setConstantColor(jsonObj.ConstantColor);
    return attr;
};

osgDB.ObjectWrapper.serializers.osg.Light = function(input, light) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.LightNum !== undefined &&
            o.Ambient !== undefined &&
            o.Diffuse !== undefined &&
            o.Direction !== undefined &&
            o.Position !== undefined &&
            o.Specular !== undefined &&
            o.SpotCutoff !== undefined &&
            o.LinearAttenuation !== undefined &&
            o.ConstantAttenuation !== undefined &&
            o.QuadraticAttenuation !== undefined ) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, light);
    light.setAmbient(jsonObj.Ambient);
    light.setConstantAttenuation(jsonObj.ConstantAttenuation);
    light.setDiffuse(jsonObj.Diffuse);
    light.setDirection(jsonObj.Direction);
    light.setLightNumber(jsonObj.LightNum);
    light.setLinearAttenuation(jsonObj.LinearAttenuation);
    light.setPosition(jsonObj.Position);
    light.setQuadraticAttenuation(jsonObj.QuadraticAttenuation);
    light.setSpecular(jsonObj.Specular);
    light.setSpotCutoff(jsonObj.SpotCutoff);
    light.setSpotBlend(0.01);
    if (jsonObj.SpotExponent !== undefined) {
        light.setSpotBlend(jsonObj.SpotExponent/128.0);
    }
    return light;
};

osgDB.ObjectWrapper.serializers.osg.Texture = function(input, texture) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.serializers.osg.Object(input, texture);

    if (jsonObj.MinFilter !== undefined) {
        texture.setMinFilter(jsonObj.MinFilter);
    }
    if (jsonObj.MagFilter !== undefined) {
        texture.setMagFilter(jsonObj.MagFilter);
    }

    if (jsonObj.WrapT !== undefined) {
        texture.setWrapT(jsonObj.WrapT);
    }
    if (jsonObj.WrapS !== undefined) {
        texture.setWrapS(jsonObj.WrapS);
    }

    if (jsonObj.File !== undefined) {
        osgDB.Promise.when(input.readImageURL(jsonObj.File)).then(
            function(img) {
                texture.setImage(img);
            });
    }
    return texture;
};


osgDB.ObjectWrapper.serializers.osg.Projection = function(input, node) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.Matrix !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var promise = osgDB.ObjectWrapper.serializers.osg.Node(input, node);

    if (jsonObj.Matrix !== undefined) {
        node.setMatrix(jsonObj.Matrix);
    }
    return promise;
};


osgDB.ObjectWrapper.serializers.osg.MatrixTransform = function(input, node) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var promise = osgDB.ObjectWrapper.serializers.osg.Node(input, node);

    if (jsonObj.Matrix !== undefined) {
        node.setMatrix(jsonObj.Matrix);
    }
    return promise;
};


osgDB.ObjectWrapper.serializers.osg.LightSource = function(input, node) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.Light !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var defer = osgDB.Promise.defer();
    var promise = osgDB.ObjectWrapper.serializers.osg.Node(input, node);
    osgDB.Promise.all([input.setJSON(jsonObj.Light).readObject(), promise]).then( function (args) {
        var light = args[0];
        var lightsource = args[1];
        node.setLight(light);
        defer.resolve(node);
    });
    return defer.promise;
};


osgDB.ObjectWrapper.serializers.osg.Geometry = function(input, node) {
    var jsonObj = input.getJSON();
    var check = function(o) {
        if (o.PrimitiveSetList !== undefined && o.VertexAttributeList !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var arraysPromise = [];
    arraysPromise.push(osgDB.ObjectWrapper.serializers.osg.Node(input, node));

    var createPrimitive = function(jsonPrimitive) {
        var defer = osgDB.Promise.defer();
        arraysPromise.push(defer.promise);
        var promise = input.setJSON(jsonPrimitive).readPrimitiveSet();
        osgDB.Promise.when(promise).then(function(primitiveSet) {
            if (primitiveSet !== undefined) {
                node.getPrimitives().push(primitiveSet);
            }
            defer.resolve(primitiveSet);
        });
    };

    for (var i = 0, l = jsonObj.PrimitiveSetList.length; i < l; i++) {
        var entry = jsonObj.PrimitiveSetList[i];
        createPrimitive(entry);
    }

    var createVertexAttribute = function(name, jsonAttribute) {
        var defer = osgDB.Promise.defer();
        arraysPromise.push(defer.promise);
        var promise = input.setJSON(jsonAttribute).readBufferArray();
        osgDB.Promise.when(promise).then(function(buffer) {
            if (buffer !== undefined) {
                node.getVertexAttributeList()[name] = buffer;
            }
            defer.resolve(buffer);
        });
    };
    for (var key in jsonObj.VertexAttributeList) {
        if (jsonObj.VertexAttributeList.hasOwnProperty(key)) {
            createVertexAttribute(key, jsonObj.VertexAttributeList[key]);
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(arraysPromise).then(function() { defer.resolve(node);});
    return defer.promise;
};
