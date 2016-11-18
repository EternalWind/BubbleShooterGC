import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;

import src.gameplay.Collision as Collision;
import src.helpers.MathExtends as MathExtends;

exports = Class(View, function (supr) {
    this.init = function (opts) {
        var _size = 50;
        var _fireSpeed = 100;

        opts = merge(opts, {
            x: 0,
            y: 0,
            offsetX: -_size / 2,
            offsetY: -_size / 2,
            width: _size,
            height: _size,
            color: "cyan"
        });

        supr(this, 'init', [opts]);

        var _nextBubble = null;
        var _canShoot = false;
        var _hexagonSize = opts.hexagonSize;
        var _hexagonWidth = opts.hexagonWidth;

        /** Private Functions **/
        
        function _bubble_marching(start, dir, step, collisionTest) {
            if (typeof collisionTest != "function") return;
            if (dir.x == 0 && dir.y == 0) return;

            var current = start;

            while (true) {
                current = current.add(dir.scale(step));

                var collision = collisionTest(current, dir);
                if (collision) {
                    return collision;
                }
            }
        };

        /** End of Private Functions **/

        /** Public Functions **/

        this.can_shoot = function() {
            return _canShoot;
        }

        this.fire = function(dir, collisionTest) {
            _canShoot = false;

            var waypoints = [];
            var currentWaypoint = new Point(_nextBubble.style.x, _nextBubble.style.y);
            
            var collision = _bubble_marching(currentWaypoint, dir, _hexagonWidth, collisionTest);
            waypoints.push(MathExtends.grid_to_screen(collision.grid, _hexagonSize, _hexagonWidth));

            var nextWaypoint = waypoints[waypoints.length - 1];

            while (!collision.isSticking) {
                dir = MathExtends.reflect(nextWaypoint.subtract(currentWaypoint).setMagnitude(1),
                collision.collidingPointNormal);

                collision = _bubble_marching(nextWaypoint, dir, _hexagonWidth, collisionTest);
                currentWaypoint = nextWaypoint;

                waypoints.push(MathExtends.grid_to-screen(collision.grid, _hexagonSize, _hexagonWidth));
            }

            var bubbleMovement = _nextBubble.move_to(waypoints.shift(), _fireSpeed, true);
            for (var i = 0; i < waypoints.length; ++i) {
                _nextBubble.move_to(waypoints[i], _fireSpeed, false);
            }

            return bubbleMovement;
        }

        this.reload = function(bubble) {
            _nextBubble = bubble;
            _nextBubble.set_position(new Point(this.style.x, this.style.y));

            _canShoot = true;
        }

        this.get_last_bubble = function() {
            return _nextBubble;
        }

        /** End of Public Functions **/
    };
});