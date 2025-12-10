export default /* glsl */`
uniform mat3 spawnBounds;
uniform float spawnBoundsSphere;
uniform float spawnBoundsSphereInnerRatio;
uniform float spawnBoundsLength;
uniform float spawnBoundsLengthInnerRatio;

vec3 calcSpawnPosition(vec3 inBounds, float rndFactor) {
    float rnd4 = fract(rndFactor * 1000.0);
    vec3 norm = normalize(inBounds.xyz - vec3(0.5));
    norm.z = abs(norm.z);
    float r = rnd4 * (1.0 - spawnBoundsSphereInnerRatio) + spawnBoundsSphereInnerRatio;
#ifndef LOCAL_SPACE
    return emitterPos + spawnBounds * norm * r * spawnBoundsSphere;
#else
    return spawnBounds * norm * r * spawnBoundsSphere;
#endif
}

void addInitialVelocity(inout vec3 localVelocity, vec3 inBounds) {
    localVelocity += normalize(inBounds - vec3(0.5)) * initialVelocity;
}
`;
