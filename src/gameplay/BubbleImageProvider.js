import ui.resource.Image as Image;

import src.gameplay.BubbleType as BubbleType;

exports = Class(function (supr) {
    this.init = function () {
        var _imgFolder = "resources/images/";
        var _imgExtension = ".png";

        var _imgs = [];
        for (var i = 0; i < BubbleType.MAX; ++i) {
            _imgs.push(new Image({ url: _imgFolder + i + _imgExtension }));
        }

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        this.getImageFor = function(type) {
            if (type >= 0 && type < BubbleType.MAX) {
                return _imgs[type];
            } else {
                console.log("No image for type " + type);
            }
        }

        /** End of Public Functions **/
    };
});