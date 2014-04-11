define( [
    'osg/Vec3',
    'osg/BoundingBox'
], function ( Vec3, BoundingBox ) {

    var BoundingSphere = function () {
        this._center = [ 0.0, 0.0, 0.0 ];
        this._radius = -1;
    };

    BoundingSphere.prototype = {
        init: function () {
            Vec3.init( this._center );
            this._radius = -1;
        },
        valid: function () {
            return this._radius >= 0.0;
        },
        set: function ( center, radius ) {
            this._center = center;
            this._radius = radius;
        },
        center: function () {
            return this._center;
        },
        radius: function () {
            return this._radius;
        },
        radius2: function () {
            return this._radius * this._radius;
        },

        expandByBox: ( function () {
            var v = [ 0.0, 0.0, 0.0 ];
            var newbb = new BoundingBox();
            return function ( bb ) {
                if ( !bb.valid() )
                    return;

                var c;
                if ( this.valid() ) {
                    newbb._min[ 0 ] = bb._min[ 0 ];
                    newbb._min[ 1 ] = bb._min[ 1 ];
                    newbb._min[ 2 ] = bb._min[ 2 ];
                    newbb._max[ 0 ] = bb._max[ 0 ];
                    newbb._max[ 1 ] = bb._max[ 1 ];
                    newbb._max[ 2 ] = bb._max[ 2 ];

                    for ( var i = 0; i < 8; i++ ) {
                        Vec3.sub( bb.corner( c ), this._center, v ); // get the direction vector from corner
                        Vec3.normalize( v, v ); // normalise it.
                        v[ 0 ] *= -this._radius; // move the vector in the opposite direction distance radius.
                        v[ 1 ] *= -this._radius; // move the vector in the opposite direction distance radius.
                        v[ 2 ] *= -this._radius; // move the vector in the opposite direction distance radius.
                        v[ 0 ] += this._center[ 0 ]; // move to absolute position.
                        v[ 1 ] += this._center[ 1 ]; // move to absolute position.
                        v[ 2 ] += this._center[ 2 ]; // move to absolute position.
                        newbb.expandBy( v ); // add it into the new bounding box.
                    }

                    c = newbb.center();
                    this._center[ 0 ] = c[ 0 ];
                    this._center[ 1 ] = c[ 1 ];
                    this._center[ 2 ] = c[ 2 ];
                    this._radius = newbb.radius();
                } else {
                    c = bb.center();
                    this._center[ 0 ] = c[ 0 ];
                    this._center[ 1 ] = c[ 1 ];
                    this._center[ 2 ] = c[ 2 ];
                    this._radius = bb.radius();
                }
            };
        } )(),

        expandByVec3: ( function () {
            var dv = [ 0.0, 0.0, 0.0 ];
            return function ( v ) {
                if ( this.valid() ) {
                    Vec3.sub( v, this.center(), dv );
                    var r = Vec3.length( dv );
                    if ( r > this.radius() ) {
                        var dr = ( r - this.radius() ) * 0.5;
                        this._center[ 0 ] += dv[ 0 ] * ( dr / r );
                        this._center[ 1 ] += dv[ 1 ] * ( dr / r );
                        this._center[ 2 ] += dv[ 2 ] * ( dr / r );
                        this._radius += dr;
                    }
                } else {
                    this._center[ 0 ] = v[ 0 ];
                    this._center[ 1 ] = v[ 1 ];
                    this._center[ 2 ] = v[ 2 ];
                    this._radius = 0.0;
                }
            };
        } )(),

        expandRadiusBySphere: function ( sh ) {
            if ( sh.valid() ) {
                if ( this.valid() ) {
                    var r = Vec3.distance( sh._center, this._center ) + sh._radius;
                    if ( r > this._radius ) {
                        this._radius = r;
                    }
                    // else do nothing as vertex is within sphere.
                } else {
                    Vec3.copy( sh._center, this._center );
                    this._radius = sh._radius;
                }
            }
        },
        expandBy: function ( sh ) {
            // ignore operation if incomming BoundingSphere is invalid.
            if ( !sh.valid() ) {
                return;
            }

            // This sphere is not set so use the inbound sphere
            if ( !this.valid() ) {
                this._center[ 0 ] = sh._center[ 0 ];
                this._center[ 1 ] = sh._center[ 1 ];
                this._center[ 2 ] = sh._center[ 2 ];
                this._radius = sh.radius();

                return;
            }

            // Calculate d == The distance between the sphere centers
            var d = Vec3.distance( this.center(), sh.center() );

            // New sphere is already inside this one
            if ( d + sh.radius() <= this.radius() ) {
                return;
            }

            //  New sphere completely contains this one
            if ( d + this.radius() <= sh.radius() ) {
                this._center[ 0 ] = sh._center[ 0 ];
                this._center[ 1 ] = sh._center[ 1 ];
                this._center[ 2 ] = sh._center[ 2 ];
                this._radius = sh._radius;
                return;
            }


            // Build a new sphere that completely contains the other two:
            //
            // The center point lies halfway along the line between the furthest
            // points on the edges of the two spheres.
            //
            // Computing those two points is ugly - so we'll use similar triangles
            var newRadius = ( this.radius() + d + sh.radius() ) * 0.5;
            var ratio = ( newRadius - this.radius() ) / d;

            this._center[ 0 ] += ( sh._center[ 0 ] - this._center[ 0 ] ) * ratio;
            this._center[ 1 ] += ( sh._center[ 1 ] - this._center[ 1 ] ) * ratio;
            this._center[ 2 ] += ( sh._center[ 2 ] - this._center[ 2 ] ) * ratio;

            this._radius = newRadius;
        },
        contains: function ( v ) {
            if ( !this.valid() )
                return false;
            return Vec3.distance2( v, this.center() ) <= this.radius2();
        },
        intersects: function ( bs ) {
            if ( !this.valid() )
                return false;
            if ( !bs.valid() )
                return false;
            var lc = Vec3.distance2( this.center(), bs.center() );
            var r = this.radius() + bs.radius();
            return lc <= r;
        }
    };

    return BoundingSphere;
} );
