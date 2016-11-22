import src.gameplay.Bubble as Bubble;
import src.helpers.BubbleImageProvider as BubbleImageProvider;
import src.helpers.Pool as Pool;

/**
    A pool for managing bubbles' life cycles and recycling them.
**/
exports = Class(Pool, function (supr) {
    this.init = function (opts) {
        supr(this, 'init', [opts]);

        var _defaultBubbleType = opts.defaultBubbleType;
        var _imgProvider = new BubbleImageProvider();

        /** Public Functions */

        /**
            @see Pool.createObj
        **/
        this.createObj = function(parent) {
            return new Bubble({
                superview: parent,
                radius: opts.bubbleRadius,
                type: _defaultBubbleType,
                imgProvider: _imgProvider,
                bubblePool: this,
                explosionPool: opts.explosionPool
            });
        };

        /**
            @see Pool.showObj
        **/
        this.showObj = function(obj) {
            obj.show();
        };

        /**
            @see Pool.hideObj
        **/
        this.hideObj = function(obj) {
            obj.hide();
            obj.updateOpts({
                scale: 1
            });
        };

        /** End of Public Functions **/ 
    };
});