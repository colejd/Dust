(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Dust = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cellauto = require("./vendor/cellauto.js");

var CellAuto = _interopRequireWildcard(_cellauto);

var _worlds = require("./worlds.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dust = exports.Dust = function () {
    function Dust(container, initFinishedCallback) {
        var _this = this;

        _classCallCheck(this, Dust);

        this.container = container;

        var worldNames = Object.keys(_worlds.Worlds);
        this.worldOptions = {
            name: worldNames[worldNames.length * Math.random() << 0] // Random startup world
            //width: 128, // Can force a width/height here
            //height: 128


            // Create the app and put its canvas into `container`
        };this.app = new PIXI.Application({
            antialias: false,
            transparent: false,
            resolution: 1
        });
        this.container.appendChild(this.app.view);

        // Start the update loop
        this.app.ticker.add(function (delta) {
            _this.OnUpdate(delta);
        });

        this.framecounter = new FrameCounter(1, null);

        // Stop application wait for setup to finish
        this.app.stop();

        // Load resources needed for the program to run
        PIXI.loader.add('fragShader', '../resources/dust.frag').load(function (loader, res) {
            // Loading has finished
            _this.loadedResources = res;
            _this.Setup();
            _this.app.start();
            initFinishedCallback();
        });
    }

    /**
     * Reusable method for setting up the simulation from `this.worldOptions`.
     * Also works as a reset function if you call this without changing
     * `this.worldOptions.name` beforehand.
     */


    _createClass(Dust, [{
        key: "Setup",
        value: function Setup() {

            // Create the world from the string
            this.world = _worlds.Worlds[this.worldOptions.name].call(this, this.worldOptions.width, this.worldOptions.height);
            this.framecounter.frameFrequency = this.world.recommendedFrameFrequency || 1;

            this.app.renderer.resize(this.world.width, this.world.height);

            // Remove canvas filtering through css
            this.app.renderer.view.style.cssText = " \n            image-rendering: optimizeSpeed; \n            image-rendering: -moz-crisp-edges; \n            image-rendering: -webkit-optimize-contrast; \n            image-rendering: optimize-contrast;\n            image-rendering: -o-crisp-edges; \n            image-rendering: pixelated; \n            -ms-interpolation-mode: nearest-neighbor; \n        ";
            this.app.renderer.view.style.border = "1px dashed green";
            this.app.renderer.view.style.width = "100%";
            this.app.renderer.view.style.height = "100%";
            this.app.renderer.backgroundColor = 0xffffff;

            // Create a sprite from a blank canvas
            this.textureCanvas = document.createElement('canvas');
            this.textureCanvas.width = this.world.width;
            this.textureCanvas.height = this.world.height;
            this.textureCtx = this.textureCanvas.getContext('2d'); // Used later to update texture

            this.baseTexture = new PIXI.BaseTexture.fromCanvas(this.textureCanvas);
            this.sprite = new PIXI.Sprite(new PIXI.Texture(this.baseTexture, new PIXI.Rectangle(0, 0, this.world.width, this.world.height)));

            // Center the sprite
            this.sprite.x = this.world.width / 2;
            this.sprite.y = this.world.height / 2;
            this.sprite.anchor.set(0.5);

            // Create the shader for the sprite
            this.filter = new PIXI.Filter(null, this.loadedResources.fragShader.data);
            this.sprite.filters = [this.filter];

            this.app.stage.removeChildren(); // Remove any attached children (for case where changing presets)
            this.app.stage.addChild(this.sprite);

            // Update the texture from the initial state of the world
            this.UpdateTexture();
        }

        /**
         * Called every frame. Continues indefinitely after being called once.
         */

    }, {
        key: "OnUpdate",
        value: function OnUpdate(delta) {
            var noskip = this.framecounter.IncrementFrame();
            if (noskip) {
                this.filter.uniforms.time += delta;
                this.world.step();
                this.UpdateTexture();
                this.app.render();
            }
        }

        /**
         * Updates the texture representing the world.
         * Writes cell colors to the texture canvas and updates `baseTexture` from it,
         * which makes Pixi update the sprite.
         */

    }, {
        key: "UpdateTexture",
        value: function UpdateTexture() {

            var index = 0;
            var ctx = this.textureCtx;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);
            var pix = ctx.createImageData(this.textureCanvas.width, this.textureCanvas.height);
            for (var y = 0; y < this.textureCanvas.height; y++) {
                for (var x = 0; x < this.textureCanvas.width; x++) {
                    // Swap buffers if used
                    if (this.world.grid[y][x].newState != null) this.world.grid[y][x].state = this.world.grid[y][x].newState;
                    var paletteIndex = this.world.grid[y][x].getColor();
                    try {
                        var colorRGBA = this.world.palette[paletteIndex];
                        pix.data[index++] = colorRGBA[0];
                        pix.data[index++] = colorRGBA[1];
                        pix.data[index++] = colorRGBA[2];
                        pix.data[index++] = colorRGBA[3];
                    } catch (ex) {
                        console.error(paletteIndex);
                        throw new Error(ex);
                    }
                }
            }
            ctx.putImageData(pix, 0, 0);

            // Tell Pixi to update the texture referenced by this ctx.
            this.baseTexture.update();
        }
    }]);

    return Dust;
}();

/**
 * Convenience class for restricting the refresh rate of the simulation.
 */


var FrameCounter = function () {
    function FrameCounter(frameFrequency) {
        var frameLimit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, FrameCounter);

        // The number of frames ingested
        this.frameCount = 0;

        // The number of frames allowed to run
        this.passedFrames = 0;

        // Frame will run every `frameFrequency` frames that pass
        this.frameFrequency = frameFrequency;

        // If set, class will stop allowing frames after `frameLimit` 
        // passedFrames have been allowed.
        this.frameLimit = frameLimit;
    }

    /**
     * Returns true once every `frameFrequency` times it is called.
     */


    _createClass(FrameCounter, [{
        key: "IncrementFrame",
        value: function IncrementFrame() {
            this.frameCount += 1;
            if (this.frameCount % this.frameFrequency == 0) {
                // If we've reached the frame limit
                if (this.frameLimit != null && this.passedFrames >= this.frameLimit) return false;

                this.frameCount = 0;
                this.passedFrames += 1;
                return true;
            }
            return false;
        }
    }]);

    return FrameCounter;
}();

},{"./vendor/cellauto.js":5,"./worlds.js":6}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GUI = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _worlds = require("./worlds.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GUI = exports.GUI = function () {
    function GUI() {
        _classCallCheck(this, GUI);
    }

    _createClass(GUI, null, [{
        key: "Init",


        /**
         * Creates and attaches a GUI to the page if DAT.GUI is included.
         */
        value: function Init(dust) {
            if (typeof dat === "undefined") {
                console.warn("No DAT.GUI instance found. Import on this page to use!");
                return;
            }

            var gui = new dat.GUI();

            gui.add(dust.framecounter, 'frameFrequency').min(1).max(30).step(1).listen();

            gui.add(dust.worldOptions, 'name', Object.getOwnPropertyNames(_worlds.Worlds)).onChange(function () {
                dust.Setup();
            }).name("Preset");

            gui.add(dust, "Setup").name("Reset");
        }
    }]);

    return GUI;
}();

},{"./worlds.js":6}],3:[function(require,module,exports){
"use strict";

var _webglDetect = require("./utils/webgl-detect.js");

var _dust = require("./dust.js");

var _gui = require("./gui.js");

var container = document.getElementById("dust-container");

if (!_webglDetect.Detector.HasWebGL()) {
    //exit("WebGL is not supported on this browser.");
    console.log("WebGL is not supported on this browser.");
    container.innerHTML = _webglDetect.Detector.GetErrorHTML();
    container.classList.add("no-webgl");
} else {
    var dust = new _dust.Dust(container, function () {
        // Dust is now fully loaded
        _gui.GUI.Init(dust);
    });
}

},{"./dust.js":1,"./gui.js":2,"./utils/webgl-detect.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Detector = function () {
    function Detector() {
        _classCallCheck(this, Detector);
    }

    _createClass(Detector, null, [{
        key: "HasWebGL",


        //http://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support
        value: function HasWebGL() {
            if (!!window.WebGLRenderingContext) {
                var canvas = document.createElement("canvas"),
                    names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
                    context = false;

                for (var i = 0; i < 4; i++) {
                    try {
                        context = canvas.getContext(names[i]);
                        if (context && typeof context.getParameter == "function") {
                            // WebGL is enabled
                            return true;
                        }
                    } catch (e) {}
                }

                // WebGL is supported, but disabled
                return false;
            }
            // WebGL not supported
            return false;
        }
    }, {
        key: "GetErrorHTML",
        value: function GetErrorHTML() {
            var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (message == null) {
                message = "Your graphics card does not seem to support \n                        <a href=\"http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation\">WebGL</a>. <br>\n                        Find out how to get it <a href=\"http://get.webgl.org/\">here</a>.";
            }
            return "\n        <div class=\"no-webgl-support\">\n        <p style=\"text-align: center;\">" + message + "</p>\n        </div>\n        ";
        }
    }]);

    return Detector;
}();

exports.Detector = Detector;

},{}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function CellAutoCell(locX, locY) {
	this.x = locX;
	this.y = locY;

	this.delays = [];
}

CellAutoCell.prototype.process = function (neighbors) {
	return;
};
CellAutoCell.prototype.countSurroundingCellsWithValue = function (neighbors, value) {
	var surrounding = 0;
	for (var i = 0; i < neighbors.length; i++) {
		if (neighbors[i] !== null && neighbors[i][value]) {
			surrounding++;
		}
	}
	return surrounding;
};
CellAutoCell.prototype.delay = function (numSteps, fn) {
	this.delays.push({ steps: numSteps, action: fn });
};

CellAutoCell.prototype.reset = function (neighbors) {
	return;
};

