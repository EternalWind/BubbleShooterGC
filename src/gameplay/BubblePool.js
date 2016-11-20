import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import src.gameplay.Bubble as Bubble;
import src.gameplay.BubbleImageProvider as BubbleImageProvider;

exports = Class(function (supr) {
    this.init = function (opts) {
        var _parentView = opts.parent;
        var _defaultBubbleType = opts.defaultBubbleType;

        var _nextBubbleId = 0;

        var _imgProvider = new BubbleImageProvider();

        var _boxedBubbles = [];
        for (var i = 0; i < opts.initialBubbleCount; ++i) {
            var boxedBubble = { 
                bubble: new Bubble({
                    superview: _parentView,
                    radius: opts.bubbleRadius,
                    type: _defaultBubbleType,
                    id: _nextBubbleId++,
                    imgProvider: _imgProvider
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
                        type: _defaultBubbleType,
                        id: _nextBubbleId++,
                        imgProvider: _imgProvider
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
                return b.bubble.id == bubble.id;
            });

            if (!boxedBubble) {
                console.log("Cannot find a boxed version for a given bubble! This should never happen.");
            } else {
                boxedBubble.isActive = false;
                boxedBubble.bubble.hide();
                boxedBubble.bubble.updateOpts({
                    scale: 1
                });
            }
        }

        this.despawnAll = function() {
            for (var i = 0; i < _boxedBubbles.length; ++i) {
                _boxedBubbles[i].isActive = false;
                _boxedBubbles[i].bubble.hide();
                _boxedBubbles[i].bubble.updateOpts({
                    scale: 1
                });
            }
        }

        /** End of Public Functions **/
    };
});