import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import animate;
import math.geom.Line as Line;

exports = Class(TextView, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            offsetX: -opts.radius,
            offsetY: -opts.radius,
            width: opts.radius * 2,
            height: opts.radius * 2,
            text: "O"
        });

        supr(this, 'init', [opts]);

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        this.reset = function(type) {
            _type = type;
            this.style.color = _type.color;
        };

        this.get_type = function() {
            return _type;
        }

        this.set_position = function(pos) {
            this.style.x = pos.x;
            this.style.y = pos.y;
        };

        this.move_to = function(target, speed, shouldInterrupt) {
            if (speed == 0) return _animator;

            var time = new Line(this.style.x, this.style.y, target.x, target.y).getLength() / speed * 1000;

            if (shouldInterrupt)
                return _animator.now({ x: target.x, y: target.y }, time, animate.LINEAR);
            else
                return _animator.then({ x: target.x, y: target.y }, time, animate.LINEAR);
        };

        this.explode = function() {
            return _animator.now({ scale: 1.5 }, 250, animate.EASE_OUT_CUBIC)
            .then({ scale: 0 }, 350, animate.EASE_IN_CUBIC);
        };

        this.drop = function(to, speed) {
            if (speed == 0) return _animator;

            var time = (this.style.y - to) / speed * 1000;
            return _animator.now({ y: to }, time, animate.EASE_IN);
        };

        /** End of Public Functions **/

        var _animator = animate(this);
        var _type = null;

        this.reset(opts.type);
    };
});