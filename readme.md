# Dust
*A Cellular Automata visualizer for WebGL*

<strong style="color:red">Epilepsy Warning</strong> - This program is likely to produce fast strobing effects without warning.

## About
Dust is a WebGL-based renderer for visualizing the behavior of various Cellular Automata. It uses [CellAuto](https://sanojian.github.io/cellauto) for the CA simulation and [Pixi](http://www.pixijs.com/) for displaying the output.

## Building
This is a Node project. You'll need [Gulp](https://gulpjs.com/)to build. Run `node install` to pull the dependencies and then `gulp build` to package the final files into `/dist/`.

You can use `gulp preview` to open a browser window showing the contents of `/testpage/index.html`, which is a demo page for this plugin.

## Usage
Copy the contents of `/dist/` to the same directory as your HTML file. In the HTML file, include both Pixi and `/dist/js/dust.js` (or the min version):

```html
<div id="dust-container"></div>
<script src="../dist/js/dust.js"></script>
```

`dust-container` is the div that the canvas will be put within. Style it however you'd like. Note that the canvas will stretch to fit.

## Credit
- [CellAuto](https://sanojian.github.io/cellauto)
- [Pixi](http://www.pixijs.com/)

Many of the Cellular Automata in `worlds.js` are not mine; their sources are in the comments.

## License
MIT license. See [LICENSE.md](LICENSE.md) for details.