define( [
    'Q'
], function ( Q ) {

    var osgWrapper = {};

    osgWrapper.Object = function ( input, obj ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/ ) {
            return true;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        if ( jsonObj.Name ) {
            obj.setName( jsonObj.Name );
        }

        if ( jsonObj.UserDataContainer ) {
            var userdata = input.setJSON( jsonObj.UserDataContainer ).readUserDataContainer();
            if ( userdata !== undefined ) {
                obj.setUserData( userdata );
            }
        }

        return obj;
    };

    osgWrapper.Node = function ( input, node ) {
        var jsonObj = input.getJSON();

        var check = function ( /*o*/ ) {
            return true;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        osgWrapper.Object( input, node );

        var promiseArray = [];

        var createCallback = function ( jsonCallback ) {
            var promise = input.setJSON( jsonCallback ).readObject();
            var df = Q.defer();
            promiseArray.push( df.promise );
            Q.when( promise ).then( function ( cb ) {
                if ( cb ) {
                    node.addUpdateCallback( cb );
                }
                df.resolve();
            } );
        };

        if ( jsonObj.UpdateCallbacks ) {
            for ( var j = 0, l = jsonObj.UpdateCallbacks.length; j < l; j++ ) {
                createCallback( jsonObj.UpdateCallbacks[ j ] );
            }
        }


        if ( jsonObj.StateSet ) {
            var pp = input.setJSON( jsonObj.StateSet ).readObject();
            var df = Q.defer();
            promiseArray.push( df.promise );
            Q.when( pp ).then( function ( stateset ) {
                node.setStateSet( stateset );
                df.resolve();
            } );
        }

        var createChildren = function ( jsonChildren ) {
            var promise = input.setJSON( jsonChildren ).readObject();
            var df = Q.defer();
            promiseArray.push( df.promise );
            Q.when( promise ).then( function ( obj ) {
                if ( obj ) {
                    node.addChild( obj );
                }
                df.resolve( obj );
            } );
        };

        if ( jsonObj.Children ) {
            for ( var i = 0, k = jsonObj.Children.length; i < k; i++ ) {
                createChildren( jsonObj.Children[ i ] );
            }
        }

        var defer = Q.defer();
        Q.all( promiseArray ).then( function () {
            defer.resolve( node );
        } );

        return defer.promise;
    };

    osgWrapper.StateSet = function ( input, stateSet ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/ ) {
            return true;
        };

        if ( !check( jsonObj ) ) {
            return;
        }

        osgWrapper.Object( input, stateSet );

        if ( jsonObj.RenderingHint !== undefined ) {
            stateSet.setRenderingHint( jsonObj.RenderingHint );
        }

        var createAttribute = function ( jsonAttribute ) {
            var promise = input.setJSON( jsonAttribute ).readObject();
            var df = Q.defer();
            promiseArray.push( df.promise );
            Q.when( promise ).then( function ( attribute ) {
                if ( attribute !== undefined ) {
                    stateSet.setAttributeAndMode( attribute );
                }
                df.resolve();
            } );
        };

        var promiseArray = [];

        if ( jsonObj.AttributeList !== undefined ) {
            for ( var i = 0, l = jsonObj.AttributeList.length; i < l; i++ ) {
                createAttribute( jsonObj.AttributeList[ i ] );
            }
        }

        var createTextureAttribute = function ( unit, textureAttribute ) {
            var promise = input.setJSON( textureAttribute ).readObject();
            var df = Q.defer();
            promiseArray.push( df.promise );
            Q.when( promise ).then( function ( attribute ) {
                if ( attribute )
                    stateSet.setTextureAttributeAndMode( unit, attribute );
                df.resolve();
            } );
        };

        if ( jsonObj.TextureAttributeList ) {
            var textures = jsonObj.TextureAttributeList;
            for ( var t = 0, lt = textures.length; t < lt; t++ ) {
                var textureAttributes = textures[ t ];
                for ( var a = 0, al = textureAttributes.length; a < al; a++ ) {
                    createTextureAttribute( t, textureAttributes[ a ] );
                }
            }
        }

        var defer = Q.defer();
        Q.all( promiseArray ).then( function () {
            defer.resolve( stateSet );
        } );

        return defer.promise;
    };

    osgWrapper.Material = function ( input, material ) {
        var jsonObj = input.getJSON();

        var check = function ( o ) {
            if ( o.Diffuse !== undefined &&
                o.Emission !== undefined &&
                o.Specular !== undefined &&
                o.Shininess !== undefined ) {
                return true;
            }
            return false;
        };

        if ( !check( jsonObj ) ) {
            return;
        }

        osgWrapper.Object( input, material );

        material.setAmbient( jsonObj.Ambient );
        material.setDiffuse( jsonObj.Diffuse );
        material.setEmission( jsonObj.Emission );
        material.setSpecular( jsonObj.Specular );
        material.setShininess( jsonObj.Shininess );
        return material;
    };


    osgWrapper.BlendFunc = function ( input, blend ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.SourceRGB && o.SourceAlpha && o.DestinationRGB && o.DestinationAlpha ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        osgWrapper.Object( input, blend );

        blend.setSourceRGB( jsonObj.SourceRGB );
        blend.setSourceAlpha( jsonObj.SourceAlpha );
        blend.setDestinationRGB( jsonObj.DestinationRGB );
        blend.setDestinationAlpha( jsonObj.DestinationAlpha );
        return blend;
    };

    osgWrapper.CullFace = function ( input, attr ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.Mode !== undefined ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        osgWrapper.Object( input, attr );
        attr.setMode( jsonObj.Mode );
        return attr;
    };

    osgWrapper.BlendColor = function ( input, attr ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.ConstantColor !== undefined ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        osgWrapper.Object( input, attr );
        attr.setConstantColor( jsonObj.ConstantColor );
        return attr;
    };

    osgWrapper.Light = function ( input, light ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.LightNum !== undefined &&
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
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        osgWrapper.Object( input, light );
        light.setAmbient( jsonObj.Ambient );
        light.setConstantAttenuation( jsonObj.ConstantAttenuation );
        light.setDiffuse( jsonObj.Diffuse );
        light.setDirection( jsonObj.Direction );
        light.setLightNumber( jsonObj.LightNum );
        light.setLinearAttenuation( jsonObj.LinearAttenuation );
        light.setPosition( jsonObj.Position );
        light.setQuadraticAttenuation( jsonObj.QuadraticAttenuation );
        light.setSpecular( jsonObj.Specular );
        light.setSpotCutoff( jsonObj.SpotCutoff );
        light.setSpotBlend( 0.01 );
        if ( jsonObj.SpotExponent !== undefined ) {
            light.setSpotBlend( jsonObj.SpotExponent / 128.0 );
        }
        return light;
    };

    osgWrapper.Texture = function ( input, texture ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/ ) {
            return true;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        osgWrapper.Object( input, texture );

        if ( jsonObj.MinFilter !== undefined ) {
            texture.setMinFilter( jsonObj.MinFilter );
        }
        if ( jsonObj.MagFilter !== undefined ) {
            texture.setMagFilter( jsonObj.MagFilter );
        }

        if ( jsonObj.WrapT !== undefined ) {
            texture.setWrapT( jsonObj.WrapT );
        }
        if ( jsonObj.WrapS !== undefined ) {
            texture.setWrapS( jsonObj.WrapS );
        }

        // no file return dummy texture
        var file = jsonObj.File;
        if ( file === undefined ) {
            file = 'no-image-provided';
        }

        var defer = Q.defer();
        Q.when( input.readImageURL( file ) ).then(
            function ( img ) {
                texture.setImage( img );
                defer.resolve( texture );
            } );
        return defer.promise;
    };

    osgWrapper.Projection = function ( input, node ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.Matrix !== undefined ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        var promise = osgWrapper.Node( input, node );

        if ( jsonObj.Matrix !== undefined ) {
            node.setMatrix( jsonObj.Matrix );
        }
        return promise;
    };

    osgWrapper.MatrixTransform = function ( input, node ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.Matrix ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        var promise = osgWrapper.Node( input, node );

        if ( jsonObj.Matrix !== undefined ) {
            node.setMatrix( jsonObj.Matrix );
        }
        return promise;
    };

    osgWrapper.LightSource = function ( input, node ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.Light !== undefined ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        var defer = Q.defer();
        var promise = osgWrapper.Node( input, node );
        Q.all( [ input.setJSON( jsonObj.Light ).readObject(), promise ] ).then( function ( args ) {
            var light = args[ 0 ];
            //var lightsource = args[ 1 ];
            node.setLight( light );
            defer.resolve( node );
        } );
        return defer.promise;
    };

    osgWrapper.Geometry = function ( input, node ) {
        var jsonObj = input.getJSON();
        var check = function ( o ) {
            if ( o.PrimitiveSetList !== undefined && o.VertexAttributeList !== undefined ) {
                return true;
            }
            return false;
        };
        if ( !check( jsonObj ) ) {
            return;
        }

        var arraysPromise = [];
        arraysPromise.push( osgWrapper.Node( input, node ) );

        var createPrimitive = function ( jsonPrimitive ) {
            var defer = Q.defer();
            arraysPromise.push( defer.promise );
            var promise = input.setJSON( jsonPrimitive ).readPrimitiveSet();
            Q.when( promise ).then( function ( primitiveSet ) {
                if ( primitiveSet !== undefined ) {
                    node.getPrimitives().push( primitiveSet );
                }
                defer.resolve( primitiveSet );
            } );
        };

        for ( var i = 0, l = jsonObj.PrimitiveSetList.length; i < l; i++ ) {
            var entry = jsonObj.PrimitiveSetList[ i ];
            createPrimitive( entry );
        }

        var createVertexAttribute = function ( name, jsonAttribute ) {
            var defer = Q.defer();
            arraysPromise.push( defer.promise );
            var promise = input.setJSON( jsonAttribute ).readBufferArray();
            Q.when( promise ).then( function ( buffer ) {
                if ( buffer !== undefined ) {
                    node.getVertexAttributeList()[ name ] = buffer;
                }
                defer.resolve( buffer );
            } );
        };
        for ( var key in jsonObj.VertexAttributeList ) {
            if ( jsonObj.VertexAttributeList.hasOwnProperty( key ) ) {
                createVertexAttribute( key, jsonObj.VertexAttributeList[ key ] );
            }
        }

        var defer = Q.defer();
        Q.all( arraysPromise ).then( function () {
            defer.resolve( node );
        } );
        return defer.promise;
    };

    return osgWrapper;
} );
