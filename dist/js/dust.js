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
            //name: worldNames[worldNames.length * Math.random() << 0], // Random startup world
            name: "CyclicRainbows"
            //width: 128, // Can force a width/height here
            //height: 128,


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

        // Stop application and wait for setup to finish
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
            try {
                this.world = _worlds.Worlds[this.worldOptions.name].call(this, this.worldOptions.width, this.worldOptions.height);
            } catch (err) {
                throw "World with the name " + this.worldOptions.name + " does not exist!";
            }
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
                    var paletteIndex = this.world.grid[y][x].getColor();
                    var colorRGBA = this.world.palette[paletteIndex];
                    if (colorRGBA != null) {
                        pix.data[index++] = colorRGBA[0];
                        pix.data[index++] = colorRGBA[1];
                        pix.data[index++] = colorRGBA[2];
                        pix.data[index++] = colorRGBA[3];
                    } else {
                        throw "Palette index out of bounds: " + paletteIndex;
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
     * Chooses a random elementary automata from a list.
     */
    RandomRule: function RandomRule() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var rules = [18, 22, 26, 54, 60, 90, 94, 110, 126, 150];
        var options = {
            width: width,
            height: height,
            rule: rules[rules.length * Math.random() << 0], // Random rule from list
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            wrap: true
        };
        return Elementary(options);
    },

    /**
     * Conway's Game of Life
     * B3/S23
     */
    Life: function Life() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 128;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 128;

        var options = {
            width: width,
            height: height,
            B: [3],
            S: [2, 3],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]]
        };
        return LifeLike(options);
    },

    /**
     * Generates a maze-like structure.
     * Based on rule B3/S1234 (Mazecetric).
     */
    Mazecetric: function Mazecetric() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [3],
            S: [1, 2, 3, 4],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 5
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.1;
        });
    },

    /**
     * B35678/S5678
     */
    Diamoeba: function Diamoeba() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [3, 5, 6, 7, 8],
            S: [5, 6, 7, 8],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 3
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.2;
        });
    },

    /**
     * B4678/S35678
     */
    Anneal: function Anneal() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 96;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 96;

        var options = {
            width: width,
            height: height,
            B: [4, 6, 7, 8],
            S: [3, 5, 6, 7, 8],
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 3
        };
        return LifeLike(options, function (x, y) {
            // Distribution function
            return Math.random() < 0.3;
        });
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
            reset: function reset() {
                this.state = this.newState;
            }
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
            reset: function reset() {
                this.state = this.newState;
            }
        }, function () {
            // Init
            // Generate a random state
            this.state = Math.random() < 1.0 ? Math.floor(Math.random() * numStates) : 0;
            this.newState = this.state;
        });

        world.initialize([{ name: 'bz', distribution: 100 }]);

        return world;
    }

    /**
     * Simulates a 1D automata.
     * Expects a property `rule` in `options`, which is the integer rule of the CA.
     * 
     * Not totally correct yet!
     * 
     */
};function Elementary(options) {
    var world = new CellAuto.World(options);

    var rule = (options.rule >>> 0).toString(2);
    while (rule.length < 8) {
        rule = "0" + rule;
    }

    console.log(options.rule);

    function processRule(leftAlive, centerAlive, rightAlive) {
        var index = 0;
        if (rightAlive) index += 1;
        if (centerAlive) index += 2;
        if (leftAlive) index += 4;
        return rule[rule.length - 1 - index];
    }

    function testRule() {
        var lastIndex = rule.length - 1;
        for (var i = 0; i < 8; i++) {
            // Convert i to binary and use it to feed processRule
            var bin = (lastIndex - i >>> 0).toString(2);
            while (bin.length < 3) {
                bin = "0" + bin;
            }var ruleOut = processRule(bin[0] == "1", bin[1] == "1", bin[2] == "1");

            console.assert(ruleOut == rule[i], bin + " " + rule[i] + " " + (ruleOut == rule[i]).toString());
        }
    }
    //testRule();

    world.registerCellType('living', {
        getColor: function getColor() {
            return this.alive ? 0 : 1;
        },
        process: function process(neighbors) {
            function getWasAlive(neighbor) {
                if (neighbor != null) return neighbor.wasAlive;
                return false;
            }

            // If the cell isn't active yet, determine its state based on its upper neighbors
            if (!this.wasAlive) {
                this.alive = processRule(getWasAlive(neighbors[0]), getWasAlive(neighbors[1]), getWasAlive(neighbors[2])) == "1";
            }
        },
        reset: function reset() {
            this.wasAlive = this.alive;
        }
    }, function (x, y) {
        // Init
        this.alive = x == Math.floor(options.width / 2) && y == 1;
        //this.alive = Math.random() < 0.01;
        //this.wasAlive = this.alive;
    });

    world.initialize([{ name: 'living', distribution: 100 }]);

    return world;
}

/**
 * Simulates a Life-like automata. Uses B/S notation.
 * See https://en.wikipedia.org/wiki/Life-like_cellular_automaton
 * 
 * Expects two additional properties in `options`:
 * `B`: An array of ints representing the B component of the rule
 * `S`: An array of ints representing the S component of the rule
 */
