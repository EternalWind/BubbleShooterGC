import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import src.gameplay.Bubble as Bubble;

exports = Class(function (supr) {
    this.init = function (opts) {
        var _parentView = opts.parent;
        var _defaultBubbleType = opts.defaultBubbleType;

        var _boxedBubbles = [];
        for (var i = 0; i < opts.initialBubbleCount; ++i) {
            var boxedBubble = { 
                bubble: new Bubble({
                    superview: _parentView,
                    radius: opts.bubbleRadius,
                    type: _defaultBubbleType
                }),
                isActive: false
            };
            boxedBubble.bubble.hide();

            _boxedBubbles.push(boxedBubble);
        }

        /** Public Functions */

        this.spawn = function() {
            var boxedBubble = _boxedBubbles.find(function(b) {
                return !b.isActive;
            });

            if (!boxedBubble) {
                boxedBubble = {
                    bubble: new Bubble({
                        superview: _parentView,
                        radius: opts.bubbleRadius,
                        type: _defaultBubbleType
                    }),
                    isActive: false
                };
                _boxedBubbles.push(boxedBubble);
            }

            boxedBubble.isActive = true;
            boxedBubble.bubble.show();

            return boxedBubble.bubble;
        };

        this.despawn = function(bubble) {
            var boxedBubble = _boxedBubbles.find(function(b) {
                return b.bubble == bubble;
            });

            if (!boxedBubble) {
                console.log("Cannot find a boxed version for a given bubble! This should never happen.");
            } else {
                b.isActive = false;
                bubble.hide();
            }
        }

        /** End of Public Functions **/
    };
});