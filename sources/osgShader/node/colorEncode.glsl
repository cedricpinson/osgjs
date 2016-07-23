
const vec4 decVec = vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0);
float decodeFloatRGBA( vec4 rgba ) {
    return dot( rgba, decVec );
}

const vec4 encVec = vec4(1.0, 255.0, 65025.0, 16581375.0);
const float fbuf = 1.0/255.0;
const vec4 vecfbuf = vec4( fbuf, fbuf, fbuf, 0.0 );
vec4 encodeFloatRGBA( float v ) {
    vec4 enc = encVec * v;
    enc = fract(enc);
    enc -= enc.yzww * vecfbuf;
    return enc;
}

vec2 decodeHalfFloatRGBA( vec4 rgba ) {
    return vec2( rgba.x + ( rgba.y * fbuf ), rgba.z + ( rgba.w * fbuf ) );
}

const vec2 bias = vec2( fbuf, 0.0);

vec4 encodeHalfFloatRGBA( vec2 v ) {
    vec4 enc;
    enc.xy = vec2(v.x, fract(v.x * 255.0));
    enc.xy = enc.xy - (enc.yy * bias);

    enc.zw = vec2(v.y, fract(v.y * 255.0));
    enc.zw = enc.zw - (enc.ww * bias);
    return enc;
}
