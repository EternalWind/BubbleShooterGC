import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;

import src.gameplay.Board as Board;

/**
    The game scene.
**/
exports = Class(View, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        var _bg = new ImageView({
            superview: this,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height,
            image: "resources/images/game_bg.png"
        });

        var _board = new Board(
        { 
            bubbleSlotRows: 13, 
            bubbleSlotsPerRow: 9,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height,
            superview: this,
        });

        _board.on("Board:end", bind(this, function() {
            this.emit("GameScene:end");
        }));

        this.on("Application:kickoff", bind(this, function() {
            _board.reset();
        }));

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/



        /** End of Public Functions **/
    };
});