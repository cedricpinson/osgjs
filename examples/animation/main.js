'use strict';

var Q = window.Q;
var OSG = window.OSG;
var osg = OSG.osg;
var osgAnimation = OSG.osgAnimation;
// var osgUtil = OSG.osgUtil;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;


function getShader( maxMatrix ) {
    var vertexshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'attribute vec3 Vertex;',
        'attribute vec3 Normal;',
        'attribute vec4 Bone;',
        'attribute vec4 Weight;',

        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'uniform mat4 NormalMatrix;',
        'uniform vec4 uBones[' + ( maxMatrix * 3 ) + '];',

        'varying vec3 vNormal;',

        'vec4 position;',

        'mat4 getMatrix( int index ) {',
        '            vec4 l1 = uBones[ index * 3 ];',
        '            vec4 l2 = uBones[ index * 3 + 1 ];',
        '            vec4 l3 = uBones[ index * 3 + 2 ];',
        '',
        '            mat4 myMat;',
        '',
        '            myMat[ 0 ][ 0 ] = l1[ 0 ];',
        '            myMat[ 0 ][ 1 ] = l2[ 0 ];',
        '            myMat[ 0 ][ 2 ] = l3[ 0 ];',
        '            myMat[ 0 ][ 3 ] = 0.;',
        '',
        '            myMat[ 1 ][ 0 ] = l1[ 1 ];',
        '            myMat[ 1 ][ 1 ] = l2[ 1 ];',
        '            myMat[ 1 ][ 2 ] = l3[ 1 ];',
        '            myMat[ 1 ][ 3 ] = 0.;',
        '',
        '            myMat[ 2 ][ 0 ] = l1[ 2 ];',
        '            myMat[ 2 ][ 1 ] = l2[ 2 ];',
        '            myMat[ 2 ][ 2 ] = l3[ 2 ];',
        '            myMat[ 2 ][ 3 ] = 0.;',
        '',
        '            myMat[ 3 ][ 0 ] = l1[ 3 ];',
        '            myMat[ 3 ][ 1 ] = l2[ 3 ];',
        '            myMat[ 3 ][ 2 ] = l3[ 3 ];',
        '            myMat[ 3 ][ 3 ] = 1.;',
        '',
        '            return myMat;',
        '}',

        'void computeAcummulatedPosition( int matrixIndex, float matrixWeight ) {',
        'mat4 matrix = getMatrix( matrixIndex );',
        '   position += matrixWeight * ( matrix * vec4( Vertex, 1.0 ) );',
        '}',

        'void main(void) {',

        'position = vec4( 0.0, 0.0, 0.0, 0.0 );',
        '',
        'if ( Weight.x != 0.0 )',
        'computeAcummulatedPosition( int( Bone.x ), Weight.x );',
        'if ( Weight.y != 0.0 )',
        'computeAcummulatedPosition( int( Bone.y ), Weight.y );',
        'if ( Weight.z != 0.0 )',
        'computeAcummulatedPosition( int( Bone.z ), Weight.z );',
        'if ( Weight.w != 0.0 )',
        'computeAcummulatedPosition( int( Bone.w ), Weight.w );',

        // 'if ( Bone.x == -1.0 &&  Bone.y == -1.0 &&  Bone.z == -1.0 &&  Bone.w == -1.0 ) ',
        // 'position = vec4( Vertex, 1.0 );',

        'vNormal = (ModelViewMatrix * vec4(Normal, 0.0)).xyz;',
        'gl_Position = ProjectionMatrix * ModelViewMatrix * position;',
        '}'
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',

        'varying vec3 vNormal;',

        'void main(void) {',
        '  gl_FragColor = vec4(normalize(vNormal) * .5 + .5, 1.0);',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

    return program;
}

var FindBoneVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._bones = [];
};
FindBoneVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {},
    apply: function ( node ) {

        if ( node.className() === 'Bone' ) {
            this._bones.push( node );
        }
        this.traverse( node );
    },
    getBones: function () {
        return this._bones;
    },
    getBone: function ( name ) {
        var bones = this.getBones();
        for ( var i = 0, l = bones.length; i < l; i++ ) {
            var bone = bones[ i ];
            if ( bone.getName() === name ) {
                return bone;
            }
        }
        return undefined;
    }
} );

/*
    FindAnimationManagerVisitor
*/
var FindAnimationManagerVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._cb = undefined;
};
FindAnimationManagerVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {
        this.found = [];
    },
    apply: function ( node ) {
        var cbs = node.getUpdateCallbackList();
        for ( var i = 0, l = cbs.length; i < l; i++ ) {
            if ( cbs[ 0 ] instanceof osgAnimation.BasicAnimationManager ) {
                this._cb = cbs[ 0 ];
                return;
            }
        }
        this.traverse( node );
    }
} );


/*
    FindRigGeometryVisitor
*/
var FindRigGeometryVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._rig = [];
};
FindRigGeometryVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    apply: function ( node ) {
        if ( node.className && node.className() === 'RigGeometry' ) {
            this._rig.push( node );
        }
        this.traverse( node );
    }
} );

