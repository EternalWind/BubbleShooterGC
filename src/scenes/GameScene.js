import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;

import src.gameplay.Board as Board;

exports = Class(View, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        var _board = new Board(
        { 
            bubbleSlotRows: 13, 
            bubbleSlotsPerRow: 9,
            width: opts.width,
            height: opts.height,
            superview: this
        });

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/



        /** End of Public Functions **/
    };
});