define( [
    'osg/Utils',
    'osg/Vec3',
    'osg/Node',
    'osg/BoundingBox',
    'osg/Geometry',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osg/Uniform',
    'osg/BufferArray'
], function ( MACROUTILS, Vec3, Node, BoundingBox, Geometry, NodeVisitor, Notify, Matrix, Uniform, BufferArray ) {

    'use strict';


    /**
     *   BoneMapVisitor
     *   @class BoneMapVisitor
     */
    var BoneMapVisitor = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
        this._boneMap = {};
    };
    BoneMapVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( node.className && node.className() === 'Bone' ) {
                this._boneMap[ node.getName() ] = node;
            }
            this.traverse( node );
        },
        getBoneMap: function () {
            return this._boneMap;
        }
    } );

    /**
     *   UniformMatrixPalette
     *   @class UniformMatrixPalette
     *
     *   Uniform array to store matrix. Matrix are stored with 3 vec4 so no scale are available in bone transform.
     */
    var UniformMatrixPalette = function () {
        this._unformPalette = undefined;
        this._bonePerVertex = undefined;
        this._palette = undefined;
        this._vertexIndexMatrixWeightList = undefined;
        this._boneWeightAttribArrays = undefined;
    };
    UniformMatrixPalette.prototype = {
        createVertexUniform: function () {
            var nbMatrix = this._palette.length;
            var matrix = new Float32Array( nbMatrix * 12 );
            for ( var i = 0; i < nbMatrix; i++ ) {
                var id = i * 12;
                matrix[ id ] = matrix[ id + 5 ] = matrix[ id + 10 ] = 1.0;
            }
            return Uniform.createFloat4Array( matrix, 'uBones' );
        },
        // setUniformPalette: function ( stateSet ) {
        //     if ( this._ubonesUniform && stateSet )
        //         stateSet.addUniform( ubonesUniform );
        // },

        createVertexAttribList: ( function () {
            var compare = function ( a, b ) {
                return b.weight - a.weight;
            };

            return function () {
                var VertexIndexMatrixWeightList = this._vertexIndexMatrixWeightList;
                var keys = Object.keys( VertexIndexMatrixWeightList );
                var nbVerts = keys.length;
                var attributeBone = new Uint8Array( nbVerts * 4 );
                var attributeWeight = new Float32Array( nbVerts * 4 );

                for ( var i = 0; i < nbVerts; i++ ) {
                    var key = keys[ i ];
                    var bones = VertexIndexMatrixWeightList[ key ]; //take all bones

                    bones.sort( compare ); //sort it

                    // keep stronger bones
                    var sum = 0;
                    var j = 0;
                    for ( j = 0; j < 4 && bones[ j ]; j++ ) {
                        sum += bones[ j ].weight;
                    }
                    var mult = 1.0 / sum;
                    for ( var k = 0; k < j; k++ ) {
                        var id = i * 4 + k;
                        var bone = bones[ k ];
                        attributeBone[ id ] = bone.index;
                        attributeWeight[ id ] = bone.weight * mult;
                    }
                }

                return {
                    Bone: new BufferArray( BufferArray.ARRAY_BUFFER, attributeBone, 4 ),
                    Weight: new BufferArray( BufferArray.ARRAY_BUFFER, attributeWeight, 4 )
                };
            };

        } )(),
        createPalette: function ( boneMap, vertexIndexToBoneWeightMap ) {

            var maxBonePerVertex = 0;
            var boneNameCountMap = {};
            var vertexIndexWeigth = {};
            var bname2Palette = {};
            var palette = [];

            var indexWeigth = function ( _index, _weight ) {
                var entry = {
                    index: _index,
                    weight: _weight
                };
                return entry;
            };

            for ( var i = 0, l = vertexIndexToBoneWeightMap.length; i < l; i++ ) {

                var vertexIndex = i;
                var boneForThisVertex = 0;
                var boneWeightList = vertexIndexToBoneWeightMap[ i ];

                for ( var j = 0, k = boneWeightList.length; j < k; j++ ) {
                    var bw = boneWeightList[ j ];

                    if ( boneNameCountMap[ bw.name ] !== undefined ) {
                        boneNameCountMap[ bw.name ] ++;
                        boneForThisVertex++;
                        if ( !vertexIndexWeigth[ vertexIndex ] ) vertexIndexWeigth[ vertexIndex ] = [];
                        vertexIndexWeigth[ vertexIndex ].push( indexWeigth( bname2Palette[ bw.name ], bw.weight ) );
                    } else if ( bw.weight > 1e-2 ) {
                        if ( boneMap[ bw.name ] === undefined ) {
                            Notify.info( 'RigTransformHardware.createPalette can t find bone ' + bw.name + ' skip this influence' );
                            continue;
                        }

                        boneNameCountMap[ bw.name ] = 1;
                        boneForThisVertex++;
                        palette.push( boneMap[ bw.name ] );
                        bname2Palette[ bw.name ] = palette.length - 1;
                        if ( !vertexIndexWeigth[ vertexIndex ] ) vertexIndexWeigth[ vertexIndex ] = [];
                        vertexIndexWeigth[ vertexIndex ].push( indexWeigth( bname2Palette[ bw.name ], bw.weight ) );
                    } else {
                        //Notify.warn( 'RigTransformHardware.createPalette Bone ' + bw.name + ' has a weight ' + bw.weight + ' for vertex ' + vertexIndex + ' this bone will not be in the palette' );
                    }

                }
                maxBonePerVertex = Math.max( maxBonePerVertex, boneForThisVertex );
            }
            Notify.info( 'RigTransformHardware.createPalette maximum number of bone per vertex is ' + maxBonePerVertex );
            Notify.info( 'RigTransformHardware.createPalette matrix palette has ' + boneNameCountMap.length + ' entries' );

            var keys = Object.keys( boneNameCountMap );
            for ( var p = 0, q = keys.length; p < q; p++ ) {
                var boneName = keys[ p ];
                var count = boneNameCountMap[ boneName ];

                Notify.info( 'RigTransformHardware::createPalette Bone ' + boneName + ' is used ' + count + ' times' );
            }

            this._bonePerVertex = maxBonePerVertex;
            this._palette = palette;
            this._vertexIndexMatrixWeightList = vertexIndexWeigth;
            this._unformPalette = this.createVertexUniform();
            this._boneWeightAttribArrays = this.createVertexAttribList();
            return true;
        },
        setElement: function ( index, matrix ) {
            if ( this._unformPalette ) {
                var uniformData = this._unformPalette.get();
                var mat = [ matrix[ 0 ], matrix[ 4 ], matrix[ 8 ], matrix[ 12 ],
                    matrix[ 1 ], matrix[ 5 ], matrix[ 9 ], matrix[ 13 ],
                    matrix[ 2 ], matrix[ 6 ], matrix[ 10 ], matrix[ 14 ]
                ];

                for ( var i = index * 12, l = ( index + 1 ) * 12, matI = 0; i < l; i++, matI++ ) {
                    uniformData[ i ] = mat[ matI ];
                }
                this._unformPalette.set( uniformData );
                return true;
            }
            console.log( 'UniformMatrixPalette.setElement() : Enable to set element ' + index );
            return false;
        }
    };

    /**
     *   VertexInfluenceSet
     *   @class VertexInfluenceSet
     */
    var VertexInfluenceSet = function () {
        this._bone2Vertexes = [];
        this._vertex2Bones = [];
    };

    VertexInfluenceSet.prototype = {
        addVertexInfluence: function ( v ) {
            this._bone2Vertexes.push( v );
        },
        buildVertex2BoneList: function () {
            this._vertex2Bones.length = 0; //clear();

            // Build _vertex2Bones

            var i, j, l, m;

            for ( i = 0, l = this._bone2Vertexes.length; i < l; i++ ) {
                var vi = this._bone2Vertexes[ i ];
                var viw = vi._map;


                var keys = Object.keys( viw );
                for ( j = 0, m = keys.length; j < m; j++ ) {
                    var index = keys[ j ];
                    var weight = viw[ index ];

                    var bw = {
                        name: vi._name,
                        weight: weight
                    };
                    if ( !this._vertex2Bones[ index ] )
                        this._vertex2Bones[ index ] = [];
                    this._vertex2Bones[ index ].push( bw );
                }
            }

            // normalize weight per vertex
            for ( i = 0, l = this._vertex2Bones.length; i < l; i++ ) {
                var bones = this._vertex2Bones[ i ];

                var sum = 0;
                for ( j = 0, m = bones.length; j < m; j++ ) {
                    var bone = bones[ j ];
                    sum += bone.weight;
                }

                if ( sum < 1e-4 ) {
                    Notify.warn( 'VertexInfluenceSet.buildVertex2BoneList warning the vertex ' + bones[ i ].name + ' seems to have 0 weight, skip normalize for this vertex' );
                } else {
                    var mult = 1.0 / sum;

                    for ( var k = 0, n = bones.length; k < n; k++ )
                        bones[ k ].weight = bones[ k ].weight * mult;
                }
            }
        },
        getVertexToBoneList: function () {
            return this._vertex2Bones;
        },
        clear: function () {
            this._bone2Vertexes = [];
            this._vertex2Bones = [];
        }
    };

    /**
     * RigTransformHardware
     * @class RigTransformHardware
     *
     *   Hardware implementation for rigGeometry
     *
     */
    var RigTransformHardware = function () {
        this._needInit = true;
        this._bonesPerVertex = 0;
        this._nbVertexes = 0;

        this._bonePalette = undefined;
        this._matrixPalette = undefined;
    };

    RigTransformHardware.prototype = {
        init: function ( geom ) {
            var Vertex = geom.getAttributes().Vertex;

            if ( !Vertex ) {
                Notify.warn( 'RigTransformHardware no vertex array in the geometry ' + geom.getName() );
                return false;
            }

            if ( !geom.getSkeleton() ) {
                Notify.warn( 'RigTransformHardware no skeleton set in geometry ' + geom.getName() );
                return false;
            }

            var mapVisitor = new BoneMapVisitor();
            geom.getSkeleton().accept( mapVisitor );
            var bm = mapVisitor.getBoneMap();

            if ( this._matrixPalette === undefined ) {
                this._matrixPalette = new UniformMatrixPalette();
            }
            if ( !this._matrixPalette.createPalette( bm, geom.getVertexInfluenceSet().getVertexToBoneList() ) ) {
                return false;
            }

            //Shader setUP

            geom.getOrCreateStateSet().addUniform( this._matrixPalette._unformPalette );

            for ( var attr in this._matrixPalette._boneWeightAttribArrays ) {
                geom.getAttributes()[ attr ] = this._matrixPalette._boneWeightAttribArrays[ attr ];
            }

            this._needInit = false;
            return true;
        },
        computeMatrixPalette: function ( transformFromSkeletonToGeometry, invTransformFromSkeletonToGeometry ) {
            var palette = this._matrixPalette._palette;
            for ( var i = 0, l = palette.length; i < l; i++ ) {
                var bone = palette[ i ];

                var invBindMatrix = bone.getInvBindMatrixInSkeletonSpace();
                var boneMatrix = bone.getMatrixInSkeletonSpace();
                var resultBoneMatrix = Matrix.create();
                var result = Matrix.create();

                Matrix.mult( boneMatrix, invBindMatrix, resultBoneMatrix );
                Matrix.mult( invTransformFromSkeletonToGeometry, resultBoneMatrix, result );
                Matrix.preMult( result, transformFromSkeletonToGeometry );

                this._matrixPalette.setElement( i, result );
            }
        },
        update: function ( geom ) {
            if ( this._needInit )
                if ( !this.init( geom ) )
                    return;
            this.computeMatrixPalette( geom.getMatrixFromSkeletonToGeometry(), geom.getInvMatrixFromSkeletonToGeometry() );
        },
    };


    /**
     * FindNearestParentSkeleton
     * @class FindNearestParentSkeleton
     */

    /*
       struct FindNearestParentSkeleton : public osg::NodeVisitor
       {
           osg::ref_ptr<Skeleton> _root;
           FindNearestParentSkeleton() : osg::NodeVisitor(osg::NodeVisitor::TRAVERSE_PARENTS) {}
           void apply(osg::Transform& node)
           {
               if (_root.valid())
                   return;
               _root = dynamic_cast<osgAnimation::Skeleton*>(&node);
               traverse(node);
           }
       };
    */

    var FindNearestParentSkeleton = function () {
        NodeVisitor.call( this, NodeVisitor.TRAVERSE_PARENTS );
        this._root = undefined;
    };
    FindNearestParentSkeleton.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
        apply: function ( node ) {
            if ( this._root )
                return;
            if ( node.className && node.className() === 'Skeleton' )
                this._root = node;

            this.traverse( node );
        }
    } );

    /**
     * UpdateRigGeometry
     * @class UpdateRigGeometry
     */
    var UpdateRigGeometry = function () {};

    /* virtual void update(osg::NodeVisitor*, osg::Drawable* drw) {
            RigGeometry* geom = dynamic_cast<RigGeometry*>(drw);
            if(!geom)
                return;
            if(!geom->getSkeleton() && !geom->getParents().empty())
            {
                RigGeometry::FindNearestParentSkeleton finder;
                if(geom->getParents().size() > 1)
                    osg::notify(osg::WARN) << "A RigGeometry should not have multi parent ( " << geom->getName() << " )" << std::endl;
                geom->getParents()[0]->accept(finder);

                if(!finder._root.valid())
                {
                    osg::notify(osg::WARN) << "A RigGeometry did not find a parent skeleton for RigGeometry ( " << geom->getName() << " )" << std::endl;
                    return;
                }
                geom->buildVertexInfluenceSet();
                geom->setSkeleton(finder._root.get());
            }

            if(!geom->getSkeleton())
                return;

            if(geom->getNeedToComputeMatrix())
                geom->computeMatrixFromRootSkeleton();

            geom->update();
        }*/

    UpdateRigGeometry.prototype = MACROUTILS.objectInherit( Object.prototype, {
        update: function ( node /*, nv*/ ) {
            var geom = node;
            if ( !( geom.className && geom.className() === 'RigGeometry' ) )
                return;

            if ( !geom.getSkeleton() && geom.getParents() !== [] ) {
                var finder = new FindNearestParentSkeleton();
                if ( geom.getParents().length > 1 )
                    Notify.warn( 'A RigGeometry should not have multi parent ( ' + geom.getName() + ' )' );

                geom.getParents()[ 0 ].accept( finder );

                if ( !finder._root ) {
                    Notify.warn( 'A RigGeometry did not find a parent skeleton for RigGeometry ( ' + geom.getName() + ' )' );
                    return;
                }
                geom.buildVertexInfluenceSet();
                geom.setSkeleton( finder._root );
            }

            if ( !geom.getSkeleton() )
                return;

            if ( geom.getNeedToComputeMatrix() )
                geom.computeMatrixFromRootSkeleton();

            geom.update();

            return true;
        }
    } );


    /**
     * RigGeometry
     * @class RigGeometry
     */
    var RigGeometry = function () {
        Geometry.call( this );
        this.setUpdateCallback( new UpdateRigGeometry() );

        this._geometry = undefined;
        this._vertexInfluenceMap = undefined;
        this._vertexInfluenceSet = new VertexInfluenceSet();
        this._root = undefined;

        this._matrixFromSkeletonToGeometry = Matrix.create();
        this._invMatrixFromSkeletonToGeometry = Matrix.create();

        this._rigTransformImplementation = undefined;

        this._needToComputeMatrix = true;

        this._boneMap = []; // Delme
        this._mapResBone = {}; // Delme
    };

    RigGeometry.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( Geometry.prototype, {
        setInfluenceMap: function ( influenceMap ) {
            this._vertexInfluenceMap = influenceMap;
        },
        getInfluenceMap: function () {
            return this._vertexInfluenceMap;
        },
        getSkeleton: function () {
            return this._root;
        },
        setSkeleton: function ( root ) {
            this._root = root;
        },
        setNeedToComputeMatrix: function ( needToComputeMatrix ) {
            this._needToComputeMatrix = needToComputeMatrix;
        },
        getNeedToComputeMatrix: function () {
            return this._needToComputeMatrix;
        },
        buildVertexInfluenceSet: function () {
            if ( !this._vertexInfluenceMap ) {
                Notify.warn( 'buildVertexInfluenceSet can t be called without VertexInfluence already set to the RigGeometry (' + this.getName() + ' ) ' );
            }
            this._vertexInfluenceSet.clear();

            var keys = Object.keys( this._vertexInfluenceMap );
            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                var value = this._vertexInfluenceMap[ key ];

                var input = {};
                input._map = value;
                input._name = key;

                this._vertexInfluenceSet.addVertexInfluence( input );
            }
            this._vertexInfluenceSet.buildVertex2BoneList();
        },
        getVertexInfluenceSet: function () {
            return this._vertexInfluenceSet;
        },

        /*
        void RigGeometry::computeMatrixFromRootSkeleton()
        {
            if (!_root.valid())
            {
                OSG_WARN << "Warning " << className() <<"::computeMatrixFromRootSkeleton if you have this message it means you miss to call buildTransformer(Skeleton* root), or your RigGeometry (" << getName() <<") is not attached to a Skeleton subgraph" << std::endl;
                return;
            }
            osg::MatrixList mtxList = getParent(0)->getWorldMatrices(_root.get());
            osg::Matrix notRoot = _root->getMatrix();
            _matrixFromSkeletonToGeometry = mtxList[0] * osg::Matrix::inverse(notRoot);
            _invMatrixFromSkeletonToGeometry = osg::Matrix::inverse(_matrixFromSkeletonToGeometry);
            _needToComputeMatrix = false;
        }
        */

        computeMatrixFromRootSkeleton: function () {
            if ( !this._root ) {
                Notify.warn( 'Warning ' + this.className() + '.computeMatrixFromRootSkeleton if you have this message it means you miss to call buildTransformer( root ), or your RigGeometry (' + this.getName() + ') is not attached to a Skeleton subgraph' );
                return;
            }

            var mtxList = this.getParents()[ 0 ].getWorldMatrices( this._root );
            var invNotRoot = Matrix.create();

            Matrix.inverse( this._root.getMatrix(), invNotRoot );
            Matrix.mult( invNotRoot, mtxList[ 0 ], this._matrixFromSkeletonToGeometry );
            Matrix.inverse( this._matrixFromSkeletonToGeometry, this._invMatrixFromSkeletonToGeometry );

            this._needToComputeMatrix = false;
        },
        getMatrixFromSkeletonToGeometry: function () {
            return this._matrixFromSkeletonToGeometry;
        },
        getInvMatrixFromSkeletonToGeometry: function () {
            return this._invMatrixFromSkeletonToGeometry;
        },
        getOrCreateSourceGeometry: function () {
            if ( this._geometry === undefined ) {
                this._geometry = new Geometry();
            }
            return this._geometry;
        },
        setSourceGeometry: function ( geometry ) {
            this._geometry = geometry;
        },
        getRigTransformImplementation: function () {
            return this._rigTransformImplementation;
        },
        setRigTransformImplementation: function ( implementation ) {
            this._rigTransformImplementation = implementation;
        },
        /* delme  */
        initBoneMap: function () {

            var IndexBoneVisitor = function ( boneMap, boneList ) {
                NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._boneMap = boneMap;
                this._boneList = boneList;
            };
            IndexBoneVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
                init: function () {},
                apply: function ( node ) {
                    if ( node.className() === 'Bone' ) {
                        for ( var i = 0, l = this._boneList.length; i < l; i++ ) {
                            var boneName = this._boneList[ i ];
                            if ( boneName === node.getName() ) {
                                this._boneMap.push( node );
                                break;
                            }
                        }
                    }
                    this.traverse( node );
                }
            } );

            var indexBoneVisitor = new IndexBoneVisitor( this._boneMap, Object.keys( this._vertexInfluenceMap ) );
            this._root.accept( indexBoneVisitor );
        },
        /*
        for (int i = 0; i < (int)_bonePalette.size(); i++)
        {
            osg::ref_ptr<Bone> bone = _bonePalette[i].get();
            const osg::Matrix& invBindMatrix = bone->getInvBindMatrixInSkeletonSpace();
            const osg::Matrix& boneMatrix = bone->getMatrixInSkeletonSpace();
            osg::Matrix resultBoneMatrix = invBindMatrix * boneMatrix;
            osg::Matrix result =  transformFromSkeletonToGeometry * resultBoneMatrix * invTransformFromSkeletonToGeometry;
            if (!_uniformMatrixPalette->setElement(i, result))
                OSG_WARN << "RigTransformHardware::computeUniformMatrixPalette can't set uniform at " << i << " elements" << std::endl;
        }
        */
        update: function () {

            if ( !this.getRigTransformImplementation() ) {
                this.setRigTransformImplementation( new RigTransformHardware() );
            }

            this._rigTransformImplementation.update( this );

            // if ( this._boneMap.length === 0 )
            //     this.initBoneMap();

            // var bones = this._boneMap;
            // for ( var i = 0, l = bones.length; i < l; i++ ) {
            //     var bone = bones[ i ];

            //     var invBindMatrix = bone.getInvBindMatrixInSkeletonSpace();
            //     var boneMatrix = bone.getMatrixInSkeletonSpace();
            //     var resultBoneMatrix = Matrix.create();

            //     //console.log( bone.getName() + '   ' + bone.getMatrixInSkeletonSpace() );
            //     Matrix.mult( boneMatrix, invBindMatrix, resultBoneMatrix );
            //     //console.log( bone.getName() + '   ' + resultBoneMatrix );

            //     var result = Matrix.create();
            //     Matrix.mult( this.getInvMatrixFromSkeletonToGeometry(), resultBoneMatrix, result );
            //     Matrix.preMult( result, this.getMatrixFromSkeletonToGeometry() );

            //     //this._mapResBone[ bone._index ] = Matrix.makeRotate( -Math.PI, 0, 0, 1, result );
            //     this._mapResBone[ bone._index ] = result;
            // }

        }
    } ), 'osgAnimation', 'RigGeometry' );

    MACROUTILS.setTypeID( RigGeometry );

    return RigGeometry;
} );
