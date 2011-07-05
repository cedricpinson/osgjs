osg.BoundingBox = function() {
    this._min = [1,1,1];
    this._max = [0,0,0];
};
osg.BoundingBox.prototype = {
    init: function() {
	this._min = [1,1,1];
	this._max = [0,0,0];
    },

    valid: function() {
        return (this._max[0] >= this._min[0] &&  this._max[1] >= this._min[1] &&  this._max[2] >= this._min[2]);
    },

    expandBySphere: function(sh) {
        if (!sh.valid()) {
            return;
        }
        if(sh._center[0]-sh._radius<this._min[0]) { this._min[0] = sh._center[0]-sh._radius; }
        if(sh._center[0]+sh._radius>this._max[0]) { this._max[0] = sh._center[0]+sh._radius; }

        if(sh._center[1]-sh._radius<this._min[1]) { this._min[1] = sh._center[1]-sh._radius; }
        if(sh._center[1]+sh._radius>this._max[1]) { this._max[1] = sh._center[1]+sh._radius; }

        if(sh._center[2]-sh._radius<this._min[2]) { this._min[2] = sh._center[2]-sh._radius; }
        if(sh._center[2]+sh._radius>this._max[2]) { this._max[2] = sh._center[2]+sh._radius; }
    },
    expandByVec3: function(v){

	if ( this.valid() ) {
	    if ( this._min[0] > v[0] ) { this._min[0] = v[0]; }
	    if ( this._min[1] > v[1] ) { this._min[1] = v[1]; }
	    if ( this._min[2] > v[2] ) { this._min[2] = v[2]; }
	    if ( this._max[0] < v[0] ) { this._max[0] = v[0]; }
	    if ( this._max[1] < v[1] ) { this._max[1] = v[1]; }
	    if ( this._max[2] < v[2] ) { this._max[2] = v[2]; }
	} else {
	    this._min[0] = v[0];
	    this._min[1] = v[1];
	    this._min[2] = v[2];
	    this._max[0] = v[0];
	    this._max[1] = v[1];
	    this._max[2] = v[2];
	}
    },

    center: function() {
	return osg.Vec3.mult(osg.Vec3.add(this._min,
                                          this._max, 
                                          []),
                             0.5,
                            []);
    },
    radius: function() {
	return Math.sqrt(this.radius2());
    },

    radius2: function() {
	return 0.25*(osg.Vec3.length2(osg.Vec3.sub(this._max,this._min, [])));
    },
    corner: function(pos) {
        ret = [0.0,0.0,0.0];
        if ( pos & 1 ) {
	    ret[0]=this._max[0];
	} else {
	    ret[0]=this._min[0];
	}
        if ( pos & 2 ) {
	    ret[1]=this._max[1];
	} else {
	    ret[1]=this._min[1];
	}
        if ( pos & 4 ) {
	    ret[2]=this._max[2];
	} else {
	    ret[2]=this._min[2];
	}
        return ret;
    }

};