CellAutoCell.prototype.getSurroundingCellsAverageValue = function (neighbors, value) {
	var summed = 0.0;
	for (var i = 0; i < neighbors.length; i++) {
		if (neighbors[i] !== null && (neighbors[i][value] || neighbors[i][value] === 0)) {
			summed += neighbors[i][value];
		}
	}
	return summed / neighbors.length; //cnt;
};
function CAWorld(options) {

	this.width = 24;
	this.height = 24;
	this.options = options;

	this.wrap = false;

	this.TOPLEFT = { index: 0, x: -1, y: -1 };
	this.TOP = { index: 1, x: 0, y: -1 };
	this.TOPRIGHT = { index: 2, x: 1, y: -1 };
	this.LEFT = { index: 3, x: -1, y: 0 };
	this.RIGHT = { index: 4, x: 1, y: 0 };
	this.BOTTOMLEFT = { index: 5, x: -1, y: 1 };
	this.BOTTOM = { index: 6, x: 0, y: 1 };
	this.BOTTOMRIGHT = { index: 7, x: 1, y: 1 };

	this.randomGenerator = Math.random;

	// square tiles by default, eight sides
	var neighborhood = [null, null, null, null, null, null, null, null];

	if (this.options.hexTiles) {
		// six sides
		neighborhood = [null, null, null, null, null, null];
	}
	this.step = function () {
		var y, x;
		for (y = 0; y < this.height; y++) {
			for (x = 0; x < this.width; x++) {
				this.grid[y][x].reset();
			}
		}

		// bottom up, left to right processing
		for (y = this.height - 1; y >= 0; y--) {
			for (x = this.width - 1; x >= 0; x--) {
				this.fillNeighbors(neighborhood, x, y);
				var cell = this.grid[y][x];
				cell.process(neighborhood);

				// perform any delays
				for (var i = 0; i < cell.delays.length; i++) {
					cell.delays[i].steps--;
					if (cell.delays[i].steps <= 0) {
						// perform action and remove delay
						cell.delays[i].action(cell);
						cell.delays.splice(i, 1);
						i--;
					}
				}
			}
		}
	};

	//var NEIGHBORLOCS = [{x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1}, {x:-1, y:0}, {x:1, y:0},{x:-1, y:1}, {x:0, y:1}, {x:1, y:1}];
	// square tiles by default
	var NEIGHBORLOCS = [{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return -1;
		} }, // top left
	{ diffX: function diffX() {
			return 0;
		}, diffY: function diffY() {
			return -1;
		} }, // top
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return -1;
		} }, // top right
	{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return 0;
		} }, // left
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return 0;
		} }, // right
	{ diffX: function diffX() {
			return -1;
		}, diffY: function diffY() {
			return 1;
		} }, // bottom left
	{ diffX: function diffX() {
			return 0;
		}, diffY: function diffY() {
			return 1;
		} }, // bottom
	{ diffX: function diffX() {
			return 1;
		}, diffY: function diffY() {
			return 1;
		} // bottom right
	}];
	if (this.options.hexTiles) {
		if (this.options.flatTopped) {
			// flat topped hex map,  function requires column to be passed
			NEIGHBORLOCS = [{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY(x) {
					return x % 2 ? -1 : 0;
				} }, // top left
			{ diffX: function diffX() {
					return 0;
				}, diffY: function diffY() {
					return -1;
				} }, // top
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY(x) {
					return x % 2 ? -1 : 0;
				} }, // top right
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY(x) {
					return x % 2 ? 0 : 1;
				} }, // bottom right
			{ diffX: function diffX() {
					return 0;
				}, diffY: function diffY() {
					return 1;
				} }, // bottom
			{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY(x) {
					return x % 2 ? 0 : 1;
				} // bottom left
			}];
		} else {
			// pointy topped hex map, function requires row to be passed
			NEIGHBORLOCS = [{ diffX: function diffX(x, y) {
					return y % 2 ? 0 : -1;
				}, diffY: function diffY() {
					return -1;
				} }, // top left
			{ diffX: function diffX(x, y) {
					return y % 2 ? 1 : 0;
				}, diffY: function diffY() {
					return -1;
				} }, // top right
			{ diffX: function diffX() {
					return -1;
				}, diffY: function diffY() {
					return 0;
				} }, // left
			{ diffX: function diffX() {
					return 1;
				}, diffY: function diffY() {
					return 0;
				} }, // right
			{ diffX: function diffX(x, y) {
					return y % 2 ? 0 : -1;
				}, diffY: function diffY() {
					return 1;
				} }, // bottom left
			{ diffX: function diffX(x, y) {
					return y % 2 ? 1 : 0;
				}, diffY: function diffY() {
					return 1;
				} // bottom right
			}];
		}
	}
	this.fillNeighbors = function (neighbors, x, y) {
		for (var i = 0; i < NEIGHBORLOCS.length; i++) {
			var neighborX = x + NEIGHBORLOCS[i].diffX(x, y);
			var neighborY = y + NEIGHBORLOCS[i].diffY(x, y);
			if (this.wrap) {
				// TODO: hex map support for wrapping
				neighborX = (neighborX + this.width) % this.width;
				neighborY = (neighborY + this.height) % this.height;
			}
			if (!this.wrap && (neighborX < 0 || neighborY < 0 || neighborX >= this.width || neighborY >= this.height)) {
				neighbors[i] = null;
			} else {
				neighbors[i] = this.grid[neighborY][neighborX];
			}
		}
	};

	this.initialize = function (arrayTypeDist) {

		// sort the cell types by distribution
		arrayTypeDist.sort(function (a, b) {
			return a.distribution > b.distribution ? 1 : -1;
		});

		var totalDist = 0;
		// add all distributions together
		for (var i = 0; i < arrayTypeDist.length; i++) {
			totalDist += arrayTypeDist[i].distribution;
			arrayTypeDist[i].distribution = totalDist;
		}

		this.grid = [];
		for (var y = 0; y < this.height; y++) {
			this.grid[y] = [];
			for (var x = 0; x < this.width; x++) {
				var random = this.randomGenerator() * 100;

				for (i = 0; i < arrayTypeDist.length; i++) {
					if (random <= arrayTypeDist[i].distribution) {
						this.grid[y][x] = new this.cellTypes[arrayTypeDist[i].name](x, y);
						break;
					}
				}
			}
		}
	};

	this.cellTypes = {};
	this.registerCellType = function (name, cellOptions, init) {
		this.cellTypes[name] = function (x, y) {
			CellAutoCell.call(this, x, y);

			if (init) {
				init.call(this, x, y);
			}

			if (cellOptions) {
				for (var key in cellOptions) {
					if (typeof cellOptions[key] !== 'function') {
						// properties get instance
						if (_typeof(cellOptions[key]) === 'object') {
							// objects must be cloned
							this[key] = JSON.parse(JSON.stringify(cellOptions[key]));
						} else {
							// primitive
							this[key] = cellOptions[key];
						}
					}
				}
			}
		};
		this.cellTypes[name].prototype = Object.create(CellAutoCell.prototype);
		this.cellTypes[name].prototype.constructor = this.cellTypes[name];
		this.cellTypes[name].prototype.cellType = name;

		if (cellOptions) {
			for (var key in cellOptions) {
				if (typeof cellOptions[key] === 'function') {
					// functions get prototype
					this.cellTypes[name].prototype[key] = cellOptions[key];
				}
			}
		}
	};

	// apply options
	if (options) {
		for (var key in options) {
			this[key] = options[key];
		}
	}
}

CAWorld.prototype.initializeFromGrid = function (values, initGrid) {

	this.grid = [];
	for (var y = 0; y < this.height; y++) {
		this.grid[y] = [];
		for (var x = 0; x < this.width; x++) {
			for (var i = 0; i < values.length; i++) {
				if (values[i].gridValue === initGrid[y][x]) {
					this.grid[y][x] = new this.cellTypes[values[i].name](x, y);
					break;
				}
			}
		}
	}
};

CAWorld.prototype.createGridFromValues = function (values, defaultValue) {
	var newGrid = [];

	for (var y = 0; y < this.height; y++) {
		newGrid[y] = [];
		for (var x = 0; x < this.width; x++) {
			newGrid[y][x] = defaultValue;
			var cell = this.grid[y][x];
			for (var i = 0; i < values.length; i++) {
				if (cell.cellType == values[i].cellType && cell[values[i].hasProperty]) {
					newGrid[y][x] = values[i].value;
				}
			}
		}
	}

	return newGrid;
};