/*
    Index Bone visitor
*/
var IndexBoneVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._cpt = 0;
    this._mapIndexBone = {};
};
IndexBoneVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {},
    apply: function ( node ) {
        if ( node.className() === 'Bone' ) {
            node._index = this._cpt;
            this._mapIndexBone[ node.getName() ] = this._cpt;
            this._cpt++;
        }
        this.traverse( node );
    },
    getBoneCount: function () {
        return this._cpt;
    },
    getBoneMap: function () {
        return this._mapIndexBone;
    }
} );


/*
    Index / Weigth Vertex Attribute Visitor
*/
var IndexWeightVertexAttributeVisitor = function () {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._boneMap = {};
};
IndexWeightVertexAttributeVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {},
    apply: function ( node ) {
        if ( node.className() === 'RigGeometry' ) {
            var Vertex = node.getAttributes()[ 'Vertex' ]._elements;
            var AttributeBone = [];
            var AttributeWeigth = [];

            //For each Vertex
            for ( var i = 0, l = Vertex.length / 3; i < l; i++ ) {
                var influenceMap = node.getInfluenceMap();
                var keys = Object.keys( influenceMap );

                var bone = [];
                var weight = [];

                //For each influence Map
                for ( var j = 0, m = keys.length; j < m; j++ ) {
                    var key = keys[ j ];
                    var map = influenceMap[ key ];

                    var mapi = map[ i ]; //Weight
                    if ( mapi !== undefined ) {
                        bone.push( this._boneMap[ key ] ); // Bone index
                        weight.push( mapi );
                    }
                }

                // if ( bone.length > 4 ) {
                //     console.log( 'Warning : More than 4 influence on vertex ' + i + 'for ' + node.getName() + 'Vertex influence Num' + bone.length );
                // }

                // if ( bone[ 0 ] === undefined )
                //     console.log( 'No Vertex influence on Vetex ' + i );

                for ( var k = 0; k < 4; k++ ) {
                    AttributeBone.push( ( bone[ k ] !== undefined ) ? bone[ k ] : -1.0 );
                    AttributeWeigth.push( ( weight[ k ] !== undefined ) ? weight[ k ] : 0.0 );
                }
            }

            node.getAttributes()[ 'Bone' ] = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, AttributeBone, 4 );
            node.getAttributes()[ 'Weight' ] = new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, AttributeWeigth, 4 );
        }

        this.traverse( node );
    },
    setBoneMap: function ( boneMap ) {
        this._boneMap = boneMap;
    }
} );

/*
    Bone Anim updateCallback
*/
var UpdateBoneAnim = function ( uniformBoneMatrix ) {
    this._uniformBoneMatrix = uniformBoneMatrix;
};

UpdateBoneAnim.prototype = osg.objectInherit( Object.prototype, {
    update: function ( node, nv ) {
        if ( nv.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
            //osg::Matrix matrix =  transform * uniq.getMatrix() * invTransform;
            var map = node._mapResBone;
            //console.log( map );
            var keys = Object.keys( map );

            for ( var i = 0, l = keys.length; i < l; i++ ) {
                var key = keys[ i ];
                this.setMatrix( parseInt( key ), map[ key ] );
            }

            //this.setMatrix( node._index, res );
        }
        //nv.traverse( node );
        return true;
    },
    setMatrix: function ( index, matrix ) {
        //console.log(index);
        var uniformData = this._uniformBoneMatrix.get();
        var mat = [ matrix[ 0 ], matrix[ 4 ], matrix[ 8 ], matrix[ 12 ],
            matrix[ 1 ], matrix[ 5 ], matrix[ 9 ], matrix[ 13 ],
            matrix[ 2 ], matrix[ 6 ], matrix[ 10 ], matrix[ 14 ]
        ];

        for ( var i = index * 12, l = ( index + 1 ) * 12, matI = 0; i < l; i++, matI++ ) {
            uniformData[ i ] = mat[ matI ];
        }
        this._uniformBoneMatrix.set( uniformData );
    }
} );

/*
    Find bones Visitor

/*
    Bone Anim Visitor
*/
// var BoneAnimVisitor = function ( callBack ) {
//     osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
//     this._callBack = callBack;
// };
// BoneAnimVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
//     init: function () {},
//     apply: function ( node ) {
//         if ( node.className() === 'Bone' ) {
//             //console.log(node._index);
//             node.addUpdateCallback( this._callBack );
//         }
//         this.traverse( node );
//     }
// } );

var BoneAnimVisitor = function ( callBack ) {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._callBack = callBack;
};
BoneAnimVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {},
    apply: function ( node ) {
        if ( node.className() === 'RigGeometry' ) {
            //console.log(node._index);
            node.addUpdateCallback( this._callBack );
        }
        this.traverse( node );
    }
} );

