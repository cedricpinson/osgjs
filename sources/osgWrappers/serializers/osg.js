define( [
    'Q'
], function ( Q ) {

    'use strict';

    var osgWrapper = {};

    osgWrapper.Object = function ( input, obj ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/) {
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
    /* jshint newcap: false */
    osgWrapper.Node = function ( input, node ) {
        var jsonObj = input.getJSON();

        var check = function ( /*o*/) {
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
            Q.when( promise ).then( function ( obj ) {
                df.resolve( obj );
            } );
            return df.promise;
        };

        var queue = [];
        // For each url, create a function call and add it to the queue
        if ( jsonObj.Children ) {
            for ( var i = 0, k = jsonObj.Children.length; i < k; i++ ) {
                queue.push( createChildren( jsonObj.Children[ i ] ) );
            }
        }
        // Resolve first updateCallbacks and stateset.
        var deferred = Q.defer();
        Q.all( promiseArray ).then( function () {
            deferred.resolve();
        } );

        var defer = Q.defer();
        // Need to wait until the stateset and the all the callbacks are resolved
        Q( deferred.promise ).then( function () {
            Q.all( queue ).then( function () {
                // All the results from Q.all are on the argument as an array
                // Now insert children in the right order
                for ( var i = 0; i < queue.length; i++ )
                    node.addChild( queue[ i ] );
                defer.resolve( node );
            } );
        } );
        return defer.promise;
    };

    osgWrapper.StateSet = function ( input, stateSet ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/) {
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
                    stateSet.setAttributeAndModes( attribute );
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
                    stateSet.setTextureAttributeAndModes( unit, attribute );
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
        var check = function ( /*o*/) {
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
            return o.VertexAttributeList !== undefined;
        };
        if ( !check( jsonObj ) ) {
            return;
        }
        jsonObj.PrimitiveSetList = jsonObj.PrimitiveSetList || [];

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

    osgWrapper.PagedLOD = function ( input, plod ) {
        var jsonObj = input.getJSON();
        var check = function ( /*o*/) {
            return true;
        };
        if ( !check( jsonObj ) ) {
            return undefined;
        }

        osgWrapper.Object( input, plod );
        // Parse center Mode
        if ( jsonObj.CenterMode === 'USE_BOUNDING_SPHERE_CENTER' )
            plod.setCenterMode( 0 );
        else if ( jsonObj.CenterMode === 'UNION_OF_BOUNDING_SPHERE_AND_USER_DEFINED' )
            plod.setCenterMode( 2 );

        // Parse center and radius
        plod.setCenter( [ jsonObj.UserCenter[ 0 ], jsonObj.UserCenter[ 1 ], jsonObj.UserCenter[ 2 ] ] );
        plod.setRadius( jsonObj.UserCenter[ 3 ] );

        // Parse RangeMode
        if ( jsonObj.RangeMode === 'PIXEL_SIZE_ON_SCREEN' )
            plod.setRangeMode( 1 );

        var str;

        // Parse Ranges
        var o = jsonObj.RangeList;

        for ( var i = 0; i < Object.keys( o ).length; i++ ) {
            str = 'Range ' + i;
            var v = o[ str ];
            plod.setRange( i, v[ 0 ], v[ 1 ] );
        }
        // Parse Files
        o = jsonObj.RangeDataList;
        for ( i = 0; i < Object.keys( o ).length; i++ ) {
            str = 'File ' + i;
            plod.setFileName( i, o[ str ] );
        }

        var createChildren = function ( jsonChildren ) {
            var promise = input.setJSON( jsonChildren ).readObject();
            var df = Q.defer();
            Q.when( promise ).then( function ( obj ) {
                df.resolve( obj );
            } );
            return df.promise;
        };

        var queue = [];
        // For each url, create a function call and add it to the queue
        if ( jsonObj.Children ) {
            for ( var j = 0, k = jsonObj.Children.length; j < k; j++ ) {
                queue.push( createChildren( jsonObj.Children[ j ] ) );
            }
        }

        var defer = Q.defer();
        Q.all( queue ).then( function () {
            // All the results from Q.all are on the argument as an array
            for ( i = 0; i < queue.length; i++ )
                plod.addChildNode( queue[ i ] );
            defer.resolve( plod );
        } );

        return defer.promise;
    };
    return osgWrapper;
} );
