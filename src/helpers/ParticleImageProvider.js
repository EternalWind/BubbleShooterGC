import ui.resource.Image as Image;

import src.gameplay.BubbleType as BubbleType;
import src.helpers.PathHelpers as PathHelpers;

/**
    Caches and provides particle images for bubbles.
**/
exports = Class(function (supr) {
    this.init = function () {
        var _imgs2 = [];
        for (var _i = 0; _i < BubbleType.MAX; ++_i) {
            _imgs2.push(new Image({ url: PathHelpers.getParticleImgPath(_i) }));
        }

        var _imgs = [];
        for (var _i = 0; _i < BubbleType.MAX; ++_i) {
            _imgs.push(PathHelpers.getParticleImgPath(_i));
        }

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        /**
           Gets a particle image for a given type of bubble.
           @param type The bubble type.
           @returns A particle image corresponding to the given bubble type.
       **/
        this.getImageFor = function(type) {
            if (type >= 0 && type < BubbleType.MAX) {
                return _imgs2[type];
            } else {
                console.log("No image for type " + type);
            }
        }

        /** End of Public Functions **/
    };
});