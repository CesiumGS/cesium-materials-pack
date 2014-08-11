(function() {
    "use strict";

    /*jshint node:true*/

    var requirejs = require('requirejs');
    var fs = require('fs');

    if (!fs.existsSync('Build')) {
        fs.mkdirSync('Build');
    }

    process.chdir('Source');

    var files = fs.readdirSync('.');

    var shims = {};

    files.forEach(function(path) {
        var contents = fs.readFileSync(path).toString();

        var cesiumRequireRegex = /'Cesium\/\w*\/(\w*)'/g;
        var match;
        while ((match = cesiumRequireRegex.exec(contents)) !== null) {
            if (match[0] in shims) {
                continue;
            }

            shims[match[0]] = 'define(' + match[0] + ', function() { return Cesium["' + match[1] + '"]; });';
        }
    });

    shims = Object.keys(shims).map(function(key) {
        return shims[key];
    }).join('\n');

    var mainJs = '\
(function() {\n\
"use strict";\n\
/*jshint sub:true*/\n\
/*global define,require,self,Cesium*/\n\
\n' + shims + '\n\
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

    function merge(o1, o2) {
        var r = {};
        var key;
        for (key in o1) {
            if (o1.hasOwnProperty(key)) {
                r[key] = o1[key];
            }
        }
        for (key in o2) {
            if (o2.hasOwnProperty(key)) {
                r[key] = o2[key];
            }
        }
        return r;
    }

    requirejs.optimize(merge(rjsConfig, {
        optimize : 'none',
        out : '../Build/Unminified/MaterialPack.js'
    }), function(buildResponse) {
        console.log('Built unminified MaterialPack.js successfully.');
    });

    requirejs.optimize(merge(rjsConfig, {
        optimize : 'uglify2',
        out : '../Build/MaterialPack.js'
    }), function(buildResponse) {
        console.log('Built minified MaterialPack.js successfully.');
    });
})();