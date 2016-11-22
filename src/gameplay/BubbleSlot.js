import ui.View as View;

/**
    A class to represent the bubble slot.
**/
exports = Class(function (supr) {
    this.init = function (opts) {
        // The bubble stored in this slot.
        this.bubble = null;

        // The generation of the bubble in this slot.
        this.bubbleGeneration = 0;

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        /**
            Resets this slot to empty.
        **/
        this.reset = function() {
            this.bubble = null;
            this.bubbleGeneration = 0;
        }

        /** End of Public Functions **/
    };
});