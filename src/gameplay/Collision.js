import math.geom.Point as Point;

/**
    A class the represent a collision.
**/
exports = Class(function (supr) {
    this.init = function () {
        // The r-odd coordinate of the point where the collision happened.
        this.grid = new Point();

        // Whether this collision makes the bubble sticks or just bounces off.
        this.isSticking = false;

        // The normal at the point where the collision happened.
        this.collidingPointNormal = new Point();

        /** Private Functions **/
        


        /** End of Private Functions **/

        /** Public Functions **/



        /** End of Public Functions **/
    }
});