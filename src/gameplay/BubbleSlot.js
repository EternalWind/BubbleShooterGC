import ui.View as View;
exports = Class(function (supr) {
    this.init = function (opts) {
        this.bubble = null;
        this.bubbleGeneration = 0;

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        this.reset = function() {
            this.bubble = null;
            this.bubbleGeneration = 0;
        }

        /** End of Public Functions **/
    };
});