define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Geometry',
    'osg/BufferArray',
    'osg/DrawArrays',
    'osg/PrimitiveSet',
    'osg/StateSet',
    'osg/Uniform',
    'osg/Depth',
    'osgUtil/DisplayGeometryVisitor'
], function ( MACROUTILS, NodeVisitor, Geometry, BufferArray, DrawArrays, PrimitiveSet, StateSet, Uniform, Depth, DGV ) {

    'use strict';

    var DisplayNormalVisitor = function ( scale ) {
        NodeVisitor.call( this );

        this._scale = scale || 1.0;

        var ns = this._normalStateSet = new StateSet();
        ns.setAttribute( DGV.getShader() );
        ns.addUniform( Uniform.createFloat3( [ 1.0, 0.0, 0.0 ], 'uColorDebug' ) );
        ns.setAttribute( new Depth( Depth.NEVER ) );

        var ts = this._tangentStateSet = new StateSet();
        ts.setAttribute( DGV.getShader() );
        ts.addUniform( Uniform.createFloat3( [ 0.0, 1.0, 0.0 ], 'uColorDebug' ) );
        ts.setAttribute( new Depth( Depth.NEVER ) );
    };
    DisplayNormalVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
        setTangentVisibility: function ( bool ) {
            this._tangentStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        setNormalVisibility: function ( bool ) {
            this._normalStateSet.setAttribute( new Depth( bool ? Depth.LESS : Depth.NEVER ) );
        },
        apply: function ( node ) {
            if ( node instanceof Geometry === false ) {
                this.traverse( node );
                return;
            }
            var vertices = node.getAttributes().Vertex;
            if ( !vertices || node._isVisitedNormalDebug )
                return;
            node._isVisitedNormalDebug = true;
            var norm = this.createDebugGeom( node.getAttributes().Normal, vertices );
            if ( norm ) {
                norm.setStateSet( this._normalStateSet );
                node.addChild( norm );
            }

            var tang = this.createDebugGeom( node.getAttributes().Tangent, vertices );
            if ( tang ) {
                tang.setStateSet( this._tangentStateSet );
                node.addChild( tang );
            }
        },
        createDebugGeom: function ( dispVec, vertices ) {
            if ( !dispVec )
                return;
            var vSize = vertices.getItemSize();
            var dSize = dispVec.getItemSize();
            dispVec = dispVec.getElements();
            vertices = vertices.getElements();

            var nbVertices = vertices.length / vSize;
            var lineVertices = new Float32Array( nbVertices * 2 * 3 );
            var scale = this._scale;
            var i = 0;
            for ( i = 0; i < nbVertices; ++i ) {
                var idl = i * 6;
                var idv = i * vSize;
                var idd = i * dSize;

                lineVertices[ idl ] = vertices[ idv ];
                lineVertices[ idl + 1 ] = vertices[ idv + 1 ];
                lineVertices[ idl + 2 ] = vertices[ idv + 2 ];
                lineVertices[ idl + 3 ] = vertices[ idv ] + dispVec[ idd ] * scale;
                lineVertices[ idl + 4 ] = vertices[ idv + 1 ] + dispVec[ idd + 1 ] * scale;
                lineVertices[ idl + 5 ] = vertices[ idv + 2 ] + dispVec[ idd + 2 ] * scale;
            }
            var g = new Geometry();
            g._isNormalDebug = true;
            g.getAttributes().Vertex = new BufferArray( BufferArray.ARRAY_BUFFER, lineVertices, 3 );
            var primitive = new DrawArrays( PrimitiveSet.LINES, 0, nbVertices * 2 );
            g.getPrimitives().push( primitive );
            return g;
        }
    } );

    return DisplayNormalVisitor;
} );
