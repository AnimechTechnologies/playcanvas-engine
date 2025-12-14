export default /* glsl */`
    float animFrame = min(floor(texCoordsAlphaLife.w * animTexParams.y) + animTexParams.x + floor((animTexParams.z + 1.0) * rndFactor3.z), animTexParams.z);
`;
