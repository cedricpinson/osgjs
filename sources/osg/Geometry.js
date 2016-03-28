'use strict';
var MACROUTILS = require( 'osg/Utils' );
var Node = require( 'osg/Node' );
var Notify = require( 'osg/Notify' );
var WebGLCaps = require( 'osg/WebGLCaps' );


/**
 * Geometry manage array and primitives to draw a geometry.
 * @class Geometry
 */
var Geometry = function () {

    Node.call( this );
    this.primitives = [];
    this.attributes = {};

    // function is generated for each Shader Program ID
    // which generates a a special "draw"
    // TODO: could be upon hash of combination of attributes
    // (as multiple shader Programs can use same combination of attributes)
    // if GPU supports VAO it's VAO object
    // if GPU doesn't it's a generated function
    this._cacheAttributeList = {};
    this._cacheVertexAttributeList = {};

    // null means the kdTree builder will skip the kdTree creation
    this._shape = undefined;

};

/** @lends Geometry.prototype */
Geometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Node.prototype, {
    releaseGLObjects: function () {
        if ( this.stateset !== undefined ) this.stateset.releaseGLObjects();
        var keys = window.Object.keys( this.attributes );
        var value;
        for ( var i = 0, l = keys.length; i < l; i++ ) {
            value = this.attributes[ keys[ i ] ];
            value.releaseGLObjects();
        }
        for ( var j = 0, h = this.primitives.length; j < h; j++ ) {
            var prim = this.primitives[ j ];
            if ( prim.getIndices !== undefined ) {
                if ( prim.getIndices() !== undefined && prim.getIndices() !== null ) {
                    prim.indices.releaseGLObjects();
                }
            }
        }
    },

    dirty: function () {
        this._cacheAttributeList = {};
    },
    getPrimitives: function () {
        return this.primitives;
    },
    getAttributes: function () {
        // Notify.warn('deprecated use instead getVertexAttributeList');
        return this.getVertexAttributeList();
    },
    getShape: function () {
        return this._shape;
    },
    setShape: function ( shape ) {
        this._shape = shape;
    },
    getVertexAttributeList: function () {
        return this.attributes;
    },
    getPrimitiveSetList: function () {
        return this.primitives;
    },

    drawCallVAO: function ( state, vao, listVA ) {

        var j, m;

        var gl = state.getGraphicContext();

        if ( state._currentVAO !== vao ) {

            this._extVAO.bindVertexArrayOES( vao );

            for ( j = 0, m = listVA.length; j < m; j++ ) {
                if ( listVA[ j ].isDirty() )
                    listVA[ j ].compile();
            }
        }

        var primitives = this.primitives;

        var p;

        // now primitives where just IB differs
        // TODO: find what's the usage of that thing of multiple IB?
        // cannot think of anything that makes sense
        // strip + primitives restart ? why no degenerate tri ?
        for ( j = 0, m = primitives.length; j < m; ++j ) {

            p = primitives[ j ];
            if ( p.getCount() === 0 ) continue;
            if ( p.getIndices ) {

                var ib = p.getIndices();

                // problem with cache on skfb (not osgjs)
                //state.setIndexArray( ib );
                //if ( ib !== state.currentIndexVBO ) {
                ib.bind( gl );
                if ( ib.isDirty() ) {
                    ib.compile( gl );
                }
                state.currentIndexVBO = ib;
                //}

                p.drawElements( state, gl );
            } else {
                p.draw( state, gl );
            }
        }

        //this._extVAO.bindVertexArrayOES( null );
        state._currentVAO = vao;
    },

    drawImplementationVAO: function ( state ) {

        var program = state.getLastProgramApplied();
        var prgID = program.getInstanceID();
        var vao = this._cacheAttributeList[ prgID ];

        // first call 
        if ( !vao ) {
            var attribute;

            var attributesCacheKeys = program._attributesCache.getKeys();
            var attributesCacheMap = program._attributesCache;
            var geometryVertexAttributes = this.getVertexAttributeList();


            var i, l, j, m, key, attr, primitives;

            var valid = false,
                attrBin;
            var gl = state.getGraphicContext();

            var listVA = [];

            state.lazyDisablingOfVertexAttributes();

            // check Buffer validity 
            for ( i = 0, l = attributesCacheKeys.length; i < l; i++ ) {

                key = attributesCacheKeys[ i ];
                attribute = attributesCacheMap[ key ];
                attr = geometryVertexAttributes[ key ];

                if ( attr === undefined ) {
                    continue;
                }

                attrBin = this.attributes[ key ];
                if ( attrBin.getBufferArray ) attrBin = attrBin.getBufferArray();

                // don't display the geometry if missing data
                if ( !attrBin.isValid() ) {

                    valid = false;
                    // TODO warning ? 
                    //this._cacheAttributeList[ prgID ] = null;
                    return;
                }

                if ( vao && attrBin.isDirty() ) {
                    attrBin.compile( gl );
                }

                listVA.push( attrBin );

                valid = true;
            }

            primitives = this.primitives;

            if ( valid ) {
                valid = false;
                for ( j = 0, m = primitives.length; j < m; ++j ) {
                    if ( primitives[ j ].getCount() !== 0 ) {
                        valid = true;
                        break;
                    }
                }
            }

            if ( !valid ) {
                // TODO warning ? 
                //this._cacheAttributeList[ prgID ] = null;
                return;
            }

            this._cacheVertexAttributeList[ prgID ] = listVA;

            state.applyDisablingOfVertexAttributes();
            vao = this._extVAO.createVertexArrayOES();

            // Start setting up VAO  
            this._extVAO.bindVertexArrayOES( vao );

            for ( i = 0, l = attributesCacheKeys.length; i < l; i++ ) {

                key = attributesCacheKeys[ i ];
                attribute = attributesCacheMap[ key ];
                attr = geometryVertexAttributes[ key ];

                if ( attr === undefined ) {
                    continue;
                }

                attrBin = this.attributes[ key ];
                if ( attrBin.getBufferArray ) attrBin = attrBin.getBufferArray();

                //  no caching.
                state.setVertexAttribArrayForce( attribute, attrBin, false, gl );

            }

            // Finished setting up VAO  
            this._extVAO.bindVertexArrayOES( null );

            /*develblock:start*/
            if ( !this._extVAO.isVertexArrayOES( vao ) ) {
                Notify.error( 'VAO broken' );
            }
            /*develblock:end*/

            this._cacheAttributeList[ prgID ] = vao;
        }

        this.drawCallVAO( state, vao, this._cacheVertexAttributeList[ prgID ] );
    },

    drawImplementationBasic: function ( state ) {
        var program = state.getLastProgramApplied();
        var prgID = program.getInstanceID();


        if ( this._cacheAttributeList[ prgID ] === undefined ) {

            var attribute;

            var attributesCacheKeys = program._attributesCache.getKeys();
            var attributesCacheMap = program._attributesCache;
            var geometryVertexAttributes = this.getVertexAttributeList();

            var i, l, j, m, key, attr, primitives;

            var generated = '//generated by Geometry::implementation\n';
            generated += 'state.lazyDisablingOfVertexAttributes();\n';
            generated += 'var attr;\n';

            for ( i = 0, l = attributesCacheKeys.length; i < l; i++ ) {
                key = attributesCacheKeys[ i ];
                attribute = attributesCacheMap[ key ];
                attr = geometryVertexAttributes[ key ];
                if ( attr === undefined ) {
                    continue;
                }

                // dont display the geometry if missing data
                generated += 'attr = this.attributes[\'' + key + '\'];\n';
                generated += 'if (attr.getBufferArray) attr = attr.getBufferArray();\n';
                generated += 'if (!attr.isValid()) return;\n';
                generated += 'state.setVertexAttribArray(' + attribute + ', attr, false);\n';
            }
            generated += 'state.applyDisablingOfVertexAttributes();\n';
            primitives = this.primitives;
            generated += 'var primitives = this.primitives;\n';
            for ( j = 0, m = primitives.length; j < m; ++j ) {
                generated += 'primitives[' + j + '].draw(state);\n';
            }

            /*jshint evil: true */
            this._cacheAttributeList[ prgID ] = new Function( 'state', generated );
            /*jshint evil: false */

        }

        this._cacheAttributeList[ prgID ].call( this, state );
    },

    drawImplementation: function () {
        // not a 'require' time closure function
        // because complex require circular dependencies
        this._extVAO = WebGLCaps.instance().getWebGLExtension( 'OES_vertex_array_object' );

        this.drawImplementation = this._extVAO ? this.drawImplementationVAO : this.drawImplementationBasic;
    },

    // for testing disabling drawing
    drawImplementationDummy: function ( state ) {
        /*jshint unused: true */
        // for testing only that's why the code is not removed
        var program = state.getLastProgramApplied();
        var attribute;
        var attributeList = [];
        var attributesCache = program._attributesCache;


        var primitives = this.primitives;
        //state.disableVertexAttribsExcept(attributeList);

        for ( var j = 0, m = primitives.length; j < m; ++j ) {
            //primitives[j].draw(state);
        }
        /*jshint unused: false */
    },

    setBound: function ( bb ) {
        this._boundingBox = bb;
        this._boundingBoxComputed = true;
    },

    computeBoundingBox: function ( boundingBox ) {

        var vertexArray = this.getVertexAttributeList().Vertex;
        if ( vertexArray && vertexArray.getElements() && vertexArray.getItemSize() > 2 ) {
            var vertexes = vertexArray.getElements();
            var itemSize = vertexArray.getItemSize();

            var min = boundingBox.getMin();
            var max = boundingBox.getMax();

            var minx = min[ 0 ];
            var miny = min[ 1 ];
            var minz = min[ 2 ];
            var maxx = max[ 0 ];
            var maxy = max[ 1 ];
            var maxz = max[ 2 ];

            // if the box is un-initialized min=Inf and max=-Inf
            // we can't simply write if(x > min) [...] else (x < max) [...]
            // most of the time the else condition is run so it's a kinda useless
            // optimization anyway
            for ( var idx = 0, l = vertexes.length; idx < l; idx += itemSize ) {
                var v1 = vertexes[ idx ];
                var v2 = vertexes[ idx + 1 ];
                var v3 = vertexes[ idx + 2 ];
                if ( v1 < minx ) minx = v1;
                if ( v1 > maxx ) maxx = v1;
                if ( v2 < miny ) miny = v2;
                if ( v2 > maxy ) maxy = v2;
                if ( v3 < minz ) minz = v3;
                if ( v3 > maxz ) maxz = v3;
            }

            min[ 0 ] = minx;
            min[ 1 ] = miny;
            min[ 2 ] = minz;
            max[ 0 ] = maxx;
            max[ 1 ] = maxy;
            max[ 2 ] = maxz;
        }
        return boundingBox;
    },

    computeBoundingSphere: function ( boundingSphere ) {
        boundingSphere.init();
        var bb = this.getBoundingBox();
        boundingSphere.expandByBoundingBox( bb );
        return boundingSphere;
    }


} ), 'osg', 'Geometry' );

Geometry.appendVertexAttributeToList = function ( from, to, postfix ) {

    var keys = window.Object.keys( from );
    var key, keyPostFix;

    for ( var i = 0, l = keys.length; i < l; i++ ) {

        key = keys[ i ];
        keyPostFix = key;
        if ( postfix !== undefined )
            keyPostFix += '_' + postfix;

        to[ keyPostFix ] = from[ key ];

    }

};


MACROUTILS.setTypeID( Geometry );

module.exports = Geometry;
