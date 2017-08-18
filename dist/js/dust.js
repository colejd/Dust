(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* The following list is defined in React's core */
var IS_UNITLESS = {
  animationIterationCount: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  stopOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true
};

module.exports = function(name, value) {
  if(typeof value === 'number' && !IS_UNITLESS[ name ]) {
    return value + 'px';
  } else {
    return value;
  }
};
},{}],2:[function(require,module,exports){
var prefix = require('prefix-style')
var toCamelCase = require('to-camel-case')
var cache = { 'float': 'cssFloat' }
var addPxToStyle = require('add-px-to-style')

function style (element, property, value) {
  var camel = cache[property]
  if (typeof camel === 'undefined') {
    camel = detect(property)
  }

  // may be false if CSS prop is unsupported
  if (camel) {
    if (value === undefined) {
      return element.style[camel]
    }

    element.style[camel] = addPxToStyle(camel, value)
  }
}

function each (element, properties) {
  for (var k in properties) {
    if (properties.hasOwnProperty(k)) {
      style(element, k, properties[k])
    }
  }
}

function detect (cssProp) {
  var camel = toCamelCase(cssProp)
  var result = prefix(camel)
  cache[camel] = cache[cssProp] = cache[result] = result
  return result
}

function set () {
  if (arguments.length === 2) {
    if (typeof arguments[1] === 'string') {
      arguments[0].style.cssText = arguments[1]
    } else {
      each(arguments[0], arguments[1])
    }
  } else {
    style(arguments[0], arguments[1], arguments[2])
  }
}

module.exports = set
module.exports.set = set

module.exports.get = function (element, properties) {
  if (Array.isArray(properties)) {
    return properties.reduce(function (obj, prop) {
      obj[prop] = style(element, prop || '')
      return obj
    }, {})
  } else {
    return style(element, properties || '')
  }
}

},{"add-px-to-style":1,"prefix-style":3,"to-camel-case":4}],3:[function(require,module,exports){
var div = null
var prefixes = [ 'Webkit', 'Moz', 'O', 'ms' ]

module.exports = function prefixStyle (prop) {
  // re-use a dummy div
  if (!div) {
    div = document.createElement('div')
  }

  var style = div.style

  // prop exists without prefix
  if (prop in style) {
    return prop
  }

  // borderRadius -> BorderRadius
  var titleCase = prop.charAt(0).toUpperCase() + prop.slice(1)

  // find the vendor-prefixed prop
  for (var i = prefixes.length; i >= 0; i--) {
    var name = prefixes[i] + titleCase
    // e.g. WebkitBorderRadius or webkitBorderRadius
    if (name in style) {
      return name
    }
  }

  return false
}

},{}],4:[function(require,module,exports){

var space = require('to-space-case')

/**
 * Export.
 */

module.exports = toCamelCase

/**
 * Convert a `string` to camel case.
 *
 * @param {String} string
 * @return {String}
 */

function toCamelCase(string) {
  return space(string).replace(/\s(\w)/g, function (matches, letter) {
    return letter.toUpperCase()
  })
}

},{"to-space-case":6}],5:[function(require,module,exports){

/**
 * Export.
 */

module.exports = toNoCase

/**
 * Test whether a string is camel-case.
 */

var hasSpace = /\s/
var hasSeparator = /(_|-|\.|:)/
var hasCamel = /([a-z][A-Z]|[A-Z][a-z])/

/**
 * Remove any starting case from a `string`, like camel or snake, but keep
 * spaces and punctuation that may be important otherwise.
 *
 * @param {String} string
 * @return {String}
 */

function toNoCase(string) {
  if (hasSpace.test(string)) return string.toLowerCase()
  if (hasSeparator.test(string)) return (unseparate(string) || string).toLowerCase()
  if (hasCamel.test(string)) return uncamelize(string).toLowerCase()
  return string.toLowerCase()
}

/**
 * Separator splitter.
 */

var separatorSplitter = /[\W_]+(.|$)/g

/**
 * Un-separate a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function unseparate(string) {
  return string.replace(separatorSplitter, function (m, next) {
    return next ? ' ' + next : ''
  })
}

/**
 * Camelcase splitter.
 */

var camelSplitter = /(.)([A-Z]+)/g

/**
 * Un-camelcase a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function uncamelize(string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ')
  })
}

},{}],6:[function(require,module,exports){

var clean = require('to-no-case')

/**
 * Export.
 */

module.exports = toSpaceCase

/**
 * Convert a `string` to space case.
 *
 * @param {String} string
 * @return {String}
 */

function toSpaceCase(string) {
  return clean(string).replace(/[\W_]+(.|$)/g, function (matches, match) {
    return match ? ' ' + match : ''
  }).trim()
}

},{"to-no-case":5}],7:[function(require,module,exports){
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

var css = require("dom-css");

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
            resolution: 1,
            width: this.container.offsetWidth,
            height: this.container.offsetHeight,
            //powerPreference: "high-performance"
            autoResize: true
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

            PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
            this.app.stage.scale = new PIXI.Point(this.container.offsetWidth / this.world.width, this.container.offsetHeight / this.world.height);

            //this.app.renderer.view.style.border = "1px dashed green";
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

},{"./vendor/cellauto.js":11,"./worlds.js":12,"dom-css":2}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.gui = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _worlds = require("./worlds.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GUI = function () {
    function GUI() {
        _classCallCheck(this, GUI);
    }

    _createClass(GUI, [{
        key: "Init",
        value: function Init(dust, container) {

            if (!guify) {
                console.log("Guify not found! Import it on your page to enable the GUI for this program.");
                return;
            }

            this.panel = new guify.GUI({
                title: "Dust",
                theme: "dark",
                root: container,
                width: 300,
                barMode: "above",
                align: "right",
                opacity: "0.95"
            });

            this.panel.Register({
                type: "range", label: "Frame Frequency",
                min: 1, max: 30, step: 1,
                object: dust.framecounter, property: "frameFrequency"
            });

            this.panel.Register({
                type: "select", label: "Preset",
                options: Object.getOwnPropertyNames(_worlds.Worlds),
                object: dust.worldOptions, property: "name",
                onChange: function onChange() {
                    return dust.Setup();
                }
            });

            this.panel.Register({
                type: "button", label: "Reset",
                action: function action() {
                    return dust.Setup();
                }
            });
        }
    }]);

    return GUI;
}();

var gui = exports.gui = new GUI();

},{"./worlds.js":12}],9:[function(require,module,exports){
"use strict";

var _webglDetect = require("./utils/webgl-detect.js");

var _dust = require("./dust.js");

var _gui = require("./gui.js");

var Init = function Init() {
    var container = document.getElementById("dust-container");
    if (!container) throw new Error("No #dust-container was found");

    if (!_webglDetect.Detector.HasWebGL()) {
        //exit("WebGL is not supported on this browser.");
        console.log("WebGL is not supported on this browser.");
        container.innerHTML = _webglDetect.Detector.GetErrorHTML();
        container.classList.add("no-webgl");
    } else {
        var dust = new _dust.Dust(container, function () {
            // Dust is now fully loaded
            _gui.gui.Init(dust, container);
        });
    }
};

if (document.readyState === 'complete') {
    Init();
} else {
    window.onload = function () {
        Init();
    };
}

},{"./dust.js":7,"./gui.js":8,"./utils/webgl-detect.js":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
            palette: [[68, 36, 52, 255], [255, 255, 255, 255]],
            recommendedFrameFrequency: 2
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

},{"./vendor/cellauto.js":11}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWRkLXB4LXRvLXN0eWxlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RvbS1jc3MvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJlZml4LXN0eWxlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvLWNhbWVsLWNhc2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdG8tbm8tY2FzZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90by1zcGFjZS1jYXNlL2luZGV4LmpzIiwic3JjL2R1c3QuanMiLCJzcmMvZ3VpLmpzIiwic3JjL21haW4uanMiLCJzcmMvdXRpbHMvd2ViZ2wtZGV0ZWN0LmpzIiwic3JjL3ZlbmRvci9jZWxsYXV0by5qcyIsInNyYy93b3JsZHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjtBQUNsRCxlQUFPLFFBQVEsRUFBZixFQUFtQixFQUFFLEtBQXJCLEVBQTRCO0FBQUUsbUJBQU8sS0FBUCxJQUFnQixDQUFoQjtBQUFvQjs7QUFF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QTVCLENBSkosRUFLSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTEosRUFNSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTkosRUFPSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBUEosRUFRSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBUkosRUFTSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBVEosRUFVSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBVkosRUFXSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBWEosRUFZSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxD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N0IsaUJBQVMsaUJBQVUsU0FBVixFQUFxQjtBQUMxQixnQkFBSSxjQUFjLEtBQUssOEJBQUwsQ0FBb0MsU0FBcEMsRUFBK0MsVUFBL0MsQ0FBbEI7QUFDQSxpQkFBSyxLQUFMLEdBQWEsUUFBUSxDQUFSLENBQVUsUUFBVixDQUFtQixXQUFuQixLQUFtQyxRQUFRLENBQVIsQ0FBVSxRQUFWLENBQW1CLFdBQW5CLEtBQW1DLEtBQUssS0FBeEY7QUFDSCxTQVA0QjtBQVE3QixlQUFPLGlCQUFZO0FBQ2YsaUJBQUssUUFBTCxHQUFnQixLQUFLLEtBQXJCO0FBQ0g7QUFWNEIsS0FBakMsRUFXRyxVQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCO0FBQ2Y7QUFDQSxZQUFHLGdCQUFILEVBQ0ksS0FBSyxLQUFMLEdBQWEsaUJBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQWIsQ0FESixLQUdJLEtBQUssS0FBTCxHQUFhLEtBQUssTUFBTCxLQUFnQixHQUE3QjtBQUNQLEtBakJEOztBQW1CQSxVQUFNLFVBQU4sQ0FBaUIsQ0FDYixFQUFFLE1BQU0sUUFBUixFQUFrQixjQUFjLEdBQWhDLEVBRGEsQ0FBakI7O0FBSUEsV0FBTyxLQUFQO0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogVGhlIGZvbGxvd2luZyBsaXN0IGlzIGRlZmluZWQgaW4gUmVhY3QncyBjb3JlICovXG52YXIgSVNfVU5JVExFU1MgPSB7XG4gIGFuaW1hdGlvbkl0ZXJhdGlvbkNvdW50OiB0cnVlLFxuICBib3hGbGV4OiB0cnVlLFxuICBib3hGbGV4R3JvdXA6IHRydWUsXG4gIGJveE9yZGluYWxHcm91cDogdHJ1ZSxcbiAgY29sdW1uQ291bnQ6IHRydWUsXG4gIGZsZXg6IHRydWUsXG4gIGZsZXhHcm93OiB0cnVlLFxuICBmbGV4UG9zaXRpdmU6IHRydWUsXG4gIGZsZXhTaHJpbms6IHRydWUsXG4gIGZsZXhOZWdhdGl2ZTogdHJ1ZSxcbiAgZmxleE9yZGVyOiB0cnVlLFxuICBncmlkUm93OiB0cnVlLFxuICBncmlkQ29sdW1uOiB0cnVlLFxuICBmb250V2VpZ2h0OiB0cnVlLFxuICBsaW5lQ2xhbXA6IHRydWUsXG4gIGxpbmVIZWlnaHQ6IHRydWUsXG4gIG9wYWNpdHk6IHRydWUsXG4gIG9yZGVyOiB0cnVlLFxuICBvcnBoYW5zOiB0cnVlLFxuICB0YWJTaXplOiB0cnVlLFxuICB3aWRvd3M6IHRydWUsXG4gIHpJbmRleDogdHJ1ZSxcbiAgem9vbTogdHJ1ZSxcblxuICAvLyBTVkctcmVsYXRlZCBwcm9wZXJ0aWVzXG4gIGZpbGxPcGFjaXR5OiB0cnVlLFxuICBzdG9wT3BhY2l0eTogdHJ1ZSxcbiAgc3Ryb2tlRGFzaG9mZnNldDogdHJ1ZSxcbiAgc3Ryb2tlT3BhY2l0eTogdHJ1ZSxcbiAgc3Ryb2tlV2lkdGg6IHRydWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgaWYodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhSVNfVU5JVExFU1NbIG5hbWUgXSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59OyIsInZhciBwcmVmaXggPSByZXF1aXJlKCdwcmVmaXgtc3R5bGUnKVxudmFyIHRvQ2FtZWxDYXNlID0gcmVxdWlyZSgndG8tY2FtZWwtY2FzZScpXG52YXIgY2FjaGUgPSB7ICdmbG9hdCc6ICdjc3NGbG9hdCcgfVxudmFyIGFkZFB4VG9TdHlsZSA9IHJlcXVpcmUoJ2FkZC1weC10by1zdHlsZScpXG5cbmZ1bmN0aW9uIHN0eWxlIChlbGVtZW50LCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgdmFyIGNhbWVsID0gY2FjaGVbcHJvcGVydHldXG4gIGlmICh0eXBlb2YgY2FtZWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY2FtZWwgPSBkZXRlY3QocHJvcGVydHkpXG4gIH1cblxuICAvLyBtYXkgYmUgZmFsc2UgaWYgQ1NTIHByb3AgaXMgdW5zdXBwb3J0ZWRcbiAgaWYgKGNhbWVsKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LnN0eWxlW2NhbWVsXVxuICAgIH1cblxuICAgIGVsZW1lbnQuc3R5bGVbY2FtZWxdID0gYWRkUHhUb1N0eWxlKGNhbWVsLCB2YWx1ZSlcbiAgfVxufVxuXG5mdW5jdGlvbiBlYWNoIChlbGVtZW50LCBwcm9wZXJ0aWVzKSB7XG4gIGZvciAodmFyIGsgaW4gcHJvcGVydGllcykge1xuICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICBzdHlsZShlbGVtZW50LCBrLCBwcm9wZXJ0aWVzW2tdKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRlY3QgKGNzc1Byb3ApIHtcbiAgdmFyIGNhbWVsID0gdG9DYW1lbENhc2UoY3NzUHJvcClcbiAgdmFyIHJlc3VsdCA9IHByZWZpeChjYW1lbClcbiAgY2FjaGVbY2FtZWxdID0gY2FjaGVbY3NzUHJvcF0gPSBjYWNoZVtyZXN1bHRdID0gcmVzdWx0XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gc2V0ICgpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFyZ3VtZW50c1swXS5zdHlsZS5jc3NUZXh0ID0gYXJndW1lbnRzWzFdXG4gICAgfSBlbHNlIHtcbiAgICAgIGVhY2goYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHN0eWxlKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRcbm1vZHVsZS5leHBvcnRzLnNldCA9IHNldFxuXG5tb2R1bGUuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCwgcHJvcGVydGllcykge1xuICBpZiAoQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzKSkge1xuICAgIHJldHVybiBwcm9wZXJ0aWVzLnJlZHVjZShmdW5jdGlvbiAob2JqLCBwcm9wKSB7XG4gICAgICBvYmpbcHJvcF0gPSBzdHlsZShlbGVtZW50LCBwcm9wIHx8ICcnKVxuICAgICAgcmV0dXJuIG9ialxuICAgIH0sIHt9KVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHlsZShlbGVtZW50LCBwcm9wZXJ0aWVzIHx8ICcnKVxuICB9XG59XG4iLCJ2YXIgZGl2ID0gbnVsbFxudmFyIHByZWZpeGVzID0gWyAnV2Via2l0JywgJ01veicsICdPJywgJ21zJyBdXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcHJlZml4U3R5bGUgKHByb3ApIHtcbiAgLy8gcmUtdXNlIGEgZHVtbXkgZGl2XG4gIGlmICghZGl2KSB7XG4gICAgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgfVxuXG4gIHZhciBzdHlsZSA9IGRpdi5zdHlsZVxuXG4gIC8vIHByb3AgZXhpc3RzIHdpdGhvdXQgcHJlZml4XG4gIGlmIChwcm9wIGluIHN0eWxlKSB7XG4gICAgcmV0dXJuIHByb3BcbiAgfVxuXG4gIC8vIGJvcmRlclJhZGl1cyAtPiBCb3JkZXJSYWRpdXNcbiAgdmFyIHRpdGxlQ2FzZSA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpXG5cbiAgLy8gZmluZCB0aGUgdmVuZG9yLXByZWZpeGVkIHByb3BcbiAgZm9yICh2YXIgaSA9IHByZWZpeGVzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbmFtZSA9IHByZWZpeGVzW2ldICsgdGl0bGVDYXNlXG4gICAgLy8gZS5nLiBXZWJraXRCb3JkZXJSYWRpdXMgb3Igd2Via2l0Qm9yZGVyUmFkaXVzXG4gICAgaWYgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgIHJldHVybiBuYW1lXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG4iLCJcbnZhciBzcGFjZSA9IHJlcXVpcmUoJ3RvLXNwYWNlLWNhc2UnKVxuXG4vKipcbiAqIEV4cG9ydC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvQ2FtZWxDYXNlXG5cbi8qKlxuICogQ29udmVydCBhIGBzdHJpbmdgIHRvIGNhbWVsIGNhc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIHRvQ2FtZWxDYXNlKHN0cmluZykge1xuICByZXR1cm4gc3BhY2Uoc3RyaW5nKS5yZXBsYWNlKC9cXHMoXFx3KS9nLCBmdW5jdGlvbiAobWF0Y2hlcywgbGV0dGVyKSB7XG4gICAgcmV0dXJuIGxldHRlci50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG4iLCJcbi8qKlxuICogRXhwb3J0LlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdG9Ob0Nhc2VcblxuLyoqXG4gKiBUZXN0IHdoZXRoZXIgYSBzdHJpbmcgaXMgY2FtZWwtY2FzZS5cbiAqL1xuXG52YXIgaGFzU3BhY2UgPSAvXFxzL1xudmFyIGhhc1NlcGFyYXRvciA9IC8oX3wtfFxcLnw6KS9cbnZhciBoYXNDYW1lbCA9IC8oW2Etel1bQS1aXXxbQS1aXVthLXpdKS9cblxuLyoqXG4gKiBSZW1vdmUgYW55IHN0YXJ0aW5nIGNhc2UgZnJvbSBhIGBzdHJpbmdgLCBsaWtlIGNhbWVsIG9yIHNuYWtlLCBidXQga2VlcFxuICogc3BhY2VzIGFuZCBwdW5jdHVhdGlvbiB0aGF0IG1heSBiZSBpbXBvcnRhbnQgb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB0b05vQ2FzZShzdHJpbmcpIHtcbiAgaWYgKGhhc1NwYWNlLnRlc3Qoc3RyaW5nKSkgcmV0dXJuIHN0cmluZy50b0xvd2VyQ2FzZSgpXG4gIGlmIChoYXNTZXBhcmF0b3IudGVzdChzdHJpbmcpKSByZXR1cm4gKHVuc2VwYXJhdGUoc3RyaW5nKSB8fCBzdHJpbmcpLnRvTG93ZXJDYXNlKClcbiAgaWYgKGhhc0NhbWVsLnRlc3Qoc3RyaW5nKSkgcmV0dXJuIHVuY2FtZWxpemUoc3RyaW5nKS50b0xvd2VyQ2FzZSgpXG4gIHJldHVybiBzdHJpbmcudG9Mb3dlckNhc2UoKVxufVxuXG4vKipcbiAqIFNlcGFyYXRvciBzcGxpdHRlci5cbiAqL1xuXG52YXIgc2VwYXJhdG9yU3BsaXR0ZXIgPSAvW1xcV19dKygufCQpL2dcblxuLyoqXG4gKiBVbi1zZXBhcmF0ZSBhIGBzdHJpbmdgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB1bnNlcGFyYXRlKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2Uoc2VwYXJhdG9yU3BsaXR0ZXIsIGZ1bmN0aW9uIChtLCBuZXh0KSB7XG4gICAgcmV0dXJuIG5leHQgPyAnICcgKyBuZXh0IDogJydcbiAgfSlcbn1cblxuLyoqXG4gKiBDYW1lbGNhc2Ugc3BsaXR0ZXIuXG4gKi9cblxudmFyIGNhbWVsU3BsaXR0ZXIgPSAvKC4pKFtBLVpdKykvZ1xuXG4vKipcbiAqIFVuLWNhbWVsY2FzZSBhIGBzdHJpbmdgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB1bmNhbWVsaXplKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoY2FtZWxTcGxpdHRlciwgZnVuY3Rpb24gKG0sIHByZXZpb3VzLCB1cHBlcnMpIHtcbiAgICByZXR1cm4gcHJldmlvdXMgKyAnICcgKyB1cHBlcnMudG9Mb3dlckNhc2UoKS5zcGxpdCgnJykuam9pbignICcpXG4gIH0pXG59XG4iLCJcbnZhciBjbGVhbiA9IHJlcXVpcmUoJ3RvLW5vLWNhc2UnKVxuXG4vKipcbiAqIEV4cG9ydC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU3BhY2VDYXNlXG5cbi8qKlxuICogQ29udmVydCBhIGBzdHJpbmdgIHRvIHNwYWNlIGNhc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIHRvU3BhY2VDYXNlKHN0cmluZykge1xuICByZXR1cm4gY2xlYW4oc3RyaW5nKS5yZXBsYWNlKC9bXFxXX10rKC58JCkvZywgZnVuY3Rpb24gKG1hdGNoZXMsIG1hdGNoKSB7XG4gICAgcmV0dXJuIG1hdGNoID8gJyAnICsgbWF0Y2ggOiAnJ1xuICB9KS50cmltKClcbn1cbiIsImltcG9ydCAqIGFzIENlbGxBdXRvIGZyb20gXCIuL3ZlbmRvci9jZWxsYXV0by5qc1wiO1xuaW1wb3J0IHsgV29ybGRzIH0gZnJvbSBcIi4vd29ybGRzLmpzXCI7XG5sZXQgY3NzID0gcmVxdWlyZShcImRvbS1jc3NcIik7XG5cbmV4cG9ydCBjbGFzcyBEdXN0IHtcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIGluaXRGaW5pc2hlZENhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuXG4gICAgICAgIGxldCB3b3JsZE5hbWVzID0gT2JqZWN0LmtleXMoV29ybGRzKTtcbiAgICAgICAgdGhpcy53b3JsZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBuYW1lOiB3b3JsZE5hbWVzW3dvcmxkTmFtZXMubGVuZ3RoICogTWF0aC5yYW5kb20oKSA8PCAwXSwgLy8gUmFuZG9tIHN0YXJ0dXAgd29ybGRcbiAgICAgICAgICAgIC8vd2lkdGg6IDEyOCwgLy8gQ2FuIGZvcmNlIGEgd2lkdGgvaGVpZ2h0IGhlcmVcbiAgICAgICAgICAgIC8vaGVpZ2h0OiAxMjgsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGFwcCBhbmQgcHV0IGl0cyBjYW52YXMgaW50byBgY29udGFpbmVyYFxuICAgICAgICB0aGlzLmFwcCA9IG5ldyBQSVhJLkFwcGxpY2F0aW9uKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGFudGlhbGlhczogZmFsc2UsIFxuICAgICAgICAgICAgICAgIHRyYW5zcGFyZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uOiAxLFxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNvbnRhaW5lci5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuY29udGFpbmVyLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgICAgICAvL3Bvd2VyUHJlZmVyZW5jZTogXCJoaWdoLXBlcmZvcm1hbmNlXCJcbiAgICAgICAgICAgICAgICBhdXRvUmVzaXplOiB0cnVlLFxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC52aWV3KTtcblxuICAgICAgICAvLyBTdGFydCB0aGUgdXBkYXRlIGxvb3BcbiAgICAgICAgdGhpcy5hcHAudGlja2VyLmFkZCgoZGVsdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuT25VcGRhdGUoZGVsdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZyYW1lY291bnRlciA9IG5ldyBGcmFtZUNvdW50ZXIoMSwgbnVsbCk7XG5cbiAgICAgICAgLy8gU3RvcCBhcHBsaWNhdGlvbiBhbmQgd2FpdCBmb3Igc2V0dXAgdG8gZmluaXNoXG4gICAgICAgIHRoaXMuYXBwLnN0b3AoKTtcblxuICAgICAgICAvLyBMb2FkIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBwcm9ncmFtIHRvIHJ1blxuICAgICAgICBQSVhJLmxvYWRlclxuICAgICAgICAgICAgLmFkZCgnZnJhZ1NoYWRlcicsICcuLi9yZXNvdXJjZXMvZHVzdC5mcmFnJylcbiAgICAgICAgICAgIC5sb2FkKChsb2FkZXIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIExvYWRpbmcgaGFzIGZpbmlzaGVkXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZWRSZXNvdXJjZXMgPSByZXM7XG4gICAgICAgICAgICAgICAgdGhpcy5TZXR1cCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgaW5pdEZpbmlzaGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldXNhYmxlIG1ldGhvZCBmb3Igc2V0dGluZyB1cCB0aGUgc2ltdWxhdGlvbiBmcm9tIGB0aGlzLndvcmxkT3B0aW9uc2AuXG4gICAgICogQWxzbyB3b3JrcyBhcyBhIHJlc2V0IGZ1bmN0aW9uIGlmIHlvdSBjYWxsIHRoaXMgd2l0aG91dCBjaGFuZ2luZ1xuICAgICAqIGB0aGlzLndvcmxkT3B0aW9ucy5uYW1lYCBiZWZvcmVoYW5kLlxuICAgICAqL1xuICAgIFNldHVwKCkge1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgd29ybGQgZnJvbSB0aGUgc3RyaW5nXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkID0gV29ybGRzW3RoaXMud29ybGRPcHRpb25zLm5hbWVdLmNhbGwodGhpcywgdGhpcy53b3JsZE9wdGlvbnMud2lkdGgsIHRoaXMud29ybGRPcHRpb25zLmhlaWdodCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgXCJXb3JsZCB3aXRoIHRoZSBuYW1lIFwiICsgdGhpcy53b3JsZE9wdGlvbnMubmFtZSArIFwiIGRvZXMgbm90IGV4aXN0IVwiO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZnJhbWVjb3VudGVyLmZyYW1lRnJlcXVlbmN5ID0gdGhpcy53b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5IHx8IDE7XG5cbiAgICAgICAgUElYSS5zZXR0aW5ncy5TQ0FMRV9NT0RFID0gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUO1xuICAgICAgICB0aGlzLmFwcC5zdGFnZS5zY2FsZSA9IG5ldyBQSVhJLlBvaW50KHRoaXMuY29udGFpbmVyLm9mZnNldFdpZHRoIC8gdGhpcy53b3JsZC53aWR0aCwgdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0IC8gdGhpcy53b3JsZC5oZWlnaHQpO1xuXG4gICAgICAgIC8vdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS5ib3JkZXIgPSBcIjFweCBkYXNoZWQgZ3JlZW5cIjtcbiAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIudmlldy5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci52aWV3LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IgPSAweGZmZmZmZjtcblxuICAgICAgICAvLyBDcmVhdGUgYSBzcHJpdGUgZnJvbSBhIGJsYW5rIGNhbnZhc1xuICAgICAgICB0aGlzLnRleHR1cmVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLndpZHRoID0gdGhpcy53b3JsZC53aWR0aDtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCA9IHRoaXMud29ybGQuaGVpZ2h0O1xuICAgICAgICB0aGlzLnRleHR1cmVDdHggPSB0aGlzLnRleHR1cmVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsgLy8gVXNlZCBsYXRlciB0byB1cGRhdGUgdGV4dHVyZVxuXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmUgPSBuZXcgUElYSS5CYXNlVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMudGV4dHVyZUNhbnZhcyk7XG4gICAgICAgIHRoaXMuc3ByaXRlID0gbmV3IFBJWEkuU3ByaXRlKFxuICAgICAgICAgICAgbmV3IFBJWEkuVGV4dHVyZSh0aGlzLmJhc2VUZXh0dXJlLCBuZXcgUElYSS5SZWN0YW5nbGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQpKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENlbnRlciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuc3ByaXRlLnggPSB0aGlzLndvcmxkLndpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUueSA9IHRoaXMud29ybGQuaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zcHJpdGUuYW5jaG9yLnNldCgwLjUpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2hhZGVyIGZvciB0aGUgc3ByaXRlXG4gICAgICAgIHRoaXMuZmlsdGVyID0gbmV3IFBJWEkuRmlsdGVyKG51bGwsIHRoaXMubG9hZGVkUmVzb3VyY2VzLmZyYWdTaGFkZXIuZGF0YSk7XG4gICAgICAgIHRoaXMuc3ByaXRlLmZpbHRlcnMgPSBbdGhpcy5maWx0ZXJdO1xuXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLnJlbW92ZUNoaWxkcmVuKCk7IC8vIFJlbW92ZSBhbnkgYXR0YWNoZWQgY2hpbGRyZW4gKGZvciBjYXNlIHdoZXJlIGNoYW5naW5nIHByZXNldHMpXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLmFkZENoaWxkKHRoaXMuc3ByaXRlKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHRleHR1cmUgZnJvbSB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgd29ybGRcbiAgICAgICAgdGhpcy5VcGRhdGVUZXh0dXJlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGV2ZXJ5IGZyYW1lLiBDb250aW51ZXMgaW5kZWZpbml0ZWx5IGFmdGVyIGJlaW5nIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgIE9uVXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIGxldCBub3NraXAgPSB0aGlzLmZyYW1lY291bnRlci5JbmNyZW1lbnRGcmFtZSgpO1xuICAgICAgICBpZihub3NraXApIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyLnVuaWZvcm1zLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnN0ZXAoKTtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlVGV4dHVyZSgpO1xuICAgICAgICAgICAgdGhpcy5hcHAucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHRleHR1cmUgcmVwcmVzZW50aW5nIHRoZSB3b3JsZC5cbiAgICAgKiBXcml0ZXMgY2VsbCBjb2xvcnMgdG8gdGhlIHRleHR1cmUgY2FudmFzIGFuZCB1cGRhdGVzIGBiYXNlVGV4dHVyZWAgZnJvbSBpdCxcbiAgICAgKiB3aGljaCBtYWtlcyBQaXhpIHVwZGF0ZSB0aGUgc3ByaXRlLlxuICAgICAqL1xuICAgIFVwZGF0ZVRleHR1cmUoKSB7XG4gICAgICAgIFxuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgY3R4ID0gdGhpcy50ZXh0dXJlQ3R4O1x0XHRcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGxldCBwaXggPSBjdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMudGV4dHVyZUNhbnZhcy53aWR0aCwgdGhpcy50ZXh0dXJlQ2FudmFzLmhlaWdodCk7XHRcdFxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMudGV4dHVyZUNhbnZhcy5oZWlnaHQ7IHkrKykge1x0XHRcdFxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLnRleHR1cmVDYW52YXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGxldCBwYWxldHRlSW5kZXggPSB0aGlzLndvcmxkLmdyaWRbeV1beF0uZ2V0Q29sb3IoKTtcbiAgICAgICAgICAgICAgICBsZXQgY29sb3JSR0JBID0gdGhpcy53b3JsZC5wYWxldHRlW3BhbGV0dGVJbmRleF07XG4gICAgICAgICAgICAgICAgaWYoY29sb3JSR0JBICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMF07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMV07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbMl07XHRcdFx0XHRcbiAgICAgICAgICAgICAgICAgICAgcGl4LmRhdGFbaW5kZXgrK10gPSBjb2xvclJHQkFbM107XHRcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlBhbGV0dGUgaW5kZXggb3V0IG9mIGJvdW5kczogXCIgKyBwYWxldHRlSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVx0XHRcbiAgICAgICAgfSBcdFx0XG4gICAgICAgIGN0eC5wdXRJbWFnZURhdGEocGl4LCAwLCAwKTtcblxuICAgICAgICAvLyBUZWxsIFBpeGkgdG8gdXBkYXRlIHRoZSB0ZXh0dXJlIHJlZmVyZW5jZWQgYnkgdGhpcyBjdHguXG4gICAgICAgIHRoaXMuYmFzZVRleHR1cmUudXBkYXRlKCk7XG5cbiAgICB9XG5cbn1cblxuLyoqXG4gKiBDb252ZW5pZW5jZSBjbGFzcyBmb3IgcmVzdHJpY3RpbmcgdGhlIHJlZnJlc2ggcmF0ZSBvZiB0aGUgc2ltdWxhdGlvbi5cbiAqL1xuY2xhc3MgRnJhbWVDb3VudGVyIHtcbiAgICBjb25zdHJ1Y3RvcihmcmFtZUZyZXF1ZW5jeSwgZnJhbWVMaW1pdCA9IG51bGwpIHtcbiAgICAgICAgLy8gVGhlIG51bWJlciBvZiBmcmFtZXMgaW5nZXN0ZWRcbiAgICAgICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcblxuICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGZyYW1lcyBhbGxvd2VkIHRvIHJ1blxuICAgICAgICB0aGlzLnBhc3NlZEZyYW1lcyA9IDA7XG5cbiAgICAgICAgLy8gRnJhbWUgd2lsbCBydW4gZXZlcnkgYGZyYW1lRnJlcXVlbmN5YCBmcmFtZXMgdGhhdCBwYXNzXG4gICAgICAgIHRoaXMuZnJhbWVGcmVxdWVuY3kgPSBmcmFtZUZyZXF1ZW5jeTtcblxuICAgICAgICAvLyBJZiBzZXQsIGNsYXNzIHdpbGwgc3RvcCBhbGxvd2luZyBmcmFtZXMgYWZ0ZXIgYGZyYW1lTGltaXRgIFxuICAgICAgICAvLyBwYXNzZWRGcmFtZXMgaGF2ZSBiZWVuIGFsbG93ZWQuXG4gICAgICAgIHRoaXMuZnJhbWVMaW1pdCA9IGZyYW1lTGltaXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIG9uY2UgZXZlcnkgYGZyYW1lRnJlcXVlbmN5YCB0aW1lcyBpdCBpcyBjYWxsZWQuXG4gICAgICovXG4gICAgSW5jcmVtZW50RnJhbWUoKXtcbiAgICAgICAgdGhpcy5mcmFtZUNvdW50ICs9IDE7XG4gICAgICAgIGlmKHRoaXMuZnJhbWVDb3VudCAlIHRoaXMuZnJhbWVGcmVxdWVuY3kgPT0gMCkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgcmVhY2hlZCB0aGUgZnJhbWUgbGltaXRcbiAgICAgICAgICAgIGlmKHRoaXMuZnJhbWVMaW1pdCAhPSBudWxsICYmIHRoaXMucGFzc2VkRnJhbWVzID49IHRoaXMuZnJhbWVMaW1pdClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMuZnJhbWVDb3VudCA9IDA7XG4gICAgICAgICAgICB0aGlzLnBhc3NlZEZyYW1lcyArPSAxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBXb3JsZHMgfSBmcm9tIFwiLi93b3JsZHMuanNcIjtcblxuY2xhc3MgR1VJIHtcblxuICAgIEluaXQoZHVzdCwgY29udGFpbmVyKXtcblxuICAgICAgICBpZighZ3VpZnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR3VpZnkgbm90IGZvdW5kISBJbXBvcnQgaXQgb24geW91ciBwYWdlIHRvIGVuYWJsZSB0aGUgR1VJIGZvciB0aGlzIHByb2dyYW0uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYW5lbCA9IG5ldyBndWlmeS5HVUkoe1xuICAgICAgICAgICAgdGl0bGU6IFwiRHVzdFwiLCBcbiAgICAgICAgICAgIHRoZW1lOiBcImRhcmtcIiwgXG4gICAgICAgICAgICByb290OiBjb250YWluZXIsXG4gICAgICAgICAgICB3aWR0aDogMzAwLFxuICAgICAgICAgICAgYmFyTW9kZTogXCJhYm92ZVwiLFxuICAgICAgICAgICAgYWxpZ246IFwicmlnaHRcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IFwiMC45NVwiLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnBhbmVsLlJlZ2lzdGVyKHtcbiAgICAgICAgICAgIHR5cGU6IFwicmFuZ2VcIiwgbGFiZWw6IFwiRnJhbWUgRnJlcXVlbmN5XCIsXG4gICAgICAgICAgICBtaW46IDEsIG1heDogMzAsIHN0ZXA6IDEsXG4gICAgICAgICAgICBvYmplY3Q6IGR1c3QuZnJhbWVjb3VudGVyLCBwcm9wZXJ0eTogXCJmcmFtZUZyZXF1ZW5jeVwiXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucGFuZWwuUmVnaXN0ZXIoe1xuICAgICAgICAgICAgdHlwZTogXCJzZWxlY3RcIiwgbGFiZWw6IFwiUHJlc2V0XCIsXG4gICAgICAgICAgICBvcHRpb25zOiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhXb3JsZHMpLFxuICAgICAgICAgICAgb2JqZWN0OiBkdXN0LndvcmxkT3B0aW9ucywgcHJvcGVydHk6IFwibmFtZVwiLFxuICAgICAgICAgICAgb25DaGFuZ2U6ICgpID0+IGR1c3QuU2V0dXAoKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnBhbmVsLlJlZ2lzdGVyKHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsIGxhYmVsOiBcIlJlc2V0XCIsXG4gICAgICAgICAgICBhY3Rpb246ICgpID0+IGR1c3QuU2V0dXAoKVxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuXG5leHBvcnQgbGV0IGd1aSA9IG5ldyBHVUkoKTsiLCJpbXBvcnQgeyBEZXRlY3RvciB9IGZyb20gXCIuL3V0aWxzL3dlYmdsLWRldGVjdC5qc1wiO1xuaW1wb3J0IHsgRHVzdCB9IGZyb20gXCIuL2R1c3QuanNcIjtcbmltcG9ydCB7IGd1aSB9IGZyb20gXCIuL2d1aS5qc1wiO1xuXG5sZXQgSW5pdCA9ICgpID0+IHtcbiAgICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXN0LWNvbnRhaW5lclwiKTtcbiAgICBpZighY29udGFpbmVyKSB0aHJvdyBuZXcgRXJyb3IoXCJObyAjZHVzdC1jb250YWluZXIgd2FzIGZvdW5kXCIpO1xuICAgIFxuICAgIGlmICggIURldGVjdG9yLkhhc1dlYkdMKCkgKSB7XG4gICAgICAgIC8vZXhpdChcIldlYkdMIGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBicm93c2VyLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJXZWJHTCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBEZXRlY3Rvci5HZXRFcnJvckhUTUwoKTtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJuby13ZWJnbFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGxldCBkdXN0ID0gbmV3IER1c3QoY29udGFpbmVyLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBEdXN0IGlzIG5vdyBmdWxseSBsb2FkZWRcbiAgICAgICAgICAgIGd1aS5Jbml0KGR1c3QsIGNvbnRhaW5lcik7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICBJbml0KCk7XG59IGVsc2Uge1xuICAgIHdpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIEluaXQoKTtcbiAgICB9XG59IiwiY2xhc3MgRGV0ZWN0b3Ige1xuXG4gICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExODcxMDc3L3Byb3Blci13YXktdG8tZGV0ZWN0LXdlYmdsLXN1cHBvcnRcbiAgICBzdGF0aWMgSGFzV2ViR0woKSB7XG4gICAgICAgIGlmICghIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLFxuICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IFtcIndlYmdsXCIsIFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIFwibW96LXdlYmdsXCIsIFwid2Via2l0LTNkXCJdLFxuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTw0O2krKykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChuYW1lc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0LmdldFBhcmFtZXRlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYkdMIGlzIGVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZWJHTCBpcyBzdXBwb3J0ZWQsIGJ1dCBkaXNhYmxlZFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlYkdMIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBHZXRFcnJvckhUTUwobWVzc2FnZSA9IG51bGwpe1xuICAgICAgICBpZihtZXNzYWdlID09IG51bGwpe1xuICAgICAgICAgICAgbWVzc2FnZSA9IGBZb3VyIGdyYXBoaWNzIGNhcmQgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cImh0dHA6Ly9raHJvbm9zLm9yZy93ZWJnbC93aWtpL0dldHRpbmdfYV9XZWJHTF9JbXBsZW1lbnRhdGlvblwiPldlYkdMPC9hPi4gPGJyPlxuICAgICAgICAgICAgICAgICAgICAgICAgRmluZCBvdXQgaG93IHRvIGdldCBpdCA8YSBocmVmPVwiaHR0cDovL2dldC53ZWJnbC5vcmcvXCI+aGVyZTwvYT4uYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibm8td2ViZ2wtc3VwcG9ydFwiPlxuICAgICAgICA8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke21lc3NhZ2V9PC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYFxuICAgIH1cblxufVxuXG5leHBvcnQgeyBEZXRlY3RvciB9OyIsImZ1bmN0aW9uIENlbGxBdXRvQ2VsbChsb2NYLCBsb2NZKSB7XG5cdHRoaXMueCA9IGxvY1g7XG5cdHRoaXMueSA9IGxvY1k7XG5cblx0dGhpcy5kZWxheXMgPSBbXTtcbn1cblxuQ2VsbEF1dG9DZWxsLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1cnJvdW5kaW5nID0gMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXVt2YWx1ZV0pIHtcblx0XHRcdHN1cnJvdW5kaW5nKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBzdXJyb3VuZGluZztcbn07XG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24obnVtU3RlcHMsIGZuKSB7XG5cdHRoaXMuZGVsYXlzLnB1c2goeyBzdGVwczogbnVtU3RlcHMsIGFjdGlvbjogZm4gfSk7XG59O1xuXG5DZWxsQXV0b0NlbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24obmVpZ2hib3JzKSB7XG5cdHJldHVybjtcbn07XG5cbkNlbGxBdXRvQ2VsbC5wcm90b3R5cGUuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZSA9IGZ1bmN0aW9uKG5laWdoYm9ycywgdmFsdWUpIHtcblx0dmFyIHN1bW1lZCA9IDAuMDtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIChuZWlnaGJvcnNbaV1bdmFsdWVdIHx8IG5laWdoYm9yc1tpXVt2YWx1ZV0gPT09IDApKSB7XG5cdFx0XHRzdW1tZWQgKz0gbmVpZ2hib3JzW2ldW3ZhbHVlXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHN1bW1lZCAvIG5laWdoYm9ycy5sZW5ndGg7Ly9jbnQ7XG59O1xuZnVuY3Rpb24gQ0FXb3JsZChvcHRpb25zKSB7XG5cblx0dGhpcy53aWR0aCA9IDI0O1xuXHR0aGlzLmhlaWdodCA9IDI0O1xuXHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG5cdHRoaXMud3JhcCA9IGZhbHNlO1xuXG5cdHRoaXMuVE9QTEVGVCAgICAgICAgPSB7IGluZGV4OiAwLCB4OiAtMSwgeTogLTEgfTtcblx0dGhpcy5UT1AgICAgICAgICAgICA9IHsgaW5kZXg6IDEsIHg6ICAwLCB5OiAtMSB9O1xuXHR0aGlzLlRPUFJJR0hUICAgICAgID0geyBpbmRleDogMiwgeDogIDEsIHk6IC0xIH07XG5cdHRoaXMuTEVGVCAgICAgICAgICAgPSB7IGluZGV4OiAzLCB4OiAtMSwgeTogIDAgfTtcblx0dGhpcy5SSUdIVCAgICAgICAgICA9IHsgaW5kZXg6IDQsIHg6ICAxLCB5OiAgMCB9O1xuXHR0aGlzLkJPVFRPTUxFRlQgICAgID0geyBpbmRleDogNSwgeDogLTEsIHk6ICAxIH07XG5cdHRoaXMuQk9UVE9NICAgICAgICAgPSB7IGluZGV4OiA2LCB4OiAgMCwgeTogIDEgfTtcblx0dGhpcy5CT1RUT01SSUdIVCAgICA9IHsgaW5kZXg6IDcsIHg6ICAxLCB5OiAgMSB9O1xuXHRcblx0dGhpcy5yYW5kb21HZW5lcmF0b3IgPSBNYXRoLnJhbmRvbTtcblxuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdCwgZWlnaHQgc2lkZXNcblx0dmFyIG5laWdoYm9yaG9vZCA9IFtudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcblxuXHRpZiAodGhpcy5vcHRpb25zLmhleFRpbGVzKSB7XG5cdFx0Ly8gc2l4IHNpZGVzXG5cdFx0bmVpZ2hib3Job29kID0gW251bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xuXHR9XG5cdHRoaXMuc3RlcCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5LCB4O1xuXHRcdGZvciAoeT0wOyB5PHRoaXMuaGVpZ2h0OyB5KyspIHtcblx0XHRcdGZvciAoeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0XHR0aGlzLmdyaWRbeV1beF0ucmVzZXQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBib3R0b20gdXAsIGxlZnQgdG8gcmlnaHQgcHJvY2Vzc2luZ1xuXHRcdGZvciAoeT10aGlzLmhlaWdodC0xOyB5Pj0wOyB5LS0pIHtcblx0XHRcdGZvciAoeD10aGlzLndpZHRoLTE7IHg+PTA7IHgtLSkge1xuXHRcdFx0XHR0aGlzLmZpbGxOZWlnaGJvcnMobmVpZ2hib3Job29kLCB4LCB5KTtcblx0XHRcdFx0dmFyIGNlbGwgPSB0aGlzLmdyaWRbeV1beF07XG5cdFx0XHRcdGNlbGwucHJvY2VzcyhuZWlnaGJvcmhvb2QpO1xuXG5cdFx0XHRcdC8vIHBlcmZvcm0gYW55IGRlbGF5c1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8Y2VsbC5kZWxheXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5zdGVwcy0tO1xuXHRcdFx0XHRcdGlmIChjZWxsLmRlbGF5c1tpXS5zdGVwcyA8PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBwZXJmb3JtIGFjdGlvbiBhbmQgcmVtb3ZlIGRlbGF5XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5c1tpXS5hY3Rpb24oY2VsbCk7XG5cdFx0XHRcdFx0XHRjZWxsLmRlbGF5cy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vdmFyIE5FSUdIQk9STE9DUyA9IFt7eDotMSwgeTotMX0sIHt4OjAsIHk6LTF9LCB7eDoxLCB5Oi0xfSwge3g6LTEsIHk6MH0sIHt4OjEsIHk6MH0se3g6LTEsIHk6MX0sIHt4OjAsIHk6MX0sIHt4OjEsIHk6MX1dO1xuXHQvLyBzcXVhcmUgdGlsZXMgYnkgZGVmYXVsdFxuXHR2YXIgTkVJR0hCT1JMT0NTID0gW1xuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9fSwgIC8vIHJpZ2h0XG5cdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19LCAgLy8gYm90dG9tIGxlZnRcblx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9fSwgIC8vIGJvdHRvbVxuXHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XTtcblx0aWYgKHRoaXMub3B0aW9ucy5oZXhUaWxlcykge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMuZmxhdFRvcHBlZCkge1xuXHRcdFx0Ly8gZmxhdCB0b3BwZWQgaGV4IG1hcCwgIGZ1bmN0aW9uIHJlcXVpcmVzIGNvbHVtbiB0byBiZSBwYXNzZWRcblx0XHRcdE5FSUdIQk9STE9DUyA9IFtcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIGxlZnRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH19LCAgLy8gdG9wXG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAtMSA6IDA7IH19LCAgLy8gdG9wIHJpZ2h0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0sICAvLyBib3R0b20gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b21cblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gLTE7IH0sIGRpZmZZOiBmdW5jdGlvbih4KSB7IHJldHVybiB4JTIgPyAwIDogMTsgfX0gIC8vIGJvdHRvbSBsZWZ0XG5cdFx0XHRdO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIHBvaW50eSB0b3BwZWQgaGV4IG1hcCwgZnVuY3Rpb24gcmVxdWlyZXMgcm93IHRvIGJlIHBhc3NlZFxuXHRcdFx0TkVJR0hCT1JMT0NTID0gW1xuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMCA6IC0xOyB9LCBkaWZmWTogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfX0sICAvLyB0b3AgbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIC0xOyB9fSwgIC8vIHRvcCByaWdodFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oKSB7IHJldHVybiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfX0sICAvLyBsZWZ0XG5cdFx0XHRcdHsgZGlmZlggOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH19LCAgLy8gcmlnaHRcblx0XHRcdFx0eyBkaWZmWCA6IGZ1bmN0aW9uKHgsIHkpIHsgcmV0dXJuIHklMiA/IDAgOiAtMTsgfSwgZGlmZlk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfX0sICAvLyBib3R0b20gbGVmdFxuXHRcdFx0XHR7IGRpZmZYIDogZnVuY3Rpb24oeCwgeSkgeyByZXR1cm4geSUyID8gMSA6IDA7IH0sIGRpZmZZOiBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH19ICAvLyBib3R0b20gcmlnaHRcblx0XHRcdF07XG5cdFx0fVxuXG5cdH1cblx0dGhpcy5maWxsTmVpZ2hib3JzID0gZnVuY3Rpb24obmVpZ2hib3JzLCB4LCB5KSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPE5FSUdIQk9STE9DUy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5laWdoYm9yWCA9IHggKyBORUlHSEJPUkxPQ1NbaV0uZGlmZlgoeCwgeSk7XG5cdFx0XHR2YXIgbmVpZ2hib3JZID0geSArIE5FSUdIQk9STE9DU1tpXS5kaWZmWSh4LCB5KTtcblx0XHRcdGlmICh0aGlzLndyYXApIHtcblx0XHRcdFx0Ly8gVE9ETzogaGV4IG1hcCBzdXBwb3J0IGZvciB3cmFwcGluZ1xuXHRcdFx0XHRuZWlnaGJvclggPSAobmVpZ2hib3JYICsgdGhpcy53aWR0aCkgJSB0aGlzLndpZHRoO1xuXHRcdFx0XHRuZWlnaGJvclkgPSAobmVpZ2hib3JZICsgdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXRoaXMud3JhcCAmJiAobmVpZ2hib3JYIDwgMCB8fCBuZWlnaGJvclkgPCAwIHx8IG5laWdoYm9yWCA+PSB0aGlzLndpZHRoIHx8IG5laWdoYm9yWSA+PSB0aGlzLmhlaWdodCkpIHtcblx0XHRcdFx0bmVpZ2hib3JzW2ldID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuZWlnaGJvcnNbaV0gPSB0aGlzLmdyaWRbbmVpZ2hib3JZXVtuZWlnaGJvclhdO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmluaXRpYWxpemUgPSBmdW5jdGlvbihhcnJheVR5cGVEaXN0KSB7XG5cblx0XHQvLyBzb3J0IHRoZSBjZWxsIHR5cGVzIGJ5IGRpc3RyaWJ1dGlvblxuXHRcdGFycmF5VHlwZURpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRyZXR1cm4gYS5kaXN0cmlidXRpb24gPiBiLmRpc3RyaWJ1dGlvbiA/IDEgOiAtMTtcblx0XHR9KTtcblxuXHRcdHZhciB0b3RhbERpc3QgPSAwO1xuXHRcdC8vIGFkZCBhbGwgZGlzdHJpYnV0aW9ucyB0b2dldGhlclxuXHRcdGZvciAodmFyIGk9MDsgaTxhcnJheVR5cGVEaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0b3RhbERpc3QgKz0gYXJyYXlUeXBlRGlzdFtpXS5kaXN0cmlidXRpb247XG5cdFx0XHRhcnJheVR5cGVEaXN0W2ldLmRpc3RyaWJ1dGlvbiA9IHRvdGFsRGlzdDtcblx0XHR9XG5cblx0XHR0aGlzLmdyaWQgPSBbXTtcblx0XHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0XHRmb3IgKHZhciB4PTA7IHg8dGhpcy53aWR0aDsgeCsrKSB7XG5cdFx0XHRcdHZhciByYW5kb20gPSB0aGlzLnJhbmRvbUdlbmVyYXRvcigpICogMTAwO1xuXG5cdFx0XHRcdGZvciAoaT0wOyBpPGFycmF5VHlwZURpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAocmFuZG9tIDw9IGFycmF5VHlwZURpc3RbaV0uZGlzdHJpYnV0aW9uKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbYXJyYXlUeXBlRGlzdFtpXS5uYW1lXSh4LCB5KTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNlbGxUeXBlcyA9IHt9O1xuXHR0aGlzLnJlZ2lzdGVyQ2VsbFR5cGUgPSBmdW5jdGlvbihuYW1lLCBjZWxsT3B0aW9ucywgaW5pdCkge1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdFx0Q2VsbEF1dG9DZWxsLmNhbGwodGhpcywgeCwgeSk7XG5cblx0XHRcdGlmIChpbml0KSB7XG5cdFx0XHRcdGluaXQuY2FsbCh0aGlzLCB4LCB5KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBjZWxsT3B0aW9ucykge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0Ly8gcHJvcGVydGllcyBnZXQgaW5zdGFuY2Vcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdFx0Ly8gb2JqZWN0cyBtdXN0IGJlIGNsb25lZFxuXHRcdFx0XHRcdFx0XHR0aGlzW2tleV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNlbGxPcHRpb25zW2tleV0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyBwcmltaXRpdmVcblx0XHRcdFx0XHRcdFx0dGhpc1trZXldID0gY2VsbE9wdGlvbnNba2V5XTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHRoaXMuY2VsbFR5cGVzW25hbWVdLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ2VsbEF1dG9DZWxsLnByb3RvdHlwZSk7XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhpcy5jZWxsVHlwZXNbbmFtZV07XG5cdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlLmNlbGxUeXBlID0gbmFtZTtcblxuXHRcdGlmIChjZWxsT3B0aW9ucykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGNlbGxPcHRpb25zKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgY2VsbE9wdGlvbnNba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdC8vIGZ1bmN0aW9ucyBnZXQgcHJvdG90eXBlXG5cdFx0XHRcdFx0dGhpcy5jZWxsVHlwZXNbbmFtZV0ucHJvdG90eXBlW2tleV0gPSBjZWxsT3B0aW9uc1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vIGFwcGx5IG9wdGlvbnNcblx0aWYgKG9wdGlvbnMpIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuXHRcdFx0dGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuXHRcdH1cblx0fVxuXG59XG5cbkNBV29ybGQucHJvdG90eXBlLmluaXRpYWxpemVGcm9tR3JpZCAgPSBmdW5jdGlvbih2YWx1ZXMsIGluaXRHcmlkKSB7XG5cblx0dGhpcy5ncmlkID0gW107XG5cdGZvciAodmFyIHk9MDsgeTx0aGlzLmhlaWdodDsgeSsrKSB7XG5cdFx0dGhpcy5ncmlkW3ldID0gW107XG5cdFx0Zm9yICh2YXIgeD0wOyB4PHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLmdyaWRWYWx1ZSA9PT0gaW5pdEdyaWRbeV1beF0pIHtcblx0XHRcdFx0XHR0aGlzLmdyaWRbeV1beF0gPSBuZXcgdGhpcy5jZWxsVHlwZXNbdmFsdWVzW2ldLm5hbWVdKHgsIHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn07XG5cbkNBV29ybGQucHJvdG90eXBlLmNyZWF0ZUdyaWRGcm9tVmFsdWVzID0gZnVuY3Rpb24odmFsdWVzLCBkZWZhdWx0VmFsdWUpIHtcblx0dmFyIG5ld0dyaWQgPSBbXTtcblxuXHRmb3IgKHZhciB5PTA7IHk8dGhpcy5oZWlnaHQ7IHkrKykge1xuXHRcdG5ld0dyaWRbeV0gPSBbXTtcblx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuXHRcdFx0bmV3R3JpZFt5XVt4XSA9IGRlZmF1bHRWYWx1ZTtcblx0XHRcdHZhciBjZWxsID0gdGhpcy5ncmlkW3ldW3hdO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY2VsbC5jZWxsVHlwZSA9PSB2YWx1ZXNbaV0uY2VsbFR5cGUgJiYgY2VsbFt2YWx1ZXNbaV0uaGFzUHJvcGVydHldKSB7XG5cdFx0XHRcdFx0bmV3R3JpZFt5XVt4XSA9IHZhbHVlc1tpXS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBuZXdHcmlkO1xufTtcblxuOyhmdW5jdGlvbigpIHtcbiAgdmFyIENlbGxBdXRvID0ge1xuICAgIFdvcmxkOiBDQVdvcmxkLFxuICAgIENlbGw6IENlbGxBdXRvQ2VsbFxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ0NlbGxBdXRvJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIENlbGxBdXRvO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDZWxsQXV0bztcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuQ2VsbEF1dG8gPSBDZWxsQXV0bztcbiAgfVxufSkoKTsiLCJpbXBvcnQgKiBhcyBDZWxsQXV0byBmcm9tIFwiLi92ZW5kb3IvY2VsbGF1dG8uanNcIjtcblxuZXhwb3J0IGxldCBXb3JsZHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaG9vc2VzIGEgcmFuZG9tIGVsZW1lbnRhcnkgYXV0b21hdGEgZnJvbSBhIGxpc3QuXG4gICAgICovXG4gICAgUmFuZG9tUnVsZTogZnVuY3Rpb24gKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgbGV0IHJ1bGVzID0gW1xuICAgICAgICAgICAgMTgsIDIyLCAyNiwgNTQsIDYwLCA5MCwgOTQsIDExMCwgMTI2LCAxNTBcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHJ1bGU6IHJ1bGVzW3J1bGVzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkgPDwgMF0sIC8vIFJhbmRvbSBydWxlIGZyb20gbGlzdFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFbGVtZW50YXJ5KG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb253YXkncyBHYW1lIG9mIExpZmVcbiAgICAgKiBCMy9TMjNcbiAgICAgKi9cbiAgICBMaWZlOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzNdLFxuICAgICAgICAgICAgUzogWzIsIDNdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogMixcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTGlmZUxpa2Uob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIG1hemUtbGlrZSBzdHJ1Y3R1cmUuXG4gICAgICogQmFzZWQgb24gcnVsZSBCMy9TMTIzNCAoTWF6ZWNldHJpYykuXG4gICAgICovXG4gICAgTWF6ZWNldHJpYzogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIEI6IFszXSxcbiAgICAgICAgICAgIFM6IFsxLCAyLCAzLCA0XSxcbiAgICAgICAgICAgIHBhbGV0dGU6IFtcbiAgICAgICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XSxcbiAgICAgICAgICAgICAgICBbMjU1LCAyNTUsIDI1NSwgMjU1XVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3k6IDUsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4xO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjM1Njc4L1M1Njc4XG4gICAgICovXG4gICAgRGlhbW9lYmE6IGZ1bmN0aW9uKHdpZHRoID0gOTYsIGhlaWdodCA9IDk2KSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBCOiBbMywgNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBTOiBbNSwgNiwgNywgOF0sXG4gICAgICAgICAgICBwYWxldHRlOiBbXG4gICAgICAgICAgICAgICAgWzY4LCAzNiwgNTIsIDI1NV0sXG4gICAgICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5OiAzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExpZmVMaWtlKG9wdGlvbnMsICh4LCB5KSA9PiB7XG4gICAgICAgICAgICAvLyBEaXN0cmlidXRpb24gZnVuY3Rpb25cbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDwgMC4yO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQjQ2NzgvUzM1Njc4XG4gICAgICovXG4gICAgQW5uZWFsOiBmdW5jdGlvbih3aWR0aCA9IDk2LCBoZWlnaHQgPSA5Nikge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgQjogWzQsIDYsIDcsIDhdLFxuICAgICAgICAgICAgUzogWzMsIDUsIDYsIDcsIDhdLFxuICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgIFs2OCwgMzYsIDUyLCAyNTVdLFxuICAgICAgICAgICAgICAgIFsyNTUsIDI1NSwgMjU1LCAyNTVdXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeTogM1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMaWZlTGlrZShvcHRpb25zLCAoeCwgeSkgPT4ge1xuICAgICAgICAgICAgLy8gRGlzdHJpYnV0aW9uIGZ1bmN0aW9uXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8IDAuMztcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENBIHRoYXQgbG9va3MgbGlrZSBsYXZhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBMYXZhOiBmdW5jdGlvbiAod2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyB0aGFua3MgdG8gVGhlTGFzdEJhbmFuYSBvbiBUSUdTb3VyY2VcblxuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB3cmFwOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbMzQsMTAsMjEsMjU1XSwgWzY4LDE3LDI2LDI1NV0sIFsxMjMsMTYsMTYsMjU1XSxcbiAgICAgICAgICAgIFsxOTAsNDUsMTYsMjU1XSwgWzI0NCwxMDIsMjAsMjU1XSwgWzI1NCwyMTIsOTcsMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBjb2xvcnMgPSBbXTtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgZm9yICg7IGluZGV4IDwgMTg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjc7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMjk7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDM7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzU7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgMzg7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDI7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDU7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDQ7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNDY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDI7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNTY7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDE7IH1cbiAgICAgICAgZm9yICg7IGluZGV4IDwgNjQ7ICsraW5kZXgpIHsgY29sb3JzW2luZGV4XSA9IDA7IH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsYXZhJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsZXQgdiA9IHRoaXMudmFsdWUgKyAwLjVcbiAgICAgICAgICAgICAgICAgICAgKyBNYXRoLnNpbih0aGlzLnggLyB3b3JsZC53aWR0aCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICArIE1hdGguc2luKHRoaXMueSAvIHdvcmxkLmhlaWdodCAqIE1hdGguUEkpICogMC4wNFxuICAgICAgICAgICAgICAgICAgICAtIDAuMDU7XG4gICAgICAgICAgICAgICAgdiA9IE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMC4wLCB2KSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzW01hdGguZmxvb3IoY29sb3JzLmxlbmd0aCAqIHYpXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5kcm9wbGV0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS52YWx1ZSA9IDAuNSAqdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ucHJldiA9IDAuNSAqdGhpcy5wcmV2O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJvcGxldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGF2ZyA9IHRoaXMuZ2V0U3Vycm91bmRpbmdDZWxsc0F2ZXJhZ2VWYWx1ZShuZWlnaGJvcnMsICd2YWx1ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IDAuOTk4ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC45OTk5Mykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMjUgKyAwLjMqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBNYXRoLm1pbigwLjUsIE1hdGgubWF4KC0wLjUsIHRoaXMudmFsdWUpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gMC4wO1xuICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubmV4dCA9IHRoaXMudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnbGF2YScsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN5Y2xpYyByYWluYm93IGF1dG9tYXRhLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBDeWNsaWNSYWluYm93czogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVjb21tZW5kZWRGcmFtZUZyZXF1ZW5jeSA9IDE7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtcbiAgICAgICAgICAgIFsyNTUsMCwwLDEgKiAyNTVdLCBbMjU1LDk2LDAsMSAqIDI1NV0sIFsyNTUsMTkxLDAsMSAqIDI1NV0sIFsyMjMsMjU1LDAsMSAqIDI1NV0sXG4gICAgICAgICAgICBbMTI4LDI1NSwwLDEgKiAyNTVdLCBbMzIsMjU1LDAsMSAqIDI1NV0sIFswLDI1NSw2NCwxICogMjU1XSwgWzAsMjU1LDE1OSwxICogMjU1XSxcbiAgICAgICAgICAgIFswLDI1NSwyNTUsMSAqIDI1NV0sIFswLDE1OSwyNTUsMSAqIDI1NV0sIFswLDY0LDI1NSwxICogMjU1XSwgWzMyLDAsMjU1LDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEyNywwLDI1NSwxICogMjU1XSwgWzIyMywwLDI1NSwxICogMjU1XSwgWzI1NSwwLDE5MSwxICogMjU1XSwgWzI1NSwwLDk2LDEgKiAyNTVdXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnY3ljbGljJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSAodGhpcy5zdGF0ZSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoyKSkgJSAxNjtcblxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVpZ2hib3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5naW5nID0gY2hhbmdpbmcgfHwgbmVpZ2hib3JzW2ldLnN0YXRlID09PSBuZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjaGFuZ2luZykgdGhpcy5zdGF0ZSA9IG5leHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICdjeWNsaWMnLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGVzIGNhdmVzIGFuZCB3YXRlciBtb3ZlbWVudC5cbiAgICAgKiBcbiAgICAgKiBGcm9tIGh0dHBzOi8vc2Fub2ppYW4uZ2l0aHViLmlvL2NlbGxhdXRvXG4gICAgICovXG4gICAgQ2F2ZXNXaXRoV2F0ZXI6IGZ1bmN0aW9uKHdpZHRoID0gMTI4LCBoZWlnaHQgPSAxMjgpIHtcbiAgICAgICAgLy8gRklSU1QgQ1JFQVRFIENBVkVTXG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YWxsJywge1xuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGxldCBzdXJyb3VuZGluZyA9IHRoaXMuY291bnRTdXJyb3VuZGluZ0NlbGxzV2l0aFZhbHVlKG5laWdoYm9ycywgJ3dhc09wZW4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSAodGhpcy53YXNPcGVuICYmIHN1cnJvdW5kaW5nID49IDQpIHx8IHN1cnJvdW5kaW5nID49IDY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc09wZW4gPSB0aGlzLm9wZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5yYW5kb20oKSA+IDAuNDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2FsbCcsIGRpc3RyaWJ1dGlvbjogMTAwIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgb3VyIGNhdmUsIDEwIHN0ZXBzIGF1Z2h0IHRvIGRvIGl0XG4gICAgICAgIGZvciAobGV0IGk9MDsgaTwxMDsgaSsrKSB7XG4gICAgICAgICAgICB3b3JsZC5zdGVwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZ3JpZCA9IHdvcmxkLmNyZWF0ZUdyaWRGcm9tVmFsdWVzKFtcbiAgICAgICAgICAgIHsgY2VsbFR5cGU6ICd3YWxsJywgaGFzUHJvcGVydHk6ICdvcGVuJywgdmFsdWU6IDAgfVxuICAgICAgICBdLCAxKTtcblxuICAgICAgICAvLyBOT1cgVVNFIE9VUiBDQVZFUyBUTyBDUkVBVEUgQSBORVcgV09STEQgQ09OVEFJTklORyBXQVRFUlxuICAgICAgICB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGNsZWFyUmVjdDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMCAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDMvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA0LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNS85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDYvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA3LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgOC85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEgKiAyNTVdLFxuICAgICAgICAgICAgWzEwOSwgMTcwLCA0NCwgMSAqIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMSAqIDI1NV1cbiAgICAgICAgXTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAweDU5N0RDRTQ0O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndhdGVyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG5laWdoYm9ycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBwdXNoIG15IHdhdGVyIG91dCB0byBteSBhdmFpbGFibGUgbmVpZ2hib3JzXG5cbiAgICAgICAgICAgICAgICAvLyBjZWxsIGJlbG93IG1lIHdpbGwgdGFrZSBhbGwgaXQgY2FuXG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdICE9PSBudWxsICYmIHRoaXMud2F0ZXIgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCA5IC0gbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0ud2F0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBib3R0b20gdHdvIGNvcm5lcnMgdGFrZSBoYWxmIG9mIHdoYXQgSSBoYXZlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaT01OyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkhPXdvcmxkLkJPVFRPTS5pbmRleCAmJiBuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbaV0ud2F0ZXIgPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYW10ID0gTWF0aC5taW4odGhpcy53YXRlciwgTWF0aC5jZWlsKCg5IC0gbmVpZ2hib3JzW2ldLndhdGVyKS8yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhdGVyLT0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzaWRlcyB0YWtlIGEgdGhpcmQgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTM7IGk8PTQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW2ldICE9PSBudWxsICYmIG5laWdoYm9yc1tpXS53YXRlciA8IHRoaXMud2F0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vaW5pdFxuICAgICAgICAgICAgdGhpcy53YXRlciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkpO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdyb2NrJywge1xuICAgICAgICAgICAgaXNTb2xpZDogdHJ1ZSxcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saWdodGVkID8gMTAgOiAxMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpZ2h0ZWQgPSBuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XSAmJiAhKG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLndhdGVyID09PSA5KSAmJiAhbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0uaXNTb2xpZFxuICAgICAgICAgICAgICAgICAgICAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XSAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS5pc1NvbGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBwYXNzIGluIG91ciBnZW5lcmF0ZWQgY2F2ZSBkYXRhXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemVGcm9tR3JpZChbXG4gICAgICAgICAgICB7IG5hbWU6ICdyb2NrJywgZ3JpZFZhbHVlOiAxIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICd3YXRlcicsIGdyaWRWYWx1ZTogMCB9XG4gICAgICAgIF0sIGdyaWQpO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgUmFpbjogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICAvLyBGSVJTVCBDUkVBVEUgQ0FWRVNcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ3dhbGwnLCB7XG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1cnJvdW5kaW5nID0gdGhpcy5jb3VudFN1cnJvdW5kaW5nQ2VsbHNXaXRoVmFsdWUobmVpZ2hib3JzLCAnd2FzT3BlbicpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlbiA9ICh0aGlzLndhc09wZW4gJiYgc3Vycm91bmRpbmcgPj0gNCkgfHwgc3Vycm91bmRpbmcgPj0gNjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzT3BlbiA9IHRoaXMub3BlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLm9wZW4gPSBNYXRoLnJhbmRvbSgpID4gMC40MDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQuaW5pdGlhbGl6ZShbXG4gICAgICAgICAgICB7IG5hbWU6ICd3YWxsJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAvLyBnZW5lcmF0ZSBvdXIgY2F2ZSwgMTAgc3RlcHMgYXVnaHQgdG8gZG8gaXRcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPDEwOyBpKyspIHtcbiAgICAgICAgICAgIHdvcmxkLnN0ZXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBncmlkID0gd29ybGQuY3JlYXRlR3JpZEZyb21WYWx1ZXMoW1xuICAgICAgICAgICAgeyBjZWxsVHlwZTogJ3dhbGwnLCBoYXNQcm9wZXJ0eTogJ29wZW4nLCB2YWx1ZTogMCB9XG4gICAgICAgIF0sIDEpO1xuXG4gICAgICAgIC8vIGN1dCB0aGUgdG9wIGhhbGYgb2YgdGhlIGNhdmVzIG9mZlxuICAgICAgICBmb3IgKGxldCB5PTA7IHk8TWF0aC5mbG9vcih3b3JsZC5oZWlnaHQvMik7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeD0wOyB4PHdvcmxkLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBncmlkW3ldW3hdID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PVyBVU0UgT1VSIENBVkVTIFRPIENSRUFURSBBIE5FVyBXT1JMRCBDT05UQUlOSU5HIFdBVEVSXG4gICAgICAgIHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgY2xlYXJSZWN0OiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLnBhbGV0dGUgPSBbXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAxXSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDEvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCAyLzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMy85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDQvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA1LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgNi85ICogMjU1XSxcbiAgICAgICAgICAgIFs4OSwgMTI1LCAyMDYsIDcvOSAqIDI1NV0sXG4gICAgICAgICAgICBbODksIDEyNSwgMjA2LCA4LzkgKiAyNTVdLFxuICAgICAgICAgICAgWzg5LCAxMjUsIDIwNiwgMjU1XSxcbiAgICAgICAgICAgIFsxMDksIDE3MCwgNDQsIDI1NV0sXG4gICAgICAgICAgICBbNjgsIDM2LCA1MiwgMjU1XVxuICAgICAgICBdO1xuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2FpcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvL3JldHVybiAnODksIDEyNSwgMjA2LCAnICsgKHRoaXMud2F0ZXIgPyBNYXRoLm1heCgwLjMsIHRoaXMud2F0ZXIvOSkgOiAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53YXRlcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICAvLyByYWluIG9uIHRoZSB0b3Agcm93XG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdID09PSBudWxsICYmIE1hdGgucmFuZG9tKCkgPCAwLjAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXIgPSA1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLndhdGVyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHB1c2ggbXkgd2F0ZXIgb3V0IHRvIG15IGF2YWlsYWJsZSBuZWlnaGJvcnNcblxuICAgICAgICAgICAgICAgIC8vIGNlbGwgYmVsb3cgbWUgd2lsbCB0YWtlIGFsbCBpdCBjYW5cbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gIT09IG51bGwgJiYgdGhpcy53YXRlciAmJiBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIDkgLSBuZWlnaGJvcnNbd29ybGQuQk9UVE9NLmluZGV4XS53YXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1t3b3JsZC5CT1RUT00uaW5kZXhdLndhdGVyICs9IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGJvdHRvbSB0d28gY29ybmVycyB0YWtlIGhhbGYgb2Ygd2hhdCBJIGhhdmVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTU7IGk8PTc7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSE9d29ybGQuQk9UVE9NLmluZGV4ICYmIG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiB0aGlzLndhdGVyICYmIG5laWdoYm9yc1tpXS53YXRlciA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhbXQgPSBNYXRoLm1pbih0aGlzLndhdGVyLCBNYXRoLmNlaWwoKDkgLSBuZWlnaGJvcnNbaV0ud2F0ZXIpLzIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2F0ZXItPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0ud2F0ZXIgKz0gYW10O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNpZGVzIHRha2UgYSB0aGlyZCBvZiB3aGF0IEkgaGF2ZVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MzsgaTw9NDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcnNbaV0gIT09IG51bGwgJiYgbmVpZ2hib3JzW2ldLndhdGVyIDwgdGhpcy53YXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFtdCA9IE1hdGgubWluKHRoaXMud2F0ZXIsIE1hdGguY2VpbCgoOSAtIG5laWdoYm9yc1tpXS53YXRlcikvMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRlci09IGFtdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yc1tpXS53YXRlciArPSBhbXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy9pbml0XG4gICAgICAgICAgICB0aGlzLndhdGVyID0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgncm9jaycsIHtcbiAgICAgICAgICAgIGlzU29saWQ6IHRydWUsXG4gICAgICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlnaHRlZCA/IDEwIDogMTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24obmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saWdodGVkID0gbmVpZ2hib3JzW3dvcmxkLlRPUC5pbmRleF0gJiYgIShuZWlnaGJvcnNbd29ybGQuVE9QLmluZGV4XS53YXRlciA9PT0gOSkgJiYgIW5laWdoYm9yc1t3b3JsZC5UT1AuaW5kZXhdLmlzU29saWRcbiAgICAgICAgICAgICAgICAgICAgJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0gJiYgbmVpZ2hib3JzW3dvcmxkLkJPVFRPTS5pbmRleF0uaXNTb2xpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFzcyBpbiBvdXIgZ2VuZXJhdGVkIGNhdmUgZGF0YVxuICAgICAgICB3b3JsZC5pbml0aWFsaXplRnJvbUdyaWQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncm9jaycsIGdyaWRWYWx1ZTogMSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnYWlyJywgZ3JpZFZhbHVlOiAwIH1cbiAgICAgICAgXSwgZ3JpZCk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZXMgc3BsYXNoaW5nIHdhdGVyLlxuICAgICAqIFxuICAgICAqIEZyb20gaHR0cHM6Ly9zYW5vamlhbi5naXRodWIuaW8vY2VsbGF1dG9cbiAgICAgKi9cbiAgICBTcGxhc2hlczogZnVuY3Rpb24od2lkdGggPSAxMjgsIGhlaWdodCA9IDEyOCkge1xuICAgICAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQoe1xuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ybGQucGFsZXR0ZSA9IFtdO1xuICAgICAgICBsZXQgY29sb3JzID0gW107XG4gICAgICAgIGZvciAobGV0IGluZGV4PTA7IGluZGV4PDY0OyBpbmRleCsrKSB7XG4gICAgICAgICAgICB3b3JsZC5wYWxldHRlLnB1c2goWzg5LCAxMjUsIDIwNiwgKGluZGV4LzY0KSAqIDI1NV0pO1xuICAgICAgICAgICAgY29sb3JzW2luZGV4XSA9IDYzIC0gaW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCd3YXRlcicsIHtcbiAgICAgICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbGV0IHYgPSAoTWF0aC5tYXgoMiAqIHRoaXMudmFsdWUgKyAwLjAyLCAwKSAtIDAuMDIpICsgMC41O1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvcnNbTWF0aC5mbG9vcihjb2xvcnMubGVuZ3RoICogdildO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChuZWlnaGJvcnMpIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmRyb3BsZXQgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yc1tpXSAhPT0gbnVsbCAmJiBuZWlnaGJvcnNbaV0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnNbaV0udmFsdWUgPSAwLjUgKnRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzW2ldLnByZXYgPSAwLjUgKnRoaXMucHJldjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3BsZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBhdmcgPSB0aGlzLmdldFN1cnJvdW5kaW5nQ2VsbHNBdmVyYWdlVmFsdWUobmVpZ2hib3JzLCAndmFsdWUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQgPSAwLjk5ICogKDIgKiBhdmcgLSB0aGlzLnByZXYpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA+IDAuOTk5OSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gLTAuMiArIDAuMjUqTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcm9wbGV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2luaXRcbiAgICAgICAgICAgIHRoaXMud2F0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IDAuMDtcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB0aGlzLm5leHQgPSB0aGlzLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3dhdGVyJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1bGUgNTI5MjggLSB0aGUgQ0EgdXNlZCBmb3IgV29sZnJhbSBBbHBoYSdzIGxvYWRpbmcgYW5pbWF0aW9uc1xuICAgICAqIFxuICAgICAqIFJlc291cmNlczpcbiAgICAgKiBodHRwczovL3d3dy5xdW9yYS5jb20vV2hhdC1pcy1Xb2xmcmFtLUFscGhhcy1sb2FkaW5nLXNjcmVlbi1hLWRlcGljdGlvbi1vZlxuICAgICAqIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvaHVuZ3J5Y2FtZWwvOVVyekovXG4gICAgICovXG4gICAgV29sZnJhbTogZnVuY3Rpb24od2lkdGggPSA5NiwgaGVpZ2h0ID0gOTYpIHtcbiAgICAgICAgbGV0IHdvcmxkID0gbmV3IENlbGxBdXRvLldvcmxkKHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgd3JhcDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JsZC5yZWNvbW1lbmRlZEZyYW1lRnJlcXVlbmN5ID0gMjtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW1xuICAgICAgICAgICAgWzI1NSwgMjU1LCAyNTUsIDI1NV0sIC8vIEJhY2tncm91bmQgY29sb3JcbiAgICAgICAgICAgIFsyNTUsIDExMCwgMCAgLCAyNTVdLCAvLyBkYXJrIG9yYW5nZVxuICAgICAgICAgICAgWzI1NSwgMTMwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTUwLCAwICAsIDI1NV0sIC8vICAgICAgfFxuICAgICAgICAgICAgWzI1NSwgMTcwLCAwICAsIDI1NV0sIC8vICAgICAgVlxuICAgICAgICAgICAgWzI1NSwgMTgwLCAwICAsIDI1NV0gIC8vIGxpZ2h0IG9yYW5nZVxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBjaG9pY2UgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgIGxldCBzZWVkTGlzdCA9IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAyLCAxLCAxLCAxLCAxLCAwLCAwLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzEsIDEsIDMsIDQsIDIsIDEsIDEsIDAsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMSwgMSwgMSwgNCwgMSwgMSwgMCwgMCwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAxLCAyLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDEsIDEsIDEsIDAsIDAsIDIsIDIsIDAsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMiwgMiwgMCwgMCwgMSwgMSwgMSwgMF0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAyLCAxLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDEsIDEsIDQsIDEsIDEsIDEsIDBdLCBcbiAgICAgICAgICAgICAgICBbMCwgMCwgMCwgMSwgMSwgMiwgNCwgMywgMSwgMV0sIFxuICAgICAgICAgICAgICAgIFswLCAwLCAwLCAwLCAxLCAxLCAxLCAxLCAyLCAwXSwgXG4gICAgICAgICAgICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDBdXG4gICAgICAgICAgICBdLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMV0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMSwgMSwgMCwgMCwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMSwgMCwgMCwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMCwgMCwgMCwgMSwgMSwgMV0sIFsxLCAwLCAxLCAxLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDEsIDEsIDAsIDFdLCBbMSwgMSwgMSwgMCwgMCwgMCwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFswLCAxLCAwLCAxLCAwLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDAsIDEsIDAsIDEsIDBdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMCwgMSwgMSwgMSwgMV0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMCwgMV0sIFsxLCAxLCAwLCAxLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDEsIDAsIDEsIDFdLCBbMSwgMCwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAwLCAwLCAxLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDEsIDAsIDAsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAwLCAwLCAxXSwgWzEsIDAsIDAsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAwLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMCwgMSwgMF0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMCwgMSwgMCwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMCwgMV0sIFsxLCAxLCAxLCAwLCAwLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMSwgMCwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAwLCAwLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDAsIDAsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFswLCAxLCAwLCAwLCAxLCAwLCAxLCAwXSwgWzAsIDEsIDAsIDEsIDAsIDAsIDEsIDBdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMCwgMSwgMSwgMF0sIFsxLCAxLCAxLCAwLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDAsIDEsIDEsIDFdLCBbMCwgMSwgMSwgMCwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFswLCAwLCAxLCAxLCAxLCAxLCAwLCAwXSwgWzAsIDAsIDEsIDEsIDEsIDEsIDAsIDBdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMCwgMF0sIFsxLCAxLCAwLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDAsIDEsIDFdLCBbMCwgMCwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAwLCAxLCAxLCAxLCAwLCAwLCAwXSwgWzAsIDAsIDAsIDEsIDEsIDEsIDAsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAxXSwgWzEsIDAsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAwLCAxLCAwLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDAsIDEsIDAsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMCwgMSwgMV0sIFsxLCAxLCAxLCAxLCAwLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDAsIDEsIDEsIDEsIDFdLCBbMSwgMSwgMCwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAwLCAxLCAwLCAwLCAxLCAxLCAxXSwgWzEsIDEsIDEsIDAsIDAsIDEsIDAsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMCwgMF0sIFswLCAxLCAxLCAxLCAxLCAxLCAxLCAwXSwgWzAsIDEsIDEsIDEsIDEsIDEsIDEsIDBdLCBbMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV1dLCBcbiAgICAgICAgICAgIFtbMSwgMSwgMSwgMSwgMSwgMSwgMSwgMF0sIFswLCAwLCAxLCAwLCAxLCAwLCAxLCAxXSwgWzEsIDEsIDAsIDEsIDAsIDEsIDAsIDBdLCBbMCwgMSwgMSwgMSwgMSwgMSwgMSwgMV1dXG4gICAgICAgIF07XG5cbiAgICAgICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgbmVpZ2hib3JPbmVzID0gbmVpZ2hib3JzLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uc3RhdGUgPT0gMTtcbiAgICAgICAgICAgICAgICB9KS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXRlID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDMgfHwgbmVpZ2hib3JPbmVzID09IDUgfHwgbmVpZ2hib3JPbmVzID09IDcpIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYobmVpZ2hib3JPbmVzID09IDAgfHwgbmVpZ2hib3JPbmVzID09IDEgfHwgbmVpZ2hib3JPbmVzID09IDIgfHwgbmVpZ2hib3JPbmVzID09IDYgfHwgbmVpZ2hib3JPbmVzID09IDgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gMykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gNDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld1N0YXRlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5uZXdTdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIC8vIEluaXQgXG5cbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gdXNlIGEgc2VlZFxuICAgICAgICAgICAgaWYoY2hvaWNlIDwgMC41KXtcbiAgICAgICAgICAgICAgICBsZXQgc2VlZDtcbiAgICAgICAgICAgICAgICAvLyAyNSUgY2hhbmNlIHRvIHVzZSBhIHJhbmRvbSBzZWVkXG4gICAgICAgICAgICAgICAgaWYoY2hvaWNlIDwgMC4yNSkge1xuICAgICAgICAgICAgICAgICAgICBzZWVkID0gc2VlZExpc3RbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VlZExpc3QubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIDI1JSBjaGFuY2UgdG8gdXNlIHRoZSBXb2xmcmFtIHNlZWRcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VlZCA9IHNlZWRMaXN0WzBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBtaW5YID0gTWF0aC5mbG9vcih3aWR0aCAvIDIpIC0gTWF0aC5mbG9vcihzZWVkWzBdLmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgICAgIGxldCBtYXhYID0gTWF0aC5mbG9vcih3aWR0aCAvIDIpICsgTWF0aC5mbG9vcihzZWVkWzBdLmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgICAgIGxldCBtaW5ZID0gTWF0aC5mbG9vcihoZWlnaHQgLyAyKSAtIE1hdGguZmxvb3Ioc2VlZC5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgbWF4WSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gMikgKyBNYXRoLmZsb29yKHNlZWQubGVuZ3RoIC8gMik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGlzIGluc2lkZSBvZiB0aGUgc2VlZCBhcnJheSAoY2VudGVyZWQgaW4gdGhlIHdvcmxkKSwgdGhlbiB1c2UgaXRzIHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKHggPj0gbWluWCAmJiB4IDwgbWF4WCAmJiB5ID49IG1pblkgJiYgeSA8IG1heFkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHNlZWRbeSAtIG1pblldW3ggLSBtaW5YXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBpbml0aWFsaXplIHdpdGggbm9pc2VcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBNYXRoLnJhbmRvbSgpIDwgMC4xNSA/IDEgOiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICB7IG5hbWU6ICdsaXZpbmcnLCBkaXN0cmlidXRpb246IDEwMCB9LFxuICAgICAgICBdKTtcblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlcyBhIEJlbG91c292LVpoYWJvdGluc2t5IHJlYWN0aW9uIChhcHByb3hpbWF0ZWx5KS5cbiAgICAgKiBUaGlzIG9uZSdzIHN0aWxsIGEgbGl0dGxlIG1lc3NlZCB1cCwgc28gY29uc2lkZXIgaXQgZXhwZXJpbWVudGFsLlxuICAgICAqIFxuICAgICAqIFJlc291cmNlczpcbiAgICAgKiBodHRwOi8vY2NsLm5vcnRod2VzdGVybi5lZHUvbmV0bG9nby9tb2RlbHMvQi1aUmVhY3Rpb25cbiAgICAgKiBodHRwOi8vd3d3LmZyYWN0YWxkZXNpZ24ubmV0L2F1dG9tYXRhYWxnb3JpdGhtLmFzcHhcbiAgICAgKi9cbiAgICBCZWxvdXNvdlpoYWJvdGluc2t5OiBmdW5jdGlvbih3aWR0aCA9IDEyOCwgaGVpZ2h0ID0gMTI4KSB7XG4gICAgICAgIGxldCB3b3JsZCA9IG5ldyBDZWxsQXV0by5Xb3JsZCh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgZnJhbWUgZnJlcXVlbmN5IGZvciB0aGlzIHNldHVwXG4gICAgICAgIHdvcmxkLnJlY29tbWVuZGVkRnJhbWVGcmVxdWVuY3kgPSAxMDtcblxuICAgICAgICAvLyBDb25maWcgbGV0aWFibGVzXG4gICAgICAgIGxldCBrZXJuZWwgPSBbIC8vIHdlaWdodHMgZm9yIG5laWdoYm9ycy4gRmlyc3QgaW5kZXggaXMgZm9yIHNlbGYgd2VpZ2h0XG4gICAgICAgICAwLCAxLCAxLCAxLFxuICAgICAgICAgICAgMSwgICAgMSxcbiAgICAgICAgICAgIDEsIDEsIDFcbiAgICAgICAgXS5yZXZlcnNlKCk7XG4gICAgICAgIGxldCBrMSA9IDU7IC8vIExvd2VyIGdpdmVzIGhpZ2hlciB0ZW5kZW5jeSBmb3IgYSBjZWxsIHRvIGJlIHNpY2tlbmVkIGJ5IGlsbCBuZWlnaGJvcnNcbiAgICAgICAgbGV0IGsyID0gMTsgLy8gTG93ZXIgZ2l2ZXMgaGlnaGVyIHRlbmRlbmN5IGZvciBhIGNlbGwgdG8gYmUgc2lja2VuZWQgYnkgaW5mZWN0ZWQgbmVpZ2hib3JzXG4gICAgICAgIGxldCBnID0gNTtcbiAgICAgICAgbGV0IG51bVN0YXRlcyA9IDI1NTtcblxuICAgICAgICB3b3JsZC5wYWxldHRlID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU3RhdGVzOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBncmF5ID0gTWF0aC5mbG9vcigoMjU1IC8gbnVtU3RhdGVzKSAqIGkpO1xuICAgICAgICAgICAgd29ybGQucGFsZXR0ZS5wdXNoKFtncmF5LCBncmF5LCBncmF5LCAyNTVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdvcmxkLnJlZ2lzdGVyQ2VsbFR5cGUoJ2J6Jywge1xuICAgICAgICAgICAgZ2V0Q29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICAgICAgbGV0IGhlYWx0aHkgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBpbmZlY3RlZCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGlsbCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bVN0YXRlcyA9IHRoaXMuc3RhdGU7XG4gICAgXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG5laWdoYm9ycy5sZW5ndGggKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5laWdoYm9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSA4KSBuZWlnaGJvciA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL2lmKG5laWdoYm9yICE9PSBudWxsICYmIG5laWdoYm9yLnN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bVN0YXRlcyArPSBuZWlnaGJvci5zdGF0ZSAqIGtlcm5lbFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGtlcm5lbFtpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihuZWlnaGJvci5zdGF0ZSA9PSAwKSBoZWFsdGh5ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihuZWlnaGJvci5zdGF0ZSA8IChudW1TdGF0ZXMgLSAxKSkgaW5mZWN0ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlsbCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnN0YXRlID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IChpbmZlY3RlZCAvIGsxKSArIChpbGwgLyBrMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlIDwgKG51bVN0YXRlcykgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3U3RhdGUgPSAoc3VtU3RhdGVzIC8gaW5mZWN0ZWQgKyBpbGwgKyAxKSArIGc7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5uZXdTdGF0ZSA9IChzdW1TdGF0ZXMgLyA5KSArIGc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRvIHNldCBzdGF0ZSB0byBuZXdzdGF0ZSBpbiBhIHNlY29uZCBwYXNzXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKG51bVN0YXRlcyAtIDEsIE1hdGguZmxvb3IodGhpcy5uZXdTdGF0ZSkpKTtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMubmV3U3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEluaXRcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGEgcmFuZG9tIHN0YXRlXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gTWF0aC5yYW5kb20oKSA8IDEuMCA/IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG51bVN0YXRlcykgOiAwO1xuICAgICAgICAgICAgdGhpcy5uZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmxkLmluaXRpYWxpemUoW1xuICAgICAgICAgICAgeyBuYW1lOiAnYnonLCBkaXN0cmlidXRpb246IDEwMCB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9XG5cbn1cblxuXG4vKipcbiAqIFNpbXVsYXRlcyBhIDFEIGF1dG9tYXRhLlxuICogRXhwZWN0cyBhIHByb3BlcnR5IGBydWxlYCBpbiBgb3B0aW9uc2AsIHdoaWNoIGlzIHRoZSBpbnRlZ2VyIHJ1bGUgb2YgdGhlIENBLlxuICogXG4gKiBOb3QgdG90YWxseSBjb3JyZWN0IHlldCFcbiAqIFxuICovXG5mdW5jdGlvbiBFbGVtZW50YXJ5KG9wdGlvbnMpIHtcbiAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQob3B0aW9ucyk7XG5cbiAgICBsZXQgcnVsZSA9IChvcHRpb25zLnJ1bGUgPj4+IDApLnRvU3RyaW5nKDIpO1xuICAgIHdoaWxlKHJ1bGUubGVuZ3RoIDwgOCkge1xuICAgICAgICBydWxlID0gXCIwXCIgKyBydWxlO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMucnVsZSk7XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzUnVsZShsZWZ0QWxpdmUsIGNlbnRlckFsaXZlLCByaWdodEFsaXZlKSB7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGlmKHJpZ2h0QWxpdmUpIGluZGV4ICs9IDE7XG4gICAgICAgIGlmKGNlbnRlckFsaXZlKSBpbmRleCArPSAyO1xuICAgICAgICBpZihsZWZ0QWxpdmUpIGluZGV4ICs9IDQ7XG4gICAgICAgIHJldHVybiBydWxlW3J1bGUubGVuZ3RoIC0gMSAtIGluZGV4XTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdGVzdFJ1bGUoKSB7XG4gICAgICAgIGxldCBsYXN0SW5kZXggPSBydWxlLmxlbmd0aCAtIDE7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgaSB0byBiaW5hcnkgYW5kIHVzZSBpdCB0byBmZWVkIHByb2Nlc3NSdWxlXG4gICAgICAgICAgICBsZXQgYmluID0gKChsYXN0SW5kZXggLSBpKSA+Pj4gMCkudG9TdHJpbmcoMik7XG4gICAgICAgICAgICB3aGlsZShiaW4ubGVuZ3RoIDwgMykgYmluID0gXCIwXCIgKyBiaW47XG4gICAgICAgICAgICBsZXQgcnVsZU91dCA9IHByb2Nlc3NSdWxlKGJpblswXSA9PSBcIjFcIiwgYmluWzFdID09IFwiMVwiLCBiaW5bMl0gPT0gXCIxXCIpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChydWxlT3V0ID09IHJ1bGVbaV0sIGJpbiArIFwiIFwiICsgcnVsZVtpXSArIFwiIFwiICsgKHJ1bGVPdXQgPT0gcnVsZVtpXSkudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy90ZXN0UnVsZSgpO1xuXG4gICAgd29ybGQucmVnaXN0ZXJDZWxsVHlwZSgnbGl2aW5nJywge1xuICAgICAgICBnZXRDb2xvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWxpdmUgPyAwIDogMTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKG5laWdoYm9ycykge1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0V2FzQWxpdmUobmVpZ2hib3Ipe1xuICAgICAgICAgICAgICAgIGlmKG5laWdoYm9yICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZWlnaGJvci53YXNBbGl2ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGlzbid0IGFjdGl2ZSB5ZXQsIGRldGVybWluZSBpdHMgc3RhdGUgYmFzZWQgb24gaXRzIHVwcGVyIG5laWdoYm9yc1xuICAgICAgICAgICAgaWYoIXRoaXMud2FzQWxpdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsaXZlID0gcHJvY2Vzc1J1bGUoZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzBdKSwgZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzFdKSwgZ2V0V2FzQWxpdmUobmVpZ2hib3JzWzJdKSkgPT0gXCIxXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLndhc0FsaXZlID0gdGhpcy5hbGl2ZTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIC8vIEluaXRcbiAgICAgICAgdGhpcy5hbGl2ZSA9ICh4ID09IE1hdGguZmxvb3Iob3B0aW9ucy53aWR0aCAvIDIpKSAmJiAoeSA9PSAxKTtcbiAgICAgICAgLy90aGlzLmFsaXZlID0gTWF0aC5yYW5kb20oKSA8IDAuMDE7XG4gICAgICAgIC8vdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgfSk7XG5cbiAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgIF0pO1xuXG4gICAgcmV0dXJuIHdvcmxkO1xufVxuXG4vKipcbiAqIFNpbXVsYXRlcyBhIExpZmUtbGlrZSBhdXRvbWF0YS4gVXNlcyBCL1Mgbm90YXRpb24uXG4gKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGlmZS1saWtlX2NlbGx1bGFyX2F1dG9tYXRvblxuICogXG4gKiBFeHBlY3RzIHR3byBhZGRpdGlvbmFsIHByb3BlcnRpZXMgaW4gYG9wdGlvbnNgOlxuICogYEJgOiBBbiBhcnJheSBvZiBpbnRzIHJlcHJlc2VudGluZyB0aGUgQiBjb21wb25lbnQgb2YgdGhlIHJ1bGVcbiAqIGBTYDogQW4gYXJyYXkgb2YgaW50cyByZXByZXNlbnRpbmcgdGhlIFMgY29tcG9uZW50IG9mIHRoZSBydWxlXG4gKi9cbmZ1bmN0aW9uIExpZmVMaWtlKG9wdGlvbnMsIGRpc3RyaWJ1dGlvbkZ1bmMpIHtcbiAgICBsZXQgd29ybGQgPSBuZXcgQ2VsbEF1dG8uV29ybGQob3B0aW9ucyk7XG5cbiAgICB3b3JsZC5yZWdpc3RlckNlbGxUeXBlKCdsaXZpbmcnLCB7XG4gICAgICAgIGdldENvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hbGl2ZSA/IDAgOiAxO1xuICAgICAgICB9LFxuICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAobmVpZ2hib3JzKSB7XG4gICAgICAgICAgICBsZXQgc3Vycm91bmRpbmcgPSB0aGlzLmNvdW50U3Vycm91bmRpbmdDZWxsc1dpdGhWYWx1ZShuZWlnaGJvcnMsICd3YXNBbGl2ZScpO1xuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IG9wdGlvbnMuQi5pbmNsdWRlcyhzdXJyb3VuZGluZykgfHwgb3B0aW9ucy5TLmluY2x1ZGVzKHN1cnJvdW5kaW5nKSAmJiB0aGlzLmFsaXZlO1xuICAgICAgICB9LFxuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53YXNBbGl2ZSA9IHRoaXMuYWxpdmU7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAvLyBJbml0XG4gICAgICAgIGlmKGRpc3RyaWJ1dGlvbkZ1bmMpXG4gICAgICAgICAgICB0aGlzLmFsaXZlID0gZGlzdHJpYnV0aW9uRnVuYyh4LCB5KTtcbiAgICAgICAgZWxzZSAgIFxuICAgICAgICAgICAgdGhpcy5hbGl2ZSA9IE1hdGgucmFuZG9tKCkgPCAwLjU7XG4gICAgfSk7XG5cbiAgICB3b3JsZC5pbml0aWFsaXplKFtcbiAgICAgICAgeyBuYW1lOiAnbGl2aW5nJywgZGlzdHJpYnV0aW9uOiAxMDAgfVxuICAgIF0pO1xuXG4gICAgcmV0dXJuIHdvcmxkO1xufSJdfQ==
