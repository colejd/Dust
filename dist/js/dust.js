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
                for (var _i = 5; _i <= 7; _i++) {
                    if (_i != world.BOTTOM.index && neighbors[_i] !== null && this.water && neighbors[_i].water < 9) {
                        var _amt = Math.min(this.water, Math.ceil((9 - neighbors[_i].water) / 2));
                        this.water -= _amt;
                        neighbors[_i].water += _amt;
                        return;
                    }
                }
                // sides take a third of what I have
                for (var _i2 = 3; _i2 <= 4; _i2++) {
                    if (neighbors[_i2] !== null && neighbors[_i2].water < this.water) {
                        var _amt2 = Math.min(this.water, Math.ceil((9 - neighbors[_i2].water) / 3));
                        this.water -= _amt2;
                        neighbors[_i2].water += _amt2;
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
                for (var _i3 = 5; _i3 <= 7; _i3++) {
                    if (_i3 != world.BOTTOM.index && neighbors[_i3] !== null && this.water && neighbors[_i3].water < 9) {
                        var _amt3 = Math.min(this.water, Math.ceil((9 - neighbors[_i3].water) / 2));
                        this.water -= _amt3;
                        neighbors[_i3].water += _amt3;
                        return;
                    }
                }
                // sides take a third of what I have
                for (var _i4 = 3; _i4 <= 4; _i4++) {
                    if (neighbors[_i4] !== null && neighbors[_i4].water < this.water) {
                        var _amt4 = Math.min(this.water, Math.ceil((9 - neighbors[_i4].water) / 3));
                        this.water -= _amt4;
                        neighbors[_i4].water += _amt4;
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
                var seed = void 0;
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

        // Config letiables
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

                for (var _i5 = 0; _i5 < neighbors.length + 1; _i5++) {
                    var neighbor = void 0;
                    if (_i5 == 8) neighbor = this;else neighbor = neighbors[_i5];

                    //if(neighbor !== null && neighbor.state){
                    sumStates += neighbor.state * kernel[_i5];
                    if (kernel[_i5] > 0) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZHVzdC5qcyIsInNyYy9ndWkuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy93ZWJnbC1kZXRlY3QuanMiLCJzcmMvdmVuZG9yL2NlbGxhdXRvLmpzIiwic3JjL3dvcmxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQ0FBOztJQUFZLFE7O0FBQ1o7Ozs7OztJQUVhLEksV0FBQSxJO0FBQ1Qsa0JBQVksU0FBWixFQUF1QixvQkFBdkIsRUFBNkM7QUFBQTs7QUFBQTs7QUFDekMsYUFBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBLFlBQUksYUFBYSxPQUFPLElBQVAsZ0JBQWpCO0FBQ0EsYUFBSyxZQUFMLEdBQW9CO0FBQ2hCLGtCQUFNLFdBQVcsV0FBVyxNQUFYLEdBQW9CLEtBQUssTUFBTCxFQUFwQixJQUFxQyxDQUFoRCxDQURVLENBQzBDO0FBQzFEO0FBQ0E7OztBQUdKO0FBTm9CLFNBQXBCLENBT0EsS0FBSyxHQUFMLEdBQVcsSUFBSSxLQUFLLFdBQVQsQ0FDUDtBQUNJLHVCQUFXLEtBRGY7QUFFSSx5QkFBYSxLQUZqQjtBQUdJLHdCQUFZO0FBSGhCLFNBRE8sQ0FBWDtBQU9BLGFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBSyxHQUFMLENBQVMsSUFBcEM7O0FBRUE7QUFDQSxhQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEdBQWhCLENBQW9CLFVBQUMsS0FBRCxFQUFXO0FBQzNCLGtCQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0gsU0FGRDs7QUFJQSxhQUFLLFlBQUwsR0FBb0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLEVBQW9CLElBQXBCLENBQXBCOztBQUVBO0FBQ0EsYUFBSyxHQUFMLENBQVMsSUFBVDs7QUFFQTtBQUNBLGFBQUssTUFBTCxDQUNLLEdBREwsQ0FDUyxZQURULEVBQ3VCLHdCQUR2QixFQUVLLElBRkwsQ0FFVSxVQUFD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QWIsRUFBZ0I7QUFDZjtBQUNBLFlBQUcsZ0JBQUgsRUFDSSxLQUFLLEtBQUwsR0FBYSxpQkFBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBYixDQURKLEtBR0ksS0FBSyxLQUFMLEdBQWEsS0FBSyxNQUFMLEtBQWdCLEdBQTdCO0FBQ1AsS0FqQkQ7O0FBbUJBLFVBQU0sVUFBTixDQUFpQixDQUNiLEVBQUUsTUFBTSxRQUFSLEVBQWtCLGNBQWMsR0FBaEMsRUFEYSxDQUFqQjs7QUFJQSxXQUFPLEtBQVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcbmltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRHVzdCB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBpbml0RmluaXNoZWRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgICAgICBsZXQgd29ybGROYW1lcyA9IE9iamVjdC5rZXlzKFdvcmxkcyk7XG4gICAgICAgIHRoaXMud29ybGRPcHRpb25zID0ge1xuICAgICAgICAgICAgbmFtZTogd29ybGROYW1lc1t3b3JsZE5hbWVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBzdGFydHVwIHdvcmxkXG4gICAgICAgICAgICAvL3dpZHRoOiAxMjgsIC8vIENhbiBmb3JjZSBhIHdpZHRoL2hlaWdodCBoZXJlXG4gICAgICAgICAgICAvL2hlaWdodDogMTI4LFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBhcHAgYW5kIHB1dCBpdHMgY2FudmFzIGludG8gYGNvbnRhaW5lcmBcbiAgICAgICAgdGhpcy5hcHAgPSBuZXcgUElYSS5BcHBsaWNhdGlvbihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhbnRpYWxpYXM6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICB0cmFuc3BhcmVudDogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHJlc29sdXRpb246IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5hcHAudmlldyk7XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIHVwZGF0ZSBsb29wXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5hZGQoKGRlbHRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLk9uVXBkYXRlKGRlbHRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mcmFtZWNvdW50ZXIgPSBuZXcgRnJhbWVDb3VudGVyKDEsIG51bGwpO1xuXG4gICAgICAgIC8vIFN0b3AgYXBwbGljYXRpb24gYW5kIHdhaXQgZm9yIHNldHVwIHRvIGZpbmlzaFxuICAgICAgICB0aGlzLmFwcC5zdG9wKCk7XG5cbiAgICAgICAgLy8gTG9hZCByZXNvdXJjZXMgbmVlZGVkIGZvciB0aGUgcHJvZ3JhbSB0byBydW5cbiAgICAgICAgUElYSS5sb2FkZXJcbiAgICAgICAgICAgIC5hZGQoJ2ZyYWdTaGFkZXInLCAnLi4vcmVzb3VyY2VzL2R1c3QuZnJhZycpXG4gICAgICAgICAgICAubG9hZCgobG9hZGVyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBMb2FkaW5nIGhhcyBmaW5pc2hlZFxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkUmVzb3VyY2VzID0gcmVzO1xuICAgICAgICAgICAgICAgIHRoaXMuU2V0dXAoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zdGFydCgpO1xuICAgICAgICAgICAgICAgIGluaXRGaW5pc2hlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXVzYWJsZSBtZXRob2QgZm9yIHNldHRpbmcgdXAgdGhlIHNpbXVsYXRpb24gZnJvbSBgdGhpcy53b3JsZE9wdGlvbnNgLlxuICAgICAqIEFsc28gd29ya3MgYXMgYSByZXNldCBmdW5jdGlvbiBpZiB5b3UgY2FsbCB0aGlzIHdpdGhvdXQgY2hhbmdpbmdcbiAgICAgKiBgdGhpcy53b3JsZE9wdGlvbnMubmFtZWAgYmVmb3JlaGFuZC5cbiAgICAgKi9cbiAgICBTZXR1cCgpIHtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHdvcmxkIGZyb20gdGhlIHN0cmluZ1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53b3JsZCA9IFdvcmxkc1t0aGlzLndvcmxkT3B0aW9ucy5uYW1lXS5jYWxsKHRoaXMsIHRoaXMud29ybGRPcHRpb25zLndpZHRoLCB0aGlzLndvcmxkT3B0aW9ucy5oZWlnaHQpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IFwiV29ybGQgd2l0aCB0aGUgbmFtZSBcIiArIHRoaXMud29ybGRPcHRpb25zLm5hbWUgKyBcIiBkb2VzIG5vdCBleGlzdCFcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZyYW1lY291bnRlci5mcmFtZUZyZXF1ZW5jeSA9IHRoaXMud29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSB8fCAxO1xuXG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnJlc2l6ZSh0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGNhbnZhcyBmaWx0ZXJpbmcgdGhyb3VnaCBjc3NcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5jc3NUZXh0ID0gYCBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogb3B0aW1pemVTcGVlZDsgXG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IC1tb3otY3Jpc3AtZWRnZXM7IFxuICAgICAgICAgICAgaW1hZ2UtcmVuZGVyaW5nOiAtd2Via2l0LW9wdGltaXplLWNvbnRyYXN0OyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogb3B0aW1pemUtY29udHJhc3Q7XG4gICAgICAgICAgICBpbWFnZS1yZW5kZXJpbmc6IC1vLWNyaXNwLWVkZ2VzOyBcbiAgICAgICAgICAgIGltYWdlLXJlbmRlcmluZzogcGl4ZWxhdGVkOyBcbiAgICAgICAgICAgIC1tcy1pbnRlcnBvbGF0aW9uLW1vZGU6IG5lYXJlc3QtbmVpZ2hib3I7IFxuICAgICAgICBgO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmJvcmRlciA9IFwiMXB4IGRhc2hlZCBncmVlblwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnZpZXcuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLmJhY2tncm91bmRDb2xvciA9IDB4ZmZmZmZmO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNwcml0ZSBmcm9tIGEgYmxhbmsgY2FudmFzXG4gICAgICAgIHRoaXMudGV4dHVyZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMud2lkdGggPSB0aGlzLndvcmxkLndpZHRoO1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0ID0gdGhpcy53b3JsZC5oZWlnaHQ7XG4gICAgICAgIHRoaXMudGV4dHVyZUN0eCA9IHRoaXMudGV4dHVyZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOyAvLyBVc2VkIGxhdGVyIHRvIHVwZGF0ZSB0ZXh0dXJlXG5cbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZSA9IG5ldyBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXModGhpcy50ZXh0dXJlQ2FudmFzKTtcbiAgICAgICAgdGhpcy5zcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUoXG4gICAgICAgICAgICBuZXcgUElYSS5UZXh0dXJlKHRoaXMuYmFzZVRleHR1cmUsIG5ldyBQSVhJLlJlY3RhbmdsZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCkpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQ2VudGVyIHRoZSBzcHJpdGVcbiAgICAgICAgdGhpcy5zcHJpdGUueCA9IHRoaXMud29ybGQud2lkdGggLyAyO1xuICAgICAgICB0aGlzLnNwcml0ZS55ID0gdGhpcy53b3JsZC5oZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnNwcml0ZS5hbmNob3Iuc2V0KDAuNSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzaGFkZXIgZm9yIHRoZSBzcHJpdGVcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBuZXcgUElYSS5GaWx0ZXIobnVsbCwgdGhpcy5sb2FkZWRSZXNvdXJjZXMuZnJhZ1NoYWRlci5kYXRhKTtcbiAgICAgICAgdGhpcy5zcHJpdGUuZmlsdGVycyA9IFt0aGlzLmZpbHRlcl07XG5cbiAgICAgICAgdGhpcy5hcHAuc3RhZ2UucmVtb3ZlQ2hpbGRyZW4oKTsgLy8gUmVtb3ZlIGFueSBhdHRhY2hlZCBjaGlsZHJlbiAoZm9yIGNhc2Ugd2hlcmUgY2hhbmdpbmcgcHJlc2V0cylcbiAgICAgICAgdGhpcy5hcHAuc3RhZ2UuYWRkQ2hpbGQodGhpcy5zcHJpdGUpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgdGV4dHVyZSBmcm9tIHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSB3b3JsZFxuICAgICAgICB0aGlzLlVwZGF0ZVRleHR1cmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgZXZlcnkgZnJhbWUuIENvbnRpbnVlcyBpbmRlZmluaXRlbHkgYWZ0ZXIgYmVpbmcgY2FsbGVkIG9uY2UuXG4gICAgICovXG4gICAgT25VcGRhdGUoZGVsdGEpIHtcbiAgICAgICAgbGV0IG5vc2tpcCA9IHRoaXMuZnJhbWVjb3VudGVyLkluY3JlbWVudEZyYW1lKCk7XG4gICAgICAgIGlmKG5vc2tpcCkge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXIudW5pZm9ybXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc3RlcCgpO1xuICAgICAgICAgICAgdGhpcy5VcGRhdGVUZXh0dXJlKCk7XG4gICAgICAgICAgICB0aGlzLmFwcC5yZW5kZXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgdGV4dHVyZSByZXByZXNlbnRpbmcgdGhlIHdvcmxkLlxuICAgICAqIFdyaXRlcyBjZWxsIGNvbG9ycyB0byB0aGUgdGV4dHVyZSBjYW52YXMgYW5kIHVwZGF0ZXMgYGJhc2VUZXh0dXJlYCBmcm9tIGl0LFxuICAgICAqIHdoaWNoIG1ha2VzIFBpeGkgdXBkYXRlIHRoZSBzcHJpdGUuXG4gICAgICovXG4gICAgVXBkYXRlVGV4dHVyZSgpIHtcbiAgICAgICAgXG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGxldCBjdHggPSB0aGlzLnRleHR1cmVDdHg7XHRcdFxuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoLCB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgbGV0IHBpeCA9IGN0eC5jcmVhdGVJbWFnZURhdGEodGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoLCB0aGlzLnRleHR1cmVDYW52YXMuaGVpZ2h0KTtcdFx0XG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodDsgeSsrKSB7XHRcdFx0XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhbGV0dGVJbmRleCA9IHRoaXMud29ybGQuZ3JpZFt5XVt4XS5nZXRDb2xvcigpO1xuICAgICAgICAgICAgICAgIGxldCBjb2xvclJHQkEgPSB0aGlzLndvcmxkLnBhbGV0dGVbcGFsZXR0ZUluZGV4XTtcbiAgICAgICAgICAgICAgICBpZihjb2xvclJHQkEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVswXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVsxXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVsyXTtcdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBwaXguZGF0YVtpbmRleCsrXSA9IGNvbG9yUkdCQVszXTtcdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiUGFsZXR0ZSBpbmRleCBvdXQgb2YgYm91bmRzOiBcIiArIHBhbGV0dGVJbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XHRcdFxuICAgICAgICB9IFx0XHRcbiAgICAgICAgY3R4LnB1dEltYWdlRGF0YShwaXgsIDAsIDApO1xuXG4gICAgICAgIC8vIFRlbGwgUGl4aSB0byB1cGRhdGUgdGhlIHRleHR1cmUgcmVmZXJlbmNlZCBieSB0aGlzIGN0eC5cbiAgICAgICAgdGhpcy5iYXNlVGV4dHVyZS51cGRhdGUoKTtcblxuICAgIH1cblxufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIGNsYXNzIGZvciByZXN0cmljdGluZyB0aGUgcmVmcmVzaCByYXRlIG9mIHRoZSBzaW11bGF0aW9uLlxuICovXG5jbGFzcyBGcmFtZUNvdW50ZXIge1xuICAgIGNvbnN0cnVjdG9yKGZyYW1lRnJlcXVlbmN5LCBmcmFtZUxpbWl0ID0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGZyYW1lcyBpbmdlc3RlZFxuICAgICAgICB0aGlzLmZyYW1lQ291bnQgPSAwO1xuXG4gICAgICAgIC8vIFRoZSBudW1iZXIgb2YgZnJhbWVzIGFsbG93ZWQgdG8gcnVuXG4gICAgICAgIHRoaXMucGFzc2VkRnJhbWVzID0gMDtcblxuICAgICAgICAvLyBGcmFtZSB3aWxsIHJ1biBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIGZyYW1lcyB0aGF0IHBhc3NcbiAgICAgICAgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9IGZyYW1lRnJlcXVlbmN5O1xuXG4gICAgICAgIC8vIElmIHNldCwgY2xhc3Mgd2lsbCBzdG9wIGFsbG93aW5nIGZyYW1lcyBhZnRlciBgZnJhbWVMaW1pdGAgXG4gICAgICAgIC8vIHBhc3NlZEZyYW1lcyBoYXZlIGJlZW4gYWxsb3dlZC5cbiAgICAgICAgdGhpcy5mcmFtZUxpbWl0ID0gZnJhbWVMaW1pdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgb25jZSBldmVyeSBgZnJhbWVGcmVxdWVuY3lgIHRpbWVzIGl0IGlzIGNhbGxlZC5cbiAgICAgKi9cbiAgICBJbmNyZW1lbnRGcmFtZSgpe1xuICAgICAgICB0aGlzLmZyYW1lQ291bnQgKz0gMTtcbiAgICAgICAgaWYodGhpcy5mcmFtZUNvdW50ICUgdGhpcy5mcmFtZUZyZXF1ZW5jeSA9PSAwKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSd2ZSByZWFjaGVkIHRoZSBmcmFtZSBsaW1pdFxuICAgICAgICAgICAgaWYodGhpcy5mcmFtZUxpbWl0ICE9IG51bGwgJiYgdGhpcy5wYXNzZWRGcmFtZXMgPj0gdGhpcy5mcmFtZUxpbWl0KVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMucGFzc2VkRnJhbWVzICs9IDE7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSIsImltcG9ydCB7IFdvcmxkcyB9IGZyb20gXCIuL3dvcmxkcy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgR1VJIHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIGF0dGFjaGVzIGEgR1VJIHRvIHRoZSBwYWdlIGlmIERBVC5HVUkgaXMgaW5jbHVkZWQuXG4gICAgICovXG4gICAgc3RhdGljIEluaXQoZHVzdCl7XG4gICAgICAgIGlmKHR5cGVvZihkYXQpID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIERBVC5HVUkgaW5zdGFuY2UgZm91bmQuIEltcG9ydCBvbiB0aGlzIHBhZ2UgdG8gdXNlIVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBndWkgPSBuZXcgZGF0LkdVSSgpO1xuXG4gICAgICAgIGd1aS5hZGQoZHVzdC5mcmFtZWNvdW50ZXIsICdmcmFtZUZyZXF1ZW5jeScpLm1pbigxKS5tYXgoMzApLnN0ZXAoMSkubGlzdGVuKCk7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LndvcmxkT3B0aW9ucywgJ25hbWUnLCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhXb3JsZHMpKS5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICBkdXN0LlNldHVwKCk7XG4gICAgICAgIH0pLm5hbWUoXCJQcmVzZXRcIik7XG5cbiAgICAgICAgZ3VpLmFkZChkdXN0LCBcIlNldHVwXCIpLm5hbWUoXCJSZXNldFwiKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBEZXRlY3RvciB9IGZyb20gXCIuL3V0aWxzL3dlYmdsLWRldGVjdC5qc1wiO1xuaW1wb3J0IHsgRHVzdCB9IGZyb20gXCIuL2R1c3QuanNcIjtcbmltcG9ydCB7IEdVSSB9IGZyb20gXCIuL2d1aS5qc1wiO1xuXG5sZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXN0LWNvbnRhaW5lclwiKTtcblxuaWYgKCAhRGV0ZWN0b3IuSGFzV2ViR0woKSApIHtcbiAgICAvL2V4aXQoXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29uc29sZS5sb2coXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IERldGVjdG9yLkdldEVycm9ySFRNTCgpO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibm8td2ViZ2xcIik7XG59XG5lbHNlIHtcbiAgICBsZXQgZHVzdCA9IG5ldyBEdXN0KGNvbnRhaW5lciwgKCkgPT4ge1xuICAgICAgICAvLyBEdXN0IGlzIG5vdyBmdWxseSBsb2FkZWRcbiAgICAgICAgR1VJLkluaXQoZHVzdCk7XG4gICAgfSk7XG59IiwiY2xhc3MgRGV0ZWN0b3Ige1xuXG4gICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExODcxMDc3L3Byb3Blci13YXktdG8tZGV0ZWN0LXdlYmdsLXN1cHBvcnRcbiAgICBzdGF0aWMgSGFzV2ViR0woKSB7XG4gICAgICAgIGlmICghIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IFtcIndlYmdsXCIsIFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIFwibW96LXdlYmdsXCIsIFwid2Via2l0LTNkXCJdLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTw0O2krKykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChuYW1lc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0LmdldFBhcmFtZXRlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYkdMIGlzIGVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZWJHTCBpcyBzdXBwb3J0ZWQsIGJ1dCBkaXNhYmxlZFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlYkdMIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBHZXRFcnJvckhUTUwobWVzc2FnZSA9IG51bGwpe1xuICAgICAgICBpZihtZXNzYWdlID09IG51bGwpe1xuICAgICAgICAgICAgbWVzc2FnZSA9IGBZb3VyIGdyYXBoaWNzIGNhcmQgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHA6Ly9raHJvbm9zLm9yZy93ZWJnbC93aWtpL0dldHRpbmdfYV9XZWJHTF9JbXBsZW1lbnRhdGlvblwiPldlYkdMPC9hPi4gPGJyPlxuICAgICAgICAgICAgICAgICAgICAgICAgRmluZCBvdXQgaG93IHRvIGdldCBpdCA8YSBocmVmPVwiaHR0cDovL2dldC53ZWJnbC5vcmcvXCI+aGVyZTwvYT4uYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibm8td2ViZ2wtc3VwcG9ydFwiPlxuICAgICAgICA8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke21lc3NhZ2V9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuICAgIH1cblxufVxuXG5leHBvcnQgeyBEZXRlY3RvciB9OyIsImZ1bmN0aW9uIENlbGxBdXRvQ2VsbChsb2NYLCBsb2NZKSB7XG5cdHRoaXMueCA9IGxvY1g7XG5cdHRoaXMueSA9IGxvY1k7XG5cblx0dGhpcy5kZWxheXMgPSBbXTtcbn1cblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1cnJvdW5kaW5nID0gMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXVt2YWx1ZV0pIHtcblx0XHRcdHN1cnJvdW5kaW5nKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBzdXJyb3VuZGluZztcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24obnVtU3RlcHMsIGZuKSB7XG5cdHRoaXMuZGVsYXlzLnB1c2goeyBzdGVwczogbnVtU3RlcHMsIGFjdGlvbjogZm4gfSk7XG59O1xuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1bW1lZCA9IDAuMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIChuZWlnaGJvcnNbaV1bdmFsdWVdIHx8IG5laWdoYm9yc1tpXVt2YWx1ZV0gPT09IDApKSB7XG5cdFx0XHRzdW1tZWQgKz0gbmVpZ2hib3JzW2ldW3ZhbHVlXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHN1bW1lZCAvIG5laWdoYm9ycy5sZW5ndGg7Ly9jbnQ7XG59O1xuZnVuY3Rpb24gQ0FXb3JsZChvcHRpb25zKSB7XG5cblx0dGhpcy53aWR0aCA9IDI0O1xuXHR0aGlzLmhlaWdodCA9IDI0O1xuXHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG5cdHRoaXMud3JhcCA9IGZhbHNlO1xuXG5cdHRoaXMuVE9QTEVGVCAgICAgICAgPSB7IGluZGV4OiAwLCB4OiAtMSwgeTogLTEgfTtcblx0dGhpcy5UT1AgICAgICAgICAgICA9IHsgaW5kZXg6IDEsIHg6ICAwLCB5OiAtMSB9O1xuXHR0aGlzLlRPUFJJR0hUICAgICAgID0geyBpbmRleDogMiwgeDogIDEsIHk6IC0xIH07XG5cdHRoaXMuTEVGVCAgICAgICAgICAgPSB7IGluZGV4OiAzLCB4OiAtMSwgeTogIDAgfTtcblx0dGhpcy5SSUdIVCAgICAgICAgICA9IHsgaW5kZXg6IDQsIHg6ICAxLCB5OiAgMCB9O1xuXHR0aGlzLkJPVFRPTUxFRlQgICAgID0geyBpbmRleDogNSwgeDogLTEsIHk6ICAxIH07XG5cdHRoaXMuQk9UVE9NICAgICAgICAgPSB7IGluZGV4OiA2LCB4OiAgMCwgeTogIDEgfTtcblx0dGhpcy5CT1RUT01SSUdIVCAgICA9IHsgaW5kZXg6IDcsIHg6ICAxLCB5OiAgMSB9O1xuXHRcblx0dGhpcy5yYW5kb21HZW5lcmF0b3IgPSBNYXRoLnJhbmRvbTtcblxuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdCwgZWlnaHQgc2lkZXNcblx0dmFyIG5laWdoYm9yaG9vZCA9IFtudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcblxuXHRpZiAodGhpcy5vcHRpb25zLmhleFRpbGVzKSB7XG5cdFx0Ly8gc2l4IHNpZGVzXG5cdFx0bmVpZ2hib3Job29kID0gW251bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xuXHR9XG5cdHRoaXMuc3RlcCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5LCB4O1xuXHRcdGZvciAoeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRcdGZvciAoeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0XHR0aGlzLmdyaWRbeV1beF0ucmVzZXQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBib3R0b20gdXAsIGxlZnQgdG8gcmlnaHQgcHJvY2Vzc2luZ1xuXHRcdGZvciAoeT10aGlzLmhlaWdodC0xOyB5Pj0wOyB5LS0pIHtcblx0XHRcdGZvciAoeD10aGlzLndpZHRoLTE7IHg+PTA7IHgtLSkge1xuXHRcdFx0XHR0aGlzLmZpbGxOZWlnaGJvcnMobmVpZ2hib3Job29kLCB4LCB5KTtcblx0XHRcdFx0dmFyIGNlbGwgPSB0aGlzLmdyaWRbeV1beF07XG5cdFx0XHRcdGNlbGwucHJvY2VzcyhuZWlnaGJvcmhvb2QpO1xuXG5cdFx0XHRcdC8vIHBlcmZvcm0gYW55IGRlbGF5c1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8Y2VsbC5kZWxheXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5zdGVwcy0tO1xuXHRcdFx0XHRcdGlmIChjZWxsLmRlbGF5c1tpXS5zdGVwcyA8PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBwZXJmb3JtIGFjdGlvbiBhbmQgcmVtb3ZlIGRlbGF5XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5hY3Rpb24oY2VsbCk7XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5cy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vdmFyIE5FSUdIQk9STE9DUyA9IFt7eDotMSwgeTotMX0sIHt4OjAsIHk6LTF9LCB7eDoxLCB5Oi0xfSwge3g6LTEsIHk6MH0sIHt4OjEsIHk6MH0se3g6LTEsIHk6MX0sIHt4OjAsIHk6MX0sIHt4OjEsIHk6MX1dO1xuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdFxuXHR2YXIgTkVJR0hCT1JMT0NTID0gW1xuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIHJpZ2h0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbVxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XTtcblx0aWYgKHRoaXMub3B0aW9ucy5oZXhUaWxlcykge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMuZmxhdFRvcHBlZCkge1xuXHRcdFx0Ly8gZmxhdCB0b3BwZWQgaGV4IG1hcCwgIGZ1bmN0aW9uIHJlcXVpcmVzIGNvbHVtbiB0byBiZSBwYXNzZWRcblx0XHRcdE5FSUdIQk9STE9DUyA9IFtcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0sICAvLyBib3R0b20gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b21cblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0gIC8vIGJvdHRvbSBsZWZ0XG5cdFx0XHRdO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIHBvaW50eSB0b3BwZWQgaGV4IG1hcCwgZnVuY3Rpb24gcmVxdWlyZXMgcm93IHRvIGJlIHBhc3NlZFxuXHRcdFx0TkVJR0hCT1JMT0NTID0gW1xuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMCA6IC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDAgOiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b20gbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XHRcdF07XG5cdFx0fVxuXG5cdH1cblx0dGhpcy5maWxsTmVpZ2hib3JzID0gZnVuY3Rpb24obmVpZ2hib3JzLCB4LCB5KSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPE5FSUdIQk9STE9DUy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5laWdoYm9yWCA9IHggKyBORUlHSEJPUkxPQ1NbaV0uZGlmZlgoeCwgeSk7XG5cdFx0XHR2YXIgbmVpZ2hib3JZID0geSArIE5FSUdIQk9STE9DU1tpXS5kaWZmWSh4LCB5KTtcblx0XHRcdGlmICh0aGlzLndyYXApIHtcblx0XHRcdFx0Ly8gVE9ETzogaGV4IG1hcCBzdXBwb3J0IGZvciB3cmFwcGluZ1xuXHRcdFx0XHRuZWlnaGJvclggPSAobmVpZ2hib3JYICsgdGhpcy53aWR0aCkgJSB0aGlzLndpZHRoO1xuXHRcdFx0XHRuZWlnaGJvclkgPSAobmVpZ2hib3JZICsgdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXRoaXMud3JhcCAmJiAobmVpZ2hib3JYIDwgMCB8fCBuZWlnaGJvclkgPCAwIHx8IG5laWdoYm9yWCA+PSB0aGlzLndpZHRoIHx8IG5laWdoYm9yWSA+PSB0aGlzLmhlaWdodCkpIHtcblx0XHRcdFx0bmVpZ2hib3JzW2ldID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuZWlnaGJvcnNbaV0gPSB0aGlzLmdyaWRbbmVpZ2hib3JZXVtuZWlnaGJvclhdO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihhcnJheVR5cGVEaXN0KSB7XG5cblx0XHQvLyBzb3J0IHRoZSBjZWxsIHR5cGVzIGJ5IGRpc3RyaWJ1dGlvblxuXHRcdGFycmF5VHlwZURpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRyZXR1cm4gYS5kaXN0cmlidXRpb24gPiBiLmRpc3RyaWJ1dGlvbiA/IDEgOiAtMTtcblx0XHR9KTtcblxuXHRcdHZhciB0b3RhbERpc3QgPSAwO1xuXHRcdC8vIGFkZCBhbGwgZGlzdHJpYnV0aW9ucyB0b2dldGhlclxuXHRcdGZvciAodmFyIGk9MDsgaTxhcnJheVR5cGVEaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0b3RhbERpc3QgKz0gYXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb247XG5cdFx0XHRhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbiA9IHRvdGFsRGlzdDtcblx0XHR9XG5cblx0XHR0aGlzLmdyaWQgPSBbXTtcblx0XHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0XHRmb3IgKHZhciB4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRcdHZhciByYW5kb20gPSB0aGlzLnJhbmRvbUdlbmVyYXRvcigpICogMTAwO1xuXG5cdFx0XHRcdGZvciAoaT0wOyBpPGFycmF5VHlwZURpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAocmFuZG9tIDw9IGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbYXJyYXlUeXBlRGlzdFtpXS5uYW1lXSh4LCB5KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNlbGxUeXBlcyA9IHt9O1xuXHR0aGlzLnJlZ2lzdGVyQ2VsbFR5cGUgPSBmdW5jdGlvbihuYW1lLCBjZWxsT3B0aW9ucywgaW5pdCkge1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0Q2VsbEF1dG9DZWxsLmNhbGwodGhpcywgeCwgeSk7XG5cblx0XHRcdGlmIChpbml0KSB7XG5cdFx0XHRcdGluaXQuY2FsbCh0aGlzLCB4LCB5KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Ly8gcHJvcGVydGllcyBnZXQgaW5zdGFuY2Vcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdFx0Ly8gb2JqZWN0cyBtdXN0IGJlIGNsb25lZFxuXHRcdFx0XHRcdFx0XHR0aGlzW2tleV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNlbGxPcHRpb25zW2tleV0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBwcmltaXRpdmVcblx0XHRcdFx0XHRcdFx0dGhpc1trZXldID0gY2VsbE9wdGlvbnNba2V5XTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2VsbEF1dG9DZWxsLnByb3RvdHlwZSk7XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhpcy5jZWxsVHlwZXNbbmFtZV07XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNlbGxUeXBlID0gbmFtZTtcblxuXHRcdGlmIChjZWxsT3B0aW9ucykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdC8vIGZ1bmN0aW9ucyBnZXQgcHJvdG90eXBlXG5cdFx0XHRcdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlW2tleV0gPSBjZWxsT3B0aW9uc1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vIGFwcGx5IG9wdGlvbnNcblx0aWYgKG9wdGlvbnMpIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuXHRcdFx0dGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuXHRcdH1cblx0fVxuXG59XG5cbkNBV29ybGQucHJvdG90eXBlLmluaXRpYWxpemVGcm9tR3JpZCAgPSBmdW5jdGlvbih2YWx1ZXMsIGluaXRHcmlkKSB7XG5cblx0dGhpcy5ncmlkID0gW107XG5cdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0Zm9yICh2YXIgeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLmdyaWRWYWx1ZSA9PT0gaW5pdEdyaWRbeV1beF0pIHtcblx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbdmFsdWVzW2ldLm5hbWVdKHgsIHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn07XG5cbkNBV29ybGQucHJvdG90eXBlLmNyZWF0ZUdyaWRGcm9tVmFsdWVzID0gZnVuY3Rpb24odmFsdWVzLCBkZWZhdWx0VmFsdWUpIHtcblx0dmFyIG5ld0dyaWQgPSBbXTtcblxuXHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdG5ld0dyaWRbeV0gPSBbXTtcblx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0bmV3R3JpZFt5XVt4XSA9IGRlZmF1bHRWYWx1ZTtcblx0XHRcdHZhciBjZWxsID0gdGhpcy5ncmlkW3ldW3hdO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY2VsbC5jZWxsVHlwZSA9PSB2YWx1ZXNbaV0uY2VsbFR5cGUgJiYgY2VsbFt2YWx1ZXNbaV0uaGFzUHJvcGVydHldKSB7XG5cdFx0XHRcdFx0bmV3R3JpZFt5XVt4XSA9IHZhbHVlc1tpXS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXdHcmlkO1xufTtcblxuOyhmdW5jdGlvbigpIHtcbiAgdmFyIENlbGxBdXRvID0ge1xuICAgIFdvcmxkOiBDQVdvcmxkLFxuICAgIENlbGw6IENlbGxBdXRvQ2VsbFxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ0NlbGxBdXRvJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIENlbGxBdXRvO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDZWxsQXV0bztcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuQ2VsbEF1dG8gPSBDZWxsQXV0bztcbiAgfVxufSkoKTsiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcblxuZXhwb3J0IGxldCBXb3JsZHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaG9vc2VzIGEgcmFuZG9tIGVsZW1lbnRhcnkgYXV0b21hdGEgZnJvbSBhIGxpc3QuXG4gICAgICovXG4gICAgUmFuZG9tUnVsZTogZnVuY3Rpb24gKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgbGV0IHJ1bGVzID0gW1xuICAgICAgICAgICAgMTgsIDIyLCAyNiwgNTQsIDYwLCA5MCwgOTQsIDExMCwgMTI2LCAxNTBcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHJ1bGU6IHJ1bGVzW3J1bGVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBydWxlIGZyb20gbGlzdFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFbGVtZW50YXJ5KG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb253YXkncyBHYW1lIG9mIExpZmVcbiAgICAgKiBCMy9TMjNcbiAgICAgKi9cbiAgICBMaWZlOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzNdLFxuICAgICAgICAgICAgUzogWzIsIDNdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBtYXplLWxpa2Ugc3RydWN0dXJlLlxuICAgICAqIEJhc2VkIG9uIHJ1bGUgQjMvUzEyMzQgKE1hemVjZXRyaWMpLlxuICAgICAqL1xuICAgIE1hemVjZXRyaWM6IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBCOiBbM10sXG4gICAgICAgICAgICBTOiBbMSwgMiwgMywgNF0sXG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5OiA1LFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMaWZlTGlrZShvcHRpb25zLCAoeCwgeSkgPT4ge1xuICAgICAgICAgICAgLy8gRGlzdHJpYnV0aW9uIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8IDAuMTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEIzNTY3OC9TNTY3OFxuICAgICAqL1xuICAgIERpYW1vZWJhOiBmdW5jdGlvbih3aWR0aCA9IDk2LCBoZWlnaHQgPSA5Nikge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzMsIDUsIDYsIDcsIDhdLFxuICAgICAgICAgICAgUzogWzUsIDYsIDcsIDhdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogM1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMaWZlTGlrZShvcHRpb25zLCAoeCwgeSkgPT4ge1xuICAgICAgICAgICAgLy8gRGlzdHJpYnV0aW9uIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8IDAuMjtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEI0Njc4L1MzNTY3OFxuICAgICAqL1xuICAgIEFubmVhbDogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIEI6IFs0LCA2LCA3LCA4XSxcbiAgICAgICAgICAgIFM6IFszLCA1LCA2LCA3LCA4XSxcbiAgICAgICAgICAgIHBhbGV0dGU6IFtcbiAgICAgICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XSxcbiAgICAgICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3k6IDNcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTGlmZUxpa2Uob3B0aW9ucywgKHgsIHkpID0+IHtcbiAgICAgICAgICAgIC8vIERpc3RyaWJ1dGlvbiBmdW5jdGlvblxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPCAwLjM7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDQSB0aGF0IGxvb2tzIGxpa2UgbGF2YS5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgTGF2YTogZnVuY3Rpb24gKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gdGhhbmtzIHRvIFRoZUxhc3RCYW5hbmEgb24gVElHU291cmNlXG5cbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzM0LDEwLDIxLDI1NV0sIFs2OCwxNywyNiwyNTVdLCBbMTIzLDE2LDE2LDI1NV0sXG4gICAgICAgICAgICBbMTkwLDQ1LDE2LDI1NV0sIFsyNDQsMTAyLDIwLDI1NV0sIFsyNTQsMjEyLDk3LDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICBsZXQgY29sb3JzID0gW107XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDE4OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAxOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDIyOyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAwOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDI1OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAxOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDI3OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAyOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDI5OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAzOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDMyOyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAyOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDM1OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAwOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDM2OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAyOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDM4OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSA0OyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDQyOyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSA1OyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDQ0OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSA0OyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDQ2OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAyOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDU2OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAxOyB9XG4gICAgICAgIGZvciAoOyBpbmRleCA8IDY0OyArK2luZGV4KSB7IGNvbG9yc1tpbmRleF0gPSAwOyB9XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGF2YScsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbGV0IHYgPSB0aGlzLnZhbHVlICsgMC41XG4gICAgICAgICAgICAgICAgICAgICsgTWF0aC5zaW4odGhpcy54IC8gd29ybGQud2lkdGggKiBNYXRoLlBJKSAqIDAuMDRcbiAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnNpbih0aGlzLnkgLyB3b3JsZC5oZWlnaHQgKiBNYXRoLlBJKSAqIDAuMDRcbiAgICAgICAgICAgICAgICAgICAgLSAwLjA1O1xuICAgICAgICAgICAgICAgIHYgPSBNYXRoLm1pbigxLjAsIE1hdGgubWF4KDAuMCwgdikpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yc1tNYXRoLmZsb29yKGNvbG9ycy5sZW5ndGggKiB2KV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuZHJvcGxldCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0udmFsdWUgPSAwLjUgKnRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnByZXYgPSAwLjUgKnRoaXMucHJldjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BsZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBhdmcgPSB0aGlzLmdldFN1cnJvdW5kaW5nQ2VsbHNBdmVyYWdlVmFsdWUobmVpZ2hib3JzLCAndmFsdWUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQgPSAwLjk5OCAqICgyICogYXZnIC0gdGhpcy5wcmV2KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA+IDAuOTk5OTMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IC0wLjI1ICsgMC4zKk1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5uZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gTWF0aC5taW4oMC41LCBNYXRoLm1heCgtMC41LCB0aGlzLnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB0aGlzLm5leHQgPSB0aGlzLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2xhdmEnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDeWNsaWMgcmFpbmJvdyBhdXRvbWF0YS5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ3ljbGljUmFpbmJvd3M6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgPSAxO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMjU1LDAsMCwxICogMjU1XSwgWzI1NSw5NiwwLDEgKiAyNTVdLCBbMjU1LDE5MSwwLDEgKiAyNTVdLCBbMjIzLDI1NSwwLDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEyOCwyNTUsMCwxICogMjU1XSwgWzMyLDI1NSwwLDEgKiAyNTVdLCBbMCwyNTUsNjQsMSAqIDI1NV0sIFswLDI1NSwxNTksMSAqIDI1NV0sXG4gICAgICAgICAgICBbMCwyNTUsMjU1LDEgKiAyNTVdLCBbMCwxNTksMjU1LDEgKiAyNTVdLCBbMCw2NCwyNTUsMSAqIDI1NV0sIFszMiwwLDI1NSwxICogMjU1XSxcbiAgICAgICAgICAgIFsxMjcsMCwyNTUsMSAqIDI1NV0sIFsyMjMsMCwyNTUsMSAqIDI1NV0sIFsyNTUsMCwxOTEsMSAqIDI1NV0sIFsyNTUsMCw5NiwxICogMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2N5Y2xpYycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gKHRoaXMuc3RhdGUgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMikpICUgMTY7XG5cbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2luZyA9IGNoYW5naW5nIHx8IG5laWdoYm9yc1tpXS5zdGF0ZSA9PT0gbmV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdpbmcpIHRoaXMuc3RhdGUgPSBuZXh0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnY3ljbGljJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlcyBjYXZlcyBhbmQgd2F0ZXIgbW92ZW1lbnQuXG4gICAgICogXG4gICAgICogRnJvbSBodHRwczovL3Nhbm9qaWFuLmdpdGh1Yi5pby9jZWxsYXV0b1xuICAgICAqL1xuICAgIENhdmVzV2l0aFdhdGVyOiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIC8vIEZJUlNUIENSRUFURSBDQVZFU1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2FsbCcsIHtcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNPcGVuJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuID0gKHRoaXMud2FzT3BlbiAmJiBzdXJyb3VuZGluZyA+PSA0KSB8fCBzdXJyb3VuZGluZyA+PSA2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNPcGVuID0gdGhpcy5vcGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMub3BlbiA9IE1hdGgucmFuZG9tKCkgPiAwLjQwO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhbGwnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIG91ciBjYXZlLCAxMCBzdGVwcyBhdWdodCB0byBkbyBpdFxuICAgICAgICBmb3IgKGxldCBpPTA7IGk8MTA7IGkrKykge1xuICAgICAgICAgICAgd29ybGQuc3RlcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGdyaWQgPSB3b3JsZC5jcmVhdGVHcmlkRnJvbVZhbHVlcyhbXG4gICAgICAgICAgICB7IGNlbGxUeXBlOiAnd2FsbCcsIGhhc1Byb3BlcnR5OiAnb3BlbicsIHZhbHVlOiAwIH1cbiAgICAgICAgXSwgMSk7XG5cbiAgICAgICAgLy8gTk9XIFVTRSBPVVIgQ0FWRVMgVE8gQ1JFQVRFIEEgTkVXIFdPUkxEIENPTlRBSU5JTkcgV0FURVJcbiAgICAgICAgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBjbGVhclJlY3Q6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDAgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDIvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAzLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDUvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA2LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDgvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxICogMjU1XSxcbiAgICAgICAgICAgIFsxMDksIDE3MCwgNDQsIDEgKiAyNTVdLFxuICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDEgKiAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2F0ZXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gMHg1OTdEQ0U0NDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53YXRlcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy53YXRlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHJlYWR5IGVtcHR5XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gcHVzaCBteSB3YXRlciBvdXQgdG8gbXkgYXZhaWxhYmxlIG5laWdoYm9yc1xuXG4gICAgICAgICAgICAgICAgLy8gY2VsbCBiZWxvdyBtZSB3aWxsIHRha2UgYWxsIGl0IGNhblxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgOSAtIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYm90dG9tIHR3byBjb3JuZXJzIHRha2UgaGFsZiBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGk9NTsgaTw9NzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpIT13b3JsZC5CT1RUT00uaW5kZXggJiYgbmVpZ2hib3JzW2ldICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gc2lkZXMgdGFrZSBhIHRoaXJkIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaT0zOyBpPD00OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCB0aGlzLndhdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMud2F0ZXIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgncm9jaycsIHtcbiAgICAgICAgICAgIGlzU29saWQ6IHRydWUsXG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlnaHRlZCA/IDEwIDogMTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWdodGVkID0gbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gJiYgIShuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS53YXRlciA9PT0gOSkgJiYgIW5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLmlzU29saWRcbiAgICAgICAgICAgICAgICAgICAgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0uaXNTb2xpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFzcyBpbiBvdXIgZ2VuZXJhdGVkIGNhdmUgZGF0YVxuICAgICAgICB3b3JsZC5pbml0aWFsaXplRnJvbUdyaWQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9jaycsIGdyaWRWYWx1ZTogMSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnd2F0ZXInLCBncmlkVmFsdWU6IDAgfVxuICAgICAgICBdLCBncmlkKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIFJhaW46IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGxldCBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAobGV0IGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBjdXQgdGhlIHRvcCBoYWxmIG9mIHRoZSBjYXZlcyBvZmZcbiAgICAgICAgZm9yIChsZXQgeT0wOyB5PE1hdGguZmxvb3Iod29ybGQuaGVpZ2h0LzIpOyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHg9MDsgeDx3b3JsZC53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgZ3JpZFt5XVt4XSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDI1NV0sXG4gICAgICAgICAgICBbMTA5LCAxNzAsIDQ0LCAyNTVdLFxuICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdhaXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gJzg5LCAxMjUsIDIwNiwgJyArICh0aGlzLndhdGVyID8gTWF0aC5tYXgoMC4zLCB0aGlzLndhdGVyLzkpIDogMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2F0ZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgLy8gcmFpbiBvbiB0aGUgdG9wIHJvd1xuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XSA9PT0gbnVsbCAmJiBNYXRoLnJhbmRvbSgpIDwgMC4wMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyID0gNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy53YXRlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHJlYWR5IGVtcHR5XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTM7IGk8PTQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS53YXRlciA8IHRoaXMud2F0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy53YXRlciA9IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3JvY2snLCB7XG4gICAgICAgICAgICBpc1NvbGlkOiB0cnVlLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpZ2h0ZWQgPyAxMCA6IDExO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMubGlnaHRlZCA9IG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdICYmICEobmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0ud2F0ZXIgPT09IDkpICYmICFuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS5pc1NvbGlkXG4gICAgICAgICAgICAgICAgICAgICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICYmIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLmlzU29saWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhc3MgaW4gb3VyIGdlbmVyYXRlZCBjYXZlIGRhdGFcbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZUZyb21HcmlkKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3JvY2snLCBncmlkVmFsdWU6IDEgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FpcicsIGdyaWRWYWx1ZTogMCB9XG4gICAgICAgIF0sIGdyaWQpO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIHNwbGFzaGluZyB3YXRlci5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgU3BsYXNoZXM6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXTtcbiAgICAgICAgbGV0IGNvbG9ycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpbmRleD0wOyBpbmRleDw2NDsgaW5kZXgrKykge1xuICAgICAgICAgICAgd29ybGQucGFsZXR0ZS5wdXNoKFs4OSwgMTI1LCAyMDYsIChpbmRleC82NCkgKiAyNTVdKTtcbiAgICAgICAgICAgIGNvbG9yc1tpbmRleF0gPSA2MyAtIGluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnd2F0ZXInLCB7XG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxldCB2ID0gKE1hdGgubWF4KDIgKiB0aGlzLnZhbHVlICsgMC4wMiwgMCkgLSAwLjAyKSArIDAuNTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnZhbHVlID0gMC41ICp0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS5wcmV2ID0gMC41ICp0aGlzLnByZXY7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgYXZnID0gdGhpcy5nZXRTdXJyb3VuZGluZ0NlbGxzQXZlcmFnZVZhbHVlKG5laWdoYm9ycywgJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0ID0gMC45OSAqICgyICogYXZnIC0gdGhpcy5wcmV2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjk5OTkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IC0wLjIgKyAwLjI1Kk1hdGgucmFuZG9tKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5uZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAwLjA7XG4gICAgICAgICAgICB0aGlzLnByZXYgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5uZXh0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YXRlcicsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdWxlIDUyOTI4IC0gdGhlIENBIHVzZWQgZm9yIFdvbGZyYW0gQWxwaGEncyBsb2FkaW5nIGFuaW1hdGlvbnNcbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cHM6Ly93d3cucXVvcmEuY29tL1doYXQtaXMtV29sZnJhbS1BbHBoYXMtbG9hZGluZy1zY3JlZW4tYS1kZXBpY3Rpb24tb2ZcbiAgICAgKiBodHRwOi8vanNmaWRkbGUubmV0L2h1bmdyeWNhbWVsLzlVcnpKL1xuICAgICAqL1xuICAgIFdvbGZyYW06IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDI7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdLCAvLyBCYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICBbMjU1LCAxMTAsIDAgICwgMjU1XSwgLy8gZGFyayBvcmFuZ2VcbiAgICAgICAgICAgIFsyNTUsIDEzMCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE1MCwgMCAgLCAyNTVdLCAvLyAgICAgIHxcbiAgICAgICAgICAgIFsyNTUsIDE3MCwgMCAgLCAyNTVdLCAvLyAgICAgIFZcbiAgICAgICAgICAgIFsyNTUsIDE4MCwgMCAgLCAyNTVdICAvLyBsaWdodCBvcmFuZ2VcbiAgICAgICAgXTtcblxuICAgICAgICBsZXQgY2hvaWNlID0gTWF0aC5yYW5kb20oKTtcblxuICAgICAgICBsZXQgc2VlZExpc3QgPSBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMiwgMSwgMSwgMSwgMSwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFsxLCAxLCAzLCA0LCAyLCAxLCAxLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDQsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMiwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAxLCAxLCAwLCAwLCAyLCAyLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDIsIDIsIDAsIDAsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMiwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAxLCAxLCA0LCAxLCAxLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDIsIDQsIDMsIDEsIDFdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMSwgMiwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwXVxuICAgICAgICAgICAgXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDEsIDAsIDAsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDAsIDAsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDAsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMSwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDAsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMSwgMCwgMCwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMCwgMCwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMCwgMCwgMV0sIFsxLCAwLCAwLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDAsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMCwgMCwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAwLCAwLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMCwgMSwgMF0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDBdLCBbMSwgMSwgMSwgMCwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzAsIDEsIDEsIDAsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAwLCAxLCAxLCAxLCAwLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMCwgMV0sIFsxLCAwLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMV0sIFsxLCAxLCAwLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMCwgMCwgMSwgMSwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdXSwgXG4gICAgICAgICAgICBbWzEsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMCwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAwLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDFdXVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuXG4gICAgICAgICAgICAgICAgbGV0IG5laWdoYm9yT25lcyA9IG5laWdoYm9ycy5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnN0YXRlID09IDE7XG4gICAgICAgICAgICAgICAgfSkubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAzIHx8IG5laWdoYm9yT25lcyA9PSA1IHx8IG5laWdoYm9yT25lcyA9PSA3KSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yT25lcyA9PSAwIHx8IG5laWdoYm9yT25lcyA9PSAxIHx8IG5laWdoYm9yT25lcyA9PSAyIHx8IG5laWdoYm9yT25lcyA9PSA2IHx8IG5laWdoYm9yT25lcyA9PSA4KVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAvLyBJbml0IFxuXG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIHVzZSBhIHNlZWRcbiAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuNSl7XG4gICAgICAgICAgICAgICAgbGV0IHNlZWQ7XG4gICAgICAgICAgICAgICAgLy8gMjUlIGNoYW5jZSB0byB1c2UgYSByYW5kb20gc2VlZFxuICAgICAgICAgICAgICAgIGlmKGNob2ljZSA8IDAuMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VlZCA9IHNlZWRMaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlZWRMaXN0Lmxlbmd0aCldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAyNSUgY2hhbmNlIHRvIHVzZSB0aGUgV29sZnJhbSBzZWVkXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlZWQgPSBzZWVkTGlzdFswXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgbWluWCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSAtIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgbWF4WCA9IE1hdGguZmxvb3Iod2lkdGggLyAyKSArIE1hdGguZmxvb3Ioc2VlZFswXS5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgbWluWSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gMikgLSBNYXRoLmZsb29yKHNlZWQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICAgICAgbGV0IG1heFkgPSBNYXRoLmZsb29yKGhlaWdodCAvIDIpICsgTWF0aC5mbG9vcihzZWVkLmxlbmd0aCAvIDIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpcyBpbnNpZGUgb2YgdGhlIHNlZWQgYXJyYXkgKGNlbnRlcmVkIGluIHRoZSB3b3JsZCksIHRoZW4gdXNlIGl0cyB2YWx1ZVxuICAgICAgICAgICAgICAgIGlmICh4ID49IG1pblggJiYgeCA8IG1heFggJiYgeSA+PSBtaW5ZICYmIHkgPCBtYXhZKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBzZWVkW3kgLSBtaW5ZXVt4IC0gbWluWF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gaW5pdGlhbGl6ZSB3aXRoIG5vaXNlXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5yYW5kb20oKSA8IDAuMTUgPyAxIDogMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfSxcbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgYSBCZWxvdXNvdi1aaGFib3RpbnNreSByZWFjdGlvbiAoYXBwcm94aW1hdGVseSkuXG4gICAgICogVGhpcyBvbmUncyBzdGlsbCBhIGxpdHRsZSBtZXNzZWQgdXAsIHNvIGNvbnNpZGVyIGl0IGV4cGVyaW1lbnRhbC5cbiAgICAgKiBcbiAgICAgKiBSZXNvdXJjZXM6XG4gICAgICogaHR0cDovL2NjbC5ub3J0aHdlc3Rlcm4uZWR1L25ldGxvZ28vbW9kZWxzL0ItWlJlYWN0aW9uXG4gICAgICogaHR0cDovL3d3dy5mcmFjdGFsZGVzaWduLm5ldC9hdXRvbWF0YWFsZ29yaXRobS5hc3B4XG4gICAgICovXG4gICAgQmVsb3Vzb3ZaaGFib3RpbnNreTogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIGZyYW1lIGZyZXF1ZW5jeSBmb3IgdGhpcyBzZXR1cFxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMTA7XG5cbiAgICAgICAgLy8gQ29uZmlnIGxldGlhYmxlc1xuICAgICAgICBsZXQga2VybmVsID0gWyAvLyB3ZWlnaHRzIGZvciBuZWlnaGJvcnMuIEZpcnN0IGluZGV4IGlzIGZvciBzZWxmIHdlaWdodFxuICAgICAgICAgMCwgMSwgMSwgMSxcbiAgICAgICAgICAgIDEsICAgIDEsXG4gICAgICAgICAgICAxLCAxLCAxXG4gICAgICAgIF0ucmV2ZXJzZSgpO1xuICAgICAgICBsZXQgazEgPSA1OyAvLyBMb3dlciBnaXZlcyBoaWdoZXIgdGVuZGVuY3kgZm9yIGEgY2VsbCB0byBiZSBzaWNrZW5lZCBieSBpbGwgbmVpZ2hib3JzXG4gICAgICAgIGxldCBrMiA9IDE7IC8vIExvd2VyIGdpdmVzIGhpZ2hlciB0ZW5kZW5jeSBmb3IgYSBjZWxsIHRvIGJlIHNpY2tlbmVkIGJ5IGluZmVjdGVkIG5laWdoYm9yc1xuICAgICAgICBsZXQgZyA9IDU7XG4gICAgICAgIGxldCBudW1TdGF0ZXMgPSAyNTU7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVN0YXRlczsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgZ3JheSA9IE1hdGguZmxvb3IoKDI1NSAvIG51bVN0YXRlcykgKiBpKTtcbiAgICAgICAgICAgIHdvcmxkLnBhbGV0dGUucHVzaChbZ3JheSwgZ3JheSwgZ3JheSwgMjU1XSk7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdieicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGxldCBoZWFsdGh5ID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgaW5mZWN0ZWQgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBpbGwgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzdW1TdGF0ZXMgPSB0aGlzLnN0YXRlO1xuICAgIFxuICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZWlnaGJvcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gOCkgbmVpZ2hib3IgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9pZihuZWlnaGJvciAhPT0gbnVsbCAmJiBuZWlnaGJvci5zdGF0ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1TdGF0ZXMgKz0gbmVpZ2hib3Iuc3RhdGUgKiBrZXJuZWxbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihrZXJuZWxbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3Iuc3RhdGUgPT0gMCkgaGVhbHRoeSArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYobmVpZ2hib3Iuc3RhdGUgPCAobnVtU3RhdGVzIC0gMSkpIGluZmVjdGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpbGwgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYodGhpcy5zdGF0ZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAoaW5mZWN0ZWQgLyBrMSkgKyAoaWxsIC8gazIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA8IChudW1TdGF0ZXMpIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gKHN1bVN0YXRlcyAvIGluZmVjdGVkICsgaWxsICsgMSkgKyBnO1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMubmV3U3RhdGUgPSAoc3VtU3RhdGVzIC8gOSkgKyBnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0byBzZXQgc3RhdGUgdG8gbmV3c3RhdGUgaW4gYSBzZWNvbmQgcGFzc1xuICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihudW1TdGF0ZXMgLSAxLCBNYXRoLmZsb29yKHRoaXMubmV3U3RhdGUpKSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLm5ld1N0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbml0XG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGgucmFuZG9tKCkgPCAxLjAgPyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1TdGF0ZXMpIDogMDtcbiAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2J6JywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfVxuXG59XG5cblxuLyoqXG4gKiBTaW11bGF0ZXMgYSAxRCBhdXRvbWF0YS5cbiAqIEV4cGVjdHMgYSBwcm9wZXJ0eSBgcnVsZWAgaW4gYG9wdGlvbnNgLCB3aGljaCBpcyB0aGUgaW50ZWdlciBydWxlIG9mIHRoZSBDQS5cbiAqIFxuICogTm90IHRvdGFsbHkgY29ycmVjdCB5ZXQhXG4gKiBcbiAqL1xuZnVuY3Rpb24gRWxlbWVudGFyeShvcHRpb25zKSB7XG4gICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKG9wdGlvbnMpO1xuXG4gICAgbGV0IHJ1bGUgPSAob3B0aW9ucy5ydWxlID4+PiAwKS50b1N0cmluZygyKTtcbiAgICB3aGlsZShydWxlLmxlbmd0aCA8IDgpIHtcbiAgICAgICAgcnVsZSA9IFwiMFwiICsgcnVsZTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhvcHRpb25zLnJ1bGUpO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1J1bGUobGVmdEFsaXZlLCBjZW50ZXJBbGl2ZSwgcmlnaHRBbGl2ZSkge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBpZihyaWdodEFsaXZlKSBpbmRleCArPSAxO1xuICAgICAgICBpZihjZW50ZXJBbGl2ZSkgaW5kZXggKz0gMjtcbiAgICAgICAgaWYobGVmdEFsaXZlKSBpbmRleCArPSA0O1xuICAgICAgICByZXR1cm4gcnVsZVtydWxlLmxlbmd0aCAtIDEgLSBpbmRleF07XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHRlc3RSdWxlKCkge1xuICAgICAgICBsZXQgbGFzdEluZGV4ID0gcnVsZS5sZW5ndGggLSAxO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IGkgdG8gYmluYXJ5IGFuZCB1c2UgaXQgdG8gZmVlZCBwcm9jZXNzUnVsZVxuICAgICAgICAgICAgbGV0IGJpbiA9ICgobGFzdEluZGV4IC0gaSkgPj4+IDApLnRvU3RyaW5nKDIpO1xuICAgICAgICAgICAgd2hpbGUoYmluLmxlbmd0aCA8IDMpIGJpbiA9IFwiMFwiICsgYmluO1xuICAgICAgICAgICAgbGV0IHJ1bGVPdXQgPSBwcm9jZXNzUnVsZShiaW5bMF0gPT0gXCIxXCIsIGJpblsxXSA9PSBcIjFcIiwgYmluWzJdID09IFwiMVwiKTtcblxuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQocnVsZU91dCA9PSBydWxlW2ldLCBiaW4gKyBcIiBcIiArIHJ1bGVbaV0gKyBcIiBcIiArIChydWxlT3V0ID09IHJ1bGVbaV0pLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vdGVzdFJ1bGUoKTtcblxuICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2xpdmluZycsIHtcbiAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFsaXZlID8gMCA6IDE7XG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFdhc0FsaXZlKG5laWdoYm9yKXtcbiAgICAgICAgICAgICAgICBpZihuZWlnaGJvciAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmVpZ2hib3Iud2FzQWxpdmU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpc24ndCBhY3RpdmUgeWV0LCBkZXRlcm1pbmUgaXRzIHN0YXRlIGJhc2VkIG9uIGl0cyB1cHBlciBuZWlnaGJvcnNcbiAgICAgICAgICAgIGlmKCF0aGlzLndhc0FsaXZlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IHByb2Nlc3NSdWxlKGdldFdhc0FsaXZlKG5laWdoYm9yc1swXSksIGdldFdhc0FsaXZlKG5laWdoYm9yc1sxXSksIGdldFdhc0FsaXZlKG5laWdoYm9yc1syXSkpID09IFwiMVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAvLyBJbml0XG4gICAgICAgIHRoaXMuYWxpdmUgPSAoeCA9PSBNYXRoLmZsb29yKG9wdGlvbnMud2lkdGggLyAyKSkgJiYgKHkgPT0gMSk7XG4gICAgICAgIC8vdGhpcy5hbGl2ZSA9IE1hdGgucmFuZG9tKCkgPCAwLjAxO1xuICAgICAgICAvL3RoaXMud2FzQWxpdmUgPSB0aGlzLmFsaXZlO1xuICAgIH0pO1xuXG4gICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICBdKTtcblxuICAgIHJldHVybiB3b3JsZDtcbn1cblxuLyoqXG4gKiBTaW11bGF0ZXMgYSBMaWZlLWxpa2UgYXV0b21hdGEuIFVzZXMgQi9TIG5vdGF0aW9uLlxuICogU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xpZmUtbGlrZV9jZWxsdWxhcl9hdXRvbWF0b25cbiAqIFxuICogRXhwZWN0cyB0d28gYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGluIGBvcHRpb25zYDpcbiAqIGBCYDogQW4gYXJyYXkgb2YgaW50cyByZXByZXNlbnRpbmcgdGhlIEIgY29tcG9uZW50IG9mIHRoZSBydWxlXG4gKiBgU2A6IEFuIGFycmF5IG9mIGludHMgcmVwcmVzZW50aW5nIHRoZSBTIGNvbXBvbmVudCBvZiB0aGUgcnVsZVxuICovXG5mdW5jdGlvbiBMaWZlTGlrZShvcHRpb25zLCBkaXN0cmlidXRpb25GdW5jKSB7XG4gICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKG9wdGlvbnMpO1xuXG4gICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWxpdmUgPyAwIDogMTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgbGV0IHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzQWxpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBvcHRpb25zLkIuaW5jbHVkZXMoc3Vycm91bmRpbmcpIHx8IG9wdGlvbnMuUy5pbmNsdWRlcyhzdXJyb3VuZGluZykgJiYgdGhpcy5hbGl2ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMud2FzQWxpdmUgPSB0aGlzLmFsaXZlO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgLy8gSW5pdFxuICAgICAgICBpZihkaXN0cmlidXRpb25GdW5jKVxuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IGRpc3RyaWJ1dGlvbkZ1bmMoeCwgeSk7XG4gICAgICAgIGVsc2UgICBcbiAgICAgICAgICAgIHRoaXMuYWxpdmUgPSBNYXRoLnJhbmRvbSgpIDwgMC41O1xuICAgIH0pO1xuXG4gICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgIHsgbmFtZTogJ2xpdmluZycsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICBdKTtcblxuICAgIHJldHVybiB3b3JsZDtcbn0iXX0=
