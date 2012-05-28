osgDB.Input = function(json, identifier)
{
    this._json = json;
    var map = identifier;
    if (map === undefined) {
        map = {};
    }
    this._identifierMap = map;
};

osgDB.Input.prototype = {
    getJSON: function() {
        return this._json;
    },
    setJSON: function(json) {
        this._json = json;
        return this;
    },
    getObjectWrapper: function (path) {
        var scope = window;
        var splittedPath = path.split('.');
        for (var i = 0, l = splittedPath.length; i < l; i++) {
            var obj = scope[ splittedPath[i] ];
            if (obj === undefined) {
                return undefined;
            }
            scope = obj;
        }
        // create the new obj
        return new (scope)();
    },

    readImageURL: function(url) {
        var img = new Image();
        img.onerror = function() {
            osg.warn("warning use white texture as fallback instead of " + url);
            img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=";
        };
        img.src = url;
        return img;
    },

    readImage: function() {
        var jsonObj = this.getJSON();
        var uniqueID = jsonObj.UniqueID;
        var img;
        if (uniqueID !== undefined) {
            img = this._identifierMap[uniqueID];
            if (img !== undefined) {
                return img;
            }
        }

        var url = jsonObj.Url;
        img = this.readImageURL(url);

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = img;
        }
        return img;
    },

    readBufferArray: function() {
        var jsonObj = this.getJSON();

        var uniqueID = jsonObj.UniqueID;
        var osgjsObject;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject;
            }
        }

        var check = function(o) {
            if (o.Elements !== undefined && 
                o.ItemSize !== undefined &&
                o.Type) {
                return true;
            }
            return false;
        };
        if (!check(jsonObj)) {
            return;
        }
        
        var obj = new osg.BufferArray(osg.BufferArray[jsonObj.Type], jsonObj.Elements, jsonObj.ItemSize );

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = obj;
        }
        return obj;
    },

    readUserDataContainer: function() {
        var jsonObj = this.getJSON();
        var osgjsObject;
        var uniqueID = jsonObj.UniqueID;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject.Values;
            }
        }

        this._identifierMap[uniqueID] = jsonObj;
        return jsonObj.Values;
    },

    readPrimitiveSet: function() {
        var jsonObj = this.getJSON();
        var uniqueID;
        var osgjsObject;

        var obj;
        var drawElementPrimitive = jsonObj.DrawElementUShort || jsonObj.DrawElementUByte || jsonObj.DrawElementUInt || jsonObj.DrawElementsUShort || jsonObj.DrawElementsUByte || jsonObj.DrawElementsUInt || undefined;
        if ( drawElementPrimitive ) {

            uniqueID = drawElementPrimitive.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            var jsonArray = drawElementPrimitive.Indices;
            mode = drawElementPrimitive.Mode;
            array = new osg.BufferArray(osg.BufferArray[jsonArray.Type], 
                                        jsonArray.Elements, 
                                        jsonArray.ItemSize );
            if (!mode) {
                mode = osg.PrimitiveSet.TRIANGLES;
            } else {
                mode = osg.PrimitiveSet[mode];
            }
            obj = new osg.DrawElements(mode, array);
        }

        var drawArrayPrimitive = jsonObj.DrawArray || jsonObj.DrawArrays;
        if (drawArrayPrimitive) {

            uniqueID = drawArrayPrimitive.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            mode = drawArrayPrimitive.Mode || drawArrayPrimitive.mode;
            first = drawArrayPrimitive.First !== undefined ? drawArrayPrimitive.First : drawArrayPrimitive.first;
            count = drawArrayPrimitive.Count !== undefined ? drawArrayPrimitive.Count : drawArrayPrimitive.count;
            var drawArray = new osg.DrawArrays(osg.PrimitiveSet[mode], first, count);
            obj = drawArray;
        }

        var drawArrayLengthsPrimitive = jsonObj.DrawArrayLengths || undefined;
        if (drawArrayLengthsPrimitive) {

            uniqueID = drawArrayLengthsPrimitive.UniqueID;
            if (uniqueID !== undefined) {
                osgjsObject = this._identifierMap[uniqueID];
                if (osgjsObject !== undefined) {
                    return osgjsObject;
                }
            }

            mode = drawArrayLengthsPrimitive.Mode;
            first = drawArrayLengthsPrimitive.First;
            array = drawArrayLengthsPrimitive.ArrayLengths;
            var drawArrayLengths =  new osg.DrawArrayLengths(osg.PrimitiveSet[mode], first, array);
            obj = drawArrayLengths;
        }

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = obj;
        }
        return obj;
    },

    readDrawable: function() {
        var jsonObj = this.getJSON();

        var uniqueID = jsonObj.UniqueID;
        var osgjsObject;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject;
            }
        }

        var check = function(o) {
            if (o.Elements !== undefined && 
                o.ItemSize !== undefined &&
                o.Type) {
                return true;
            }
            return false;
        };
        if (!check(jsonObj)) {
            return;
        }
        
        var obj = new osg.BufferArray(osg.BufferArray[jsonObj.Type], jsonObj.Elements, jsonObj.ItemSize );

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = obj;
        }
        return obj;
    },

    readObject: function () {

        var jsonObj = this.getJSON();
        var prop = Object.keys(jsonObj)[0];
        if (!prop) {
            osg.warn("can't find property for object " + jsonObj);
            return undefined;
        }

        var uniqueID = jsonObj[prop].UniqueID;
        var osgjsObject;
        if (uniqueID !== undefined) {
            osgjsObject = this._identifierMap[uniqueID];
            if (osgjsObject !== undefined) {
                return osgjsObject;
            }
        }

        var obj = this.getObjectWrapper(prop);
        if (!obj) {
            osg.warn("can't instanciate object " + prop);
            return undefined;
        }

        var scope = osgDB.ObjectWrapper.serializers;
        var splittedPath = prop.split('.');
        for (var i = 0, l = splittedPath.length; i < l; i++) {
            var reader = scope[ splittedPath[i] ];
            if (reader === undefined) {
                osg.warn("can't find function to read object " + prop + " - undefined");
                return undefined;
            }
            scope = reader;
        }
        
        scope(this.setJSON(jsonObj[prop]), obj);

        if (uniqueID !== undefined) {
            this._identifierMap[uniqueID] = obj;
        }
        return obj;
    }
    
};