var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var del = require('del');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var scssLint = require('gulp-scss-lint');
var Server = require('karma').Server;


gulp.task('default', function(callback) { 
  runSequence(
    'clean:dev',
    // Add lint:js 
    ['lint:js'], 
    ['lint:scss'], 
    ['sass', 'nunjucks'], 
    ['browserSync', 'watch'], 
    callback
  )
});

gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss')
  // Replacing plumber with customPlumber
  .pipe(customPlumber('Error Running Sass')) 
  .pipe(sourcemaps.init()) 
  .pipe(sass())
  // ... other plugins
  .pipe(autoprefixer())
  // Writing sourcemaps
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('app/css'))
  .pipe(browserSync.reload({
    stream: true
  }))
})

// Watch files for changes
gulp.task('watch', function() { 
  gulp.watch('app/scss/**/*.scss', ['sass', 'lint:scss']);
  // Watch JavaScript files and warn us of errors 
  gulp.watch('app/js/**/*.js', ['lint:js']); 
  gulp.watch('app/js/**/*.js', 
  browserSync.reload); 
  gulp.watch([
    'app/pages/**/*.+(html|nunjucks)', 
    'app/templates/**/*', 
    'app/data.json'
  ], ['nunjucks']);
});

gulp.task('clean:dev', function(){
  return del.sync([
    'app/css',
    'app/*.html'
  ]);
});

gulp.task('nunjucks', function() {
  nunjucksRender.nunjucks.configure(['app/templates/']);

  // Gets .html and .nunjucks files in pages
  return gulp.src('app/pages/**/*.+(html|nunjucks)')

  .pipe(data(function() {
    return require('./app/data.json')
  }))
  // Renders template with nunjucks
  .pipe(nunjucksRender({
      path: ['app/templates']
    }))
  // output files in app folder
  .pipe(gulp.dest('app'))
  .pipe(browserSync.reload({
    stream:true
  }));
});

gulp.task('browserSync', function() {
  browserSync({
    server: {
      // Use root as base directory
      baseDir: 'app'
    },
  })
})

gulp.task('lint:js', function () { 
  return gulp.src('app/js/**/*.js')
  // Catching errors with customPlumber 
  .pipe(customPlumber('JSHint Error')) 
  .pipe(jshint()) 
  .pipe(jshint.reporter('jshint-stylish')) 
  // Catching all JSHint errors 
  .pipe(jshint.reporter('fail', { 
    ignoreWarning: true, 
    ignoreInfo: true
  }))  
  .pipe(jscs({
    fix: true,
    configPath: '.jscsrc' }))
  // removed JSCS reporter
  .pipe(gulp.dest('app/js'))
})

gulp.task('lint:scss', function() { 
  return gulp.src('app/scss/**/*.scss')
  // Linting files with SCSSLint
  .pipe(scssLint({
    // Pointing to config file
    config: '.scss-lint.yml' 
  }));
})

gulp.task('test', function(done) { 
  new Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

function customPlumber(errTitle) { return plumber({
  errorHandler: notify.onError({
    // Customizing error title
    title: errTitle || "Error running Gulp", 
    message: "Error: <%= error.message %>",
    }) 
  });
}