import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import math.geom.Vec2D as Vec2D;
import math.geom.Line as Line;

import src.gameplay.Collision as Collision;
import src.helpers.MathExtends as MathExtends;

exports = Class(View, function (supr) {
    this.init = function (opts) {
        var _size = 50;
        var _fireSpeed = 700;

        opts = merge(opts, {
            x: 0,
            y: 0,
            offsetX: -_size / 2,
            offsetY: -_size / 2,
            width: _size,
            height: _size
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

            var current = new Point(start.x, start.y);
            var offset = dir.multiply(step);

            var path = [];
            var path2 = [];

            while (true) {
                current.x += offset.x;
                current.y += offset.y;

                if (current.getMagnitude() > 2000) {
                    console.log("Possible dead-loop in bubble march!");
                    break;
                }

                path2.push(new Point(current.x, current.y));
                path.push(MathExtends.screen_to_grid(current, _hexagonSize, _hexagonWidth));

                var collision = collisionTest(current, dir);
                if (collision) {
                    return collision;
                }
            }
        };

        /** End of Private Functions **/

        /** Public Functions **/

        this.canShoot = function() {
            return _canShoot;
        }

        this.fire = function(dir, collisionTest, calibratePos) {
            if (typeof collisionTest != "function" || typeof calibratePos != "function") return;

            _canShoot = false;

            var waypoints = [];
            var currentWaypoint = new Point(_nextBubble.style.x, _nextBubble.style.y);
            
            var collision = _bubble_marching(currentWaypoint, dir, _hexagonWidth / 2, collisionTest);
            waypoints.push(MathExtends.grid_to_screen(collision.grid,
                _hexagonSize, _hexagonWidth));

            var nextWaypoint = waypoints[waypoints.length - 1];

            while (!collision.isSticking) {
                var calibratedInDir = new Vec2D({ x: nextWaypoint.x - currentWaypoint.x, y: nextWaypoint.y - currentWaypoint.y }).getUnitVector();

                dir = MathExtends.reflect(calibratedInDir,
                collision.collidingPointNormal);

                collision = _bubble_marching(nextWaypoint, dir, _hexagonWidth / 2, collisionTest);
                currentWaypoint = nextWaypoint;

                var screenPos = MathExtends.grid_to_screen(collision.grid, _hexagonSize, _hexagonWidth);
                if (!collision.isSticking) {
                    screenPos = calibratePos(screenPos, collision.grid.y);
                }

                waypoints.push(screenPos);

                nextWaypoint = waypoints[waypoints.length - 1];

                if (waypoints.length > 10) {
                    console.log("Possible dead-loop in fire.");
                    break;
                }
            }

            var lastWaypoint = _nextBubble.get_position();
            var bubbleMovement = null;
            for (var i = 0; i < waypoints.length; ++i) {
                var target = waypoints[i];
                var time = new Line(lastWaypoint, target).getLength() / _fireSpeed * 1000;

                bubbleMovement = _nextBubble.move_to(target, time, i == 0);

                lastWaypoint = target;
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