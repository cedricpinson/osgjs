osg.BoundingSphere = function() {
    this._center = [0.0,0.0,0.0];
    this._radius = -1;
};
osg.BoundingSphere.prototype = {
    init: function() {
	this._center = [0.0,0.0,0.0];
	this._radius = -1;
    },
    valid: function() {
	return this._radius>=0.0;
    },
    set: function (center,radius)
    {
	this._center = center;
	this._radius = radius;
    },
    center: function() {return this._center;},
    radius: function() {return this._radius;},
    radius2: function() {return this._radius*this._radius;},

    expandByBox: function(bb) {
	if ( bb.valid() )
	{
            var c;
	    if (this.valid())
	    {
		var newbb = new osg.BoundingBox();
		newbb._min[0]=bb._min[0];
		newbb._min[1]=bb._min[1];
		newbb._min[2]=bb._min[2];
		newbb._max[0]=bb._max[0];
		newbb._max[1]=bb._max[1];
		newbb._max[2]=bb._max[2];

                // this code is not valid c is defined after the loop
                // FIXME
		for (var i = 0 ; i < 8; i++) {
                    var v = osg.Vec3.sub(bb.corner(c),this._center, []); // get the direction vector from corner
                    osg.Vec3.normalize(v,v); // normalise it.
                    nv[0] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[1] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[2] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[0] += this._center[0]; // move to absolute position.
                    nv[1] += this._center[1]; // move to absolute position.
                    nv[2] += this._center[2]; // move to absolute position.
                    newbb.expandBy(nv); // add it into the new bounding box.
		}

		c = newbb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = newbb.radius();


	    }
	    else
	    {

		c = bb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = bb.radius();

	    }
	}

    },

    expandByVec3: function(v){
	if ( this.valid())
	{
	    var dv = osg.Vec3.sub(v,this.center(), []);
	    r = osg.Vec3.length(dv);
	    if (r>this.radius())
	    {
		dr = (r-this.radius())*0.5;
		this._center[0] += dv[0] * (dr/r);
		this._center[1] += dv[1] * (dr/r);
		this._center[2] += dv[2] * (dr/r);
		this._radius += dr;
	    }
	}
	else
	{
	    this._center[0] = v[0];
	    this._center[1] = v[1];
	    this._center[2] = v[2];
	    this._radius = 0.0;
	}
    },

    expandRadiusBySphere: function(sh){
        if (sh.valid()) {
            if (this.valid()) {
                var sub = osg.Vec3.sub;
                var length = osg.Vec3.length;
                var r = length( sub(sh._center,
                                    this._center, 
                                    [])
                              ) + sh._radius;
                if (r>this._radius) {
                    this._radius = r;
                }
                // else do nothing as vertex is within sphere.
            } else {
                this._center = osg.Vec3.copy(sh._center, []);
                this._radius = sh._radius;
            }
        }
    },
    expandBy: function(sh){
	// ignore operation if incomming BoundingSphere is invalid.
	if (!sh.valid()) { return; }

	// This sphere is not set so use the inbound sphere
	if (!this.valid())
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius = sh.radius();

	    return;
	}


	// Calculate d == The distance between the sphere centers
	var tmp= osg.Vec3.sub( this.center() , sh.center(), [] );
	d = osg.Vec3.length(tmp);

	// New sphere is already inside this one
	if ( d + sh.radius() <= this.radius() )
	{
	    return;
	}

	//  New sphere completely contains this one
	if ( d + this.radius() <= sh.radius() )
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius    = sh._radius;
	    return;
	}


	// Build a new sphere that completely contains the other two:
	//
	// The center point lies halfway along the line between the furthest
	// points on the edges of the two spheres.
	//
	// Computing those two points is ugly - so we'll use similar triangles
	new_radius = (this.radius() + d + sh.radius() ) * 0.5;
	ratio = ( new_radius - this.radius() ) / d ;

	this._center[0] += ( sh._center[0] - this._center[0] ) * ratio;
	this._center[1] += ( sh._center[1] - this._center[1] ) * ratio;
	this._center[2] += ( sh._center[2] - this._center[2] ) * ratio;

	this._radius = new_radius;

    },
    contains: function(v) {
	var vc = osg.Vec3.sub(v,this.center(), []);
	return valid() && (osg.Vec3.length2(vc)<=radius2());
    },
    intersects: function( bs ) {
	var lc = osg.Vec3.length2(osg.Vec3.sub(this.center() , 
                                               bs.center(),
                                              []));
	return valid() && bs.valid() &&
	    (lc <= (this.radius() + bs.radius())*(this.radius() + bs.radius()));
    }
};
