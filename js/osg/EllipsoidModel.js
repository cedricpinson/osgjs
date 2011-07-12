osg.WGS_84_RADIUS_EQUATOR = 6378137.0;
osg.WGS_84_RADIUS_POLAR = 6356752.3142;

osg.EllipsoidModel = function() {
    this._radiusEquator = osg.WGS_84_RADIUS_EQUATOR;
    this._radiusPolar = osg.WGS_84_RADIUS_POLAR;
    this.computeCoefficients();
};
osg.EllipsoidModel.prototype = {
    setRadiusEquator: function(r) { this._radiusEquator = radius; this.computeCoefficients();},
    getRadiusEquator: function() { return this._radiusEquator;},
    setRadiusPolar: function(radius) { this._radiusPolar = radius; 
                                              this.computeCoefficients(); },
    getRadiusPolar: function() { return this._radiusPolar; },
    convertLatLongHeightToXYZ: function ( latitude, longitude, height ) {
        var sin_latitude = Math.sin(latitude);
        var cos_latitude = Math.cos(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);
        var X = (N+height)*cos_latitude*Math.cos(longitude);
        var Y = (N+height)*cos_latitude*Math.sin(longitude);
        var Z = (N*(1-this._eccentricitySquared)+height)*sin_latitude;
        return [X, Y, Z];
    },
    convertXYZToLatLongHeight: function ( X,  Y,  Z ) {
        // http://www.colorado.edu/geography/gcraft/notes/datum/gif/xyzllh.gif
        var p = Math.sqrt(X*X + Y*Y);
        var theta = Math.atan2(Z*this._radiusEquator , (p*this._radiusPolar));
        var eDashSquared = (this._radiusEquator*this._radiusEquator - this._radiusPolar*this._radiusPolar)/ (this._radiusPolar*this._radiusPolar);

        var sin_theta = Math.sin(theta);
        var cos_theta = Math.cos(theta);

        latitude = Math.atan( (Z + eDashSquared*this._radiusPolar*sin_theta*sin_theta*sin_theta) /
                         (p - this._eccentricitySquared*this._radiusEquator*cos_theta*cos_theta*cos_theta) );
        longitude = Math.atan2(Y,X);

        var sin_latitude = Math.sin(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);

        height = p/Math.cos(latitude) - N;
        return [latitude, longitude, height];
    },
    computeLocalUpVector: function(X, Y, Z) {
        // Note latitude is angle between normal to ellipsoid surface and XY-plane
        var  latitude, longitude, altitude;
        var coord = this.convertXYZToLatLongHeight(X,Y,Z,latitude,longitude,altitude);
        latitude = coord[0];
        longitude = coord[1];
        altitude = coord[2];

        // Compute up vector
        return [ Math.cos(longitude) * Math.cos(latitude),
                 Math.sin(longitude) * Math.cos(latitude),
                 Math.sin(latitude) ];
    },
    isWGS84: function() { return(this._radiusEquator == osg.WGS_84_RADIUS_EQUATOR && this._radiusPolar == osg.WGS_84_RADIUS_POLAR);},

    computeCoefficients: function() {
        var flattening = (this._radiusEquator-this._radiusPolar)/this._radiusEquator;
        this._eccentricitySquared = 2*flattening - flattening*flattening;
    },
    computeLocalToWorldTransformFromLatLongHeight : function(latitude, longitude, height) {
        var pos = this.convertLatLongHeightToXYZ(latitude, longitude, height);
        var m = osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], []);
        this.computeCoordinateFrame(latitude, longitude, m);
        return m;
    },
    computeLocalToWorldTransformFromXYZ : function(X, Y, Z) {
        var lla = this.convertXYZToLatLongHeight(X, Y, Z);
        var m = osg.Matrix.makeTranslate(X, Y, Z);
        this.computeCoordinateFrame(lla[0], lla[1], m);
        return m;
    },
    computeCoordinateFrame: function ( latitude,  longitude, localToWorld) {
        // Compute up vector
        var  up = [ Math.cos(longitude)*Math.cos(latitude), Math.sin(longitude)*Math.cos(latitude), Math.sin(latitude) ];

        // Compute east vector
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];

        // Compute north vector = outer product up x east
        var north = osg.Vec3.cross(up,east, []);

        // set matrix
        osg.Matrix.set(localToWorld,0,0, east[0]);
        osg.Matrix.set(localToWorld,0,1, east[1]);
        osg.Matrix.set(localToWorld,0,2, east[2]);

        osg.Matrix.set(localToWorld,1,0, north[0]);
        osg.Matrix.set(localToWorld,1,1, north[1]);
        osg.Matrix.set(localToWorld,1,2, north[2]);

        osg.Matrix.set(localToWorld,2,0, up[0]);
        osg.Matrix.set(localToWorld,2,1, up[1]);
        osg.Matrix.set(localToWorld,2,2, up[2]);
    }
};
