(function() {
    "use strict";
    /*jshint node:true*/

    var requirejs = require('requirejs');
    var fs = require('fs');

    if (!fs.existsSync('Build')) {
        fs.mkdirSync('Build');
    }

    if (!fs.existsSync('Build/MinifiedShaders')) {
        fs.mkdirSync('Build/MinifiedShaders');
    }

    process.chdir('Source');

    var files = fs.readdirSync('.');

    var shims = {};
    var minifiedGlslPaths = {};
    var shaderLicenseComments = [];

    files.forEach(function(path) {
        if (/main\.js$/.test(path)) {
            return;
        }

        var contents = fs.readFileSync(path).toString();

        if (/\.js$/.test(path)) {
            // Search for Cesium modules and add shim
            // modules that pull from the Cesium global

            var cesiumRequireRegex = /'Cesium\/\w*\/(\w*)'/g;
            var match;
            while ((match = cesiumRequireRegex.exec(contents)) !== null) {
                if (match[0] in shims) {
                    continue;
                }

                shims[match[0]] = 'define(' + match[0] + ', function() { return Cesium["' + match[1] + '"]; });';
            }
        } else if (/\.glsl$/.test(path)) {
            var newContents = [];

            contents = contents.replace(/\r\n/gm, '\n');

            var licenseComments = contents.match(/\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm);
            if (licenseComments !== null) {
                shaderLicenseComments = shaderLicenseComments.concat(licenseComments);
            }

            // Remove comments. Code ported from
            // https://github.com/apache/ant/blob/master/src/main/org/apache/tools/ant/filters/StripJavaComments.java
            for (var i = 0; i < contents.length; ++i) {
                var c = contents.charAt(i);
                if (c === '/') {
                    c = contents.charAt(++i);
                    if (c === '/') {
                        while (c !== '\r' && c !== '\n' && i < contents.length) {
                            c = contents.charAt(++i);
                        }
                    } else if (c === '*') {
                        while (i < contents.length) {
                            c = contents.charAt(++i);
                            if (c === '*') {
                                c = contents.charAt(++i);
                                while (c === '*') {
                                    c = contents.charAt(++i);
                                }
                                if (c === '/') {
                                    c = contents.charAt(++i);
                                    break;
                                }
                            }
                        }
                    } else {
                        --i;
                        c = '/';
                    }
                }
                newContents.push(c);
            }

            newContents = newContents.join('');
            newContents = newContents.replace(/\s+$/gm, '').replace(/^\s+/gm, '').replace(/\n+/gm, '\n');

            var minifiedFile = '../Build/MinifiedShaders/' + path;
            fs.writeFileSync(minifiedFile, newContents);
            minifiedGlslPaths[path.replace(/\.glsl$/, '')] = minifiedFile.replace(/\.glsl$/, '');
        }
    });

    shims = Object.keys(shims).map(function(key) {
        return shims[key];
    }).join('\n');

    var mainJs = '\
(function() {\n\
"use strict";\n\
/*jshint sub:true*/\n\
/*global define,require,self,Cesium*/\n' + shaderLicenseComments.join('\n') + '\n' + shims + '\n\
require(["MaterialPack"], function(MaterialPack) {\n\
    var scope = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};\n\
    scope.MaterialPack = MaterialPack;\n\
}, undefined, true);\n\
})();';

    fs.writeFileSync('main.js', mainJs);

    var copyrightHeader = fs.readFileSync('copyrightHeader.js').toString();

    var rjsConfig = {
        useStrict : true,
        inlineText : true,
        stubModules : ['text'],
        baseUrl : '.',
        skipModuleInsertion : true,
        wrap : {
            start : copyrightHeader + '(function() {',
            end : '})();'
        },
        name : '../ThirdParty/almond-0.2.9/almond.js',
        include : 'main',
        paths : {
            'text' : '../ThirdParty/requirejs-2.1.14/text'
        }
    };

    var unminifiedRjsConfig = JSON.parse(JSON.stringify(rjsConfig));
    unminifiedRjsConfig.optimize = 'none';
    unminifiedRjsConfig.out = '../Build/Unminified/MaterialPack.js';

    requirejs.optimize(unminifiedRjsConfig, function(buildResponse) {
        console.log('Built unminified MaterialPack.js successfully.');
    });

    var minifiedRjsConfig = JSON.parse(JSON.stringify(rjsConfig));

    minifiedRjsConfig.optimize = 'uglify2';
    minifiedRjsConfig.out = '../Build/MaterialPack.js';
    Object.keys(minifiedGlslPaths).forEach(function(key) {
        minifiedRjsConfig.paths[key] = minifiedGlslPaths[key];
    });

    requirejs.optimize(minifiedRjsConfig, function(buildResponse) {
        console.log('Built minified MaterialPack.js successfully.');
    });
})();