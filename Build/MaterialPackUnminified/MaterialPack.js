/**
 * Cesium Materials - https://github.com/AnalyticalGraphicsInc/cesium-materials-pack
 *
 * Copyright 2011-2014 Analytical Graphics Inc. and Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium-materials-pack/blob/master/LICENSE.md for full licensing details.
 */
(function () {
/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/AsphaltMaterial',[],function() {
    "use strict";
    return "uniform vec4 asphaltColor;\n\
uniform float bumpSize;\n\
uniform float roughness;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec4 color = asphaltColor;\n\
vec2 st = materialInput.st;\n\
vec2 F = czm_cellular(st / bumpSize);\n\
color.rgb -= (F.x / F.y) * 0.1;\n\
float noise = czm_snoise(st / bumpSize);\n\
noise = pow(noise, 5.0) * roughness;\n\
color.rgb += noise;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/BlobMaterial',[],function() {
    "use strict";
    return "uniform vec4 lightColor;\n\
uniform vec4 darkColor;\n\
uniform float frequency;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 F = czm_cellular(materialInput.st * frequency);\n\
float t = 1.0 - F.x * F.x;\n\
vec4 color = mix(lightColor, darkColor, t);\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/BrickMaterial',[],function() {
    "use strict";
    return "uniform vec4 brickColor;\n\
uniform vec4 mortarColor;\n\
uniform vec2 brickSize;\n\
uniform vec2 brickPct;\n\
uniform float brickRoughness;\n\
uniform float mortarRoughness;\n\
#define Integral(x, p) ((floor(x) * p) + max(fract(x) - (1.0 - p), 0.0))\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 st = materialInput.st;\n\
vec2 position = st / brickSize;\n\
if(fract(position.y * 0.5) > 0.5) {\n\
position.x += 0.5;\n\
}\n\
vec2 filterWidth = vec2(0.02);\n\
vec2 useBrick = (Integral(position + filterWidth, brickPct) -\n\
Integral(position, brickPct)) / filterWidth;\n\
float useBrickFinal = useBrick.x * useBrick.y;\n\
vec4 color = mix(mortarColor, brickColor, useBrickFinal);\n\
vec2 brickScaled = vec2(st.x / 0.1, st.y / 0.006);\n\
float brickNoise = abs(czm_snoise(brickScaled) * brickRoughness / 5.0);\n\
color.rg += brickNoise * useBrickFinal;\n\
vec2 mortarScaled = st / 0.005;\n\
float mortarNoise = max(czm_snoise(mortarScaled) * mortarRoughness, 0.0);\n\
color.rgb += mortarNoise * (1.0 - useBrickFinal);\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
/**
 * @license
 * Cellular noise ("Worley noise") in 2D in GLSL.
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
 * This code is released under the conditions of the MIT license.
 * See LICENSE file for details.
 */
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/Builtin/Functions/cellular',[],function() {
    "use strict";
    return "vec3 _czm_permute289(vec3 x)\n\
{\n\
return mod((34.0 * x + 1.0) * x, 289.0);\n\
}\n\
vec2 czm_cellular(vec2 P)\n\
{\n\
#define K 0.142857142857\n\
#define Ko 0.428571428571\n\
#define jitter 1.0\n\
vec2 Pi = mod(floor(P), 289.0);\n\
vec2 Pf = fract(P);\n\
vec3 oi = vec3(-1.0, 0.0, 1.0);\n\
vec3 of = vec3(-0.5, 0.5, 1.5);\n\
vec3 px = _czm_permute289(Pi.x + oi);\n\
vec3 p = _czm_permute289(px.x + Pi.y + oi);\n\
vec3 ox = fract(p*K) - Ko;\n\
vec3 oy = mod(floor(p*K),7.0)*K - Ko;\n\
vec3 dx = Pf.x + 0.5 + jitter*ox;\n\
vec3 dy = Pf.y - of + jitter*oy;\n\
vec3 d1 = dx * dx + dy * dy;\n\
p = _czm_permute289(px.y + Pi.y + oi);\n\
ox = fract(p*K) - Ko;\n\
oy = mod(floor(p*K),7.0)*K - Ko;\n\
dx = Pf.x - 0.5 + jitter*ox;\n\
dy = Pf.y - of + jitter*oy;\n\
vec3 d2 = dx * dx + dy * dy;\n\
p = _czm_permute289(px.z + Pi.y + oi);\n\
ox = fract(p*K) - Ko;\n\
oy = mod(floor(p*K),7.0)*K - Ko;\n\
dx = Pf.x - 1.5 + jitter*ox;\n\
dy = Pf.y - of + jitter*oy;\n\
vec3 d3 = dx * dx + dy * dy;\n\
vec3 d1a = min(d1, d2);\n\
d2 = max(d1, d2);\n\
d2 = min(d2, d3);\n\
d1 = min(d1a, d2);\n\
d2 = max(d1a, d2);\n\
d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx;\n\
d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx;\n\
d1.yz = min(d1.yz, d2.yz);\n\
d1.y = min(d1.y, d1.z);\n\
d1.y = min(d1.y, d2.x);\n\
return sqrt(d1.xy);\n\
}\n\
";
});
/**
 * @license
 * Description : Array and textureless GLSL 2D/3D/4D simplex 
 *               noise functions.
 *      Author : Ian McEwan, Ashima Arts.
 *  Maintainer : ijm
 *     Lastmod : 20110822 (ijm)
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
 *               Distributed under the MIT License. See LICENSE file.
 *               https://github.com/ashima/webgl-noise
 */
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/Builtin/Functions/snoise',[],function() {
    "use strict";
    return "vec4 _czm_mod289(vec4 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec3 _czm_mod289(vec3 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec2 _czm_mod289(vec2 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
