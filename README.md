# gulp-inline-download

> Advantage of gulp-inline-download is to support downloading remote file and inject js/css file to HTML.

## Installation

Install package with NPM and add it to your development dependencies:

	npm install --save-dev gulp-inline-download

## Usage

```
var inline = require('gulp-inline-download');

gulp.src('./test/test.html')
	.pipe(inline({
		uglify: {
			css: {},
			js: {
				output: {
					width: 100
				}
			}
		}
	}))
	.pipe(gulp.dest('./dist'))
```

it can replace your `<link>` and `<script>` uglified with the corresponding inlined files.
