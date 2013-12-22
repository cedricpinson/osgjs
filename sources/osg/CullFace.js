define( [
    'osg/Utils',
    'osg/StateAttribute'
], function ( MACROUTILS, StateAttribute ) {

    /**
     *  Manage CullFace attribute
     *  @class CullFace
     */
    var CullFace = function ( mode ) {
        StateAttribute.call( this );
        if ( mode === undefined ) {
            mode = CullFace.BACK;
        }
        this.setMode( mode );
    };

    CullFace.DISABLE = 0x0;
    CullFace.FRONT = 0x0404;
    CullFace.BACK = 0x0405;
    CullFace.FRONT_AND_BACK = 0x0408;

    /** @lends CullFace.prototype */
    CullFace.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( StateAttribute.prototype, {
        attributeType: 'CullFace',
        cloneType: function () {
            return new CullFace();
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType;
        },
        setMode: function ( mode ) {
            if ( typeof mode === 'string' ) {
                mode = CullFace[ mode ];
            }
            this._mode = mode;
        },
        getMode: function () {
            return this._mode;
        },
        apply: function ( state ) {
            var gl = state.getGraphicContext();
            if ( this._mode === CullFace.DISABLE ) {
                gl.disable( gl.CULL_FACE );
            } else {
                gl.enable( gl.CULL_FACE );
                gl.cullFace( this._mode );
            }
            this._dirty = false;
        }
    } ), 'osg', 'CullFace' );

    return CullFace;
} );
