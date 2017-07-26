/*
A large portion of this gulpfile was borrowed from
https://gist.github.com/Fishrock123/8ea81dad3197c2f84366
*/

var gulp = require("gulp");

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('utils-merge');

var browserify = require("browserify");
var babelify = require("babelify");
var browserSync = require("browser-sync").create();

var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");

/* nicer browserify errors */
var gutil = require("gulp-util");
var chalk = require("chalk");


// Name of the compiled js file 
var module_name = "dust";
// Directory of source js
var srcDir = "src/";
// Directory where compiled js will go
var distDir = "dist/js/";


function bundle_js(bundler) {
  return bundler.bundle()
    .on('error', map_error)
    .pipe(source(module_name + '.js'))
    .pipe(buffer())
    .pipe(gulp.dest(distDir))
    .pipe(rename(module_name + '.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
      // capture sourcemaps from transforms
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(distDir))
}

/**
 * Main build command. Everything is placed in dist.
 * All JS is transpiled to ES2015 using Babelify.
 */
gulp.task("build", ["copy_resources", "copy_dependencies"], function(){

    var bundler = browserify(`./${srcDir}main.js`, { debug: true })
                    .transform(babelify, { "presets": [ "es2015" ] });

    return bundle_js(bundler);
});

/**
 * Copy the resources folder to dist
 */
gulp.task("copy_resources", [], function(){
    gulp.src(['./resources/**/*'])
        .pipe(gulp.dest('./dist/resources'));
});

/**
 * Copy any external dependencies to dist
 */
gulp.task("copy_dependencies", [], function(){
    gulp.src(['./dependencies/**/*'])
        .pipe(gulp.dest('./dist/dependencies'));
});

/**
 * Shows the test page in your browser through BrowserSync. 
 * Live reloads upon any changes to source files.
 */
gulp.task("preview", ["build"], function(){
    browserSync.init({
        server: {
            baseDir: "./",
            index: "./testpage/index.html"
        }
    });

    // Rebuild upon changes to source files
    gulp.watch(`./${srcDir}**/*.js`, ["build"]);
    gulp.watch(`./resources/**/*`, ["build"]);

    // Reload upon changes to final files
    gulp.watch(`./${distDir}**/*.js`).on('change', browserSync.reload);
    gulp.watch("./testpage/**/*.css").on('change', browserSync.reload);
    gulp.watch("./testpage/**/*.html").on('change', browserSync.reload);
});

function map_error(err) {
  if (err.fileName) {
    // regular error
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.fileName.replace(__dirname + `/${srcDir}`, ''))
      + ': '
      + 'Line '
      + chalk.magenta(err.lineNumber)
      + ' & '
      + 'Column '
      + chalk.magenta(err.columnNumber || err.column)
      + ': '
      + chalk.blue(err.description))
  } else {
    // browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message))
  }

  this.emit('end');
}