float ChebychevInequality (vec2 moments, float t)
{
	// No shadow if depth of fragment is in front
	if ( t <= moments.x )
		return 1.0;

	// Calculate variance, which is actually the amount of
	// error due to precision loss from fp32 to RG/BA
	// (moment1 / moment2)
	float variance = moments.y - (moments.x * moments.x);
	variance = max(variance, 0.02);

	// Calculate the upper bound
	float d = t - moments.x;
	return variance / (variance + d * d);
}

float ChebyshevUpperBound(vec2 moments, float mean, float bias, float minVariance)
{
    float d = mean - moments.x;
	if ( d <= 0.0 )
        return 1.0;
    // Compute variance    
    float variance = moments.y - (moments.x * moments.x);
    variance = max(variance, minVariance);

    // Compute probabilistic upper bound
    //p represent an upper bound on the visibility percentage of the receiver. This value //attempts to estimate how much of the distribution of occluders at the surface location is //beyond the surface's distance from the light. If it is 0, then there is no probability //that the fragment is partially lit, so it will be fully in shadow. If it is a value in the //[0, 1] range, it represent the penumbrae value of the shadow edge.
    float p = smoothstep(mean - bias, mean, moments.x);

    // Remove the [0, Amount] tail and linearly rescale (Amount, 1]. 
    /// light bleeding when shadows overlap. 

    float pMax = smoothstep(0.2, 1.0, variance / (variance + d*d));
    // One-tailed Chebyshev     
    return clamp(max(p, pMax), 0.0, 1.0);
}