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

        var _bg = new ImageView({
            superview: this,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height,
            image: "resources/images/title_bg.png"
        });

        var _startbutton = new View({
            superview: this,
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        _startbutton.on('InputSelect', bind(this, function () {
            this.emit('TitleScene:start');
        }));
    };
});