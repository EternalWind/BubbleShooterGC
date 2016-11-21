import src.helpers.Defines as Defines;

exports = {
    getImgPath: getImgPath,
    getParticleImgPath: getParticleImgPath
}

function getImgPath(imgName) {
    return Defines.IMG_FOLDER + imgName + Defines.IMG_EXT;
}

function getParticleImgPath(name) {
    return Defines.IMG_PARTICLE_FOLDER + name + Defines.IMG_EXT;
}