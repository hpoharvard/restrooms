var gulp = require('gulp');
var minifycss = require('gulp-minify-css');
var uglify = require("gulp-uglify-es");
var minify = require('gulp-minify');



gulp.task('css',function(){
	return gulp.src('css/*.css')
		.pipe(minifycss())
		.pipe(gulp.dest('dist/css'));
});

 
gulp.task('compress', async function() {
  gulp.src(['js/*.js'])
    .pipe(minify())
    .pipe(gulp.dest('dist/js'))
});

/*
gulp.task('compress', function() {
  gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
});
*/
/*gulp.task('watch', function(){	
	gulp.watch('css/*.css', ['css'])
})

gulp.task('default',['watch'])


var gulp = require('gulp');

gulp.task('default', function() {
  // place code for your default task here
  console.log("it works")
});
*/