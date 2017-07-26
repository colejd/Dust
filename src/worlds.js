import * as CellAuto from "./vendor/cellauto.js";

export var Worlds = {

    /**
     * Conway's Game of Life.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Life: function(width = 96, height = 96) {
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [
            [68, 36, 52, 255],
            [255, 255, 255, 255]
        ];

        world.registerCellType('living', {
            getColor: function () {
                return this.alive ? 0 : 1;
            },
            process: function (neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
                this.alive = surrounding === 3 || surrounding === 2 && this.alive;
            },
            reset: function () {
                this.wasAlive = this.alive;
            }
        }, function () {
            // Init
            this.alive = Math.random() > 0.5;
        });

        world.initialize([
            { name: 'living', distribution: 100 }
        ]);

        return world;
    },

    /**
     * CA that looks like lava.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Lava: function (width = 128, height = 128) {
        // thanks to TheLastBanana on TIGSource

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.palette = [
            [34,10,21,255], [68,17,26,255], [123,16,16,255],
            [190,45,16,255], [244,102,20,255], [254,212,97,255]
        ];

        var colors = [];
        var index = 0;
        for (; index < 18; ++index) { colors[index] = 1; }
        for (; index < 22; ++index) { colors[index] = 0; }
        for (; index < 25; ++index) { colors[index] = 1; }
        for (; index < 27; ++index) { colors[index] = 2; }
        for (; index < 29; ++index) { colors[index] = 3; }
        for (; index < 32; ++index) { colors[index] = 2; }
        for (; index < 35; ++index) { colors[index] = 0; }
        for (; index < 36; ++index) { colors[index] = 2; }
        for (; index < 38; ++index) { colors[index] = 4; }
        for (; index < 42; ++index) { colors[index] = 5; }
        for (; index < 44; ++index) { colors[index] = 4; }
        for (; index < 46; ++index) { colors[index] = 2; }
        for (; index < 56; ++index) { colors[index] = 1; }
        for (; index < 64; ++index) { colors[index] = 0; }

        world.registerCellType('lava', {
            getColor: function () {
                var v = this.value + 0.5
                    + Math.sin(this.x / world.width * Math.PI) * 0.04
                    + Math.sin(this.y / world.height * Math.PI) * 0.04
                    - 0.05;
                v = Math.min(1.0, Math.max(0.0, v));

                return colors[Math.floor(colors.length * v)];
            },
            process: function (neighbors) {
                if(this.droplet === true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 *this.value;
                            neighbors[i].prev = 0.5 *this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.998 * (2 * avg - this.prev);

                return true;
            },
            reset: function () {
                if(Math.random() > 0.99993) {
                    this.value = -0.25 + 0.3*Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                }
                else {
                    this.prev = this.value;
                    this.value = this.next;
                }
                this.value = Math.min(0.5, Math.max(-0.5, this.value));
                return true;
            }
        }, function () {
            //init
            this.value = 0.0;
            this.prev = this.value;
            this.next = this.value;
        });

        world.initialize([
            { name: 'lava', distribution: 100 }
        ]);

        return world;

    },

    /**
     * Generates a maze-like structure.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Maze: function(width = 128, height = 128) {
        // thanks to SuperDisk on TIGSource forums!

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [
            [68, 36, 52, 255],
            [255, 255, 255, 255]
        ];

        world.registerCellType('living', {
            getColor: function () {
                return this.alive ? 0 : 1;
            },
            process: function (neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');

                if (this.simulated < 20) {
                    this.alive = surrounding === 1 || surrounding === 2 && this.alive;
                }
                if (this.simulated > 20 && surrounding == 2) {
                    this.alive = true;
                }
                this.simulated += 1;
            },
            reset: function () {
                this.wasAlive = this.alive;
            }
        }, function () {
            //init
            this.alive = Math.random() > 0.5;
            this.simulated = 0;
        });

        world.initialize([
            { name: 'living', distribution: 100 }
        ]);

        return world;
    },

    /**
     * Cyclic rainbow automata.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CyclicRainbows: function(width = 128, height = 128) {
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.recommendedFrameFrequency = 1;

        world.palette = [
            [255,0,0,1 * 255], [255,96,0,1 * 255], [255,191,0,1 * 255], [223,255,0,1 * 255],
            [128,255,0,1 * 255], [32,255,0,1 * 255], [0,255,64,1 * 255], [0,255,159,1 * 255],
            [0,255,255,1 * 255], [0,159,255,1 * 255], [0,64,255,1 * 255], [32,0,255,1 * 255],
            [127,0,255,1 * 255], [223,0,255,1 * 255], [255,0,191,1 * 255], [255,0,96,1 * 255]
        ];

        world.registerCellType('cyclic', {
            getColor: function () {
                return this.state;
            },
            process: function (neighbors) {
                var next = (this.state + Math.floor(Math.random()*2)) % 16;

                var changing = false;
                for (var i = 0; i < neighbors.length; i++) {
                    if (neighbors[i] !== null) {
                        changing = changing || neighbors[i].state === next;
                    }
                }
                if (changing) this.state = next;
                return true;
            }
        }, function () {
            //init
            this.state = Math.floor(Math.random() * 16);
        });

        world.initialize([
            { name: 'cyclic', distribution: 100 }
        ]);

        return world;
    },

    /**
     * Simulates caves and water movement.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CavesWithWater: function(width = 128, height = 128) {
        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function (neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 6;
            },
            reset: function () {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([
            { name: 'wall', distribution: 100 }
        ]);

        // generate our cave, 10 steps aught to do it
        for (var i=0; i<10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([
            { cellType: 'wall', hasProperty: 'open', value: 0 }
        ], 1);

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [
            [89, 125, 206, 0 * 255],
            [89, 125, 206, 1/9 * 255],
            [89, 125, 206, 2/9 * 255],
            [89, 125, 206, 3/9 * 255],
            [89, 125, 206, 4/9 * 255],
            [89, 125, 206, 5/9 * 255],
            [89, 125, 206, 6/9 * 255],
            [89, 125, 206, 7/9 * 255],
            [89, 125, 206, 8/9 * 255],
            [89, 125, 206, 1 * 255],
            [109, 170, 44, 1 * 255],
            [68, 36, 52, 1 * 255]
        ];

        world.registerCellType('water', {
            getColor: function() {
                //return 0x597DCE44;
                return this.water;
            },
            process: function(neighbors) {
                if (this.water === 0) {
                    // already empty
                    return;
                }
                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water-= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i=5; i<=7; i++) {
                    if (i!=world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water)/2));
                        this.water-= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i=3; i<=4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water)/3));
                        this.water-= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function() {
            //init
            this.water = Math.floor(Math.random() * 9);
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function() {
                return this.lighted ? 10 : 11;
            },
            process: function(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid
                    && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([
            { name: 'rock', gridValue: 1 },
            { name: 'water', gridValue: 0 }
        ], grid);

        return world;
    },

    Rain: function(width = 128, height = 128) {
        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function (neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = (this.wasOpen && surrounding >= 4) || surrounding >= 6;
            },
            reset: function () {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([
            { name: 'wall', distribution: 100 }
        ]);

        // generate our cave, 10 steps aught to do it
        for (var i=0; i<10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([
            { cellType: 'wall', hasProperty: 'open', value: 0 }
        ], 1);

        // cut the top half of the caves off
        for (var y=0; y<Math.floor(world.height/2); y++) {
            for (var x=0; x<world.width; x++) {
                grid[y][x] = 0;
            }
        }

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [
            [89, 125, 206, 1],
            [89, 125, 206, 1/9 * 255],
            [89, 125, 206, 2/9 * 255],
            [89, 125, 206, 3/9 * 255],
            [89, 125, 206, 4/9 * 255],
            [89, 125, 206, 5/9 * 255],
            [89, 125, 206, 6/9 * 255],
            [89, 125, 206, 7/9 * 255],
            [89, 125, 206, 8/9 * 255],
            [89, 125, 206, 255],
            [109, 170, 44, 255],
            [68, 36, 52, 255]
        ];

        world.registerCellType('air', {
            getColor: function() {
                //return '89, 125, 206, ' + (this.water ? Math.max(0.3, this.water/9) : 0);
                return this.water;
            },
            process: function(neighbors) {
                // rain on the top row
                if (neighbors[world.TOP.index] === null && Math.random() < 0.02) {
                    this.water = 5;
                }
                else if (this.water === 0) {
                    // already empty
                    return;
                }

                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water-= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i=5; i<=7; i++) {
                    if (i!=world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water)/2));
                        this.water-= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i=3; i<=4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water)/3));
                        this.water-= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function() {
            //init
            this.water = 0;
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function() {
                return this.lighted ? 10 : 11;
            },
            process: function(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid
                    && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([
            { name: 'rock', gridValue: 1 },
            { name: 'air', gridValue: 0 }
        ], grid);

        return world;
    },

    /**
     * Simulates splashing water.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Splashes: function(width = 128, height = 128) {
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [];
        var colors = [];
        for (var index=0; index<64; index++) {
            world.palette.push([89, 125, 206, (index/64) * 255]);
            colors[index] = 63 - index;
        }

        world.registerCellType('water', {
            getColor: function () {
                var v = (Math.max(2 * this.value + 0.02, 0) - 0.02) + 0.5;
                return colors[Math.floor(colors.length * v)];
            },
            process: function (neighbors) {
                if(this.droplet == true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 *this.value;
                            neighbors[i].prev = 0.5 *this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.99 * (2 * avg - this.prev);
                return true;
            },
            reset: function () {
                if(Math.random() > 0.9999) {
                    this.value = -0.2 + 0.25*Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                }
                else {
                    this.prev = this.value;
                    this.value = this.next;
                }
                return true;
            }
        }, function () {
            //init
            this.water = true;
            this.value = 0.0;
            this.prev = this.value;
            this.next = this.value;
        });

        world.initialize([
            { name: 'water', distribution: 100 }
        ]);

        return world;
    },

    /**
     * Rule 52928 - the CA used for Wolfram Alpha's loading animations
     * 
     * Resources:
     * https://www.quora.com/What-is-Wolfram-Alphas-loading-screen-a-depiction-of
     * http://jsfiddle.net/hungrycamel/9UrzJ/
     */
    Wolfram: function(width = 96, height = 96) {
        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.recommendedFrameFrequency = 2;

        world.palette = [
            [255, 255, 255, 255], // Background color
            [255, 110, 0  , 255], // dark orange
            [255, 130, 0  , 255], //      |
            [255, 150, 0  , 255], //      |
            [255, 170, 0  , 255], //      V
            [255, 180, 0  , 255]  // light orange
        ];

        var choice = Math.random();

        var seedList = [
            [
                [0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 
                [0, 2, 1, 1, 1, 1, 0, 0, 0, 0], 
                [1, 1, 3, 4, 2, 1, 1, 0, 0, 0], 
                [0, 1, 1, 1, 4, 1, 1, 0, 0, 0], 
                [0, 1, 2, 0, 1, 1, 1, 1, 0, 0], 
                [0, 1, 1, 1, 0, 0, 2, 2, 0, 0], 
                [0, 0, 2, 2, 0, 0, 1, 1, 1, 0], 
                [0, 0, 1, 1, 1, 1, 0, 2, 1, 0], 
                [0, 0, 0, 1, 1, 4, 1, 1, 1, 0], 
                [0, 0, 0, 1, 1, 2, 4, 3, 1, 1], 
                [0, 0, 0, 0, 1, 1, 1, 1, 2, 0], 
                [0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
            ], 
            [[0, 0, 0, 0, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 0, 0, 0, 0]], 
            [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0]], 
            [[0, 0, 0, 0, 0, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 0, 0, 0, 0, 0]], 
            [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], 
            [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], 
            [[0, 0, 0, 0, 1, 1, 1, 0], [1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1], [0, 1, 1, 1, 0, 0, 0, 0]], 
            [[0, 0, 1, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 0, 0]], 
            [[0, 1, 0, 0, 0, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 0, 0, 0, 1, 0]], 
            [[0, 1, 1, 0, 1, 1, 1, 1], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [1, 1, 1, 1, 0, 1, 1, 0]], 
            [[1, 1, 1, 0, 1, 1, 1, 0], [0, 1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 1, 0], [0, 1, 1, 1, 0, 1, 1, 1]], 
            [[1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 0, 0, 1], [1, 0, 0, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 1, 0, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 1, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 1, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 1, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 0, 1, 1, 0], [1, 1, 1, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 0, 0], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 1, 1], [0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 1, 0, 0], [1, 1, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 1, 0], [0, 1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 1, 1]], 
            [[1, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 1]]
        ];

        world.registerCellType('living', {
            getColor: function () {
                return this.state;
            },
            process: function (neighbors) {

                var neighborOnes = neighbors.filter(function(item){
                    return item.state == 1;
                }).length;

                if(this.state == 0) {
                    if(neighborOnes == 3 || neighborOnes == 5 || neighborOnes == 7) 
                        this.newState = 1;
                } else if (this.state == 1) {
                    if(neighborOnes == 0 || neighborOnes == 1 || neighborOnes == 2 || neighborOnes == 6 || neighborOnes == 8)
                        this.newState = 2;
                } else if (this.state == 2) {
                    this.newState = 3;
                } else if (this.state == 3) {
                    this.newState = 4;
                } else if (this.state == 4) {
                    this.newState = 0;
                }
            },
            reset: function () {

            }
        }, function (x, y) {
            // Init 

            // 50% chance to use a seed
            if(choice < 0.5){
                var seed;
                // 25% chance to use a random seed
                if(choice < 0.25) {
                    seed = seedList[Math.floor(Math.random() * seedList.length)];
                }
                // 25% chance to use the Wolfram seed
                else {
                    seed = seedList[0];
                }

                var minX = Math.floor(width / 2) - Math.floor(seed[0].length / 2);
                var maxX = Math.floor(width / 2) + Math.floor(seed[0].length / 2);
                var minY = Math.floor(height / 2) - Math.floor(seed.length / 2);
                var maxY = Math.floor(height / 2) + Math.floor(seed.length / 2);

                this.state = 0;

                // If the cell is inside of the seed array (centered in the world), then use its value
                if (x >= minX && x < maxX && y >= minY && y < maxY) {
                    this.state = seed[y - minY][x - minX];
                }
            } 
            // 50% chance to initialize with noise
            else {
                this.state = Math.random() < 0.15 ? 1 : 0;
            }
            this.newState = this.state;
        });

        world.initialize([
           { name: 'living', distribution: 100 },
        ]);

        return world;
    },

    /**
     * Simulates a Belousov-Zhabotinsky reaction (approximately).
     * This one's still a little messed up, so consider it experimental.
     * 
     * Resources:
     * http://ccl.northwestern.edu/netlogo/models/B-ZReaction
     * http://www.fractaldesign.net/automataalgorithm.aspx
     */
    BelousovZhabotinsky: function(width = 128, height = 128) {
        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        // Override frame frequency for this setup
        world.recommendedFrameFrequency = 10;

        // Config variables
        var kernel = [ // weights for neighbors. First index is for self weight
         0, 1, 1, 1,
            1,    1,
            1, 1, 1
        ].reverse();
        var k1 = 5; // Lower gives higher tendency for a cell to be sickened by ill neighbors
        var k2 = 1; // Lower gives higher tendency for a cell to be sickened by infected neighbors
        var g = 5;
        var numStates = 255;

        world.palette = [];
        for (var i = 0; i < numStates; i++) {
            var gray = Math.floor((255 / numStates) * i);
            world.palette.push([gray, gray, gray, 255]);
        }

        world.registerCellType('bz', {
            getColor: function () {
                return this.state;
            },
            process: function (neighbors) {
                var healthy = 0;
                var infected = 0;
                var ill = 0;
                var sumStates = this.state;
    
                for(var i = 0; i < neighbors.length + 1; i++) {
                    var neighbor;
                    if (i == 8) neighbor = this;
                    else neighbor = neighbors[i];
                    
                    //if(neighbor !== null && neighbor.state){
                        sumStates += neighbor.state * kernel[i];
                        if(kernel[i] > 0) {
                            if(neighbor.state == 0) healthy += 1;
                            else if(neighbor.state < (numStates - 1)) infected += 1;
                            else ill += 1;
                        }
                    //}
                }

                if(this.state == 0) {
                    this.newState = (infected / k1) + (ill / k2);
                } else if (this.state < (numStates) - 1) {
                    this.newState = (sumStates / infected + ill + 1) + g;
                    //this.newState = (sumStates / 9) + g;
                } else {
                    this.newState = 0;
                }

                // Make sure to set state to newstate in a second pass
                this.newState = Math.max(0, Math.min(numStates - 1, Math.floor(this.newState)));

            },
            reset: function () {

            }
        }, function () {
            // Init
            // Generate a random state
            this.state = Math.random() < 1.0 ? Math.floor(Math.random() * numStates) : 0;
            this.newState = this.state;
        });

        world.initialize([
            { name: 'bz', distribution: 100 }
        ]);

        return world;
    }

}