float _czm_mod289(float x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec4 _czm_permute(vec4 x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
vec3 _czm_permute(vec3 x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
float _czm_permute(float x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
vec4 _czm_taylorInvSqrt(vec4 r)\n\
{\n\
return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
float _czm_taylorInvSqrt(float r)\n\
{\n\
return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
vec4 _czm_grad4(float j, vec4 ip)\n\
{\n\
const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\n\
vec4 p,s;\n\
p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\n\
p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n\
s = vec4(lessThan(p, vec4(0.0)));\n\
p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;\n\
return p;\n\
}\n\
float czm_snoise(vec2 v)\n\
{\n\
const vec4 C = vec4(0.211324865405187,\n\
0.366025403784439,\n\
-0.577350269189626,\n\
0.024390243902439);\n\
vec2 i  = floor(v + dot(v, C.yy) );\n\
vec2 x0 = v -   i + dot(i, C.xx);\n\
vec2 i1;\n\
i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
vec4 x12 = x0.xyxy + C.xxzz;\n\
x12.xy -= i1;\n\
i = _czm_mod289(i);\n\
vec3 p = _czm_permute( _czm_permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));\n\
vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n\
m = m*m ;\n\
m = m*m ;\n\
vec3 x = 2.0 * fract(p * C.www) - 1.0;\n\
vec3 h = abs(x) - 0.5;\n\
vec3 ox = floor(x + 0.5);\n\
vec3 a0 = x - ox;\n\
m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\
vec3 g;\n\
g.x  = a0.x  * x0.x  + h.x  * x0.y;\n\
g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n\
return 130.0 * dot(m, g);\n\
}\n\
float czm_snoise(vec3 v)\n\
{\n\
const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n\
const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\
vec3 i  = floor(v + dot(v, C.yyy) );\n\
vec3 x0 =   v - i + dot(i, C.xxx) ;\n\
vec3 g = step(x0.yzx, x0.xyz);\n\
vec3 l = 1.0 - g;\n\
vec3 i1 = min( g.xyz, l.zxy );\n\
vec3 i2 = max( g.xyz, l.zxy );\n\
vec3 x1 = x0 - i1 + C.xxx;\n\
vec3 x2 = x0 - i2 + C.yyy;\n\
vec3 x3 = x0 - D.yyy;\n\
i = _czm_mod289(i);\n\
vec4 p = _czm_permute( _czm_permute( _czm_permute(\n\
i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n\
+ i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n\
+ i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\
float n_ = 0.142857142857;\n\
vec3  ns = n_ * D.wyz - D.xzx;\n\
vec4 j = p - 49.0 * floor(p * ns.z * ns.z);\n\
vec4 x_ = floor(j * ns.z);\n\
vec4 y_ = floor(j - 7.0 * x_ );\n\
vec4 x = x_ *ns.x + ns.yyyy;\n\
vec4 y = y_ *ns.x + ns.yyyy;\n\
vec4 h = 1.0 - abs(x) - abs(y);\n\
vec4 b0 = vec4( x.xy, y.xy );\n\
vec4 b1 = vec4( x.zw, y.zw );\n\
vec4 s0 = floor(b0)*2.0 + 1.0;\n\
vec4 s1 = floor(b1)*2.0 + 1.0;\n\
vec4 sh = -step(h, vec4(0.0));\n\
vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n\
vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\
vec3 p0 = vec3(a0.xy,h.x);\n\
vec3 p1 = vec3(a0.zw,h.y);\n\
vec3 p2 = vec3(a1.xy,h.z);\n\
vec3 p3 = vec3(a1.zw,h.w);\n\
vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
p0 *= norm.x;\n\
p1 *= norm.y;\n\
p2 *= norm.z;\n\
p3 *= norm.w;\n\
vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n\
m = m * m;\n\
return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n\
dot(p2,x2), dot(p3,x3) ) );\n\
}\n\
float czm_snoise(vec4 v)\n\
{\n\
const vec4  C = vec4( 0.138196601125011,\n\
0.276393202250021,\n\
0.414589803375032,\n\
-0.447213595499958);\n\
#define F4 0.309016994374947451\n\
vec4 i  = floor(v + dot(v, vec4(F4)) );\n\
vec4 x0 = v -   i + dot(i, C.xxxx);\n\
vec4 i0;\n\
vec3 isX = step( x0.yzw, x0.xxx );\n\
vec3 isYZ = step( x0.zww, x0.yyz );\n\
i0.x = isX.x + isX.y + isX.z;\n\
i0.yzw = 1.0 - isX;\n\
i0.y += isYZ.x + isYZ.y;\n\
i0.zw += 1.0 - isYZ.xy;\n\
i0.z += isYZ.z;\n\
i0.w += 1.0 - isYZ.z;\n\
vec4 i3 = clamp( i0, 0.0, 1.0 );\n\
vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\n\
vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\n\
vec4 x1 = x0 - i1 + C.xxxx;\n\
vec4 x2 = x0 - i2 + C.yyyy;\n\
vec4 x3 = x0 - i3 + C.zzzz;\n\
vec4 x4 = x0 + C.wwww;\n\
i = _czm_mod289(i);\n\
float j0 = _czm_permute( _czm_permute( _czm_permute( _czm_permute(i.w) + i.z) + i.y) + i.x);\n\
vec4 j1 = _czm_permute( _czm_permute( _czm_permute( _czm_permute (\n\
i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\n\
+ i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\n\
+ i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\n\
+ i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\n\
vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\n\
vec4 p0 = _czm_grad4(j0,   ip);\n\
vec4 p1 = _czm_grad4(j1.x, ip);\n\
vec4 p2 = _czm_grad4(j1.y, ip);\n\
vec4 p3 = _czm_grad4(j1.z, ip);\n\
vec4 p4 = _czm_grad4(j1.w, ip);\n\
vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
p0 *= norm.x;\n\
p1 *= norm.y;\n\
p2 *= norm.z;\n\
p3 *= norm.w;\n\
p4 *= _czm_taylorInvSqrt(dot(p4,p4));\n\
vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\n\
m0 = m0 * m0;\n\
m1 = m1 * m1;\n\
return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\n\
+ dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\n\
}\n\
";
});
//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define('Shaders/Builtin/CzmBuiltins',[
        './Functions/cellular',
        './Functions/snoise'
    ], function(
        czm_cellular,
        czm_snoise) {
    "use strict";
    return {
        czm_cellular : czm_cellular,
        czm_snoise : czm_snoise};
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/CementMaterial',[],function() {
    "use strict";
    return "uniform vec4 cementColor;\n\
uniform float grainScale;\n\
uniform float roughness;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
float noise = czm_snoise(materialInput.st / grainScale);\n\
noise = pow(noise, 5.0) * roughness;\n\
vec4 color = cementColor;\n\
color.rgb += noise;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/ErosionMaterial',[],function() {
    "use strict";
    return "uniform vec4 color;\n\
uniform float time;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
float alpha = 1.0;\n\
if (time != 1.0)\n\
{\n\
float t = 0.5 + (0.5 * czm_snoise(materialInput.str / (1.0 / 10.0)));\n\
if (t > time)\n\
{\n\
alpha = 0.0;\n\
}\n\
}\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a * alpha;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/FacetMaterial',[],function() {
    "use strict";
    return "uniform vec4 lightColor;\n\
uniform vec4 darkColor;\n\
uniform float frequency;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 F = czm_cellular(materialInput.st * frequency);\n\
float t = 0.1 + (F.y - F.x);\n\
vec4 color = mix(lightColor, darkColor, t);\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/FresnelMaterial',[],function() {
    "use strict";
    return "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\n\
vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\n\
float cosAngIncidence = max(dot(normalWC, positionWC), 0.0);\n\
material.diffuse = mix(reflection.diffuse, refraction.diffuse, cosAngIncidence);\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/GrassMaterial',[],function() {
    "use strict";
    return "uniform vec4 grassColor;\n\
uniform vec4 dirtColor;\n\
uniform float patchiness;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 st = materialInput.st;\n\
float noise1 = (czm_snoise(st * patchiness * 1.0)) * 1.0;\n\
float noise2 = (czm_snoise(st * patchiness * 2.0)) * 0.5;\n\
float noise3 = (czm_snoise(st * patchiness * 4.0)) * 0.25;\n\
float noise = sin(noise1 + noise2 + noise3) * 0.1;\n\
vec4 color = mix(grassColor, dirtColor, noise);\n\
float verticalNoise = czm_snoise(vec2(st.x * 100.0, st.y * 20.0)) * 0.02;\n\
float horizontalNoise = czm_snoise(vec2(st.x * 20.0, st.y * 100.0)) * 0.02;\n\
float stripeNoise = min(verticalNoise, horizontalNoise);\n\
color.rgb += stripeNoise;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/ReflectionMaterial',[],function() {
    "use strict";
    return "uniform samplerCube cubeMap;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\n\
vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\n\
vec3 reflectedWC = reflect(positionWC, normalWC);\n\
material.diffuse = textureCube(cubeMap, reflectedWC).channels;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/RefractionMaterial',[],function() {
    "use strict";
    return "uniform samplerCube cubeMap;\n\
uniform float indexOfRefractionRatio;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\n\
vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\n\
vec3 refractedWC = refract(positionWC, -normalWC, indexOfRefractionRatio);\n\
material.diffuse = textureCube(cubeMap, refractedWC).channels;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/TieDyeMaterial',[],function() {
    "use strict";
    return "uniform vec4 lightColor;\n\
uniform vec4 darkColor;\n\
uniform float frequency;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec3 scaled = materialInput.str * frequency;\n\
float t = abs(czm_snoise(scaled));\n\
vec4 color = mix(lightColor, darkColor, t);\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define('Shaders/WoodMaterial',[],function() {
    "use strict";
    return "uniform vec4 lightWoodColor;\n\
uniform vec4 darkWoodColor;\n\
uniform float ringFrequency;\n\
uniform vec2 noiseScale;\n\
uniform float grainFrequency;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 st = materialInput.st;\n\
vec2 noisevec;\n\
noisevec.x = czm_snoise(st * noiseScale.x);\n\
noisevec.y = czm_snoise(st * noiseScale.y);\n\
vec2 location = st + noisevec;\n\
float dist = sqrt(location.x * location.x + location.y * location.y);\n\
dist *= ringFrequency;\n\
float r = fract(dist + noisevec[0] + noisevec[1]) * 2.0;\n\
if(r > 1.0)\n\
r = 2.0 - r;\n\
vec4 color = mix(lightWoodColor, darkWoodColor, r);\n\
r = abs(czm_snoise(vec2(st.x * grainFrequency, st.y * grainFrequency * 0.02))) * 0.2;\n\
color.rgb += lightWoodColor.rgb * r;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});
/*global define*/
define('initialize',[
        './Shaders/AsphaltMaterial',
        './Shaders/BlobMaterial',
        './Shaders/BrickMaterial',
        './Shaders/CementMaterial',
        './Shaders/ErosionMaterial',
        './Shaders/FacetMaterial',
        './Shaders/FresnelMaterial',
        './Shaders/GrassMaterial',
        './Shaders/ReflectionMaterial',
        './Shaders/RefractionMaterial',
        './Shaders/TieDyeMaterial',
        './Shaders/WoodMaterial',
        './Shaders/Builtin/CzmBuiltins'
    ], function(
        AsphaltMaterial,
        BlobMaterial,
        BrickMaterial,
        CementMaterial,
        ErosionMaterial,
        FacetMaterial,
        FresnelMaterial,
        GrassMaterial,
        ReflectionMaterial,
        RefractionMaterial,
        TieDyeMaterial,
        WoodMaterial,
        CzmBuiltins) {
    "use strict";
    
    function initialize(Cesium) {
        for ( var builtinName in CzmBuiltins) {
            if (CzmBuiltins.hasOwnProperty(builtinName)) {
                Cesium.ShaderProgram._czmBuiltinsAndUniforms[builtinName] = CzmBuiltins[builtinName];
            }
        }

        Cesium.Material.AsphaltType = 'Asphalt';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.AsphaltType, {
            fabric : {
                type : Cesium.Material.AsphaltType,
                uniforms : {
                    asphaltColor : new Cesium.Color(0.15, 0.15, 0.15, 1.0),
                    bumpSize : 0.02,
                    roughness : 0.2
                },
                source : AsphaltMaterial
            },
            translucent : function(material) {
                return material.uniforms.asphaltColor.alpha < 1.0;
            }
        });

        Cesium.Material.BlobType = 'Blob';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.BlobType, {
            fabric : {
                type : Cesium.Material.BlobType,
                uniforms : {
                    lightColor : new Cesium.Color(1.0, 1.0, 1.0, 0.5),
                    darkColor : new Cesium.Color(0.0, 0.0, 1.0, 0.5),
                    frequency : 10.0
                },
                source : BlobMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });

        Cesium.Material.BrickType = 'Brick';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.BrickType, {
            fabric : {
                type : Cesium.Material.BrickType,
                uniforms : {
                    brickColor : new Cesium.Color(0.6, 0.3, 0.1, 1.0),
                    mortarColor : new Cesium.Color(0.8, 0.8, 0.7, 1.0),
                    brickSize : new Cesium.Cartesian2(0.3, 0.15),
                    brickPct : new Cesium.Cartesian2(0.9, 0.85),
                    brickRoughness : 0.2,
                    mortarRoughness : 0.1
                },
                source : BrickMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.brickColor.alpha < 1.0) || (uniforms.mortarColor.alpha < 1.0);
            }
        });

        Cesium.Material.CementType = 'Cement';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.CementType, {
            fabric : {
                type : Cesium.Material.CementType,
                uniforms : {
                    cementColor : new Cesium.Color(0.95, 0.95, 0.85, 1.0),
                    grainScale : 0.01,
                    roughness : 0.3
                },
                source : CementMaterial
            },
            translucent : function(material) {
                return material.uniforms.cementColor.alpha < 1.0;
            }
        });

        Cesium.Material.ErosionType = 'Erosion';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.ErosionType, {
            fabric : {
                type : Cesium.Material.ErosionType,
                uniforms : {
                    color : new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                    time : 1.0
                },
                source : ErosionMaterial
            },
            translucent : function(material) {
                return material.uniforms.color.alpha < 1.0;
            }
        });

        Cesium.Material.FacetType = 'Facet';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.FacetType, {
            fabric : {
                type : Cesium.Material.FacetType,
                uniforms : {
                    lightColor : new Cesium.Color(0.25, 0.25, 0.25, 0.75),
                    darkColor : new Cesium.Color(0.75, 0.75, 0.75, 0.75),
                    frequency : 10.0
                },
                source : FacetMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });
        
        Cesium.Material.FresnelType = 'Fresnel';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.FresnelType, {
            fabric : {
                type : Cesium.Material.FresnelType,
                materials : {
                    reflection : {
                        type : Cesium.Material.ReflectionType
                    },
                    refraction : {
                        type : Cesium.Material.RefractionType
                    }
                },
                source : FresnelMaterial
            },
            translucent : false
        });

        Cesium.Material.GrassType = 'Grass';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.GrassType, {
            fabric : {
                type : Cesium.Material.GrassType,
                uniforms : {
                    grassColor : new Cesium.Color(0.25, 0.4, 0.1, 1.0),
                    dirtColor : new Cesium.Color(0.1, 0.1, 0.1, 1.0),
                    patchiness : 1.5
                },
                source : GrassMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.grassColor.alpha < 1.0) || (uniforms.dirtColor.alpha < 1.0);
            }
        });
        
        Cesium.Material.ReflectionType = 'Reflection';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.ReflectionType, {
            fabric : {
                type : Cesium.Material.ReflectionType,
                uniforms : {
                    cubeMap : Cesium.Material.DefaultCubeMapId,
                    channels : 'rgb'
                },
                source : ReflectionMaterial
            },
            translucent : false
        });

        Cesium.Material.RefractionType = 'Refraction';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.RefractionType, {
            fabric : {
                type : Cesium.Material.RefractionType,
                uniforms : {
                    cubeMap : Cesium.Material.DefaultCubeMapId,
                    channels : 'rgb',
                    indexOfRefractionRatio : 0.9
                },
                source : RefractionMaterial
            },
            translucent : false
        });

        Cesium.Material.TyeDyeType = 'TieDye';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.TyeDyeType, {
            fabric : {
                type : Cesium.Material.TyeDyeType,
                uniforms : {
                    lightColor : new Cesium.Color(1.0, 1.0, 0.0, 0.75),
                    darkColor : new Cesium.Color(1.0, 0.0, 0.0, 0.75),
                    frequency : 5.0
                },
                source : TieDyeMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });

        Cesium.Material.WoodType = 'Wood';
        Cesium.Material._materialCache.addMaterial(Cesium.Material.WoodType, {
            fabric : {
                type : Cesium.Material.WoodType,
                uniforms : {
                    lightWoodColor : new Cesium.Color( 0.6, 0.3, 0.1, 1.0),
                    darkWoodColor : new Cesium.Color( 0.4, 0.2, 0.07, 1.0),
                    ringFrequency : 3.0,
                    noiseScale : new Cesium.Cartesian2( 0.7, 0.5),
                    grainFrequency : 27.0
                },
                source : WoodMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightWoodColor.alpha < 1.0) || (uniforms.darkWoodColor.alpha < 1.0);
            }
        });
    }

    return initialize;
});
/*global define*/
define('MaterialPack',['./Shaders/AsphaltMaterial', './Shaders/BlobMaterial', './Shaders/BrickMaterial', './Shaders/Builtin/CzmBuiltins', './Shaders/Builtin/Functions/cellular', './Shaders/Builtin/Functions/snoise', './Shaders/CementMaterial', './Shaders/ErosionMaterial', './Shaders/FacetMaterial', './Shaders/FresnelMaterial', './Shaders/GrassMaterial', './Shaders/ReflectionMaterial', './Shaders/RefractionMaterial', './Shaders/TieDyeMaterial', './Shaders/WoodMaterial', './initialize'], function(Shaders_AsphaltMaterial, Shaders_BlobMaterial, Shaders_BrickMaterial, Shaders_Builtin_CzmBuiltins, Shaders_Builtin_Functions_cellular, Shaders_Builtin_Functions_snoise, Shaders_CementMaterial, Shaders_ErosionMaterial, Shaders_FacetMaterial, Shaders_FresnelMaterial, Shaders_GrassMaterial, Shaders_ReflectionMaterial, Shaders_RefractionMaterial, Shaders_TieDyeMaterial, Shaders_WoodMaterial, initialize) {
  "use strict";
  /*jshint sub:true*/
  var MaterialPack = {
    _shaders : {}
  };
  MaterialPack._shaders['AsphaltMaterial'] = Shaders_AsphaltMaterial;
  MaterialPack._shaders['BlobMaterial'] = Shaders_BlobMaterial;
  MaterialPack._shaders['BrickMaterial'] = Shaders_BrickMaterial;
  MaterialPack._shaders['CzmBuiltins'] = Shaders_Builtin_CzmBuiltins;
  MaterialPack._shaders['cellular'] = Shaders_Builtin_Functions_cellular;
  MaterialPack._shaders['snoise'] = Shaders_Builtin_Functions_snoise;
  MaterialPack._shaders['CementMaterial'] = Shaders_CementMaterial;
  MaterialPack._shaders['ErosionMaterial'] = Shaders_ErosionMaterial;
  MaterialPack._shaders['FacetMaterial'] = Shaders_FacetMaterial;
  MaterialPack._shaders['FresnelMaterial'] = Shaders_FresnelMaterial;
  MaterialPack._shaders['GrassMaterial'] = Shaders_GrassMaterial;
  MaterialPack._shaders['ReflectionMaterial'] = Shaders_ReflectionMaterial;
  MaterialPack._shaders['RefractionMaterial'] = Shaders_RefractionMaterial;
  MaterialPack._shaders['TieDyeMaterial'] = Shaders_TieDyeMaterial;
  MaterialPack._shaders['WoodMaterial'] = Shaders_WoodMaterial;
  MaterialPack['initialize'] = initialize;
  return MaterialPack;
});
/*global require*/
// require in the complete Cesium object and reassign it globally.
// This is meant for use with the Almond loader.
require(['MaterialPack'], function(MaterialPack) {
    "use strict";
    /*global self*/
    var scope = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

    scope.MaterialPack = MaterialPack;
}, undefined, true);
}());