;(function () {
	var CellAuto = {
		World: CAWorld,
		Cell: CellAutoCell
	};

	if (typeof define === 'function' && define.amd) {
		define('CellAuto', function () {
			return CellAuto;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = CellAuto;
	} else {
		window.CellAuto = CellAuto;
	}
})();

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Worlds = undefined;

var _cellauto = require('./vendor/cellauto.js');

var CellAuto = _interopRequireWildcard(_cellauto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Worlds = exports.Worlds = {

    /**
     * Conway's Game of Life.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Life: function Life() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [[68, 36, 52, 255], [255, 255, 255, 255]];

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.alive ? 0 : 1;
            },
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
                this.alive = surrounding === 3 || surrounding === 2 && this.alive;
            },
            reset: function reset() {
                this.wasAlive = this.alive;
            }
        }, function () {
            // Init
            this.alive = Math.random() > 0.5;
        });

        world.initialize([{ name: 'living', distribution: 100 }]);

        return world;
    },

    /**
     * CA that looks like lava.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Lava: function Lava() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // thanks to TheLastBanana on TIGSource

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.palette = [[34, 10, 21, 255], [68, 17, 26, 255], [123, 16, 16, 255], [190, 45, 16, 255], [244, 102, 20, 255], [254, 212, 97, 255]];

        var colors = [];
        var index = 0;
        for (; index < 18; ++index) {
            colors[index] = 1;
        }
        for (; index < 22; ++index) {
            colors[index] = 0;
        }
        for (; index < 25; ++index) {
            colors[index] = 1;
        }
        for (; index < 27; ++index) {
            colors[index] = 2;
        }
        for (; index < 29; ++index) {
            colors[index] = 3;
        }
        for (; index < 32; ++index) {
            colors[index] = 2;
        }
        for (; index < 35; ++index) {
            colors[index] = 0;
        }
        for (; index < 36; ++index) {
            colors[index] = 2;
        }
        for (; index < 38; ++index) {
            colors[index] = 4;
        }
        for (; index < 42; ++index) {
            colors[index] = 5;
        }
        for (; index < 44; ++index) {
            colors[index] = 4;
        }
        for (; index < 46; ++index) {
            colors[index] = 2;
        }
        for (; index < 56; ++index) {
            colors[index] = 1;
        }
        for (; index < 64; ++index) {
            colors[index] = 0;
        }

        world.registerCellType('lava', {
            getColor: function getColor() {
                var v = this.value + 0.5 + Math.sin(this.x / world.width * Math.PI) * 0.04 + Math.sin(this.y / world.height * Math.PI) * 0.04 - 0.05;
                v = Math.min(1.0, Math.max(0.0, v));

                return colors[Math.floor(colors.length * v)];
            },
            process: function process(neighbors) {
                if (this.droplet === true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 * this.value;
                            neighbors[i].prev = 0.5 * this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.998 * (2 * avg - this.prev);

                return true;
            },
            reset: function reset() {
                if (Math.random() > 0.99993) {
                    this.value = -0.25 + 0.3 * Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                } else {
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

        world.initialize([{ name: 'lava', distribution: 100 }]);

        return world;
    },

    /**
     * Generates a maze-like structure.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Maze: function Maze() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // thanks to SuperDisk on TIGSource forums!

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [[68, 36, 52, 255], [255, 255, 255, 255]];

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.alive ? 0 : 1;
            },
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');

                if (this.simulated < 20) {
                    this.alive = surrounding === 1 || surrounding === 2 && this.alive;
                }
                if (this.simulated > 20 && surrounding == 2) {
                    this.alive = true;
                }
                this.simulated += 1;
            },
            reset: function reset() {
                this.wasAlive = this.alive;
            }
        }, function () {
            //init
            this.alive = Math.random() > 0.5;
            this.simulated = 0;
        });

        world.initialize([{ name: 'living', distribution: 100 }]);

        return world;
    },

    /**
     * Cyclic rainbow automata.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CyclicRainbows: function CyclicRainbows() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.recommendedFrameFrequency = 1;

        world.palette = [[255, 0, 0, 1 * 255], [255, 96, 0, 1 * 255], [255, 191, 0, 1 * 255], [223, 255, 0, 1 * 255], [128, 255, 0, 1 * 255], [32, 255, 0, 1 * 255], [0, 255, 64, 1 * 255], [0, 255, 159, 1 * 255], [0, 255, 255, 1 * 255], [0, 159, 255, 1 * 255], [0, 64, 255, 1 * 255], [32, 0, 255, 1 * 255], [127, 0, 255, 1 * 255], [223, 0, 255, 1 * 255], [255, 0, 191, 1 * 255], [255, 0, 96, 1 * 255]];

        world.registerCellType('cyclic', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {
                var next = (this.state + Math.floor(Math.random() * 2)) % 16;

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

        world.initialize([{ name: 'cyclic', distribution: 100 }]);

        return world;
    },

    /**
     * Simulates caves and water movement.
     * 
     * From https://sanojian.github.io/cellauto
     */
    CavesWithWater: function CavesWithWater() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = this.wasOpen && surrounding >= 4 || surrounding >= 6;
            },
            reset: function reset() {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([{ name: 'wall', distribution: 100 }]);

        // generate our cave, 10 steps aught to do it
        for (var i = 0; i < 10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([{ cellType: 'wall', hasProperty: 'open', value: 0 }], 1);

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [[89, 125, 206, 0 * 255], [89, 125, 206, 1 / 9 * 255], [89, 125, 206, 2 / 9 * 255], [89, 125, 206, 3 / 9 * 255], [89, 125, 206, 4 / 9 * 255], [89, 125, 206, 5 / 9 * 255], [89, 125, 206, 6 / 9 * 255], [89, 125, 206, 7 / 9 * 255], [89, 125, 206, 8 / 9 * 255], [89, 125, 206, 1 * 255], [109, 170, 44, 1 * 255], [68, 36, 52, 1 * 255]];

        world.registerCellType('water', {
            getColor: function getColor() {
                //return 0x597DCE44;
                return this.water;
            },
            process: function process(neighbors) {
                if (this.water === 0) {
                    // already empty
                    return;
                }
                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water -= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i = 5; i <= 7; i++) {
                    if (i != world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 2));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i = 3; i <= 4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 3));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function () {
            //init
            this.water = Math.floor(Math.random() * 9);
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function getColor() {
                return this.lighted ? 10 : 11;
            },
            process: function process(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([{ name: 'rock', gridValue: 1 }, { name: 'water', gridValue: 0 }], grid);

        return world;
    },

    Rain: function Rain() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        // FIRST CREATE CAVES
        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.registerCellType('wall', {
            process: function process(neighbors) {
                var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasOpen');
                this.open = this.wasOpen && surrounding >= 4 || surrounding >= 6;
            },
            reset: function reset() {
                this.wasOpen = this.open;
            }
        }, function () {
            //init
            this.open = Math.random() > 0.40;
        });

        world.initialize([{ name: 'wall', distribution: 100 }]);

        // generate our cave, 10 steps aught to do it
        for (var i = 0; i < 10; i++) {
            world.step();
        }

        var grid = world.createGridFromValues([{ cellType: 'wall', hasProperty: 'open', value: 0 }], 1);

        // cut the top half of the caves off
        for (var y = 0; y < Math.floor(world.height / 2); y++) {
            for (var x = 0; x < world.width; x++) {
                grid[y][x] = 0;
            }
        }

        // NOW USE OUR CAVES TO CREATE A NEW WORLD CONTAINING WATER
        world = new CellAuto.World({
            width: width,
            height: height,
            clearRect: true
        });

        world.palette = [[89, 125, 206, 1], [89, 125, 206, 1 / 9 * 255], [89, 125, 206, 2 / 9 * 255], [89, 125, 206, 3 / 9 * 255], [89, 125, 206, 4 / 9 * 255], [89, 125, 206, 5 / 9 * 255], [89, 125, 206, 6 / 9 * 255], [89, 125, 206, 7 / 9 * 255], [89, 125, 206, 8 / 9 * 255], [89, 125, 206, 255], [109, 170, 44, 255], [68, 36, 52, 255]];

        world.registerCellType('air', {
            getColor: function getColor() {
                //return '89, 125, 206, ' + (this.water ? Math.max(0.3, this.water/9) : 0);
                return this.water;
            },
            process: function process(neighbors) {
                // rain on the top row
                if (neighbors[world.TOP.index] === null && Math.random() < 0.02) {
                    this.water = 5;
                } else if (this.water === 0) {
                    // already empty
                    return;
                }

                // push my water out to my available neighbors

                // cell below me will take all it can
                if (neighbors[world.BOTTOM.index] !== null && this.water && neighbors[world.BOTTOM.index].water < 9) {
                    var amt = Math.min(this.water, 9 - neighbors[world.BOTTOM.index].water);
                    this.water -= amt;
                    neighbors[world.BOTTOM.index].water += amt;
                    return;
                }

                // bottom two corners take half of what I have
                for (var i = 5; i <= 7; i++) {
                    if (i != world.BOTTOM.index && neighbors[i] !== null && this.water && neighbors[i].water < 9) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 2));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (i = 3; i <= 4; i++) {
                    if (neighbors[i] !== null && neighbors[i].water < this.water) {
                        var amt = Math.min(this.water, Math.ceil((9 - neighbors[i].water) / 3));
                        this.water -= amt;
                        neighbors[i].water += amt;
                        return;
                    }
                }
            }
        }, function () {
            //init
            this.water = 0;
        });

        world.registerCellType('rock', {
            isSolid: true,
            getColor: function getColor() {
                return this.lighted ? 10 : 11;
            },
            process: function process(neighbors) {
                this.lighted = neighbors[world.TOP.index] && !(neighbors[world.TOP.index].water === 9) && !neighbors[world.TOP.index].isSolid && neighbors[world.BOTTOM.index] && neighbors[world.BOTTOM.index].isSolid;
            }
        });

        // pass in our generated cave data
        world.initializeFromGrid([{ name: 'rock', gridValue: 1 }, { name: 'air', gridValue: 0 }], grid);

        return world;
    },

    /**
     * Simulates splashing water.
     * 
     * From https://sanojian.github.io/cellauto
     */
    Splashes: function Splashes() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height
        });

        world.palette = [];
        var colors = [];
        for (var index = 0; index < 64; index++) {
            world.palette.push([89, 125, 206, index / 64 * 255]);
            colors[index] = 63 - index;
        }

        world.registerCellType('water', {
            getColor: function getColor() {
                var v = Math.max(2 * this.value + 0.02, 0) - 0.02 + 0.5;
                return colors[Math.floor(colors.length * v)];
            },
            process: function process(neighbors) {
                if (this.droplet == true) {
                    for (var i = 0; i < neighbors.length; i++) {
                        if (neighbors[i] !== null && neighbors[i].value) {
                            neighbors[i].value = 0.5 * this.value;
                            neighbors[i].prev = 0.5 * this.prev;
                        }
                    }
                    this.droplet = false;
                    return true;
                }
                var avg = this.getSurroundingCellsAverageValue(neighbors, 'value');
                this.next = 0.99 * (2 * avg - this.prev);
                return true;
            },
            reset: function reset() {
                if (Math.random() > 0.9999) {
                    this.value = -0.2 + 0.25 * Math.random();
                    this.prev = this.value;
                    this.droplet = true;
                } else {
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

        world.initialize([{ name: 'water', distribution: 100 }]);

        return world;
    },

    /**
     * Rule 52928 - the CA used for Wolfram Alpha's loading animations
     * 
     * Resources:
     * https://www.quora.com/What-is-Wolfram-Alphas-loading-screen-a-depiction-of
     * http://jsfiddle.net/hungrycamel/9UrzJ/
     */
    Wolfram: function Wolfram() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        world.recommendedFrameFrequency = 2;

        world.palette = [[255, 255, 255, 255], // Background color
        [255, 110, 0, 255], // dark orange
        [255, 130, 0, 255], //      |
        [255, 150, 0, 255], //      |
        [255, 170, 0, 255], //      V
        [255, 180, 0, 255] // light orange
        ];

        var choice = Math.random();

        var seedList = [[[0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 2, 1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 3, 4, 2, 1, 1, 0, 0, 0], [0, 1, 1, 1, 4, 1, 1, 0, 0, 0], [0, 1, 2, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0, 2, 2, 0, 0], [0, 0, 2, 2, 0, 0, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 2, 1, 0], [0, 0, 0, 1, 1, 4, 1, 1, 1, 0], [0, 0, 0, 1, 1, 2, 4, 3, 1, 1], [0, 0, 0, 0, 1, 1, 1, 1, 2, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 1, 0, 0, 0, 0, 0, 0]], [[0, 0, 0, 0, 1, 1, 1, 0], [1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1], [0, 1, 1, 1, 0, 0, 0, 0]], [[0, 0, 1, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 0, 0]], [[0, 1, 0, 0, 0, 1, 1, 1], [1, 0, 1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 0, 0, 0, 1, 0]], [[0, 1, 1, 0, 1, 1, 1, 1], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [1, 1, 1, 1, 0, 1, 1, 0]], [[1, 1, 1, 0, 1, 1, 1, 0], [0, 1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 0, 0, 1, 0], [0, 1, 1, 1, 0, 1, 1, 1]], [[1, 1, 1, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 0, 1], [1, 1, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 1, 0, 1, 1], [1, 0, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 0, 0, 1], [1, 0, 0, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 0, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 0, 1, 0], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [0, 1, 0, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 0, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [0, 1, 0, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 0, 1, 0], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 0, 1, 1, 0], [1, 1, 1, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 0, 0], [1, 1, 0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 1, 0, 0], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 1, 1, 0], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 1, 0], [0, 1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1, 1, 1], [1, 1, 0, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 1, 1, 1], [1, 1, 1, 0, 0, 1, 0, 0], [0, 0, 1, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 1, 1]], [[1, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 1]]];

        world.registerCellType('living', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {

                var neighborOnes = neighbors.filter(function (item) {
                    return item.state == 1;
                }).length;

                if (this.state == 0) {
                    if (neighborOnes == 3 || neighborOnes == 5 || neighborOnes == 7) this.newState = 1;
                } else if (this.state == 1) {
                    if (neighborOnes == 0 || neighborOnes == 1 || neighborOnes == 2 || neighborOnes == 6 || neighborOnes == 8) this.newState = 2;
                } else if (this.state == 2) {
                    this.newState = 3;
                } else if (this.state == 3) {
                    this.newState = 4;
                } else if (this.state == 4) {
                    this.newState = 0;
                }
            },
            reset: function reset() {}
        }, function (x, y) {
            // Init 

            // 50% chance to use a seed
            if (choice < 0.5) {
                var seed;
                // 25% chance to use a random seed
                if (choice < 0.25) {
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

        world.initialize([{ name: 'living', distribution: 100 }]);

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
    BelousovZhabotinsky: function BelousovZhabotinsky() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var world = new CellAuto.World({
            width: width,
            height: height,
            wrap: true
        });

        // Override frame frequency for this setup
        world.recommendedFrameFrequency = 10;

        // Config variables
        var kernel = [// weights for neighbors. First index is for self weight
        0, 1, 1, 1, 1, 1, 1, 1, 1].reverse();
        var k1 = 5; // Lower gives higher tendency for a cell to be sickened by ill neighbors
        var k2 = 1; // Lower gives higher tendency for a cell to be sickened by infected neighbors
        var g = 5;
        var numStates = 255;

        world.palette = [];
        for (var i = 0; i < numStates; i++) {
            var gray = Math.floor(255 / numStates * i);
            world.palette.push([gray, gray, gray, 255]);
        }

        world.registerCellType('bz', {
            getColor: function getColor() {
                return this.state;
            },
            process: function process(neighbors) {
                var healthy = 0;
                var infected = 0;
                var ill = 0;
                var sumStates = this.state;

                for (var i = 0; i < neighbors.length + 1; i++) {
                    var neighbor;
                    if (i == 8) neighbor = this;else neighbor = neighbors[i];

                    //if(neighbor !== null && neighbor.state){
                    sumStates += neighbor.state * kernel[i];
                    if (kernel[i] > 0) {
                        if (neighbor.state == 0) healthy += 1;else if (neighbor.state < numStates - 1) infected += 1;else ill += 1;
                    }
                    //}
                }

                if (this.state == 0) {
                    this.newState = infected / k1 + ill / k2;
                } else if (this.state < numStates - 1) {
                    this.newState = sumStates / infected + ill + 1 + g;
                    //this.newState = (sumStates / 9) + g;
                } else {
                    this.newState = 0;
                }

                // Make sure to set state to newstate in a second pass
                this.newState = Math.max(0, Math.min(numStates - 1, Math.floor(this.newState)));
            },
            reset: function reset() {}
        }, function () {
            // Init
            // Generate a random state
            this.state = Math.random() < 1.0 ? Math.floor(Math.random() * numStates) : 0;
            this.newState = this.state;
        });

        world.initialize([{ name: 'bz', distribution: 100 }]);

        return world;
    }

};

},{"./vendor/cellauto.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZHVzdC5qcyIsInNyYy9ndWkuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy93ZWJnbC1kZXRlY3QuanMiLCJzcmMvdmVuZG9yL2NlbGxhdXRvLmpzIiwic3JjL3dvcmxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQ0FBOztJQUFZLFE7O0FBQ1o7Ozs7OztJQUVhLEksV0FBQSxJO0FBQ1Qsa0JBQVksU0FBWixFQUF1QixvQkFBdkIsRUFBNkM7QUFBQTs7QUFBQTs7QUFDekMsYUFBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBLFlBQUksYUFBYSxPQUFPLElBQVAsZ0JBQWpCO0FBQ0EsYUFBSyxZQUFMLEdBQW9CO0FBQ2hCLGtCQUFNLFdBQVcsV0FBVyxNQUFYLEdBQW9CLEtBQUssTUFBTCxFQUFwQixJQUFxQyxDQUFoRCxDQURVLENBQzBDO0FBQzFEO0FBQ0E7OztBQUdKO0FBTm9CLFNBQXBCLENBT0EsS0FBSyxHQUFMLEdBQVcsSUFBSSxLQUFLLFdBQVQsQ0FDUDtBQUNJLHVCQUFXLEtBRGY7QUFFSSx5QkFBYSxLQUZqQjtBQUdJLHdCQUFZO0FBSGhCLFNBRE8sQ0FBWDtBQU9BLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBSyxHQUFMLENBQVMsSUFBcEM7O0FBRUE7QUFDQSxhQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEdBQWhCLENBQW9CLFVBQUMsS0FBRCxFQUFXO0FBQzNCLGtCQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0gsU0FGRDs7QUFJQSxhQUFLLFlBQUwsR0FBb0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLEVBQW9CLElBQXBCLENBQXBCOztBQUVBO0FBQ0EsYUFBSyxHQUFMLENBQVMsSUFBVDs7QUFFQTtBQUNBLGFBQUssTUFBTCxDQUNLLEdBREwsQ0FDUyxZQURULEVBQ3VCLHdCQUR2QixFQUVLLElBRkwsQ0FFVSxVQUFD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RCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FB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Q0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUhKLEVBSUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUpKLEVBS0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUxKLEVBTUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQU5KLEVBT0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVBKLEVBUUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVJKLEVBU0ksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVRKLEVBVUksQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixF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d0JlLENBQWIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0ICogYXMgQ2VsbEF1dG8gZnJvbSBcIi4vdmVuZG9yL2NlbGxhdXRvLmpzXCI7XG5pbXBvcnQgeyBXb3JsZHMgfSBmcm9tIFwiLi93b3JsZHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIER1c3Qge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgaW5pdEZpbmlzaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG5cbiAgICAgICAgdmFyIHdvcmxkTmFtZXMgPSBPYmplY3Qua2V5cyhXb3JsZHMpO1xuICAgICAgICB0aGlzLndvcmxkT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIG5hbWU6IHdvcmxkTmFtZXNbd29ybGROYW1lcy5sZW5ndGggKiBNYXRoLnJhbmRvbSgpIDw8IDBdLCAvLyBSYW5kb20gc3RhcnR1cCB3b3JsZFxuICAgICAgICAgICAgLy93aWR0aDogMTI4LCAvLyBDYW4gZm9yY2UgYSB3aWR0aC9oZWlnaHQgaGVyZVxuICAgICAgICAgICAgLy9oZWlnaHQ6IDEyOFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBhcHAgYW5kIHB1dCBpdHMgY2FudmFzIGludG8gYGNvbnRhaW5lcmBcbiAgICAgICAgdGhpcy5hcHAgPSBuZXcgUElYSS5BcHBsaWNhdGlvbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhbnRpYWxpYXM6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICB0cmFuc3BhcmVudDogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHJlc29sdXRpb246IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5hcHAudmlldyk7XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIHVwZGF0ZSBsb29wXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5hZGQoKGRlbHRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLk9uVXBkYXRlKGRlbHRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcmFtZWNvdW50ZXIgPSBuZXcgRnJhbWVDb3VudGVyKDEsIG51bGwpO1xuXG4gICAgICAgIC8vIFN0b3AgYXBwbGljYXRpb24gd2FpdCBmb3Igc2V0dXAgdG8gZmluaXNoXG4gICAgICAgIHRoaXMuYXBwLnN0b3AoKTtcblxuICAgICAgICAvLyBMb2FkIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBwcm9ncmFtIHRvIHJ1blxuICAgICAgICBQSVhJLmxvYWRlclxuICAgICAgICAgICAgLmFkZCgnZnJhZ1NoYWRlcicsICcuLi9yZXNvdXJjZXMvZHVzdC5mcmFnJylcbiAgICAgICAgICAgIC5sb2FkKChsb2FkZXIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIExvYWRpbmcgaGFzIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWRSZXNvdXJjZXMgPSByZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5TZXR1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgaW5pdEZpbmlzaGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldXNhYmxlIG1ldGhvZCBmb3Igc2V0dGluZyB1cCB0aGUgc2ltdWxhdGlvbiBmcm9tIGB0aGlzLndvcmxkT3B0aW9uc2AuXG4gICAgICogQWxzbyB3b3JrcyBhcyBhIHJlc2V0IGZ1bmN0aW9uIGlmIHlvdSBjYWxsIHRoaXMgd2l0aG91dCBjaGFuZ2luZ1xuICAgICAqIGB0aGlzLndvcmxkT3B0aW9ucy5uYW1lYCBiZWZvcmVoYW5kLlxuICAgICAqL1xuICAgIFNldHVwKCkge1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgd29ybGQgZnJvbSB0aGUgc3RyaW5nXG4gICAgICAgIHRoaXMud29ybGQgPSBXb3JsZHNbdGhpcy53b3JsZE9wdGlvbnMubmFtZV0uY2FsbCh0aGlzLCB0aGlzLndvcmxkT3B0aW9ucy53aWR0aCwgdGhpcy53b3JsZE9wdGlvbnMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5mcmFtZWNvdW50ZXIuZnJhbWVGcmVxdWVuY3kgPSB0aGlzLndvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgfHwgMTtcblxuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5yZXNpemUodGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjYW52YXMgZmlsdGVyaW5nIHRocm91Z2ggY3NzXG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUuY3NzVGV4dCA9IGAgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IG9wdGltaXplU3BlZWQ7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtbW96LWNyaXNwLWVkZ2VzOyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogLXdlYmtpdC1vcHRpbWl6ZS1jb250cmFzdDsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IG9wdGltaXplLWNvbnRyYXN0O1xuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtby1jcmlzcC1lZGdlczsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IHBpeGVsYXRlZDsgXG4gICAgICAgICAgICAtbXMtaW50ZXJwb2xhdGlvbi1tb2RlOiBuZWFyZXN0LW5laWdoYm9yOyBcbiAgICAgICAgYDtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5ib3JkZXIgPSBcIjFweCBkYXNoZWQgZ3JlZW5cIjtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IgPSAweGZmZmZmZjtcblxuICAgICAgICAvLyBDcmVhdGUgYSBzcHJpdGUgZnJvbSBhIGJsYW5rIGNhbnZhc1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoID0gdGhpcy53b3JsZC53aWR0aDtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCA9IHRoaXMud29ybGQuaGVpZ2h0O1xuICAgICAgICB0aGlzLnRleHR1cmVDdHggPSB0aGlzLnRleHR1cmVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsgLy8gVXNlZCBsYXRlciB0byB1cGRhdGUgdGV4dHVyZVxuXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmUgPSBuZXcgUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMudGV4dHVyZUNhbnZhcyk7XG4gICAgICAgIHRoaXMuc3ByaXRlID0gbmV3IFBJWEkuU3ByaXRlKFxuICAgICAgICAgICAgbmV3IFBJWEkuVGV4dHVyZSh0aGlzLmJhc2VUZXh0dXJlLCBuZXcgUElYSS5SZWN0YW5nbGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQpKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENlbnRlciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuc3ByaXRlLnggPSB0aGlzLndvcmxkLndpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUueSA9IHRoaXMud29ybGQuaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUuYW5jaG9yLnNldCgwLjUpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2hhZGVyIGZvciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuZmlsdGVyID0gbmV3IFBJWEkuRmlsdGVyKG51bGwsIHRoaXMubG9hZGVkUmVzb3VyY2VzLmZyYWdTaGFkZXIuZGF0YSk7XG4gICAgICAgIHRoaXMuc3ByaXRlLmZpbHRlcnMgPSBbdGhpcy5maWx0ZXJdO1xuXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLnJlbW92ZUNoaWxkcmVuKCk7IC8vIFJlbW92ZSBhbnkgYXR0YWNoZWQgY2hpbGRyZW4gKGZvciBjYXNlIHdoZXJlIGNoYW5naW5nIHByZXNldHMpXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLmFkZENoaWxkKHRoaXMuc3ByaXRlKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHRleHR1cmUgZnJvbSB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgd29ybGRcbiAgICAgICAgdGhpcy5VcGRhdGVUZXh0dXJlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGV2ZXJ5IGZyYW1lLiBDb250aW51ZXMgaW5kZWZpbml0ZWx5IGFmdGVyIGJlaW5nIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgIE9uVXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHZhciBub3NraXAgPSB0aGlzLmZyYW1lY291bnRlci5JbmNyZW1lbnRGcmFtZSgpO1xuICAgICAgICBpZihub3NraXApIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyLnVuaWZvcm1zLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnN0ZXAoKTtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlVGV4dHVyZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHRleHR1cmUgcmVwcmVzZW50aW5nIHRoZSB3b3JsZC5cbiAgICAgKiBXcml0ZXMgY2VsbCBjb2xvcnMgdG8gdGhlIHRleHR1cmUgY2FudmFzIGFuZCB1cGRhdGVzIGBiYXNlVGV4dHVyZWAgZnJvbSBpdCxcbiAgICAgKiB3aGljaCBtYWtlcyBQaXhpIHVwZGF0ZSB0aGUgc3ByaXRlLlxuICAgICAqL1xuICAgIFVwZGF0ZVRleHR1cmUoKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy50ZXh0dXJlQ3R4O1x0XHRcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHZhciBwaXggPSBjdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XHRcdFxuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQ7IHkrKykge1x0XHRcdFxuICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLnRleHR1cmVDYW52YXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIC8vIFN3YXAgYnVmZmVycyBpZiB1c2VkXG4gICAgICAgICAgICAgICAgaWYodGhpcy53b3JsZC5ncmlkW3ldW3hdLm5ld1N0YXRlICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud29ybGQuZ3JpZFt5XVt4XS5zdGF0ZSA9IHRoaXMud29ybGQuZ3JpZFt5XVt4XS5uZXdTdGF0ZTtcbiAgICAgICAgICAgICAgICB2YXIgcGFsZXR0ZUluZGV4ID0gdGhpcy53b3JsZC5ncmlkW3ldW3hdLmdldENvbG9yKCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JSR0JBID0gdGhpcy53b3JsZC5wYWxldHRlW3BhbGV0dGVJbmRleF07XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMF07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMV07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMl07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbM107XHRcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHBhbGV0dGVJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihleCk7XG4gICAgICAgICAgICAgICAgfVx0XG4gICAgICAgICAgICB9XHRcdFxuICAgICAgICB9IFx0XHRcbiAgICAgICAgY3R4LnB1dEltYWdlRGF0YShwaXgsIDAsIDApO1xuXG4gICAgICAgIC8vIFRlbGwgUGl4aSB0byB1cGRhdGUgdGhlIHRleHR1cmUgcmVmZXJlbmNlZCBieSB0aGlzIGN0eC5cbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZS51cGRhdGUoKTtcblxuICAgIH1cblxufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIGNsYXNzIGZvciByZXN0cmljdGluZyB0aGUgcmVmcmVzaCByYXRlIG9mIHRoZSBzaW11bGF0aW9uLlxuICovXG5jbGFzcyBGcmFtZUNvdW50ZXIge1xuICAgIGNvbnN0cnVjdG9yKGZyYW1lRnJlcXVlbmN5LCBmcmFtZUxpbWl0ID0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGZyYW1lcyBpbmdlc3RlZFxuICAgICAgICB0aGlzLmZyYW1lQ291bnQgPSAwO1xuXG4gICAgICAgIC8vIFRoZSBudW1iZXIgb2YgZnJhbWVzIGFsbG93ZWQgdG8gcnVuXG4gICAgICAgIHRoaXMucGFzc2VkRnJhbWVzID0gMDtcblxuICAgICAgICAvLyBGcmFtZSB3aWxsIHJ1biBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIGZyYW1lcyB0aGF0IHBhc3NcbiAgICAgICAgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9IGZyYW1lRnJlcXVlbmN5O1xuXG4gICAgICAgIC8vIElmIHNldCwgY2xhc3Mgd2lsbCBzdG9wIGFsbG93aW5nIGZyYW1lcyBhZnRlciBgZnJhbWVMaW1pdGAgXG4gICAgICAgIC8vIHBhc3NlZEZyYW1lcyBoYXZlIGJlZW4gYWxsb3dlZC5cbiAgICAgICAgdGhpcy5mcmFtZUxpbWl0ID0gZnJhbWVMaW1pdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgb25jZSBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIHRpbWVzIGl0IGlzIGNhbGxlZC5cbiAgICAgKi9cbiAgICBJbmNyZW1lbnRGcmFtZSgpe1xuICAgICAgICB0aGlzLmZyYW1lQ291bnQgKz0gMTtcbiAgICAgICAgaWYodGhpcy5mcmFtZUNvdW50ICUgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9PSAwKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSd2ZSByZWFjaGVkIHRoZSBmcmFtZSBsaW1pdFxuICAgICAgICAgICAgaWYodGhpcy5mcmFtZUxpbWl0ICE9IG51bGwgJiYgdGhpcy5wYXNzZWRGcmFtZXMgPj0gdGhpcy5mcmFtZUxpbWl0KVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMucGFzc2VkRnJhbWVzICs9IDE7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSIsImltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgR1VJIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIGF0dGFjaGVzIGEgR1VJIHRvIHRoZSBwYWdlIGlmIERBVC5HVUkgaXMgaW5jbHVkZWQuXG4gICAgICovXG4gICAgc3RhdGljIEluaXQoZHVzdCl7XG4gICAgICAgIGlmKHR5cGVvZihkYXQpID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIERBVC5HVUkgaW5zdGFuY2UgZm91bmQuIEltcG9ydCBvbiB0aGlzIHBhZ2UgdG8gdXNlIVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBndWkgPSBuZXcgZGF0LkdVSSgpO1xuXG4gICAgICAgIGd1aS5hZGQoZHVzdC5mcmFtZWNvdW50ZXIsICdmcmFtZUZyZXF1ZW5jeScpLm1pbigxKS5tYXgoMzApLnN0ZXAoMSkubGlzdGVuKCk7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LndvcmxkT3B0aW9ucywgJ25hbWUnLCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhXb3JsZHMpKS5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICBkdXN0LlNldHVwKCk7XG4gICAgICAgIH0pLm5hbWUoXCJQcmVzZXRcIik7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LCBcIlNldHVwXCIpLm5hbWUoXCJSZXNldFwiKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBEZXRlY3RvciB9IGZyb20gXCIuL3V0aWxzL3dlYmdsLWRldGVjdC5qc1wiO1xuaW1wb3J0IHsgRHVzdCB9IGZyb20gXCIuL2R1c3QuanNcIjtcbmltcG9ydCB7IEdVSSB9IGZyb20gXCIuL2d1aS5qc1wiO1xuXG5sZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXN0LWNvbnRhaW5lclwiKTtcblxuaWYgKCAhRGV0ZWN0b3IuSGFzV2ViR0woKSApIHtcbiAgICAvL2V4aXQoXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29uc29sZS5sb2coXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IERldGVjdG9yLkdldEVycm9ySFRNTCgpO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibm8td2ViZ2xcIik7XG59XG5lbHNlIHtcbiAgICBsZXQgZHVzdCA9IG5ldyBEdXN0KGNvbnRhaW5lciwgKCkgPT4ge1xuICAgICAgICAvLyBEdXN0IGlzIG5vdyBmdWxseSBsb2FkZWRcbiAgICAgICAgR1VJLkluaXQoZHVzdCk7XG4gICAgfSk7XG59IiwiY2xhc3MgRGV0ZWN0b3Ige1xuXG4gICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExODcxMDc3L3Byb3Blci13YXktdG8tZGV0ZWN0LXdlYmdsLXN1cHBvcnRcbiAgICBzdGF0aWMgSGFzV2ViR0woKSB7XG4gICAgICAgIGlmICghIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IFtcIndlYmdsXCIsIFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIFwibW96LXdlYmdsXCIsIFwid2Via2l0LTNkXCJdLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTw0O2krKykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChuYW1lc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0LmdldFBhcmFtZXRlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYkdMIGlzIGVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZWJHTCBpcyBzdXBwb3J0ZWQsIGJ1dCBkaXNhYmxlZFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlYkdMIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBHZXRFcnJvckhUTUwobWVzc2FnZSA9IG51bGwpe1xuICAgICAgICBpZihtZXNzYWdlID09IG51bGwpe1xuICAgICAgICAgICAgbWVzc2FnZSA9IGBZb3VyIGdyYXBoaWNzIGNhcmQgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHA6Ly9raHJvbm9zLm9yZy93ZWJnbC93aWtpL0dldHRpbmdfYV9XZWJHTF9JbXBsZW1lbnRhdGlvblwiPldlYkdMPC9hPi4gPGJyPlxuICAgICAgICAgICAgICAgICAgICAgICAgRmluZCBvdXQgaG93IHRvIGdldCBpdCA8YSBocmVmPVwiaHR0cDovL2dldC53ZWJnbC5vcmcvXCI+aGVyZTwvYT4uYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibm8td2ViZ2wtc3VwcG9ydFwiPlxuICAgICAgICA8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke21lc3NhZ2V9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuICAgIH1cblxufVxuXG5leHBvcnQgeyBEZXRlY3RvciB9OyIsImZ1bmN0aW9uIENlbGxBdXRvQ2VsbChsb2NYLCBsb2NZKSB7XG5cdHRoaXMueCA9IGxvY1g7XG5cdHRoaXMueSA9IGxvY1k7XG5cblx0dGhpcy5kZWxheXMgPSBbXTtcbn1cblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1cnJvdW5kaW5nID0gMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXVt2YWx1ZV0pIHtcblx0XHRcdHN1cnJvdW5kaW5nKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBzdXJyb3VuZGluZztcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24obnVtU3RlcHMsIGZuKSB7XG5cdHRoaXMuZGVsYXlzLnB1c2goeyBzdGVwczogbnVtU3RlcHMsIGFjdGlvbjogZm4gfSk7XG59O1xuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1bW1lZCA9IDAuMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIChuZWlnaGJvcnNbaV1bdmFsdWVdIHx8IG5laWdoYm9yc1tpXVt2YWx1ZV0gPT09IDApKSB7XG5cdFx0XHRzdW1tZWQgKz0gbmVpZ2hib3JzW2ldW3ZhbHVlXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHN1bW1lZCAvIG5laWdoYm9ycy5sZW5ndGg7Ly9jbnQ7XG59O1xuZnVuY3Rpb24gQ0FXb3JsZChvcHRpb25zKSB7XG5cblx0dGhpcy53aWR0aCA9IDI0O1xuXHR0aGlzLmhlaWdodCA9IDI0O1xuXHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG5cdHRoaXMud3JhcCA9IGZhbHNlO1xuXG5cdHRoaXMuVE9QTEVGVCAgICAgICAgPSB7IGluZGV4OiAwLCB4OiAtMSwgeTogLTEgfTtcblx0dGhpcy5UT1AgICAgICAgICAgICA9IHsgaW5kZXg6IDEsIHg6ICAwLCB5OiAtMSB9O1xuXHR0aGlzLlRPUFJJR0hUICAgICAgID0geyBpbmRleDogMiwgeDogIDEsIHk6IC0xIH07XG5cdHRoaXMuTEVGVCAgICAgICAgICAgPSB7IGluZGV4OiAzLCB4OiAtMSwgeTogIDAgfTtcblx0dGhpcy5SSUdIVCAgICAgICAgICA9IHsgaW5kZXg6IDQsIHg6ICAxLCB5OiAgMCB9O1xuXHR0aGlzLkJPVFRPTUxFRlQgICAgID0geyBpbmRleDogNSwgeDogLTEsIHk6ICAxIH07XG5cdHRoaXMuQk9UVE9NICAgICAgICAgPSB7IGluZGV4OiA2LCB4OiAgMCwgeTogIDEgfTtcblx0dGhpcy5CT1RUT01SSUdIVCAgICA9IHsgaW5kZXg6IDcsIHg6ICAxLCB5OiAgMSB9O1xuXHRcblx0dGhpcy5yYW5kb21HZW5lcmF0b3IgPSBNYXRoLnJhbmRvbTtcblxuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdCwgZWlnaHQgc2lkZXNcblx0dmFyIG5laWdoYm9yaG9vZCA9IFtudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcblxuXHRpZiAodGhpcy5vcHRpb25zLmhleFRpbGVzKSB7XG5cdFx0Ly8gc2l4IHNpZGVzXG5cdFx0bmVpZ2hib3Job29kID0gW251bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xuXHR9XG5cdHRoaXMuc3RlcCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5LCB4O1xuXHRcdGZvciAoeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRcdGZvciAoeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0XHR0aGlzLmdyaWRbeV1beF0ucmVzZXQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBib3R0b20gdXAsIGxlZnQgdG8gcmlnaHQgcHJvY2Vzc2luZ1xuXHRcdGZvciAoeT10aGlzLmhlaWdodC0xOyB5Pj0wOyB5LS0pIHtcblx0XHRcdGZvciAoeD10aGlzLndpZHRoLTE7IHg+PTA7IHgtLSkge1xuXHRcdFx0XHR0aGlzLmZpbGxOZWlnaGJvcnMobmVpZ2hib3Job29kLCB4LCB5KTtcblx0XHRcdFx0dmFyIGNlbGwgPSB0aGlzLmdyaWRbeV1beF07XG5cdFx0XHRcdGNlbGwucHJvY2VzcyhuZWlnaGJvcmhvb2QpO1xuXG5cdFx0XHRcdC8vIHBlcmZvcm0gYW55IGRlbGF5c1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8Y2VsbC5kZWxheXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5zdGVwcy0tO1xuXHRcdFx0XHRcdGlmIChjZWxsLmRlbGF5c1tpXS5zdGVwcyA8PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBwZXJmb3JtIGFjdGlvbiBhbmQgcmVtb3ZlIGRlbGF5XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5hY3Rpb24oY2VsbCk7XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5cy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vdmFyIE5FSUdIQk9STE9DUyA9IFt7eDotMSwgeTotMX0sIHt4OjAsIHk6LTF9LCB7eDoxLCB5Oi0xfSwge3g6LTEsIHk6MH0sIHt4OjEsIHk6MH0se3g6LTEsIHk6MX0sIHt4OjAsIHk6MX0sIHt4OjEsIHk6MX1dO1xuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdFxuXHR2YXIgTkVJR0hCT1JMT0NTID0gW1xuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIHJpZ2h0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbVxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XTtcblx0aWYgKHRoaXMub3B0aW9ucy5oZXhUaWxlcykge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMuZmxhdFRvcHBlZCkge1xuXHRcdFx0Ly8gZmxhdCB0b3BwZWQgaGV4IG1hcCwgIGZ1bmN0aW9uIHJlcXVpcmVzIGNvbHVtbiB0byBiZSBwYXNzZWRcblx0XHRcdE5FSUdIQk9STE9DUyA9IFtcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0sICAvLyBib3R0b20gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b21cblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0gIC8vIGJvdHRvbSBsZWZ0XG5cdFx0XHRdO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIHBvaW50eSB0b3BwZWQgaGV4IG1hcCwgZnVuY3Rpb24gcmVxdWlyZXMgcm93IHRvIGJlIHBhc3NlZFxuXHRcdFx0TkVJR0hCT1JMT0NTID0gW1xuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMCA6IC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDAgOiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b20gbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XHRcdF07XG5cdFx0fVxuXG5cdH1cblx0dGhpcy5maWxsTmVpZ2hib3JzID0gZnVuY3Rpb24obmVpZ2hib3JzLCB4LCB5KSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPE5FSUdIQk9STE9DUy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5laWdoYm9yWCA9IHggKyBORUlHSEJPUkxPQ1NbaV0uZGlmZlgoeCwgeSk7XG5cdFx0XHR2YXIgbmVpZ2hib3JZID0geSArIE5FSUdIQk9STE9DU1tpXS5kaWZmWSh4LCB5KTtcblx0XHRcdGlmICh0aGlzLndyYXApIHtcblx0XHRcdFx0Ly8gVE9ETzogaGV4IG1hcCBzdXBwb3J0IGZvciB3cmFwcGluZ1xuXHRcdFx0XHRuZWlnaGJvclggPSAobmVpZ2hib3JYICsgdGhpcy53aWR0aCkgJSB0aGlzLndpZHRoO1xuXHRcdFx0XHRuZWlnaGJvclkgPSAobmVpZ2hib3JZICsgdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXRoaXMud3JhcCAmJiAobmVpZ2hib3JYIDwgMCB8fCBuZWlnaGJvclkgPCAwIHx8IG5laWdoYm9yWCA+PSB0aGlzLndpZHRoIHx8IG5laWdoYm9yWSA+PSB0aGlzLmhlaWdodCkpIHtcblx0XHRcdFx0bmVpZ2hib3JzW2ldID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuZWlnaGJvcnNbaV0gPSB0aGlzLmdyaWRbbmVpZ2hib3JZXVtuZWlnaGJvclhdO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihhcnJheVR5cGVEaXN0KSB7XG5cblx0XHQvLyBzb3J0IHRoZSBjZWxsIHR5cGVzIGJ5IGRpc3RyaWJ1dGlvblxuXHRcdGFycmF5VHlwZURpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRyZXR1cm4gYS5kaXN0cmlidXRpb24gPiBiLmRpc3RyaWJ1dGlvbiA/IDEgOiAtMTtcblx0XHR9KTtcblxuXHRcdHZhciB0b3RhbERpc3QgPSAwO1xuXHRcdC8vIGFkZCBhbGwgZGlzdHJpYnV0aW9ucyB0b2dldGhlclxuXHRcdGZvciAodmFyIGk9MDsgaTxhcnJheVR5cGVEaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0b3RhbERpc3QgKz0gYXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb247XG5cdFx0XHRhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbiA9IHRvdGFsRGlzdDtcblx0XHR9XG5cblx0XHR0aGlzLmdyaWQgPSBbXTtcblx0XHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0XHRmb3IgKHZhciB4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRcdHZhciByYW5kb20gPSB0aGlzLnJhbmRvbUdlbmVyYXRvcigpICogMTAwO1xuXG5cdFx0XHRcdGZvciAoaT0wOyBpPGFycmF5VHlwZURpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAocmFuZG9tIDw9IGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbYXJyYXlUeXBlRGlzdFtpXS5uYW1lXSh4LCB5KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNlbGxUeXBlcyA9IHt9O1xuXHR0aGlzLnJlZ2lzdGVyQ2VsbFR5cGUgPSBmdW5jdGlvbihuYW1lLCBjZWxsT3B0aW9ucywgaW5pdCkge1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0Q2VsbEF1dG9DZWxsLmNhbGwodGhpcywgeCwgeSk7XG5cblx0XHRcdGlmIChpbml0KSB7XG5cdFx0XHRcdGluaXQuY2FsbCh0aGlzLCB4LCB5KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Ly8gcHJvcGVydGllcyBnZXQgaW5zdGFuY2Vcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdFx0Ly8gb2JqZWN0cyBtdXN0IGJlIGNsb25lZFxuXHRcdFx0XHRcdFx0XHR0aGlzW2tleV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNlbGxPcHRpb25zW2tleV0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBwcmltaXRpdmVcblx0XHRcdFx0XHRcdFx0dGhpc1trZXldID0gY2VsbE9wdGlvbnNba2V5XTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2VsbEF1dG9DZWxsLnByb3RvdHlwZSk7XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhpcy5jZWxsVHlwZXNbbmFtZV07XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNlbGxUeXBlID0gbmFtZTtcblxuXHRcdGlmIChjZWxsT3B0aW9ucykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdC8vIGZ1bmN0aW9ucyBnZXQgcHJvdG90eXBlXG5cdFx0XHRcdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlW2tleV0gPSBjZWxsT3B0aW9uc1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vIGFwcGx5IG9wdGlvbnNcblx0aWYgKG9wdGlvbnMpIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuXHRcdFx0dGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuXHRcdH1cblx0fVxuXG59XG5cbkNBV29ybGQucHJvdG90eXBlLmluaXRpYWxpemVGcm9tR3JpZCAgPSBmdW5jdGlvbih2YWx1ZXMsIGluaXRHcmlkKSB7XG5cblx0dGhpcy5ncmlkID0gW107XG5cdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0Zm9yICh2YXIgeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLmdyaWRWYWx1ZSA9PT0gaW5pdEdyaWRbeV1beF0pIHtcblx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbdmFsdWVzW2ldLm5hbWVdKHgsIHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn07XG5cbkNBV29ybGQucHJvdG90eXBlLmNyZWF0ZUdyaWRGcm9tVmFsdWVzID0gZnVuY3Rpb24odmFsdWVzLCBkZWZhdWx0VmFsdWUpIHtcblx0dmFyIG5ld0dyaWQgPSBbXTtcblxuXHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdG5ld0dyaWRbeV0gPSBbXTtcblx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0bmV3R3JpZFt5XVt4XSA9IGRlZmF1bHRWYWx1ZTtcblx0XHRcdHZhciBjZWxsID0gdGhpcy5ncmlkW3ldW3hdO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY2VsbC5jZWxsVHlwZSA9PSB2YWx1ZXNbaV0uY2VsbFR5cGUgJiYgY2VsbFt2YWx1ZXNbaV0uaGFzUHJvcGVydHldKSB7XG5cdFx0XHRcdFx0bmV3R3JpZFt5XVt4XSA9IHZhbHVlc1tpXS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXdHcmlkO1xufTtcblxuOyhmdW5jdGlvbigpIHtcbiAgdmFyIENlbGxBdXRvID0ge1xuICAgIFdvcmxkOiBDQVdvcmxkLFxuICAgIENlbGw6IENlbGxBdXRvQ2VsbFxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ0NlbGxBdXRvJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIENlbGxBdXRvO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDZWxsQXV0bztcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuQ2VsbEF1dG8gPSBDZWxsQXV0bztcbiAgfVxufSkoKTsiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcblxuZXhwb3J0IHZhciBXb3JsZHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDb253YXkncyBHYW1lIG9mIExpZmUuXG4gICAgICogXG4gICAgICogRnJvbSBodHRwczovL3Nhbm9qaWFuLmdpdGh1Yi5pby9jZWxsYXV0b1xuICAgICAqL1xuICAgIExpZmU6IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWxpdmUgPyAwIDogMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzQWxpdmUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFsaXZlID0gc3Vycm91bmRpbmcgPT09IDMgfHwgc3Vycm91bmRpbmcgPT09IDIgJiYgdGhpcy5hbGl2ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzQWxpdmUgPSB0aGlzLmFsaXZlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbml0XG4gICAgICAgICAgICB0aGlzLmFsaXZlID0gTWF0aC5yYW5kb20oKSA+IDAuNTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdsaXZpbmcnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ0EgdGhhdCBsb29rcyBsaWtlIGxhdmEuXG4gICAgICogXG4gICAgICogRnJvbSBodHRwczovL3Nhbm9qaWFuLmdpdGh1Yi5pby9jZWxsYXV0b1xuICAgICAqL1xuICAgIExhdmE6IGZ1bmN0aW9uICh3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIC8vIHRoYW5rcyB0byBUaGVMYXN0QmFuYW5hIG9uIFRJR1NvdXJjZVxuXG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFszNCwxMCwyMSwyNTVdLCBbNjgsMTcsMjYsMjU1XSwgWzEyMywxNiwxNiwyNTVdLFxuICAgICAgICAgICAgWzE5MCw0NSwxNiwyNTVdLCBbMjQ0LDEwMiwyMCwyNTVdLCBbMjU0LDIxMiw5NywyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKDsgaW5kZXggPCAxODsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMTsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAyMjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMDsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAyNTsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMTsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAyNzsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMjsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAyOTsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMzsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAzMjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMjsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAzNTsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMDsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAzNjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMjsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCAzODsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gNDsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCA0MjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gNTsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCA0NDsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gNDsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCA0NjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMjsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCA1NjsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMTsgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCA2NDsgKytpbmRleCkgeyBjb2xvcnNbaW5kZXhdID0gMDsgfVxuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xhdmEnLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gdGhpcy52YWx1ZSArIDAuNVxuICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHRoaXMueCAvIHdvcmxkLndpZHRoICogTWF0aC5QSSkgKiAwLjA0XG4gICAgICAgICAgICAgICAgICAgICsgTWF0aC5zaW4odGhpcy55IC8gd29ybGQuaGVpZ2h0ICogTWF0aC5QSSkgKiAwLjA0XG4gICAgICAgICAgICAgICAgICAgIC0gMC4wNTtcbiAgICAgICAgICAgICAgICB2ID0gTWF0aC5taW4oMS4wLCBNYXRoLm1heCgwLjAsIHYpKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvcnNbTWF0aC5mbG9vcihjb2xvcnMubGVuZ3RoICogdildO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmRyb3BsZXQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnZhbHVlID0gMC41ICp0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS5wcmV2ID0gMC41ICp0aGlzLnByZXY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gdGhpcy5nZXRTdXJyb3VuZGluZ0NlbGxzQXZlcmFnZVZhbHVlKG5laWdoYm9ycywgJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gMC45OTggKiAoMiAqIGF2ZyAtIHRoaXMucHJldik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjk5OTkzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAtMC4yNSArIDAuMypNYXRoLnJhbmRvbSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BsZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMubmV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IE1hdGgubWluKDAuNSwgTWF0aC5tYXgoLTAuNSwgdGhpcy52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5uZXh0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdsYXZhJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgbWF6ZS1saWtlIHN0cnVjdHVyZS5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgTWF6ZTogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyB0aGFua3MgdG8gU3VwZXJEaXNrIG9uIFRJR1NvdXJjZSBmb3J1bXMhXG5cbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XSxcbiAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hbGl2ZSA/IDAgOiAxO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNBbGl2ZScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2ltdWxhdGVkIDwgMjApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IHN1cnJvdW5kaW5nID09PSAxIHx8IHN1cnJvdW5kaW5nID09PSAyICYmIHRoaXMuYWxpdmU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNpbXVsYXRlZCA+IDIwICYmIHN1cnJvdW5kaW5nID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2ltdWxhdGVkICs9IDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc0FsaXZlID0gdGhpcy5hbGl2ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLmFsaXZlID0gTWF0aC5yYW5kb20oKSA+IDAuNTtcbiAgICAgICAgICAgIHRoaXMuc2ltdWxhdGVkID0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdsaXZpbmcnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3ljbGljIHJhaW5ib3cgYXV0b21hdGEuXG4gICAgICogXG4gICAgICogRnJvbSBodHRwczovL3Nhbm9qaWFuLmdpdGh1Yi5pby9jZWxsYXV0b1xuICAgICAqL1xuICAgIEN5Y2xpY1JhaW5ib3dzOiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzI1NSwwLDAsMSAqIDI1NV0sIFsyNTUsOTYsMCwxICogMjU1XSwgWzI1NSwxOTEsMCwxICogMjU1XSwgWzIyMywyNTUsMCwxICogMjU1XSxcbiAgICAgICAgICAgIFsxMjgsMjU1LDAsMSAqIDI1NV0sIFszMiwyNTUsMCwxICogMjU1XSwgWzAsMjU1LDY0LDEgKiAyNTVdLCBbMCwyNTUsMTU5LDEgKiAyNTVdLFxuICAgICAgICAgICAgWzAsMjU1LDI1NSwxICogMjU1XSwgWzAsMTU5LDI1NSwxICogMjU1XSwgWzAsNjQsMjU1LDEgKiAyNTVdLCBbMzIsMCwyNTUsMSAqIDI1NV0sXG4gICAgICAgICAgICBbMTI3LDAsMjU1LDEgKiAyNTVdLCBbMjIzLDAsMjU1LDEgKiAyNTVdLCBbMjU1LDAsMTkxLDEgKiAyNTVdLCBbMjU1LDAsOTYsMSAqIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdjeWNsaWMnLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dCA9ICh0aGlzLnN0YXRlICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjIpKSAlIDE2O1xuXG4gICAgICAgICAgICAgICAgdmFyIGNoYW5naW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdpbmcgPSBjaGFuZ2luZyB8fCBuZWlnaGJvcnNbaV0uc3RhdGUgPT09IG5leHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNoYW5naW5nKSB0aGlzLnN0YXRlID0gbmV4dDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTYpO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2N5Y2xpYycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgY2F2ZXMgYW5kIHdhdGVyIG1vdmVtZW50LlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBDYXZlc1dpdGhXYXRlcjogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyBGSVJTVCBDUkVBVEUgQ0FWRVNcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3dhbGwnLCB7XG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzT3BlbicpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlbiA9ICh0aGlzLndhc09wZW4gJiYgc3Vycm91bmRpbmcgPj0gNCkgfHwgc3Vycm91bmRpbmcgPj0gNjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzT3BlbiA9IHRoaXMub3BlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLm9wZW4gPSBNYXRoLnJhbmRvbSgpID4gMC40MDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YWxsJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAvLyBnZW5lcmF0ZSBvdXIgY2F2ZSwgMTAgc3RlcHMgYXVnaHQgdG8gZG8gaXRcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPDEwOyBpKyspIHtcbiAgICAgICAgICAgIHdvcmxkLnN0ZXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBncmlkID0gd29ybGQuY3JlYXRlR3JpZEZyb21WYWx1ZXMoW1xuICAgICAgICAgICAgeyBjZWxsVHlwZTogJ3dhbGwnLCBoYXNQcm9wZXJ0eTogJ29wZW4nLCB2YWx1ZTogMCB9XG4gICAgICAgIF0sIDEpO1xuXG4gICAgICAgIC8vIE5PVyBVU0UgT1VSIENBVkVTIFRPIENSRUFURSBBIE5FVyBXT1JMRCBDT05UQUlOSU5HIFdBVEVSXG4gICAgICAgIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgY2xlYXJSZWN0OiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAwICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAyLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDQvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA1LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDcvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA4LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMSAqIDI1NV0sXG4gICAgICAgICAgICBbMTA5LCAxNzAsIDQ0LCAxICogMjU1XSxcbiAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAxICogMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3dhdGVyJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIDB4NTk3RENFNDQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2F0ZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMud2F0ZXIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHB1c2ggbXkgd2F0ZXIgb3V0IHRvIG15IGF2YWlsYWJsZSBuZWlnaGJvcnNcblxuICAgICAgICAgICAgICAgIC8vIGNlbGwgYmVsb3cgbWUgd2lsbCB0YWtlIGFsbCBpdCBjYW5cbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIDkgLSBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGJvdHRvbSB0d28gY29ybmVycyB0YWtlIGhhbGYgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTU7IGk8PTc7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSE9d29ybGQuQk9UVE9NLmluZGV4ICYmIG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1tpXS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNpZGVzIHRha2UgYSB0aGlyZCBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAoaT0zOyBpPD00OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCB0aGlzLndhdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMud2F0ZXIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgncm9jaycsIHtcbiAgICAgICAgICAgIGlzU29saWQ6IHRydWUsXG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlnaHRlZCA/IDEwIDogMTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWdodGVkID0gbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gJiYgIShuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS53YXRlciA9PT0gOSkgJiYgIW5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLmlzU29saWRcbiAgICAgICAgICAgICAgICAgICAgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0uaXNTb2xpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFzcyBpbiBvdXIgZ2VuZXJhdGVkIGNhdmUgZGF0YVxuICAgICAgICB3b3JsZC5pbml0aWFsaXplRnJvbUdyaWQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9jaycsIGdyaWRWYWx1ZTogMSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnd2F0ZXInLCBncmlkVmFsdWU6IDAgfVxuICAgICAgICBdLCBncmlkKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIFJhaW46IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBjdXQgdGhlIHRvcCBoYWxmIG9mIHRoZSBjYXZlcyBvZmZcbiAgICAgICAgZm9yICh2YXIgeT0wOyB5PE1hdGguZmxvb3Iod29ybGQuaGVpZ2h0LzIpOyB5KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHg9MDsgeDx3b3JsZC53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgZ3JpZFt5XVt4XSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDI1NV0sXG4gICAgICAgICAgICBbMTA5LCAxNzAsIDQ0LCAyNTVdLFxuICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdhaXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gJzg5LCAxMjUsIDIwNiwgJyArICh0aGlzLndhdGVyID8gTWF0aC5tYXgoMC4zLCB0aGlzLndhdGVyLzkpIDogMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2F0ZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgLy8gcmFpbiBvbiB0aGUgdG9wIHJvd1xuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XSA9PT0gbnVsbCAmJiBNYXRoLnJhbmRvbSgpIDwgMC4wMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyID0gNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy53YXRlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHJlYWR5IGVtcHR5XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGk9MzsgaTw9NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgdGhpcy53YXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgncm9jaycsIHtcbiAgICAgICAgICAgIGlzU29saWQ6IHRydWUsXG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlnaHRlZCA/IDEwIDogMTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWdodGVkID0gbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gJiYgIShuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS53YXRlciA9PT0gOSkgJiYgIW5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLmlzU29saWRcbiAgICAgICAgICAgICAgICAgICAgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0uaXNTb2xpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFzcyBpbiBvdXIgZ2VuZXJhdGVkIGNhdmUgZGF0YVxuICAgICAgICB3b3JsZC5pbml0aWFsaXplRnJvbUdyaWQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9jaycsIGdyaWRWYWx1ZTogMSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnYWlyJywgZ3JpZFZhbHVlOiAwIH1cbiAgICAgICAgXSwgZ3JpZCk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgc3BsYXNoaW5nIHdhdGVyLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBTcGxhc2hlczogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgIGZvciAodmFyIGluZGV4PTA7IGluZGV4PDY0OyBpbmRleCsrKSB7XG4gICAgICAgICAgICB3b3JsZC5wYWxldHRlLnB1c2goWzg5LCAxMjUsIDIwNiwgKGluZGV4LzY0KSAqIDI1NV0pO1xuICAgICAgICAgICAgY29sb3JzW2luZGV4XSA9IDYzIC0gaW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSAoTWF0aC5tYXgoMiAqIHRoaXMudmFsdWUgKyAwLjAyLCAwKSAtIDAuMDIpICsgMC41O1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvcnNbTWF0aC5mbG9vcihjb2xvcnMubGVuZ3RoICogdildO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmRyb3BsZXQgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0udmFsdWUgPSAwLjUgKnRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnByZXYgPSAwLjUgKnRoaXMucHJldjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BsZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhdmcgPSB0aGlzLmdldFN1cnJvdW5kaW5nQ2VsbHNBdmVyYWdlVmFsdWUobmVpZ2hib3JzLCAndmFsdWUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQgPSAwLjk5ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA+IDAuOTk5OSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMiArIDAuMjUqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMud2F0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB0aGlzLm5leHQgPSB0aGlzLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhdGVyJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1bGUgNTI5MjggLSB0aGUgQ0EgdXNlZCBmb3IgV29sZnJhbSBBbHBoYSdzIGxvYWRpbmcgYW5pbWF0aW9uc1xuICAgICAqIFxuICAgICAqIFJlc291cmNlczpcbiAgICAgKiBodHRwczovL3d3dy5xdW9yYS5jb20vV2hhdC1pcy1Xb2xmcmFtLUFscGhhcy1sb2FkaW5nLXNjcmVlbi1hLWRlcGljdGlvbi1vZlxuICAgICAqIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvaHVuZ3J5Y2FtZWwvOVVyekovXG4gICAgICovXG4gICAgV29sZnJhbTogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMjtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV0sIC8vIEJhY2tncm91bmQgY29sb3JcbiAgICAgICAgICAgIFsyNTUsIDExMCwgMCAgLCAyNTVdLCAvLyBkYXJrIG9yYW5nZVxuICAgICAgICAgICAgWzI1NSwgMTMwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTUwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTcwLCAwICAsIDI1NV0sIC8vICAgICAgVlxuICAgICAgICAgICAgWzI1NSwgMTgwLCAwICAsIDI1NV0gIC8vIGxpZ2h0IG9yYW5nZVxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBjaG9pY2UgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgIHZhciBzZWVkTGlzdCA9IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAyLCAxLCAxLCAxLCAxLCAwLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzEsIDEsIDMsIDQsIDIsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMSwgMSwgNCwgMSwgMSwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAyLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDAsIDAsIDIsIDIsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMiwgMiwgMCwgMCwgMSwgMSwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAyLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDQsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMSwgMiwgNCwgMywgMSwgMV0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAxLCAxLCAxLCAxLCAyLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDBdXG4gICAgICAgICAgICBdLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMCwgMCwgMCwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMCwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMCwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMCwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAwLCAwLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDAsIDAsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMV1dXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmVpZ2hib3JPbmVzID0gbmVpZ2hib3JzLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uc3RhdGUgPT0gMTtcbiAgICAgICAgICAgICAgICB9KS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXRlID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDMgfHwgbmVpZ2hib3JPbmVzID09IDUgfHwgbmVpZ2hib3JPbmVzID09IDcpIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDAgfHwgbmVpZ2hib3JPbmVzID09IDEgfHwgbmVpZ2hib3JPbmVzID09IDIgfHwgbmVpZ2hib3JPbmVzID09IDYgfHwgbmVpZ2hib3JPbmVzID09IDgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgLy8gSW5pdCBcblxuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byB1c2UgYSBzZWVkXG4gICAgICAgICAgICBpZihjaG9pY2UgPCAwLjUpe1xuICAgICAgICAgICAgICAgIHZhciBzZWVkO1xuICAgICAgICAgICAgICAgIC8vIDI1JSBjaGFuY2UgdG8gdXNlIGEgcmFuZG9tIHNlZWRcbiAgICAgICAgICAgICAgICBpZihjaG9pY2UgPCAwLjI1KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlZWQgPSBzZWVkTGlzdFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzZWVkTGlzdC5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gMjUlIGNoYW5jZSB0byB1c2UgdGhlIFdvbGZyYW0gc2VlZFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWVkID0gc2VlZExpc3RbMF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG1pblggPSBNYXRoLmZsb29yKHdpZHRoIC8gMikgLSBNYXRoLmZsb29yKHNlZWRbMF0ubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIG1heFggPSBNYXRoLmZsb29yKHdpZHRoIC8gMikgKyBNYXRoLmZsb29yKHNlZWRbMF0ubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIG1pblkgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpIC0gTWF0aC5mbG9vcihzZWVkLmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgICAgIHZhciBtYXhZID0gTWF0aC5mbG9vcihoZWlnaHQgLyAyKSArIE1hdGguZmxvb3Ioc2VlZC5sZW5ndGggLyAyKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNlbGwgaXMgaW5zaWRlIG9mIHRoZSBzZWVkIGFycmF5IChjZW50ZXJlZCBpbiB0aGUgd29ybGQpLCB0aGVuIHVzZSBpdHMgdmFsdWVcbiAgICAgICAgICAgICAgICBpZiAoeCA+PSBtaW5YICYmIHggPCBtYXhYICYmIHkgPj0gbWluWSAmJiB5IDwgbWF4WSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gc2VlZFt5IC0gbWluWV1beCAtIG1pblhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIGluaXRpYWxpemUgd2l0aCBub2lzZVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGgucmFuZG9tKCkgPCAwLjE1ID8gMSA6IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH0sXG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIGEgQmVsb3Vzb3YtWmhhYm90aW5za3kgcmVhY3Rpb24gKGFwcHJveGltYXRlbHkpLlxuICAgICAqIFRoaXMgb25lJ3Mgc3RpbGwgYSBsaXR0bGUgbWVzc2VkIHVwLCBzbyBjb25zaWRlciBpdCBleHBlcmltZW50YWwuXG4gICAgICogXG4gICAgICogUmVzb3VyY2VzOlxuICAgICAqIGh0dHA6Ly9jY2wubm9ydGh3ZXN0ZXJuLmVkdS9uZXRsb2dvL21vZGVscy9CLVpSZWFjdGlvblxuICAgICAqIGh0dHA6Ly93d3cuZnJhY3RhbGRlc2lnbi5uZXQvYXV0b21hdGFhbGdvcml0aG0uYXNweFxuICAgICAqL1xuICAgIEJlbG91c292WmhhYm90aW5za3k6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBmcmFtZSBmcmVxdWVuY3kgZm9yIHRoaXMgc2V0dXBcbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDEwO1xuXG4gICAgICAgIC8vIENvbmZpZyB2YXJpYWJsZXNcbiAgICAgICAgdmFyIGtlcm5lbCA9IFsgLy8gd2VpZ2h0cyBmb3IgbmVpZ2hib3JzLiBGaXJzdCBpbmRleCBpcyBmb3Igc2VsZiB3ZWlnaHRcbiAgICAgICAgIDAsIDEsIDEsIDEsXG4gICAgICAgICAgICAxLCAgICAxLFxuICAgICAgICAgICAgMSwgMSwgMVxuICAgICAgICBdLnJldmVyc2UoKTtcbiAgICAgICAgdmFyIGsxID0gNTsgLy8gTG93ZXIgZ2l2ZXMgaGlnaGVyIHRlbmRlbmN5IGZvciBhIGNlbGwgdG8gYmUgc2lja2VuZWQgYnkgaWxsIG5laWdoYm9yc1xuICAgICAgICB2YXIgazIgPSAxOyAvLyBMb3dlciBnaXZlcyBoaWdoZXIgdGVuZGVuY3kgZm9yIGEgY2VsbCB0byBiZSBzaWNrZW5lZCBieSBpbmZlY3RlZCBuZWlnaGJvcnNcbiAgICAgICAgdmFyIGcgPSA1O1xuICAgICAgICB2YXIgbnVtU3RhdGVzID0gMjU1O1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1TdGF0ZXM7IGkrKykge1xuICAgICAgICAgICAgdmFyIGdyYXkgPSBNYXRoLmZsb29yKCgyNTUgLyBudW1TdGF0ZXMpICogaSk7XG4gICAgICAgICAgICB3b3JsZC5wYWxldHRlLnB1c2goW2dyYXksIGdyYXksIGdyYXksIDI1NV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnYnonLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGVhbHRoeSA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGluZmVjdGVkID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgaWxsID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgc3VtU3RhdGVzID0gdGhpcy5zdGF0ZTtcbiAgICBcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aCArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmVpZ2hib3I7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IDgpIG5laWdoYm9yID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZWlnaGJvciA9IG5laWdoYm9yc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vaWYobmVpZ2hib3IgIT09IG51bGwgJiYgbmVpZ2hib3Iuc3RhdGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtU3RhdGVzICs9IG5laWdoYm9yLnN0YXRlICoga2VybmVsW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoa2VybmVsW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yLnN0YXRlID09IDApIGhlYWx0aHkgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKG5laWdoYm9yLnN0YXRlIDwgKG51bVN0YXRlcyAtIDEpKSBpbmZlY3RlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWxsICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKHRoaXMuc3RhdGUgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gKGluZmVjdGVkIC8gazEpICsgKGlsbCAvIGsyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPCAobnVtU3RhdGVzKSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IChzdW1TdGF0ZXMgLyBpbmZlY3RlZCArIGlsbCArIDEpICsgZztcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLm5ld1N0YXRlID0gKHN1bVN0YXRlcyAvIDkpICsgZztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdG8gc2V0IHN0YXRlIHRvIG5ld3N0YXRlIGluIGEgc2Vjb25kIHBhc3NcbiAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obnVtU3RhdGVzIC0gMSwgTWF0aC5mbG9vcih0aGlzLm5ld1N0YXRlKSkpO1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbml0XG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGgucmFuZG9tKCkgPCAxLjAgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1TdGF0ZXMpIDogMDtcbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2J6JywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfVxuXG59Il19