var createScene = function ( viewer ) {

    var root = new osg.MatrixTransform();
    osg.Matrix.makeRotate( Math.PI * 0.5, 1, 0, 0, root.getMatrix() );

    //var request = osgDB.readNodeURL( '../media/models/animation-test/brindherbetrs.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/brindherbe.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/brindherbe2.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/mixamo beta front_twist_flip.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/mixamo horse gallop.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/mixamo wizard magic_attack_05.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/brin_multi.osgjs' );
    //var request = osgDB.readNodeURL( '../media/models/animation-test/ArmyPilot.osgjs' );
    var request = osgDB.readNodeURL( '../media/models/animation-test/mixamo fuse_w_blendshapes waving.osgjs' );

    Q( request ).then( function ( node ) {
        root.addChild( node );

        //Gets bones
        var finder = new FindBoneVisitor();
        root.accept( finder );

        var bones = finder.getBones();

        // var box = new osg.createTexturedBoxGeometry();
        // var n = new osg.MatrixTransform();
        // var res = osg.Matrix.create();
        // osg.Matrix.makeScale(5, 0.5, 0.5, res);
        // n.setMatrix(res);
        // n.addChild(box);

        //Adds geometry on each bone
        // for ( var i = 0, l = bones.length; i < l; i++ ) {
        //     var bone = bones[ i ];
        //     //console.log( bone.getName() );
        //     bone.addChild( new osg.createAxisGeometry() );
        // }

        //Index each Bone
        // var indexBoneVisitor = new IndexBoneVisitor();
        // root.accept( indexBoneVisitor );

        //Construct index Weigth vertex attribute
        // var indexWeightVertexAttributeVisitor = new IndexWeightVertexAttributeVisitor();
        // indexWeightVertexAttributeVisitor.setBoneMap( indexBoneVisitor.getBoneMap() );
        // root.accept( indexWeightVertexAttributeVisitor );


        viewer.getManipulator().computeHomePosition();

        // var nbBones = 2;

        // var matrix = [
        //     1, 0, 0, 10,
        //     0, 1, 0, 0,
        //     0, 0, 1, 0,

        //     1, 0, 0, 0,
        //     0, 1, 0, 10,
        //     0, 0, 1, 0
        // ];

        // var m = [];

        // for ( var i = 0, l = indexBoneVisitor.getBoneCount(); i < l; i++ ) {
        //     m.push( 1 );
        //     m.push( 0 );
        //     m.push( 0 );
        //     m.push( 0 );

        //     m.push( 0 );
        //     m.push( 1 );
        //     m.push( 0 );
        //     m.push( 0 );

        //     m.push( 0 );
        //     m.push( 0 );
        //     m.push( 1 );
        //     m.push( 0 );
        // }

        //root.getOrCreateStateSet().setAttributeAndModes( getShader( indexBoneVisitor.getBoneCount() ) );

        // var matrix = new Float32Array( m );

        // var ubonesUniform = osg.Uniform.createFloat4Array( new Float32Array( matrix ), 'uBones' );
        // root.getOrCreateStateSet().addUniform( ubonesUniform );

        var rigFinder = new FindRigGeometryVisitor();
        root.accept( rigFinder );


        console.log( rigFinder._rig[ 0 ] );
        //rigFinder._rig[ 0 ].parents[ 0 ].getOrCreateStateSet().setAttributeAndModes( getShader( 100 /*indexBoneVisitor.getBoneCount()*/ ), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
        //root.getOrCreateStateSet().setAttributeAndModes( getShader( 100 /*indexBoneVisitor.getBoneCount()*/ ) );

        //Link bone - animation
        // var linkVisitor = new osgAnimation.LinkVisitor();
        // root.accept(linkVisitor);

        finder = new FindAnimationManagerVisitor();
        root.accept( finder );
        var animationManager = finder._cb;
        console.log( animationManager );

        var lv = new osgAnimation.LinkVisitor();
        lv.setAnimationMap( animationManager.getAnimationMap() );
        root.accept( lv );
        animationManager.buildTargetList();


        //Outputs root node
        console.log( root );

        // var updateBoneAnim = new UpdateBoneAnim( ubonesUniform );
        // var boneAnimVisitor = new BoneAnimVisitor( updateBoneAnim );
        // root.accept( boneAnimVisitor );

        // console.log(animationManager._animations['Take 001']);
        // animationManager.playAnimationObject(animationManager._animations['Take 001']);

        //Plays animation
        animationManager.playAnimation( 'mixamo.com', 0, 0 );
        //animationManager.playAnimation( 'Take 001', 0, 0 );
        //animationManager.playAnimation( 'Walk', 0, 0 );

    } );

    // var g = osg.createAxisGeometry();
    // root.addChild( g );

    return root;
};

var onLoad = function () {
    var canvas = document.getElementById( 'View' );

    var viewer = new osgViewer.Viewer( canvas );
    viewer.init();
    viewer.setSceneData( createScene( viewer ) );
    viewer.setupManipulator();
    viewer.run();
};

window.addEventListener( 'load', onLoad, true );
