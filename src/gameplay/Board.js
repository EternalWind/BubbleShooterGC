import ui.View as View;
import ui.ImageView as ImageView;
import ui.TextView as TextView;
import math.geom.Point as Point;
import math.geom.Line as Line;
import util.ajax as ajax;

import src.gameplay.Canon as Canon;
import src.gameplay.BubblePool as BubblePool;
import src.gameplay.Collision as Collision;
import src.gameplay.BubbleSlot as BubbleSlot;
import src.helpers.MathExtends as MathExtends;

exports = Class(View, function (supr) {
    var NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW = [
            new Point(-1, 0), new Point(-1, -1), new Point(0, -1),
            new Point(1, 0), new Point(0, 1), new Point(-1, 1)
    ];
    var NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW = [
        new Point(-1, 0), new Point(0, -1), new Point(1, -1),
        new Point(1, 0), new Point(1, 1), new Point(0, 1)
    ];

    var LEFT = new Point(-1, 0);
    var RIGHT = new Point(1, 0);

    var BUBBLE_TYPES = [
    { color: "black" },
    { color: "white" },
    { color: "red" },
    { color: "blue" },
    { color: "green" },
    { color: "yellow" },
    ];

    var INITIAL_BUBBLE_DATA = [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, -1,
    -1, 2, 2, 2, 2, 2, 2, 2, -1,
    -1, 3, 3, 3, 3, 3, 3, -1, -1,
    -1, -1, 4, 4, 4, 4, 4, -1, -1,
    -1, -1, 5, 5, 5, 5, -1, -1, -1,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.init = function (opts) {
        opts = merge(opts, {
            x: 0,
            y: 0,
            width: opts.width,
            height: opts.height
        });

        supr(this, 'init', [opts]);

        var _bubbleSlotRows = opts.bubbleSlotRows;
        var _bubbleSlotsPerRow = opts.bubbleSlotsPerRow;
        
        var bubbleSlotCount = _bubbleSlotsPerRow * _bubbleSlotRows;
        var _bubbleSlots = [];
        for (var i = 0; i < bubbleSlotCount; ++i) {
            _bubbleSlots.push(new BubbleSlot());
        }

        // The width should be just enough for [_bubbleSlotsPerRow] + 0.5 bubbles
        // because the existance of horizontal offsets introduced by hexagons.
        var _bubbleRadius = opts.width / (_bubbleSlotsPerRow * 2 + 1);
        var _bubbleChainThreshold = 3;
        var _currentBubbleGeneration = 0;

        // Hexagon grid math reference: http://www.redblobgames.com/grids/hexagons/
        var _hexagonSize = _bubbleRadius / Math.cos(30 * Math.PI / 180);
        var _hexagonHeight = _hexagonSize * 2;
        var _hexagonVerticalDistance = _hexagonHeight * 3 / 4;
        var _left = 0;
        var _right = _left + opts.width;
        var _top = 0;
        var _bottom = _top + (_bubbleSlotRows - 1) * _hexagonVerticalDistance - _hexagonSize * 2;

        // To make the bubble can be shot through 1-bubble-sized gaps
        // if the player is lucky/skillful enough!
        var _collideThresholdRatio = 0.95;

        var _currentActiveBubble = null;

        var _bubblePool = new BubblePool({
            initialBubbleCount: bubbleSlotCount,
            parent: this,
            bubbleRadius: _bubbleRadius,
            defaultBubbleType: BUBBLE_TYPES[0]
        });

        var _canon = new Canon({
            superview: this,
            x: this.style.width / 2,
            y: this.style.height - 50,
            hexagonSize: _hexagonSize,
            hexagonWidth: _bubbleRadius
        });

        /** Public Functions **/



        /** End of Public Functions **/

        /** Private Functions **/

        function _is_slot_index_valid(index) {
            return index >= 0 && index < _bubbleSlots.length;
        }

        function _grid_to_index(grid) {
            return grid.x + grid.y * _bubbleSlotsPerRow;
        }

        function _flood_fill(col, row, shouldProcess, process) {
            if (col < 0 || col > _bubbleSlotsPerRow || row < 0 || row >= _bubbleSlotRows
            || typeof shouldProcess != "function" || typeof process != "function") return;

            var slotIndex = grid_to_index(col, row);

            if (!shouldProcess(_bubbleSlots[slotIndex])) return;
            process(_bubbleSlots[slotIndex]);

            var neighbourGridOffsets = (row & 1) == 1 ? 
                NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW;
            for (var i = 0; i < neighbourGridOffsets.length; ++i) {
                _flood_fill(col + neighbourGridOffsets[i].x, row + neighbourGridOffsets[i].y, shouldProcess, process);
            }
        };

        function _load_bubbles() {
            for (var i = 0; i < INITIAL_BUBBLE_DATA.length && i < _bubbleSlots.length; ++i) {
                if (INITIAL_BUBBLE_DATA[i] >= 0) {
                    _bubbleSlots[i].bubble = _generate_bubble(INITIAL_BUBBLE_DATA[i]);
                }
            }
        };

        function _arrange_bubbles_in_slots() {
            for (var row = 0; row < _bubbleSlotRows; ++row) {
                for (var col = 0; col < _bubbleSlotsPerRow; ++col) {
                    var grid = new Point(col, row);

                    var slot_index = _grid_to_index(grid);
                    var screen = HexgonMath.grid_to_screen(grid, _hexagonSize, _bubbleRadius);

                    if (_bubbleSlots[slot_index].bubble != null) {
                        _bubbleSlots[slot_index].bubble.set_position(screen);
                    }
                }
            }
        };

        function _generate_bubble(type_index) {
            if (type_index == null || type_index == undefined) {
                type_index = Math.floor(Math.random() * BUBBLE_TYPES.length);
            }

            if (type_index < 0 || type_index >= BUBBLE_TYPES.length) {
                console.log("Invalid bubble type index is given!");
            }

            var bubble = _bubblePool.spawn();
            bubble.reset(BUBBLE_TYPES[type_index]);

            return bubble;
        }

        function _collision_test(pos, dir) {
            var grid = MathExtends.screen_to_grid(pos, _hexagonSize, _bubbleRadius);
            var collision = null;

            var neighbourGridOffsets = (grid & 1) == 0 ?
                NEIGHBOUR_GRID_OFFSETS_FOR_EVEN_ROW : NEIGHBOUR_GRID_OFFSETS_FOR_ODD_ROW;

            var potentialCollidersAndDistances = [];
            for (var i = 0; i < neighbourGridOffsets.length; ++i) {
                var offset = neighbourGridOffsets[i];
                var neighbourGrid = grid + offset;
                var neighbourScreen = MathExtends.grid_to_screen(neighbourGrid, _hexagonSize, _bubbleRadius);
                var distance = new Line(pos, neighbourScreen).getLength();

                if (distance < _bubbleRadius * 2 * _collideThresholdRatio) {
                    potentialCollidersAndDistances.push({
                        colliderGrid: neighbourGrid,
                        distance: distance
                    });
                }
            }

            potentialCollidersAndDistances.sort(function(a, b) {
                return a.distance - b.distance;
            });

            for (var i = 0; i < potentialCollidersAndDistances.length; ++i)
            {
                var potentialColliderGrid = potentialCollidersAndDistances[i].colliderGrid;
                var isCollidingWithCeiling = potentialColliderGrid < 0;
                var isCollidingWithLeftWall = potentialColliderGrid.x < 0 && dir.x < 0;
                var isCollidingWithRightWall = potentialColliderGrid.x >= _bubbleSlotsPerRow && dir.x > 0;
                var isCollidingWithSideWalls = isCollidingWithLeftWall || isCollidingWithRightWall;

                var slotIndex = _grid_to_index(potentialColliderGrid);

                if (isCollidingWithSideWalls) {
                    // Colliding with a side wall.
                    collision = new Collision();
                    collision.isSticking = false;
                    collision.grid = grid;
                    collision.collidingPointNormal = isCollidingWithLeftWall ? LEFT : RIGHT;

                    break;
                } else if (isCollidingWithCeiling || _is_slot_index_valid(slotIndex) && _bubbleSlots[slotIndex].bubble) {
                    // Colliding with the ceiling or another bubble.
                    collision = new Collision();
                    collision.isSticking = true;
                    collision.grid = grid;

                    break;
                }
            }

            return collision;
        }

        function _collect_chained_bubble_slots(startingCol, startingRow, chainingBubbleType) {
            var chainedBubbleSlots = [];

            _flood_fill(startingCol, startingRow,
                function(slot) {
                    return slot.bubble && slot.bubble.get_type() == chainingBubbleType && chainedBubbleSlots.indexOf(slot) == -1;
                },
                function(slot) {
                    chainedBubbleSlots.push(slot);
            });

            return chainedBubbleSlots;
        }

        function _collect_dropping_bubble_slots(nextBubbleGeneration) {
            for (var col = 0; col < _bubbleSlotsPerRow; ++col) {
                _flood_fill(col, 0,
                    function(slot) {
                        return slot.bubble && slot.bubbleGeneration != nextBubbleGeneration;
                    },
                    function(slot) {
                        slot.bubbleGeneration = nextBubbleGeneration;
                    }
                );
            }

            return _bubbleSlots.filter(function(slot) {
                slot.bubble && slot.bubbleGeneration < nextBubbleGeneration;
            });
        }

        /** End of Private Functions **/

        this.on("InputSelect", bind(this, function(event, point) {
            var dir = new Point(x - _canon.style.x, y - _canon.style.y);

            _canon.fire(dir, _collision_test).then(function() {
                var chainedBubbles = [];
                var droppingBubbles = [];

                var bubble = _canon.get_last_bubble();
                var grid = MathExtends.screen_to_grid(new Point(bubble.style.x, bubble.style.y), 
                _hexagonSize, _bubbleRadius);

                if (grid.y < _bubbleSlotRows) {
                    var slotIndex = _grid_to_index(grid);

                    _bubbleSlots[slotIndex].bubble = bubble;
                    _bubbleSlots[slotIndex].bubbleGeneration = _currentBubbleGeneration;

                    var chainedBubbleSlots = _collect_chained_bubble_slots(grid.x, grid.y, bubble.get_type());
                    if (chainedBubbleSlots.length >= _bubbleChainThreshold) {
                        for (var i = 0; i < chainedBubbleSlots.length; ++i) {
                            chainedBubbles.push(chainedBubbleSlots[i].bubble);
                            chainedBubbleSlots[i].bubble = null;
                        }

                        var droppingBubbleSlots = _collect_dropping_bubble_slots(++_currentBubbleGeneration);
                        for (var i = 0; i < droppingBubbleSlots.length; ++i) {
                            droppingBubbles.push(droppingBubbleSlots[i].bubble);
                            droppingBubbleSlots[i].bubble = null;
                        }
                    }
                }

                for (var i = 0; i < chainedBubbles.length; ++i) {
                    var bubble = chainedBubbles[i];

                    bubble.explode().then(function() {
                        _bubblePool.despawn(bubble);
                    });
                }

                for (var i = 0; i < droppingBubbles.length; ++i) {
                    var bubble = droppingBubbles[i];

                    bubble.drop(this.style.height + 50, 200).then(function() {
                        _bubblePool.despawn(bubble);
                    });
                }

                _canon.reload(_generate_bubble());
            });
        }));

        _load_bubbles();
        _arrange_bubbles_in_slots();
    };
});