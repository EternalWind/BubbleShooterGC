import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import animate;

exports = Class(ImageView, function (supr) {
    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            offsetX: -opts.radius,
            offsetY: -opts.radius,
            width: opts.radius * 2,
            height: opts.radius * 2
        });

        supr(this, 'init', [opts]);

        this.id = opts.id;
        var _animator = animate(this);
        var _type = null;
        var _imgProvider = opts.imgProvider;

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/

        this.reset = function(type) {
            _type = type;
            this.setImage(_imgProvider.getImageFor(type));

            _animator.clear();
        };

        this.get_type = function() {
            return _type;
        }

        this.set_position = function(pos) {
            this.style.x = pos.x;
            this.style.y = pos.y;
        };

        this.get_position = function() {
            return new Point(this.style.x, this.style.y);
        }

        this.move_to = function(target, time, shouldInterrupt) {
            if (shouldInterrupt)
                return _animator.now({ x: target.x, y: target.y }, time, animate.linear);
            else
                return _animator.then({ x: target.x, y: target.y }, time, animate.linear);
        };

        this.explode = function() {
            return _animator.now({ scale: 1.5 }, 250, animate.easeOutCubic)
            .then({ scale: 0 }, 350, animate.easeInCubic);
        };

        this.drop = function(to, speed) {
            if (speed == 0) return _animator;

            var time = Math.abs(this.style.y - to) / speed * 1000;
            return _animator.now({ y: to }, time, animate.easeIn);
        };

        /** End of Public Functions **/

        this.reset(opts.type);
    };
});