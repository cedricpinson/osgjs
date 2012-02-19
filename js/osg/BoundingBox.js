osg.BoundingBox = function() {
    this.init();
};
osg.BoundingBox.prototype = {
    _cache_radius2_tmp: [0, 0, 0],

    init: function() {
	this._min = [Infinity, Infinity, Infinity];
	this._max = [-Infinity, -Infinity, -Infinity];
    },

    valid: function() {
        return (this._max[0] >= this._min[0] &&  this._max[1] >= this._min[1] &&  this._max[2] >= this._min[2]);
    },

    expandBySphere: function(sh) {
        if (!sh.valid()) {
            return;
        }
        var max = this._max;
        var min = this._min;
        min[0] = Math.min(min[0], sh._center[0]-sh._radius);
        min[1] = Math.min(min[1], sh._center[1]-sh._radius);
        min[2] = Math.min(min[2], sh._center[2]-sh._radius);

        max[0] = Math.max(max[0], sh._center[0]+sh._radius);
        max[1] = Math.max(max[1], sh._center[1]+sh._radius);
        max[2] = Math.max(max[2], sh._center[2]+sh._radius);
    },

    expandByVec3: function(v){
        var min = this._min;
        var max = this._max;
	min[0] = Math.min(min[0], v[0]);
	min[1] = Math.min(min[1], v[1]);
	min[2] = Math.min(min[2], v[2]);

	max[0] = Math.max(max[0], v[0]);
	max[1] = Math.max(max[1], v[1]);
	max[2] = Math.max(max[2], v[2]);
    },

    center: function() {
        var min = this._min;
        var max = this._max;
	return [ (min[0] + max[0])*0.5,
                 (min[1] + max[1])*0.5,
                 (min[2] + max[2])*0.5 ];
    },

    radius: function() {
	return Math.sqrt(this.radius2());
    },

    radius2: function() {
        var min = this._min;
        var max = this._max;
        var cache = this._cache_radius2_tmp;
        cache[0] = max[0] - min[0];
        cache[1] = max[1] - min[1];
        cache[2] = max[2] - min[2];
	return 0.25*(cache[0] * cache[0] + cache[1] * cache[1] + cache[2] * cache[2]);
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
