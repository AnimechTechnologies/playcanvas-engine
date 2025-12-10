export default /* glsl */`
uniform mat3 spawnBounds;
uniform float spawnBoundsSphere;
uniform float spawnBoundsSphereInnerRatio;
uniform float spawnBoundsLength;
uniform float spawnBoundsLengthInnerRatio;

vec3 calcSpawnPosition(vec3 inBounds, float rndFactor) {
    float rnd4 = fract(rndFactor * 1000.0);
    vec2 norm = normalize(inBounds.xy - vec2(0.5));
    float r = rnd4 * (1.0 - spawnBoundsSphereInnerRatio) + spawnBoundsSphereInnerRatio;
    float l = inBounds.z * (1.0 - spawnBoundsLengthInnerRatio) + spawnBoundsLengthInnerRatio;
#ifndef LOCAL_SPACE
    return emitterPos + spawnBounds * vec3(norm * r * spawnBoundsSphere, (l - 0.5) * spawnBoundsLength);
#else
    return spawnBounds * vec3(norm * r * spawnBoundsSphere, (l - 0.5) * spawnBoundsLength);
#endif
}

void addInitialVelocity(inout vec3 localVelocity, vec3 inBounds) {
    localVelocity += normalize(inBounds - vec3(0.5)) * initialVelocity;
}
`;
