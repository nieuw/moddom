const gulp = require('gulp')
    , sass = require('gulp-sass')

gulp.task('sass', function(){
    return gulp.src('style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./'));
});
