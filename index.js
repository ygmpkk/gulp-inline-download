var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var cheerio = require('cheerio');
var gulp = require('gulp');
var path = require('path');
var each = require("async/each");
var fs = require('fs');
var download = require('gulp-download');
var uglify = require('gulp-uglify');
var minify = require('gulp-clean-css');
var url = require('url');

var typeMap = {
  css: {
    tag: 'link',
    template: function (contents, el) {
	  var attribute = '';
	  if (isRemote(el.attr('href'))) {
	  	attribute = ' data-src="' + el.attr('href') + '"';
	  }

      return '<style' + attribute + '>\n' + String(contents) + '\n</style>'
    },
    getSrc: function (el) {
      return el.attr('href')
    }
  },

  js: {
    tag: 'script',
    template: function (contents, el) {
      var str = stringifyAttrs(without(el[0].attribs, ['src', 'inline']));
      var attribute = '';
	  if (isRemote(el.attr('src'))) {
	  	attribute = ' data-src="' + el.attr('src') + '"';
	  }
      return '<script ' + attribute + str + '>\n' + String(contents) + '\n</script>'
    },
    getSrc: function (el) {
      return el.attr('src')
    }
  }
};

function inline($, opts, relative, done) {

	var sign = opts.sign || 'inline';

	each(typeMap, function(data, callback){
		var el = $(data.tag);

		//inject every proper tag
		each(el, function(el, cb) {
			if (filter($(el), sign)) {
				console.log('通过')
				
				var stream = null,
					src = data.getSrc($(el));
					console.log(src);
				if (isRemote(src)) {
					stream = download(src);
				} else {
					if (fs.existsSync(path.resolve(relative, src))) {
						stream = gulp.src(path.resolve(relative, src));
					} else {
						return cb();
					}
				}

				if (data.tag == 'link' && opts['uglify'] && opts['uglify'].css) {
					stream = stream.pipe(minify(opts['uglify'].css));
				} else if (data.tag == 'script' && opts['uglify'] && opts['uglify'].js) {
					stream = stream.pipe(uglify(opts['uglify'].js));
				}

				//replace tag with file contents
				//now $ is changed
				stream.pipe(replace($(el), data.template, cb));

			} else {
				cb();
			}
		}, function(err) {
			if (err) throw new PluginError(err) ;
			callback();
		});

	}, function(err) {
		if (err) throw new PluginError(err) ;
		console.log('这里没有执行')
		done();
	})
}

module.exports = function(opts) {

	return through.obj(function(file, enc, cb) {
		var self = this;

		if (file.isNull()) {
	      // return empty file
	      return cb(null, file);
	    }
	    if (file.isBuffer()) {
	    	var $ = cheerio.load(String(file.contents), {decodeEntities: false});
	    	inline($, opts, path.dirname(file.path), function() {
	    		console.log('到这里了')
	    		file.contents = new Buffer($.html());
	      		self.push(file);
	      		cb();
	    	});
	    }
	    if (file.isStream()) {
	      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
	      return cb();
	    }
	})
}

//some utils
function replace (el, tmpl, callback) {
  return through.obj(function (file, enc, cb) {
  	console.log(file.contents	)
    el.replaceWith(tmpl(String(file.contents), el));
    this.push(file);
    cb();
    callback();
  })
}

function filter(el, sign) {
	return el.attr(sign) || el.attr(sign) == '';
}

function isRemote (href) {
  return href && (href.slice(0, 2) == '//' || url.parse(href).protocol)
}

function without (o, keys) {
  keys = [].concat(keys)
  return Object.keys(o).reduce(function (memo, key) {
    if (keys.indexOf(key) === -1) {
      memo[key] = o[key]
    }

    return memo
  }, {})
}

function stringifyAttrs (attrs) {
  return Object.keys(attrs).map(function (key) {
    return [key, attrs[key]].join('=')
  }).join(' ')
}