function LifeLike(options, distributionFunc) {
    var world = new CellAuto.World(options);

    world.registerCellType('living', {
        getColor: function getColor() {
            return this.alive ? 0 : 1;
        },
        process: function process(neighbors) {
            var surrounding = this.countSurroundingCellsWithValue(neighbors, 'wasAlive');
            this.alive = options.B.includes(surrounding) || options.S.includes(surrounding) && this.alive;
        },
        reset: function reset() {
            this.wasAlive = this.alive;
        }
    }, function (x, y) {
        // Init
        if (distributionFunc) this.alive = distributionFunc(x, y);else this.alive = Math.random() < 0.5;
    });

    world.initialize([{ name: 'living', distribution: 100 }]);

    return world;
}

},{"./vendor/cellauto.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZHVzdC5qcyIsInNyYy9ndWkuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy93ZWJnbC1kZXRlY3QuanMiLCJzcmMvdmVuZG9yL2NlbGxhdXRvLmpzIiwic3JjL3dvcmxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQ0FBOztJQUFZLFE7O0FBQ1o7Ozs7OztJQUVhLEksV0FBQSxJO0FBQ1Qsa0JBQVksU0FBWixFQUF1QixvQkFBdkIsRUFBNkM7QUFBQTs7QUFBQTs7QUFDekMsYUFBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBLFlBQUksYUFBYSxPQUFPLElBQVAsZ0JBQWpCO0FBQ0EsYUFBSyxZQUFMLEdBQW9CO0FBQ2hCO0FBQ0Esa0JBQU07QUFDTjtBQUNBOzs7QUFHSjtBQVBvQixTQUFwQixDQVFBLEtBQUssR0FBTCxHQUFXLElBQUksS0FBSyxXQUFULENBQ1A7QUFDSSx1QkFBVyxLQURmO0FBRUkseUJBQWEsS0FGakI7QUFHSSx3QkFBWTtBQUhoQixTQURPLENBQVg7QUFPQSxhQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCLEtBQUssR0FBTCxDQUFTLElBQXBDOztBQUVBO0FBQ0EsYUFBSyxHQUFMLENBQVMsTUFBVCxDQUFnQixHQUFoQixDQUFvQixVQUFDLEtBQUQsRUFBVztBQUMzQixrQkFBSyxRQUFMLENBQWMsS0FBZDtBQUNILFNBRkQ7O0FBSUEsYUFBSyxZQUFMLEdBQW9CLElBQUksWUFBSixDQUFpQixDQUFqQixFQUFvQixJQUFwQixDQUFwQjs7QUFFQTtBQUNBLGFBQUssR0FBTCxDQUFTLElBQVQ7O0FBRUE7QUFDQSxhQUFLLE1BQUwsQ0FDSyxHQURMLENBQ1MsWUFEVCxFQUN1Qix3QkFEdkIsRUFFSyxJQUZMLENBRVUsVUFBQyxNQUFELEVBQVMsR0FBVCxFQUFpQjtBQUNuQjtBQUNBLGtCQUFLLGVBQUwsR0FBdUIsR0FBdkI7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Q0FBcEIsQ0FBYixDQURKLEtBR0ksS0FBSyxLQUFMLEdBQWEsS0FBSyxNQUFMLEtBQWdCLEdBQTdCO0FBQ1AsS0FqQkQ7O0FBbUJBLFVBQU0sVUFBTixDQUFpQixDQUNiLEVBQUUsTUFBTSxRQUFSLEVBQWtCLGNBQWMsR0FBaEMsRUFEYSxDQUFqQjs7QUFJQSxXQUFPLEtBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcbmltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRHVzdCB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBpbml0RmluaXNoZWRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgICAgICB2YXIgd29ybGROYW1lcyA9IE9iamVjdC5rZXlzKFdvcmxkcyk7XG4gICAgICAgIHRoaXMud29ybGRPcHRpb25zID0ge1xuICAgICAgICAgICAgLy9uYW1lOiB3b3JsZE5hbWVzW3dvcmxkTmFtZXMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXSwgLy8gUmFuZG9tIHN0YXJ0dXAgd29ybGRcbiAgICAgICAgICAgIG5hbWU6IFwiQ3ljbGljUmFpbmJvd3NcIixcbiAgICAgICAgICAgIC8vd2lkdGg6IDEyOCwgLy8gQ2FuIGZvcmNlIGEgd2lkdGgvaGVpZ2h0IGhlcmVcbiAgICAgICAgICAgIC8vaGVpZ2h0OiAxMjgsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGFwcCBhbmQgcHV0IGl0cyBjYW52YXMgaW50byBgY29udGFpbmVyYFxuICAgICAgICB0aGlzLmFwcCA9IG5ldyBQSVhJLkFwcGxpY2F0aW9uKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFudGlhbGlhczogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHRyYW5zcGFyZW50OiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogMVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC52aWV3KTtcblxuICAgICAgICAvLyBTdGFydCB0aGUgdXBkYXRlIGxvb3BcbiAgICAgICAgdGhpcy5hcHAudGlja2VyLmFkZCgoZGVsdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuT25VcGRhdGUoZGVsdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZyYW1lY291bnRlciA9IG5ldyBGcmFtZUNvdW50ZXIoMSwgbnVsbCk7XG5cbiAgICAgICAgLy8gU3RvcCBhcHBsaWNhdGlvbiBhbmQgd2FpdCBmb3Igc2V0dXAgdG8gZmluaXNoXG4gICAgICAgIHRoaXMuYXBwLnN0b3AoKTtcblxuICAgICAgICAvLyBMb2FkIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBwcm9ncmFtIHRvIHJ1blxuICAgICAgICBQSVhJLmxvYWRlclxuICAgICAgICAgICAgLmFkZCgnZnJhZ1NoYWRlcicsICcuLi9yZXNvdXJjZXMvZHVzdC5mcmFnJylcbiAgICAgICAgICAgIC5sb2FkKChsb2FkZXIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIExvYWRpbmcgaGFzIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWRSZXNvdXJjZXMgPSByZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5TZXR1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgaW5pdEZpbmlzaGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldXNhYmxlIG1ldGhvZCBmb3Igc2V0dGluZyB1cCB0aGUgc2ltdWxhdGlvbiBmcm9tIGB0aGlzLndvcmxkT3B0aW9uc2AuXG4gICAgICogQWxzbyB3b3JrcyBhcyBhIHJlc2V0IGZ1bmN0aW9uIGlmIHlvdSBjYWxsIHRoaXMgd2l0aG91dCBjaGFuZ2luZ1xuICAgICAqIGB0aGlzLndvcmxkT3B0aW9ucy5uYW1lYCBiZWZvcmVoYW5kLlxuICAgICAqL1xuICAgIFNldHVwKCkge1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgd29ybGQgZnJvbSB0aGUgc3RyaW5nXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkID0gV29ybGRzW3RoaXMud29ybGRPcHRpb25zLm5hbWVdLmNhbGwodGhpcywgdGhpcy53b3JsZE9wdGlvbnMud2lkdGgsIHRoaXMud29ybGRPcHRpb25zLmhlaWdodCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgXCJXb3JsZCB3aXRoIHRoZSBuYW1lIFwiICsgdGhpcy53b3JsZE9wdGlvbnMubmFtZSArIFwiIGRvZXMgbm90IGV4aXN0IVwiO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZnJhbWVjb3VudGVyLmZyYW1lRnJlcXVlbmN5ID0gdGhpcy53b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5IHx8IDE7XG5cbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIucmVzaXplKHRoaXMud29ybGQud2lkdGgsIHRoaXMud29ybGQuaGVpZ2h0KTtcblxuICAgICAgICAvLyBSZW1vdmUgY2FudmFzIGZpbHRlcmluZyB0aHJvdWdoIGNzc1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmNzc1RleHQgPSBgIFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiBvcHRpbWl6ZVNwZWVkOyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogLW1vei1jcmlzcC1lZGdlczsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IC13ZWJraXQtb3B0aW1pemUtY29udHJhc3Q7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiBvcHRpbWl6ZS1jb250cmFzdDtcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogLW8tY3Jpc3AtZWRnZXM7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiBwaXhlbGF0ZWQ7IFxuICAgICAgICAgICAgLW1zLWludGVycG9sYXRpb24tbW9kZTogbmVhcmVzdC1uZWlnaGJvcjsgXG4gICAgICAgIGA7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUuYm9yZGVyID0gXCIxcHggZGFzaGVkIGdyZWVuXCI7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUud2lkdGggPSBcIjEwMCVcIjtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIuYmFja2dyb3VuZENvbG9yID0gMHhmZmZmZmY7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgc3ByaXRlIGZyb20gYSBibGFuayBjYW52YXNcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCA9IHRoaXMud29ybGQud2lkdGg7XG4gICAgICAgIHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQgPSB0aGlzLndvcmxkLmhlaWdodDtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ3R4ID0gdGhpcy50ZXh0dXJlQ2FudmFzLmdldENvbnRleHQoJzJkJyk7IC8vIFVzZWQgbGF0ZXIgdG8gdXBkYXRlIHRleHR1cmVcblxuICAgICAgICB0aGlzLmJhc2VUZXh0dXJlID0gbmV3IFBJWEkuQmFzZVRleHR1cmUuZnJvbUNhbnZhcyh0aGlzLnRleHR1cmVDYW52YXMpO1xuICAgICAgICB0aGlzLnNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZShcbiAgICAgICAgICAgIG5ldyBQSVhJLlRleHR1cmUodGhpcy5iYXNlVGV4dHVyZSwgbmV3IFBJWEkuUmVjdGFuZ2xlKDAsIDAsIHRoaXMud29ybGQud2lkdGgsIHRoaXMud29ybGQuaGVpZ2h0KSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBDZW50ZXIgdGhlIHNwcml0ZVxuICAgICAgICB0aGlzLnNwcml0ZS54ID0gdGhpcy53b3JsZC53aWR0aCAvIDI7XG4gICAgICAgIHRoaXMuc3ByaXRlLnkgPSB0aGlzLndvcmxkLmhlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNoYWRlciBmb3IgdGhlIHNwcml0ZVxuICAgICAgICB0aGlzLmZpbHRlciA9IG5ldyBQSVhJLkZpbHRlcihudWxsLCB0aGlzLmxvYWRlZFJlc291cmNlcy5mcmFnU2hhZGVyLmRhdGEpO1xuICAgICAgICB0aGlzLnNwcml0ZS5maWx0ZXJzID0gW3RoaXMuZmlsdGVyXTtcblxuICAgICAgICB0aGlzLmFwcC5zdGFnZS5yZW1vdmVDaGlsZHJlbigpOyAvLyBSZW1vdmUgYW55IGF0dGFjaGVkIGNoaWxkcmVuIChmb3IgY2FzZSB3aGVyZSBjaGFuZ2luZyBwcmVzZXRzKVxuICAgICAgICB0aGlzLmFwcC5zdGFnZS5hZGRDaGlsZCh0aGlzLnNwcml0ZSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSB0ZXh0dXJlIGZyb20gdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIHdvcmxkXG4gICAgICAgIHRoaXMuVXBkYXRlVGV4dHVyZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBldmVyeSBmcmFtZS4gQ29udGludWVzIGluZGVmaW5pdGVseSBhZnRlciBiZWluZyBjYWxsZWQgb25jZS5cbiAgICAgKi9cbiAgICBPblVwZGF0ZShkZWx0YSkge1xuICAgICAgICB2YXIgbm9za2lwID0gdGhpcy5mcmFtZWNvdW50ZXIuSW5jcmVtZW50RnJhbWUoKTtcbiAgICAgICAgaWYobm9za2lwKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlci51bmlmb3Jtcy50aW1lICs9IGRlbHRhO1xuICAgICAgICAgICAgdGhpcy53b3JsZC5zdGVwKCk7XG4gICAgICAgICAgICB0aGlzLlVwZGF0ZVRleHR1cmUoKTtcbiAgICAgICAgICAgIHRoaXMuYXBwLnJlbmRlcigpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSB0ZXh0dXJlIHJlcHJlc2VudGluZyB0aGUgd29ybGQuXG4gICAgICogV3JpdGVzIGNlbGwgY29sb3JzIHRvIHRoZSB0ZXh0dXJlIGNhbnZhcyBhbmQgdXBkYXRlcyBgYmFzZVRleHR1cmVgIGZyb20gaXQsXG4gICAgICogd2hpY2ggbWFrZXMgUGl4aSB1cGRhdGUgdGhlIHNwcml0ZS5cbiAgICAgKi9cbiAgICBVcGRhdGVUZXh0dXJlKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMudGV4dHVyZUN0eDtcdFx0XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLnRleHR1cmVDYW52YXMud2lkdGgsIHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB2YXIgcGl4ID0gY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLnRleHR1cmVDYW52YXMud2lkdGgsIHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQpO1x0XHRcbiAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0OyB5KyspIHtcdFx0XHRcbiAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFsZXR0ZUluZGV4ID0gdGhpcy53b3JsZC5ncmlkW3ldW3hdLmdldENvbG9yKCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yUkdCQSA9IHRoaXMud29ybGQucGFsZXR0ZVtwYWxldHRlSW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmKGNvbG9yUkdCQSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzBdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzFdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzJdO1x0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgIHBpeC5kYXRhW2luZGV4KytdID0gY29sb3JSR0JBWzNdO1x0XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJQYWxldHRlIGluZGV4IG91dCBvZiBib3VuZHM6IFwiICsgcGFsZXR0ZUluZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cdFx0XG4gICAgICAgIH0gXHRcdFxuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKHBpeCwgMCwgMCk7XG5cbiAgICAgICAgLy8gVGVsbCBQaXhpIHRvIHVwZGF0ZSB0aGUgdGV4dHVyZSByZWZlcmVuY2VkIGJ5IHRoaXMgY3R4LlxuICAgICAgICB0aGlzLmJhc2VUZXh0dXJlLnVwZGF0ZSgpO1xuXG4gICAgfVxuXG59XG5cbi8qKlxuICogQ29udmVuaWVuY2UgY2xhc3MgZm9yIHJlc3RyaWN0aW5nIHRoZSByZWZyZXNoIHJhdGUgb2YgdGhlIHNpbXVsYXRpb24uXG4gKi9cbmNsYXNzIEZyYW1lQ291bnRlciB7XG4gICAgY29uc3RydWN0b3IoZnJhbWVGcmVxdWVuY3ksIGZyYW1lTGltaXQgPSBudWxsKSB7XG4gICAgICAgIC8vIFRoZSBudW1iZXIgb2YgZnJhbWVzIGluZ2VzdGVkXG4gICAgICAgIHRoaXMuZnJhbWVDb3VudCA9IDA7XG5cbiAgICAgICAgLy8gVGhlIG51bWJlciBvZiBmcmFtZXMgYWxsb3dlZCB0byBydW5cbiAgICAgICAgdGhpcy5wYXNzZWRGcmFtZXMgPSAwO1xuXG4gICAgICAgIC8vIEZyYW1lIHdpbGwgcnVuIGV2ZXJ5IGBmcmFtZUZyZXF1ZW5jeWAgZnJhbWVzIHRoYXQgcGFzc1xuICAgICAgICB0aGlzLmZyYW1lRnJlcXVlbmN5ID0gZnJhbWVGcmVxdWVuY3k7XG5cbiAgICAgICAgLy8gSWYgc2V0LCBjbGFzcyB3aWxsIHN0b3AgYWxsb3dpbmcgZnJhbWVzIGFmdGVyIGBmcmFtZUxpbWl0YCBcbiAgICAgICAgLy8gcGFzc2VkRnJhbWVzIGhhdmUgYmVlbiBhbGxvd2VkLlxuICAgICAgICB0aGlzLmZyYW1lTGltaXQgPSBmcmFtZUxpbWl0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBvbmNlIGV2ZXJ5IGBmcmFtZUZyZXF1ZW5jeWAgdGltZXMgaXQgaXMgY2FsbGVkLlxuICAgICAqL1xuICAgIEluY3JlbWVudEZyYW1lKCl7XG4gICAgICAgIHRoaXMuZnJhbWVDb3VudCArPSAxO1xuICAgICAgICBpZih0aGlzLmZyYW1lQ291bnQgJSB0aGlzLmZyYW1lRnJlcXVlbmN5ID09IDApIHtcbiAgICAgICAgICAgIC8vIElmIHdlJ3ZlIHJlYWNoZWQgdGhlIGZyYW1lIGxpbWl0XG4gICAgICAgICAgICBpZih0aGlzLmZyYW1lTGltaXQgIT0gbnVsbCAmJiB0aGlzLnBhc3NlZEZyYW1lcyA+PSB0aGlzLmZyYW1lTGltaXQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLmZyYW1lQ291bnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5wYXNzZWRGcmFtZXMgKz0gMTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59IiwiaW1wb3J0IHsgV29ybGRzIH0gZnJvbSBcIi4vd29ybGRzLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBHVUkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbmQgYXR0YWNoZXMgYSBHVUkgdG8gdGhlIHBhZ2UgaWYgREFULkdVSSBpcyBpbmNsdWRlZC5cbiAgICAgKi9cbiAgICBzdGF0aWMgSW5pdChkdXN0KXtcbiAgICAgICAgaWYodHlwZW9mKGRhdCkgPT09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gREFULkdVSSBpbnN0YW5jZSBmb3VuZC4gSW1wb3J0IG9uIHRoaXMgcGFnZSB0byB1c2UhXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGd1aSA9IG5ldyBkYXQuR1VJKCk7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LmZyYW1lY291bnRlciwgJ2ZyYW1lRnJlcXVlbmN5JykubWluKDEpLm1heCgzMCkuc3RlcCgxKS5saXN0ZW4oKTtcblxuICAgICAgICBndWkuYWRkKGR1c3Qud29ybGRPcHRpb25zLCAnbmFtZScsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKFdvcmxkcykpLm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgICAgIGR1c3QuU2V0dXAoKTtcbiAgICAgICAgfSkubmFtZShcIlByZXNldFwiKTtcblxuICAgICAgICBndWkuYWRkKGR1c3QsIFwiU2V0dXBcIikubmFtZShcIlJlc2V0XCIpO1xuICAgIH1cblxufSIsImltcG9ydCB7IERldGVjdG9yIH0gZnJvbSBcIi4vdXRpbHMvd2ViZ2wtZGV0ZWN0LmpzXCI7XG5pbXBvcnQgeyBEdXN0IH0gZnJvbSBcIi4vZHVzdC5qc1wiO1xuaW1wb3J0IHsgR1VJIH0gZnJvbSBcIi4vZ3VpLmpzXCI7XG5cbmxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImR1c3QtY29udGFpbmVyXCIpO1xuXG5pZiAoICFEZXRlY3Rvci5IYXNXZWJHTCgpICkge1xuICAgIC8vZXhpdChcIldlYkdMIGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBicm93c2VyLlwiKTtcbiAgICBjb25zb2xlLmxvZyhcIldlYkdMIGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBicm93c2VyLlwiKTtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gRGV0ZWN0b3IuR2V0RXJyb3JIVE1MKCk7XG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJuby13ZWJnbFwiKTtcbn1cbmVsc2Uge1xuICAgIGxldCBkdXN0ID0gbmV3IER1c3QoY29udGFpbmVyLCAoKSA9PiB7XG4gICAgICAgIC8vIER1c3QgaXMgbm93IGZ1bGx5IGxvYWRlZFxuICAgICAgICBHVUkuSW5pdChkdXN0KTtcbiAgICB9KTtcbn0iLCJjbGFzcyBEZXRlY3RvciB7XG5cbiAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTE4NzEwNzcvcHJvcGVyLXdheS10by1kZXRlY3Qtd2ViZ2wtc3VwcG9ydFxuICAgIHN0YXRpYyBIYXNXZWJHTCgpIHtcbiAgICAgICAgaWYgKCEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzID0gW1wid2ViZ2xcIiwgXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgXCJtb3otd2ViZ2xcIiwgXCJ3ZWJraXQtM2RcIl0sXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPDQ7aSsrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KG5hbWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQuZ2V0UGFyYW1ldGVyID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2ViR0wgaXMgZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlYkdMIGlzIHN1cHBvcnRlZCwgYnV0IGRpc2FibGVkXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2ViR0wgbm90IHN1cHBvcnRlZFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIEdldEVycm9ySFRNTChtZXNzYWdlID0gbnVsbCl7XG4gICAgICAgIGlmKG1lc3NhZ2UgPT0gbnVsbCl7XG4gICAgICAgICAgICBtZXNzYWdlID0gYFlvdXIgZ3JhcGhpY3MgY2FyZCBkb2VzIG5vdCBzZWVtIHRvIHN1cHBvcnQgXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiaHR0cDovL2tocm9ub3Mub3JnL3dlYmdsL3dpa2kvR2V0dGluZ19hX1dlYkdMX0ltcGxlbWVudGF0aW9uXCI+V2ViR0w8L2E+LiA8YnI+XG4gICAgICAgICAgICAgICAgICAgICAgICBGaW5kIG91dCBob3cgdG8gZ2V0IGl0IDxhIGhyZWY9XCJodHRwOi8vZ2V0LndlYmdsLm9yZy9cIj5oZXJlPC9hPi5gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJuby13ZWJnbC1zdXBwb3J0XCI+XG4gICAgICAgIDxwIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPiR7bWVzc2FnZX08L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgXG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IERldGVjdG9yIH07IiwiZnVuY3Rpb24gQ2VsbEF1dG9DZWxsKGxvY1gsIGxvY1kpIHtcblx0dGhpcy54ID0gbG9jWDtcblx0dGhpcy55ID0gbG9jWTtcblxuXHR0aGlzLmRlbGF5cyA9IFtdO1xufVxuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbihuZWlnaGJvcnMpIHtcblx0cmV0dXJuO1xufTtcbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlID0gZnVuY3Rpb24obmVpZ2hib3JzLCB2YWx1ZSkge1xuXHR2YXIgc3Vycm91bmRpbmcgPSAwO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldW3ZhbHVlXSkge1xuXHRcdFx0c3Vycm91bmRpbmcrKztcblx0XHR9XG5cdH1cblx0cmV0dXJuIHN1cnJvdW5kaW5nO1xufTtcbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbihudW1TdGVwcywgZm4pIHtcblx0dGhpcy5kZWxheXMucHVzaCh7IHN0ZXBzOiBudW1TdGVwcywgYWN0aW9uOiBmbiB9KTtcbn07XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihuZWlnaGJvcnMpIHtcblx0cmV0dXJuO1xufTtcblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5nZXRTdXJyb3VuZGluZ0NlbGxzQXZlcmFnZVZhbHVlID0gZnVuY3Rpb24obmVpZ2hib3JzLCB2YWx1ZSkge1xuXHR2YXIgc3VtbWVkID0gMC4wO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgKG5laWdoYm9yc1tpXVt2YWx1ZV0gfHwgbmVpZ2hib3JzW2ldW3ZhbHVlXSA9PT0gMCkpIHtcblx0XHRcdHN1bW1lZCArPSBuZWlnaGJvcnNbaV1bdmFsdWVdO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gc3VtbWVkIC8gbmVpZ2hib3JzLmxlbmd0aDsvL2NudDtcbn07XG5mdW5jdGlvbiBDQVdvcmxkKG9wdGlvbnMpIHtcblxuXHR0aGlzLndpZHRoID0gMjQ7XG5cdHRoaXMuaGVpZ2h0ID0gMjQ7XG5cdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cblx0dGhpcy53cmFwID0gZmFsc2U7XG5cblx0dGhpcy5UT1BMRUZUICAgICAgICA9IHsgaW5kZXg6IDAsIHg6IC0xLCB5OiAtMSB9O1xuXHR0aGlzLlRPUCAgICAgICAgICAgID0geyBpbmRleDogMSwgeDogIDAsIHk6IC0xIH07XG5cdHRoaXMuVE9QUklHSFQgICAgICAgPSB7IGluZGV4OiAyLCB4OiAgMSwgeTogLTEgfTtcblx0dGhpcy5MRUZUICAgICAgICAgICA9IHsgaW5kZXg6IDMsIHg6IC0xLCB5OiAgMCB9O1xuXHR0aGlzLlJJR0hUICAgICAgICAgID0geyBpbmRleDogNCwgeDogIDEsIHk6ICAwIH07XG5cdHRoaXMuQk9UVE9NTEVGVCAgICAgPSB7IGluZGV4OiA1LCB4OiAtMSwgeTogIDEgfTtcblx0dGhpcy5CT1RUT00gICAgICAgICA9IHsgaW5kZXg6IDYsIHg6ICAwLCB5OiAgMSB9O1xuXHR0aGlzLkJPVFRPTVJJR0hUICAgID0geyBpbmRleDogNywgeDogIDEsIHk6ICAxIH07XG5cdFxuXHR0aGlzLnJhbmRvbUdlbmVyYXRvciA9IE1hdGgucmFuZG9tO1xuXG5cdC8vIHNxdWFyZSB0aWxlcyBieSBkZWZhdWx0LCBlaWdodCBzaWRlc1xuXHR2YXIgbmVpZ2hib3Job29kID0gW251bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xuXG5cdGlmICh0aGlzLm9wdGlvbnMuaGV4VGlsZXMpIHtcblx0XHQvLyBzaXggc2lkZXNcblx0XHRuZWlnaGJvcmhvb2QgPSBbbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbF07XG5cdH1cblx0dGhpcy5zdGVwID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHksIHg7XG5cdFx0Zm9yICh5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdFx0Zm9yICh4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRcdHRoaXMuZ3JpZFt5XVt4XS5yZXNldCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIGJvdHRvbSB1cCwgbGVmdCB0byByaWdodCBwcm9jZXNzaW5nXG5cdFx0Zm9yICh5PXRoaXMuaGVpZ2h0LTE7IHk+PTA7IHktLSkge1xuXHRcdFx0Zm9yICh4PXRoaXMud2lkdGgtMTsgeD49MDsgeC0tKSB7XG5cdFx0XHRcdHRoaXMuZmlsbE5laWdoYm9ycyhuZWlnaGJvcmhvb2QsIHgsIHkpO1xuXHRcdFx0XHR2YXIgY2VsbCA9IHRoaXMuZ3JpZFt5XVt4XTtcblx0XHRcdFx0Y2VsbC5wcm9jZXNzKG5laWdoYm9yaG9vZCk7XG5cblx0XHRcdFx0Ly8gcGVyZm9ybSBhbnkgZGVsYXlzXG5cdFx0XHRcdGZvciAodmFyIGk9MDsgaTxjZWxsLmRlbGF5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGNlbGwuZGVsYXlzW2ldLnN0ZXBzLS07XG5cdFx0XHRcdFx0aWYgKGNlbGwuZGVsYXlzW2ldLnN0ZXBzIDw9IDApIHtcblx0XHRcdFx0XHRcdC8vIHBlcmZvcm0gYWN0aW9uIGFuZCByZW1vdmUgZGVsYXlcblx0XHRcdFx0XHRcdGNlbGwuZGVsYXlzW2ldLmFjdGlvbihjZWxsKTtcblx0XHRcdFx0XHRcdGNlbGwuZGVsYXlzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdGktLTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly92YXIgTkVJR0hCT1JMT0NTID0gW3t4Oi0xLCB5Oi0xfSwge3g6MCwgeTotMX0sIHt4OjEsIHk6LTF9LCB7eDotMSwgeTowfSwge3g6MSwgeTowfSx7eDotMSwgeToxfSwge3g6MCwgeToxfSwge3g6MSwgeToxfV07XG5cdC8vIHNxdWFyZSB0aWxlcyBieSBkZWZhdWx0XG5cdHZhciBORUlHSEJPUkxPQ1MgPSBbXG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCBsZWZ0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wXG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gcmlnaHRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b20gbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tXG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0gIC8vIGJvdHRvbSByaWdodFxuXHRdO1xuXHRpZiAodGhpcy5vcHRpb25zLmhleFRpbGVzKSB7XG5cdFx0aWYgKHRoaXMub3B0aW9ucy5mbGF0VG9wcGVkKSB7XG5cdFx0XHQvLyBmbGF0IHRvcHBlZCBoZXggbWFwLCAgZnVuY3Rpb24gcmVxdWlyZXMgY29sdW1uIHRvIGJlIHBhc3NlZFxuXHRcdFx0TkVJR0hCT1JMT0NTID0gW1xuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHglMiA/IC0xIDogMDsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3Bcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHglMiA/IC0xIDogMDsgfX0sICAvLyB0b3AgcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHglMiA/IDAgOiAxOyB9fSwgIC8vIGJvdHRvbSByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbVxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHglMiA/IDAgOiAxOyB9fSAgLy8gYm90dG9tIGxlZnRcblx0XHRcdF07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gcG9pbnR5IHRvcHBlZCBoZXggbWFwLCBmdW5jdGlvbiByZXF1aXJlcyByb3cgdG8gYmUgcGFzc2VkXG5cdFx0XHRORUlHSEJPUkxPQ1MgPSBbXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbih4LCB5KSB7IHJldHVybiB5JTIgPyAwIDogLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbih4LCB5KSB7IHJldHVybiB5JTIgPyAxIDogMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMCA6IC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbSBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbih4LCB5KSB7IHJldHVybiB5JTIgPyAxIDogMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0gIC8vIGJvdHRvbSByaWdodFxuXHRcdFx0XTtcblx0XHR9XG5cblx0fVxuXHR0aGlzLmZpbGxOZWlnaGJvcnMgPSBmdW5jdGlvbihuZWlnaGJvcnMsIHgsIHkpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8TkVJR0hCT1JMT0NTLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbmVpZ2hib3JYID0geCArIE5FSUdIQk9STE9DU1tpXS5kaWZmWCh4LCB5KTtcblx0XHRcdHZhciBuZWlnaGJvclkgPSB5ICsgTkVJR0hCT1JMT0NTW2ldLmRpZmZZKHgsIHkpO1xuXHRcdFx0aWYgKHRoaXMud3JhcCkge1xuXHRcdFx0XHQvLyBUT0RPOiBoZXggbWFwIHN1cHBvcnQgZm9yIHdyYXBwaW5nXG5cdFx0XHRcdG5laWdoYm9yWCA9IChuZWlnaGJvclggKyB0aGlzLndpZHRoKSAlIHRoaXMud2lkdGg7XG5cdFx0XHRcdG5laWdoYm9yWSA9IChuZWlnaGJvclkgKyB0aGlzLmhlaWdodCkgJSB0aGlzLmhlaWdodDtcblx0XHRcdH1cblx0XHRcdGlmICghdGhpcy53cmFwICYmIChuZWlnaGJvclggPCAwIHx8IG5laWdoYm9yWSA8IDAgfHwgbmVpZ2hib3JYID49IHRoaXMud2lkdGggfHwgbmVpZ2hib3JZID49IHRoaXMuaGVpZ2h0KSkge1xuXHRcdFx0XHRuZWlnaGJvcnNbaV0gPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdG5laWdoYm9yc1tpXSA9IHRoaXMuZ3JpZFtuZWlnaGJvclldW25laWdoYm9yWF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGFycmF5VHlwZURpc3QpIHtcblxuXHRcdC8vIHNvcnQgdGhlIGNlbGwgdHlwZXMgYnkgZGlzdHJpYnV0aW9uXG5cdFx0YXJyYXlUeXBlRGlzdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRcdHJldHVybiBhLmRpc3RyaWJ1dGlvbiA+IGIuZGlzdHJpYnV0aW9uID8gMSA6IC0xO1xuXHRcdH0pO1xuXG5cdFx0dmFyIHRvdGFsRGlzdCA9IDA7XG5cdFx0Ly8gYWRkIGFsbCBkaXN0cmlidXRpb25zIHRvZ2V0aGVyXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGFycmF5VHlwZURpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRvdGFsRGlzdCArPSBhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbjtcblx0XHRcdGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uID0gdG90YWxEaXN0O1xuXHRcdH1cblxuXHRcdHRoaXMuZ3JpZCA9IFtdO1xuXHRcdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0XHR0aGlzLmdyaWRbeV0gPSBbXTtcblx0XHRcdGZvciAodmFyIHg9MDsgeDx0aGlzLndpZHRoOyB4KyspIHtcblx0XHRcdFx0dmFyIHJhbmRvbSA9IHRoaXMucmFuZG9tR2VuZXJhdG9yKCkgKiAxMDA7XG5cblx0XHRcdFx0Zm9yIChpPTA7IGk8YXJyYXlUeXBlRGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGlmIChyYW5kb20gPD0gYXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb24pIHtcblx0XHRcdFx0XHRcdHRoaXMuZ3JpZFt5XVt4XSA9IG5ldyB0aGlzLmNlbGxUeXBlc1thcnJheVR5cGVEaXN0W2ldLm5hbWVdKHgsIHkpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuY2VsbFR5cGVzID0ge307XG5cdHRoaXMucmVnaXN0ZXJDZWxsVHlwZSA9IGZ1bmN0aW9uKG5hbWUsIGNlbGxPcHRpb25zLCBpbml0KSB7XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0gPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0XHRDZWxsQXV0b0NlbGwuY2FsbCh0aGlzLCB4LCB5KTtcblxuXHRcdFx0aWYgKGluaXQpIHtcblx0XHRcdFx0aW5pdC5jYWxsKHRoaXMsIHgsIHkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY2VsbE9wdGlvbnMpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjZWxsT3B0aW9uc1trZXldICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHQvLyBwcm9wZXJ0aWVzIGdldCBpbnN0YW5jZVxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjZWxsT3B0aW9uc1trZXldID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdFx0XHQvLyBvYmplY3RzIG11c3QgYmUgY2xvbmVkXG5cdFx0XHRcdFx0XHRcdHRoaXNba2V5XSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY2VsbE9wdGlvbnNba2V5XSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdC8vIHByaW1pdGl2ZVxuXHRcdFx0XHRcdFx0XHR0aGlzW2tleV0gPSBjZWxsT3B0aW9uc1trZXldO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDZWxsQXV0b0NlbGwucHJvdG90eXBlKTtcblx0XHR0aGlzLmNlbGxUeXBlc1tuYW1lXS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0aGlzLmNlbGxUeXBlc1tuYW1lXTtcblx0XHR0aGlzLmNlbGxUeXBlc1tuYW1lXS5wcm90b3R5cGUuY2VsbFR5cGUgPSBuYW1lO1xuXG5cdFx0aWYgKGNlbGxPcHRpb25zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gY2VsbE9wdGlvbnMpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBjZWxsT3B0aW9uc1trZXldID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Ly8gZnVuY3Rpb25zIGdldCBwcm90b3R5cGVcblx0XHRcdFx0XHR0aGlzLmNlbGxUeXBlc1tuYW1lXS5wcm90b3R5cGVba2V5XSA9IGNlbGxPcHRpb25zW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8gYXBwbHkgb3B0aW9uc1xuXHRpZiAob3B0aW9ucykge1xuXHRcdGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XG5cdFx0XHR0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG5cdFx0fVxuXHR9XG5cbn1cblxuQ0FXb3JsZC5wcm90b3R5cGUuaW5pdGlhbGl6ZUZyb21HcmlkICA9IGZ1bmN0aW9uKHZhbHVlcywgaW5pdEdyaWQpIHtcblxuXHR0aGlzLmdyaWQgPSBbXTtcblx0Zm9yICh2YXIgeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHR0aGlzLmdyaWRbeV0gPSBbXTtcblx0XHRmb3IgKHZhciB4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8dmFsdWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh2YWx1ZXNbaV0uZ3JpZFZhbHVlID09PSBpbml0R3JpZFt5XVt4XSkge1xuXHRcdFx0XHRcdHRoaXMuZ3JpZFt5XVt4XSA9IG5ldyB0aGlzLmNlbGxUeXBlc1t2YWx1ZXNbaV0ubmFtZV0oeCwgeSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxufTtcblxuQ0FXb3JsZC5wcm90b3R5cGUuY3JlYXRlR3JpZEZyb21WYWx1ZXMgPSBmdW5jdGlvbih2YWx1ZXMsIGRlZmF1bHRWYWx1ZSkge1xuXHR2YXIgbmV3R3JpZCA9IFtdO1xuXG5cdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0bmV3R3JpZFt5XSA9IFtdO1xuXHRcdGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRuZXdHcmlkW3ldW3hdID0gZGVmYXVsdFZhbHVlO1xuXHRcdFx0dmFyIGNlbGwgPSB0aGlzLmdyaWRbeV1beF07XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8dmFsdWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChjZWxsLmNlbGxUeXBlID09IHZhbHVlc1tpXS5jZWxsVHlwZSAmJiBjZWxsW3ZhbHVlc1tpXS5oYXNQcm9wZXJ0eV0pIHtcblx0XHRcdFx0XHRuZXdHcmlkW3ldW3hdID0gdmFsdWVzW2ldLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG5ld0dyaWQ7XG59O1xuXG47KGZ1bmN0aW9uKCkge1xuICB2YXIgQ2VsbEF1dG8gPSB7XG4gICAgV29ybGQ6IENBV29ybGQsXG4gICAgQ2VsbDogQ2VsbEF1dG9DZWxsXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgnQ2VsbEF1dG8nLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gQ2VsbEF1dG87XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENlbGxBdXRvO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5DZWxsQXV0byA9IENlbGxBdXRvO1xuICB9XG59KSgpOyIsImltcG9ydCAqIGFzIENlbGxBdXRvIGZyb20gXCIuL3ZlbmRvci9jZWxsYXV0by5qc1wiO1xuXG5leHBvcnQgdmFyIFdvcmxkcyA9IHtcblxuICAgIC8qKlxuICAgICAqIENob29zZXMgYSByYW5kb20gZWxlbWVudGFyeSBhdXRvbWF0YSBmcm9tIGEgbGlzdC5cbiAgICAgKi9cbiAgICBSYW5kb21SdWxlOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICB2YXIgcnVsZXMgPSBbXG4gICAgICAgICAgICAxOCwgMjIsIDI2LCA1NCwgNjAsIDkwLCA5NCwgMTEwLCAxMjYsIDE1MFxuICAgICAgICBdO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgcnVsZTogcnVsZXNbcnVsZXMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXSwgLy8gUmFuZG9tIHJ1bGUgZnJvbSBsaXN0XG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVsZW1lbnRhcnkob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbndheSdzIEdhbWUgb2YgTGlmZVxuICAgICAqIEIzL1MyM1xuICAgICAqL1xuICAgIExpZmU6IGZ1bmN0aW9uICh3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBCOiBbM10sXG4gICAgICAgICAgICBTOiBbMiwgM10sXG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTGlmZUxpa2Uob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIG1hemUtbGlrZSBzdHJ1Y3R1cmUuXG4gICAgICogQmFzZWQgb24gcnVsZSBCMy9TMTIzNCAoTWF6ZWNldHJpYykuXG4gICAgICovXG4gICAgTWF6ZWNldHJpYzogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIEI6IFszXSxcbiAgICAgICAgICAgIFM6IFsxLCAyLCAzLCA0XSxcbiAgICAgICAgICAgIHBhbGV0dGU6IFtcbiAgICAgICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XSxcbiAgICAgICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3k6IDUsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4xO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjM1Njc4L1M1Njc4XG4gICAgICovXG4gICAgRGlhbW9lYmE6IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBCOiBbMywgNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBTOiBbNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5OiAzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4yO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjQ2NzgvUzM1Njc4XG4gICAgICovXG4gICAgQW5uZWFsOiBmdW5jdGlvbih3aWR0aCA9IDk2LCBoZWlnaHQgPSA5Nikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzQsIDYsIDcsIDhdLFxuICAgICAgICAgICAgUzogWzMsIDUsIDYsIDcsIDhdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogM1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMaWZlTGlrZShvcHRpb25zLCAoeCwgeSkgPT4ge1xuICAgICAgICAgICAgLy8gRGlzdHJpYnV0aW9uIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8IDAuMztcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENBIHRoYXQgbG9va3MgbGlrZSBsYXZhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBMYXZhOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyB0aGFua3MgdG8gVGhlTGFzdEJhbmFuYSBvbiBUSUdTb3VyY2VcblxuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMzQsMTAsMjEsMjU1XSwgWzY4LDE3LDI2LDI1NV0sIFsxMjMsMTYsMTYsMjU1XSxcbiAgICAgICAgICAgIFsxOTAsNDUsMTYsMjU1XSwgWzI0NCwxMDIsMjAsMjU1XSwgWzI1NCwyMTIsOTcsMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgMTg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjc7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjk7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDM7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDU7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNTY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNjQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsYXZhJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMudmFsdWUgKyAwLjVcbiAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnNpbih0aGlzLnggLyB3b3JsZC53aWR0aCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHRoaXMueSAvIHdvcmxkLmhlaWdodCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICAtIDAuMDU7XG4gICAgICAgICAgICAgICAgdiA9IE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCB2KSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS52YWx1ZSA9IDAuNSAqdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ucHJldiA9IDAuNSAqdGhpcy5wcmV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGF2ZyA9IHRoaXMuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZShuZWlnaGJvcnMsICd2YWx1ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IDAuOTk4ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC45OTk5Mykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMjUgKyAwLjMqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBNYXRoLm1pbigwLjUsIE1hdGgubWF4KC0wLjUsIHRoaXMudmFsdWUpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubmV4dCA9IHRoaXMudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnbGF2YScsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN5Y2xpYyByYWluYm93IGF1dG9tYXRhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBDeWNsaWNSYWluYm93czogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDE7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsMCwwLDEgKiAyNTVdLCBbMjU1LDk2LDAsMSAqIDI1NV0sIFsyNTUsMTkxLDAsMSAqIDI1NV0sIFsyMjMsMjU1LDAsMSAqIDI1NV0sXG4gICAgICAgICAgICBbMTI4LDI1NSwwLDEgKiAyNTVdLCBbMzIsMjU1LDAsMSAqIDI1NV0sIFswLDI1NSw2NCwxICogMjU1XSwgWzAsMjU1LDE1OSwxICogMjU1XSxcbiAgICAgICAgICAgIFswLDI1NSwyNTUsMSAqIDI1NV0sIFswLDE1OSwyNTUsMSAqIDI1NV0sIFswLDY0LDI1NSwxICogMjU1XSwgWzMyLDAsMjU1LDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEyNywwLDI1NSwxICogMjU1XSwgWzIyMywwLDI1NSwxICogMjU1XSwgWzI1NSwwLDE5MSwxICogMjU1XSwgWzI1NSwwLDk2LDEgKiAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnY3ljbGljJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHQgPSAodGhpcy5zdGF0ZSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoyKSkgJSAxNjtcblxuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5naW5nID0gY2hhbmdpbmcgfHwgbmVpZ2hib3JzW2ldLnN0YXRlID09PSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjaGFuZ2luZykgdGhpcy5zdGF0ZSA9IG5leHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdjeWNsaWMnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIGNhdmVzIGFuZCB3YXRlciBtb3ZlbWVudC5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ2F2ZXNXaXRoV2F0ZXI6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMCAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMSAqIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMSAqIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAweDU5N0RDRTQ0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGk9MzsgaTw9NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgdGhpcy53YXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3JvY2snLCB7XG4gICAgICAgICAgICBpc1NvbGlkOiB0cnVlLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpZ2h0ZWQgPyAxMCA6IDExO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMubGlnaHRlZCA9IG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdICYmICEobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0ud2F0ZXIgPT09IDkpICYmICFuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS5pc1NvbGlkXG4gICAgICAgICAgICAgICAgICAgICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLmlzU29saWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhc3MgaW4gb3VyIGdlbmVyYXRlZCBjYXZlIGRhdGFcbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZUZyb21HcmlkKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3JvY2snLCBncmlkVmFsdWU6IDEgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhdGVyJywgZ3JpZFZhbHVlOiAwIH1cbiAgICAgICAgXSwgZ3JpZCk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICBSYWluOiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIC8vIEZJUlNUIENSRUFURSBDQVZFU1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2FsbCcsIHtcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNPcGVuJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuID0gKHRoaXMud2FzT3BlbiAmJiBzdXJyb3VuZGluZyA+PSA0KSB8fCBzdXJyb3VuZGluZyA+PSA2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNPcGVuID0gdGhpcy5vcGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMub3BlbiA9IE1hdGgucmFuZG9tKCkgPiAwLjQwO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhbGwnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIG91ciBjYXZlLCAxMCBzdGVwcyBhdWdodCB0byBkbyBpdFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8MTA7IGkrKykge1xuICAgICAgICAgICAgd29ybGQuc3RlcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdyaWQgPSB3b3JsZC5jcmVhdGVHcmlkRnJvbVZhbHVlcyhbXG4gICAgICAgICAgICB7IGNlbGxUeXBlOiAnd2FsbCcsIGhhc1Byb3BlcnR5OiAnb3BlbicsIHZhbHVlOiAwIH1cbiAgICAgICAgXSwgMSk7XG5cbiAgICAgICAgLy8gY3V0IHRoZSB0b3AgaGFsZiBvZiB0aGUgY2F2ZXMgb2ZmXG4gICAgICAgIGZvciAodmFyIHk9MDsgeTxNYXRoLmZsb29yKHdvcmxkLmhlaWdodC8yKTsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB4PTA7IHg8d29ybGQud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGdyaWRbeV1beF0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTk9XIFVTRSBPVVIgQ0FWRVMgVE8gQ1JFQVRFIEEgTkVXIFdPUkxEIENPTlRBSU5JTkcgV0FURVJcbiAgICAgICAgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBjbGVhclJlY3Q6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDFdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDIvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAzLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDUvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA2LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDgvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMjU1XSxcbiAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnYWlyJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuICc4OSwgMTI1LCAyMDYsICcgKyAodGhpcy53YXRlciA/IE1hdGgubWF4KDAuMywgdGhpcy53YXRlci85KSA6IDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIC8vIHJhaW4gb24gdGhlIHRvcCByb3dcbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gPT09IG51bGwgJiYgTWF0aC5yYW5kb20oKSA8IDAuMDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlciA9IDU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMud2F0ZXIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcHVzaCBteSB3YXRlciBvdXQgdG8gbXkgYXZhaWxhYmxlIG5laWdoYm9yc1xuXG4gICAgICAgICAgICAgICAgLy8gY2VsbCBiZWxvdyBtZSB3aWxsIHRha2UgYWxsIGl0IGNhblxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgOSAtIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYm90dG9tIHR3byBjb3JuZXJzIHRha2UgaGFsZiBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGk9NTsgaTw9NzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIT13b3JsZC5CT1RUT00uaW5kZXggJiYgbmVpZ2hib3JzW2ldICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gc2lkZXMgdGFrZSBhIHRoaXJkIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChpPTM7IGk8PTQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS53YXRlciA8IHRoaXMud2F0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy53YXRlciA9IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3JvY2snLCB7XG4gICAgICAgICAgICBpc1NvbGlkOiB0cnVlLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpZ2h0ZWQgPyAxMCA6IDExO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMubGlnaHRlZCA9IG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdICYmICEobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0ud2F0ZXIgPT09IDkpICYmICFuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS5pc1NvbGlkXG4gICAgICAgICAgICAgICAgICAgICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLmlzU29saWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhc3MgaW4gb3VyIGdlbmVyYXRlZCBjYXZlIGRhdGFcbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZUZyb21HcmlkKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3JvY2snLCBncmlkVmFsdWU6IDEgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FpcicsIGdyaWRWYWx1ZTogMCB9XG4gICAgICAgIF0sIGdyaWQpO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIHNwbGFzaGluZyB3YXRlci5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgU3BsYXNoZXM6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXTtcbiAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpbmRleD0wOyBpbmRleDw2NDsgaW5kZXgrKykge1xuICAgICAgICAgICAgd29ybGQucGFsZXR0ZS5wdXNoKFs4OSwgMTI1LCAyMDYsIChpbmRleC82NCkgKiAyNTVdKTtcbiAgICAgICAgICAgIGNvbG9yc1tpbmRleF0gPSA2MyAtIGluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2F0ZXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKE1hdGgubWF4KDIgKiB0aGlzLnZhbHVlICsgMC4wMiwgMCkgLSAwLjAyKSArIDAuNTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnZhbHVlID0gMC41ICp0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS5wcmV2ID0gMC41ICp0aGlzLnByZXY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gdGhpcy5nZXRTdXJyb3VuZGluZ0NlbGxzQXZlcmFnZVZhbHVlKG5laWdoYm9ycywgJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gMC45OSAqICgyICogYXZnIC0gdGhpcy5wcmV2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjk5OTkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IC0wLjIgKyAwLjI1Kk1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5uZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5uZXh0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YXRlcicsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdWxlIDUyOTI4IC0gdGhlIENBIHVzZWQgZm9yIFdvbGZyYW0gQWxwaGEncyBsb2FkaW5nIGFuaW1hdGlvbnNcbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cHM6Ly93d3cucXVvcmEuY29tL1doYXQtaXMtV29sZnJhbS1BbHBoYXMtbG9hZGluZy1zY3JlZW4tYS1kZXBpY3Rpb24tb2ZcbiAgICAgKiBodHRwOi8vanNmaWRkbGUubmV0L2h1bmdyeWNhbWVsLzlVcnpKL1xuICAgICAqL1xuICAgIFdvbGZyYW06IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIHZhciB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDI7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdLCAvLyBCYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICBbMjU1LCAxMTAsIDAgICwgMjU1XSwgLy8gZGFyayBvcmFuZ2VcbiAgICAgICAgICAgIFsyNTUsIDEzMCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE1MCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE3MCwgMCAgLCAyNTVdLCAvLyAgICAgIFZcbiAgICAgICAgICAgIFsyNTUsIDE4MCwgMCAgLCAyNTVdICAvLyBsaWdodCBvcmFuZ2VcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgY2hvaWNlID0gTWF0aC5yYW5kb20oKTtcblxuICAgICAgICB2YXIgc2VlZExpc3QgPSBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMiwgMSwgMSwgMSwgMSwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFsxLCAxLCAzLCA0LCAyLCAxLCAxLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDQsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMiwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAxLCAxLCAwLCAwLCAyLCAyLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDIsIDIsIDAsIDAsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMiwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAxLCAxLCA0LCAxLCAxLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDIsIDQsIDMsIDEsIDFdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMSwgMiwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwXVxuICAgICAgICAgICAgXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDAsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDAsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDAsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMCwgMCwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAwLCAwLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMCwgMSwgMF0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMCwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDFdXVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuXG4gICAgICAgICAgICAgICAgdmFyIG5laWdoYm9yT25lcyA9IG5laWdoYm9ycy5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnN0YXRlID09IDE7XG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAzIHx8IG5laWdoYm9yT25lcyA9PSA1IHx8IG5laWdoYm9yT25lcyA9PSA3KSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAwIHx8IG5laWdoYm9yT25lcyA9PSAxIHx8IG5laWdoYm9yT25lcyA9PSAyIHx8IG5laWdoYm9yT25lcyA9PSA2IHx8IG5laWdoYm9yT25lcyA9PSA4KVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAvLyBJbml0IFxuXG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIHVzZSBhIHNlZWRcbiAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuNSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlZWQ7XG4gICAgICAgICAgICAgICAgLy8gMjUlIGNoYW5jZSB0byB1c2UgYSByYW5kb20gc2VlZFxuICAgICAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VlZCA9IHNlZWRMaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlZWRMaXN0Lmxlbmd0aCldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAyNSUgY2hhbmNlIHRvIHVzZSB0aGUgV29sZnJhbSBzZWVkXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlZWQgPSBzZWVkTGlzdFswXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbWluWCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSAtIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICB2YXIgbWF4WCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSArIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICB2YXIgbWluWSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gMikgLSBNYXRoLmZsb29yKHNlZWQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIG1heFkgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpICsgTWF0aC5mbG9vcihzZWVkLmxlbmd0aCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpcyBpbnNpZGUgb2YgdGhlIHNlZWQgYXJyYXkgKGNlbnRlcmVkIGluIHRoZSB3b3JsZCksIHRoZW4gdXNlIGl0cyB2YWx1ZVxuICAgICAgICAgICAgICAgIGlmICh4ID49IG1pblggJiYgeCA8IG1heFggJiYgeSA+PSBtaW5ZICYmIHkgPCBtYXhZKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBzZWVkW3kgLSBtaW5ZXVt4IC0gbWluWF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gaW5pdGlhbGl6ZSB3aXRoIG5vaXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5yYW5kb20oKSA8IDAuMTUgPyAxIDogMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfSxcbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgYSBCZWxvdXNvdi1aaGFib3RpbnNreSByZWFjdGlvbiAoYXBwcm94aW1hdGVseSkuXG4gICAgICogVGhpcyBvbmUncyBzdGlsbCBhIGxpdHRsZSBtZXNzZWQgdXAsIHNvIGNvbnNpZGVyIGl0IGV4cGVyaW1lbnRhbC5cbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cDovL2NjbC5ub3J0aHdlc3Rlcm4uZWR1L25ldGxvZ28vbW9kZWxzL0ItWlJlYWN0aW9uXG4gICAgICogaHR0cDovL3d3dy5mcmFjdGFsZGVzaWduLm5ldC9hdXRvbWF0YWFsZ29yaXRobS5hc3B4XG4gICAgICovXG4gICAgQmVsb3Vzb3ZaaGFib3RpbnNreTogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICB2YXIgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIGZyYW1lIGZyZXF1ZW5jeSBmb3IgdGhpcyBzZXR1cFxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMTA7XG5cbiAgICAgICAgLy8gQ29uZmlnIHZhcmlhYmxlc1xuICAgICAgICB2YXIga2VybmVsID0gWyAvLyB3ZWlnaHRzIGZvciBuZWlnaGJvcnMuIEZpcnN0IGluZGV4IGlzIGZvciBzZWxmIHdlaWdodFxuICAgICAgICAgMCwgMSwgMSwgMSxcbiAgICAgICAgICAgIDEsICAgIDEsXG4gICAgICAgICAgICAxLCAxLCAxXG4gICAgICAgIF0ucmV2ZXJzZSgpO1xuICAgICAgICB2YXIgazEgPSA1OyAvLyBMb3dlciBnaXZlcyBoaWdoZXIgdGVuZGVuY3kgZm9yIGEgY2VsbCB0byBiZSBzaWNrZW5lZCBieSBpbGwgbmVpZ2hib3JzXG4gICAgICAgIHZhciBrMiA9IDE7IC8vIExvd2VyIGdpdmVzIGhpZ2hlciB0ZW5kZW5jeSBmb3IgYSBjZWxsIHRvIGJlIHNpY2tlbmVkIGJ5IGluZmVjdGVkIG5laWdoYm9yc1xuICAgICAgICB2YXIgZyA9IDU7XG4gICAgICAgIHZhciBudW1TdGF0ZXMgPSAyNTU7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVN0YXRlczsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZ3JheSA9IE1hdGguZmxvb3IoKDI1NSAvIG51bVN0YXRlcykgKiBpKTtcbiAgICAgICAgICAgIHdvcmxkLnBhbGV0dGUucHVzaChbZ3JheSwgZ3JheSwgZ3JheSwgMjU1XSk7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdieicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHZhciBoZWFsdGh5ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgaW5mZWN0ZWQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBpbGwgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBzdW1TdGF0ZXMgPSB0aGlzLnN0YXRlO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gOCkgbmVpZ2hib3IgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9pZihuZWlnaGJvciAhPT0gbnVsbCAmJiBuZWlnaGJvci5zdGF0ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1TdGF0ZXMgKz0gbmVpZ2hib3Iuc3RhdGUgKiBrZXJuZWxbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihrZXJuZWxbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3Iuc3RhdGUgPT0gMCkgaGVhbHRoeSArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYobmVpZ2hib3Iuc3RhdGUgPCAobnVtU3RhdGVzIC0gMSkpIGluZmVjdGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpbGwgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAoaW5mZWN0ZWQgLyBrMSkgKyAoaWxsIC8gazIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA8IChudW1TdGF0ZXMpIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gKHN1bVN0YXRlcyAvIGluZmVjdGVkICsgaWxsICsgMSkgKyBnO1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMubmV3U3RhdGUgPSAoc3VtU3RhdGVzIC8gOSkgKyBnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0byBzZXQgc3RhdGUgdG8gbmV3c3RhdGUgaW4gYSBzZWNvbmQgcGFzc1xuICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihudW1TdGF0ZXMgLSAxLCBNYXRoLmZsb29yKHRoaXMubmV3U3RhdGUpKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLm5ld1N0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbml0XG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGgucmFuZG9tKCkgPCAxLjAgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1TdGF0ZXMpIDogMDtcbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2J6JywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfVxuXG59XG5cblxuLyoqXG4gKiBTaW11bGF0ZXMgYSAxRCBhdXRvbWF0YS5cbiAqIEV4cGVjdHMgYSBwcm9wZXJ0eSBgcnVsZWAgaW4gYG9wdGlvbnNgLCB3aGljaCBpcyB0aGUgaW50ZWdlciBydWxlIG9mIHRoZSBDQS5cbiAqIFxuICogTm90IHRvdGFsbHkgY29ycmVjdCB5ZXQhXG4gKiBcbiAqL1xuZnVuY3Rpb24gRWxlbWVudGFyeShvcHRpb25zKSB7XG4gICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKG9wdGlvbnMpO1xuXG4gICAgdmFyIHJ1bGUgPSAob3B0aW9ucy5ydWxlID4+PiAwKS50b1N0cmluZygyKTtcbiAgICB3aGlsZShydWxlLmxlbmd0aCA8IDgpIHtcbiAgICAgICAgcnVsZSA9IFwiMFwiICsgcnVsZTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhvcHRpb25zLnJ1bGUpO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1J1bGUobGVmdEFsaXZlLCBjZW50ZXJBbGl2ZSwgcmlnaHRBbGl2ZSkge1xuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICBpZihyaWdodEFsaXZlKSBpbmRleCArPSAxO1xuICAgICAgICBpZihjZW50ZXJBbGl2ZSkgaW5kZXggKz0gMjtcbiAgICAgICAgaWYobGVmdEFsaXZlKSBpbmRleCArPSA0O1xuICAgICAgICByZXR1cm4gcnVsZVtydWxlLmxlbmd0aCAtIDEgLSBpbmRleF07XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHRlc3RSdWxlKCkge1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gcnVsZS5sZW5ndGggLSAxO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IGkgdG8gYmluYXJ5IGFuZCB1c2UgaXQgdG8gZmVlZCBwcm9jZXNzUnVsZVxuICAgICAgICAgICAgdmFyIGJpbiA9ICgobGFzdEluZGV4IC0gaSkgPj4+IDApLnRvU3RyaW5nKDIpO1xuICAgICAgICAgICAgd2hpbGUoYmluLmxlbmd0aCA8IDMpIGJpbiA9IFwiMFwiICsgYmluO1xuICAgICAgICAgICAgdmFyIHJ1bGVPdXQgPSBwcm9jZXNzUnVsZShiaW5bMF0gPT0gXCIxXCIsIGJpblsxXSA9PSBcIjFcIiwgYmluWzJdID09IFwiMVwiKTtcblxuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQocnVsZU91dCA9PSBydWxlW2ldLCBiaW4gKyBcIiBcIiArIHJ1bGVbaV0gKyBcIiBcIiArIChydWxlT3V0ID09IHJ1bGVbaV0pLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vdGVzdFJ1bGUoKTtcblxuICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFsaXZlID8gMCA6IDE7XG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFdhc0FsaXZlKG5laWdoYm9yKXtcbiAgICAgICAgICAgICAgICBpZihuZWlnaGJvciAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmVpZ2hib3Iud2FzQWxpdmU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpc24ndCBhY3RpdmUgeWV0LCBkZXRlcm1pbmUgaXRzIHN0YXRlIGJhc2VkIG9uIGl0cyB1cHBlciBuZWlnaGJvcnNcbiAgICAgICAgICAgIGlmKCF0aGlzLndhc0FsaXZlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IHByb2Nlc3NSdWxlKGdldFdhc0FsaXZlKG5laWdoYm9yc1swXSksIGdldFdhc0FsaXZlKG5laWdoYm9yc1sxXSksIGdldFdhc0FsaXZlKG5laWdoYm9yc1syXSkpID09IFwiMVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAvLyBJbml0XG4gICAgICAgIHRoaXMuYWxpdmUgPSAoeCA9PSBNYXRoLmZsb29yKG9wdGlvbnMud2lkdGggLyAyKSkgJiYgKHkgPT0gMSk7XG4gICAgICAgIC8vdGhpcy5hbGl2ZSA9IE1hdGgucmFuZG9tKCkgPCAwLjAxO1xuICAgICAgICAvL3RoaXMud2FzQWxpdmUgPSB0aGlzLmFsaXZlO1xuICAgIH0pO1xuXG4gICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICBdKTtcblxuICAgIHJldHVybiB3b3JsZDtcbn1cblxuLyoqXG4gKiBTaW11bGF0ZXMgYSBMaWZlLWxpa2UgYXV0b21hdGEuIFVzZXMgQi9TIG5vdGF0aW9uLlxuICogU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xpZmUtbGlrZV9jZWxsdWxhcl9hdXRvbWF0b25cbiAqIFxuICogRXhwZWN0cyB0d28gYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGluIGBvcHRpb25zYDpcbiAqIGBCYDogQW4gYXJyYXkgb2YgaW50cyByZXByZXNlbnRpbmcgdGhlIEIgY29tcG9uZW50IG9mIHRoZSBydWxlXG4gKiBgU2A6IEFuIGFycmF5IG9mIGludHMgcmVwcmVzZW50aW5nIHRoZSBTIGNvbXBvbmVudCBvZiB0aGUgcnVsZVxuICovXG5mdW5jdGlvbiBMaWZlTGlrZShvcHRpb25zLCBkaXN0cmlidXRpb25GdW5jKSB7XG4gICAgdmFyIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKG9wdGlvbnMpO1xuXG4gICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWxpdmUgPyAwIDogMTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgdmFyIHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzQWxpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBvcHRpb25zLkIuaW5jbHVkZXMoc3Vycm91bmRpbmcpIHx8IG9wdGlvbnMuUy5pbmNsdWRlcyhzdXJyb3VuZGluZykgJiYgdGhpcy5hbGl2ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMud2FzQWxpdmUgPSB0aGlzLmFsaXZlO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgLy8gSW5pdFxuICAgICAgICBpZihkaXN0cmlidXRpb25GdW5jKVxuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IGRpc3RyaWJ1dGlvbkZ1bmMoeCwgeSk7XG4gICAgICAgIGVsc2UgICBcbiAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBNYXRoLnJhbmRvbSgpIDwgMC41O1xuICAgIH0pO1xuXG4gICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICBdKTtcblxuICAgIHJldHVybiB3b3JsZDtcbn0iXX0=
