import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;

exports = Class(View, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        var bubbleSlotsPerRow = opts.bubblePerRows;
        var bubbleSlotRows = opts.bubbleSlotRows;
        
        var bubbleSlotCount = bubbleSlotsPerRow * bubbleSlotRows;
        var bubbleSlots = [];
        for (var i = 0; i < bubbleSlotCount; ++i) {
            bubbleSlots.push({
                bubble: null,
                bubbleGeneration: 0
            });
        }

        // The width should be just enough for [bubbleSlotsPerRow] + 0.5 bubbles
        // because the existance of horizontal offsets introduced by hexagons.
        var bubbleRadius = opts.width / (bubbleSlotsPerRow * 2 + 1);
        var bubbleChainThreshold = 3;
        var currentBubbleGeneration = 0;

        // Hexagon grid math reference: http://www.redblobgames.com/grids/hexagons/
        var hexagonSize = bubbleRadius / Math.cos(30 * Math.PI / 180);
        var hexagonHeight = hexagonSize * 2;
        var hexagonVerticalDistance = hexagonHeight * 3 / 4;
        var bottom = (bubbleSlotRows - 1) * hexagonVerticalDistance - hexagonSize * 2;

        // To make the bubble can be shot through 1-bubble-sized gaps
        // if the player is lucky/skillful enough!
        var collideThresholdRatio = 0.95;

        var isReadyToShoot = true;
        var currentActiveBubble = null;

        var neighbourGridOffsetsForEvenRow = [
            new Point(-1, 0), new Point(-1, -1), new Point(0, -1),
            new Point(1, 0), new Point(0, 1), new Point(-1, 1)
        ];
        var neighbourGridOffsetsForOddRow = [
            new Point(-1, 0), new Point(0, -1), new Point(1, -1),
            new Point(1, 0), new Point(1, 1), new Point(0, 1)
        ];


    };
});