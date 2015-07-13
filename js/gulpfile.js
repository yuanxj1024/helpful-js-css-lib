var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var usemin = require('gulp-usemin');
var rev = require('gulp-rev');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var through = require('through2');

var fs  = require('fs');
var path = require('path');
var statics = 'http://statics.as.missfresh.cn/frontend';
//var statics = '.';


//测试一下提交，请忽略注释

var paths = {
  sass: ['./scss/**/*.scss']
};

// gulp.task('default',function(){
//   console.log('test');
// })

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});


gulp.task('clean-dest', function() {
  return gulp.src('./dest')
    .pipe(clean({force: true}));
});

gulp.task('usemin', function(cd) {
  return gulp.src('./www/index.html')
    .pipe(usemin({
      css: [minifyCss(), 'concat', rev()],
      // js: [uglify({mangle: false}), rev()]
      js: [rev()]
    }))
    .pipe(asyncLoad())
    .pipe(gulp.dest('./dest/'));
});

gulp.task('move-to-dest', function() {
  return gulp.src([
    './www/fonts/**/*',
    './www/img/**/*',
    './www/templates/**/*',
    './www/lib/**/*',
    './www/*.js',
    './www/js/vendors/ap.js',
    './www/pay.htm'
  ], {base: './www'})
    .pipe(gulp.dest('./dest/'));
});

function asyncLoad() {
  console.log("Starting 'async load'...");
  return through.obj(function(file,enc,cb){
    if(file.isNull()) {
      cb(null,file);
    }
    if (file.isBuffer()) {
      var data = Buffer.concat([file.contents]).toString();
      data = data.replace('<link rel="stylesheet" href="', '<link rel="stylesheet" href="' + statics + '/');
      data = data.replace('<img src="./img/icon.png" style="width:80px" alt=""/>', '<img src="' +statics + '/img/icon.png" style="width:80px" alt=""/>');
      data = data.replace('<script src="js/ionic.all','<script src="load.js" id="asyncLoading" data-asyncLoading="'+ statics +'/js/ionic.all');
      data = data.replace('</head>', '<script type="text/javascript" src="http://tajs.qq.com/stats?sId=45760313" charset="UTF-8"></script>\n</head>');
      file.contents = new Buffer(data);
    }
    if (file.isStream()) {
        console.log('async load error');
    }
    cb(null, file);
  });
};
gulp.task('prepare-web', ['clean-dest'], function() {
  gulp.start('usemin', 'move-to-dest');
});


