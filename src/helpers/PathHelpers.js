import src.helpers.Defines as Defines;

/**
    A set of helper functions for calculating pathes.
**/
exports = {
    getImgPath: getImgPath,
    getParticleImgPath: getParticleImgPath
}

/**
    Gets the path for a given image.
    @param imgName The name of the image.
    @returns The path to the given image.
**/
function getImgPath(imgName) {
    return Defines.IMG_FOLDER + imgName + Defines.IMG_EXT;
}

/**
    Gets the path for a given particle image.
    @param name The name of the particle image.
    @returns The path to the given particle image.
**/
function getParticleImgPath(name) {
    return Defines.IMG_PARTICLE_FOLDER + name + Defines.IMG_EXT;
}