import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;

exports = Class(View, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        var text = new TextView({
            superview: this,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height,
            text: "Title Scene",
            color: "white"
        });

        var startbutton = new View({
            superview: this,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        startbutton.on('InputSelect', bind(this, function () {
            this.emit('TitleScene:start');
        }));
    };
});