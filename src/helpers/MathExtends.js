import math.geom.Point as Point;

import src.helpers.Point3D as Point3D;

exports = {
    axial_to_cube: axial_to_cube,
    cube_round: cube_round,
    screen_to_cube: screen_to_cube,
    cube_to_grid: cube_to_grid,
    screen_to_grid: screen_to_grid,
    grid_to_screen: grid_to_screen,
    reflect: reflect
};

function axial_to_cube(axial) {
    return new Point3D(axial.x, -axial.x - axial.y, axial.y);
}

function cube_round(cube) {
    var rx = Math.round(cube.x);
    var ry = Math.round(cube.y);
    var rz = Math.round(cube.z);

    var xDiff = Math.abs(rx - cube.x);
    var yDiff = Math.abs(ry - cube.y);
    var zDiff = Math.abs(rz - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
        rx = -ry - rz;
    } else if (yDiff > zDiff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return new Point3D(rx, ry, rz);
}

function screen_to_cube(screen, hexagonSize, hexagonWidth) {
    var temp = new Point();

    temp.x = screen.x - hexagonWidth;
    temp.y = screen.y - hexagonSize;

    var axial = new Point(
        (temp.x * Math.sqrt(3) / 3 - temp.y / 3) / hexagonSize,
        temp.y * 2 / 3 / hexagonSize
    );

    return cube_round(axial_to_cube(axial));
}

function cube_to_grid(cube) {
    return new Point(cube.x + (cube.z - (cube.z & 1)) / 2, cube.z);
}

function screen_to_grid(screen, hexagonSize, hexagonWidth) {
    return cube_to_grid(screen_to_cube(screen, hexagonSize, hexagonWidth));
}

function grid_to_screen(grid, hexagonSize, hexagonWidth) {
    var x = hexagonSize * Math.sqrt(3) * (grid.x + 0.5 * (grid.y & 1));
    var y = hexagonSize * 3 / 2 * grid.y;

    return new Point(x + hexagonWidth, y + hexagonSize);
}

function reflect(dir, normal) {
    if (dir.x == 0 && dir.y == 0 || normal.x == 0 && normal.y == 0) return;

    var dot = dir.dot(normal);

    return dir.minus(normal.multiply(dot * 2));
}