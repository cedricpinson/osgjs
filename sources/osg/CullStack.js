define( [
    'osg/Matrix',
    'osg/Notify',
    'osg/Camera',
    'osg/TransformEnums',
], function( Matrix, Notify, Camera, TransformEnums ) {

    var CullStack = function() {
        this._modelViewMatrixStack = [];
        this._projectionMatrixStack = [];
        this._viewportStack = [];
        this._bbCornerFar = 0;
        this._bbCornerNear = 0;



        // keep a matrix in memory to avoid to create matrix
        this._reserveMatrixStack = [
            Matrix.create()
        ];
        this._reserveMatrixStack.current = 0;


        // data for caching camera matrix inverse for computation of world/view
        // contains index of the camera node in the nodepath
        this._cameraIndexStack = [];
        // contains index of the camera modelview matrix in the modelViewMatrixStack
        this._cameraModelViewIndexStack = [];

        // contains the id has a key to computed Inverse Matrix
        this._cameraMatrixInverse = {};

    };

    CullStack.prototype = {

        _getReservedMatrix: function() {
            var m = this._reserveMatrixStack[ this._reserveMatrixStack.current++ ];
            if ( this._reserveMatrixStack.current === this._reserveMatrixStack.length ) {
                this._reserveMatrixStack.push( Matrix.create() );
            }
            return m;
        },

        reset: function() {
            this._modelViewMatrixStack.length = 0;
            this._projectionMatrixStack.length = 0;
            this._reserveMatrixStack.current = 0;

            this._cameraModelViewIndexStack.length = 0;
            this._cameraIndexStack.length = 0;
            this._cameraMatrixInverse = {};
        },

        getProjectionMatrixStack: function() {
            return this._projectionMatrixStack;
        },
        getCurrentProjectionMatrix: function() {
            return this._projectionMatrixStack[ this._projectionMatrixStack.length - 1 ];
        },

        getCurrentModelViewMatrix: function() {
            return this._modelViewMatrixStack[ this._modelViewMatrixStack.length - 1 ];
        },

        getCurrentModelviewMatrix: function() {
            Notify.warn( 'deprecated switch to getCurrentModelViewMatrix' );
            return this.getCurrentModelViewMatrix();
        },

        getCameraInverseMatrix: function() {

            // Return or compute and cache the MatrixInverse of the last
            // active camera in absolute reference

            // if no index the camera inverse is the root with an fake id
            if ( !this._cameraIndexStack.length )
                return this._cameraMatrixInverse[ -1 ];

            var idx = this._cameraIndexStack[ this._cameraIndexStack.length - 1 ];

            // get the camera node
            var camera = this.getNodePath()[ idx ];
            var id = camera.getInstanceID();

            if ( this._cameraMatrixInverse[ id ] === undefined ) {
                var indexInModelViewMatrixStack = this._cameraModelViewIndexStack[ this._cameraModelViewIndexStack.length - 1 ];
                var mat = this._modelViewMatrixStack[ indexInModelViewMatrixStack ];
                var matInverse = this._getReservedMatrix();
                Matrix.inverse( mat, matInverse );
                this._cameraMatrixInverse[ id ] = matInverse;
            }
            return this._cameraMatrixInverse[ id ];
        },

        getCurrentModelWorldMatrix: function() {
            // Improvment could be to cache more things
            // and / or use this method only if the shader use it
            var invMatrix = this.getCameraInverseMatrix();
            var m = this._getReservedMatrix();
            var world = Matrix.mult( invMatrix, this.getCurrentModelViewMatrix(), m );
            return world;
        },

        getCurrentViewMatrix: function() {
            // Improvment could be to cache more things
            // and / or use this method only if the shader use it
            if ( !this._cameraIndexStack.length )
                return this._modelViewMatrixStack[ 1 ];

            // also we could keep the index of the current to avoid lenght-1 at each access
            // it's implemented in osg like that:
            // https://github.com/openscenegraph/osg/blob/master/include/osg/fast_back_stack
            var idx = this._cameraModelViewIndexStack[ this._cameraModelViewIndexStack.length - 1 ];
            return this._modelViewMatrixStack[ idx ];
        },

        getViewport: function() {
            if ( this._viewportStack.length === 0 ) {
                return undefined;
            }
            return this._viewportStack[ this._viewportStack.length - 1 ];
        },
        getLookVectorLocal: function() {
            var m = this.getCurrentModelViewMatrix();
            return [ -m[ 2 ], -m[ 6 ], -m[ 10 ] ];
        },
        pushViewport: function( vp ) {
            this._viewportStack.push( vp );
        },
        popViewport: function() {
            this._viewportStack.pop();
        },

        pushModelViewMatrix: function( matrix ) {

            // When pushing a matrix, it can be a transform or camera. To compute
            // differents matrix type in shader ( ViewMatrix/ModelWorldMatrix/ModelViewMatrix )
            // we track camera node when using pushModelViewMatrix
            // To detect a camera, we check on the nodepath the type of the node and if the
            // camera is relatif or absolute.
            // When we detect an absolute camera we keep it's index to get it when needed to
            // compute the World/View matrix
            // There is an exception for the root camera, the root camera is not pushed on the
            // CullVisitor but only its matrixes, so to handle this we compute the inverse camera
            // when the nodepath has a lenght of 0
            // To avoid to compute too much inverse matrix, we keep a cache of them during the
            // traverse and store the result under the instanceID key, except for the root we use
            // the special id '-1'
            var np = this.getNodePath();
            var length = np.length;
            if ( this._modelViewMatrixStack.length > 0 )
                if ( !length ) { // root
                    var matInverse = this._getReservedMatrix();
                    Matrix.inverse( matrix, matInverse );
                    this._cameraMatrixInverse[ -1 ] = matInverse;
                } else {
                    var index = length - 1;
                    if ( np[ index ].getTypeID() === Camera.getTypeID() && np[ index ].getReferenceFrame() === TransformEnums.ABSOLUTE_RF ) {
                        this._cameraIndexStack.push( index );
                        this._cameraModelViewIndexStack.push( this._modelViewMatrixStack.length );
                    }
                }

            this._modelViewMatrixStack.push( matrix );
            var lookVector = this.getLookVectorLocal();

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */

        },
        popModelViewMatrix: function() {

            // if same index it's a camera and we have to pop it
            var np = this.getNodePath();
            var index = np.length - 1;
            if ( this._cameraIndexStack.length && index === this._cameraIndexStack[ this._cameraIndexStack.length - 1 ] ) {
                this._cameraIndexStack.pop();
                this._cameraModelViewIndexStack.pop();
            }

            this._modelViewMatrixStack.pop();
            var lookVector;
            if ( this._modelViewMatrixStack.length !== 0 ) {
                lookVector = this.getLookVectorLocal();
            } else {
                lookVector = [ 0, 0, -1 ];
            }

            /*jshint bitwise: false */
            this._bbCornerFar = ( lookVector[ 0 ] >= 0 ? 1 : 0 ) | ( lookVector[ 1 ] >= 0 ? 2 : 0 ) | ( lookVector[ 2 ] >= 0 ? 4 : 0 );
            this._bbCornerNear = ( ~this._bbCornerFar ) & 7;
            /*jshint bitwise: true */

        },
        pushProjectionMatrix: function( matrix ) {
            this._projectionMatrixStack.push( matrix );
        },
        popProjectionMatrix: function() {
            this._projectionMatrixStack.pop();
        }
    };

    return CullStack;
} );