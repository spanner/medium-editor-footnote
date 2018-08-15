const gulp = require('gulp'),
  gulpBabel = require('gulp-babel'),
  gulpRename = require('gulp-rename'),
  gulpUglify = require('gulp-uglify'),
  pump = require('pump');

gulp.task('default', function (cb) {
  pump([
      gulp.src('./src/medium-editor-footnote.js'),
      gulpBabel({ presets: ['es2015-script'] }),
      gulpRename('medium-editor-footnote.js'),
      gulp.dest('dist'),
      gulpRename('medium-editor-footnote.min.js'),
      gulpUglify(),
      gulp.dest('dist')
    ],
    cb
  );
});
