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
(function() {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
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
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

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
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
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
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

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
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
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

            ret = callback ? callback.apply(defined[name], args) : undefined;

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
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

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
        return req(cfg);
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

define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('text!AsphaltMaterial.glsl',[],function () { return 'uniform vec4 asphaltColor;\r\nuniform float bumpSize;\r\nuniform float roughness;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n\r\n    // From Stefan Gustavson\'s Procedural Textures in GLSL in OpenGL Insights\r\n    //Main cellular pattern\r\n    vec4 color = asphaltColor;\r\n    vec2 st = materialInput.st;\r\n    vec2 F = czm_cellular(st / bumpSize);\r\n    color.rgb -= (F.x / F.y) * 0.1;\r\n    \r\n    //Extra bumps for roughness\r\n    float noise = czm_snoise(st / bumpSize);\r\n    noise = pow(noise, 5.0) * roughness;\r\n    color.rgb += noise;\r\n\r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}\r\n';});


define('text!BlobMaterial.glsl',[],function () { return 'uniform vec4 lightColor;\r\nuniform vec4 darkColor;\r\nuniform float frequency;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n\r\n    // From Stefan Gustavson\'s Procedural Textures in GLSL in OpenGL Insights\r\n    vec2 F = czm_cellular(materialInput.st * frequency);\r\n    float t = 1.0 - F.x * F.x;\r\n    \r\n    vec4 color = mix(lightColor, darkColor, t);\r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}';});


define('text!BrickMaterial.glsl',[],function () { return 'uniform vec4 brickColor;\r\nuniform vec4 mortarColor;\r\nuniform vec2 brickSize;\r\nuniform vec2 brickPct;\r\nuniform float brickRoughness;\r\nuniform float mortarRoughness;\r\n\r\n#define Integral(x, p) ((floor(x) * p) + max(fract(x) - (1.0 - p), 0.0))\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n\r\n    // From OpenGL Shading Language (3rd edition) pg. 194, 501\r\n    vec2 st = materialInput.st;\r\n    vec2 position = st / brickSize;\r\n    if(fract(position.y * 0.5) > 0.5) {\r\n        position.x += 0.5;    \r\n    }\r\n        \r\n    //calculate whether to use brick or mortar (does AA)\r\n    vec2 filterWidth = vec2(0.02);\r\n    vec2 useBrick = (Integral(position + filterWidth, brickPct) - \r\n                       Integral(position, brickPct)) / filterWidth;\r\n    float useBrickFinal = useBrick.x * useBrick.y;\r\n    vec4 color = mix(mortarColor, brickColor, useBrickFinal);\r\n    \r\n    //Apply noise to brick\r\n    vec2 brickScaled = vec2(st.x / 0.1, st.y / 0.006);\r\n    float brickNoise = abs(czm_snoise(brickScaled) * brickRoughness / 5.0);\r\n    color.rg += brickNoise * useBrickFinal;\r\n    \r\n    //Apply noise to mortar\r\n    vec2 mortarScaled = st / 0.005;\r\n    float mortarNoise = max(czm_snoise(mortarScaled) * mortarRoughness, 0.0);\r\n    color.rgb += mortarNoise * (1.0 - useBrickFinal); \r\n\r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}';});


define('text!CementMaterial.glsl',[],function () { return 'uniform vec4 cementColor;\r\nuniform float grainScale;\r\nuniform float roughness;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n\r\n    float noise = czm_snoise(materialInput.st / grainScale);\r\n    noise = pow(noise, 5.0) * roughness;\r\n   \r\n    vec4 color = cementColor;\r\n    color.rgb += noise;\r\n    \r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}';});


define('text!ErosionMaterial.glsl',[],function () { return 'uniform vec4 color;\r\nuniform float time;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n\r\n    float alpha = 1.0;\r\n    if (time != 1.0)\r\n    {\r\n        float t = 0.5 + (0.5 * czm_snoise(materialInput.str / (1.0 / 10.0)));   // Scale [-1, 1] to [0, 1]\r\n    \r\n        if (t > time)\r\n        {\r\n            alpha = 0.0;\r\n        }\r\n    }\r\n    \r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a * alpha;\r\n\r\n    return material;\r\n}\r\n';});


define('text!FacetMaterial.glsl',[],function () { return 'uniform vec4 lightColor;\r\nuniform vec4 darkColor;\r\nuniform float frequency;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    // From Stefan Gustavson\'s Procedural Textures in GLSL in OpenGL Insights\r\n    vec2 F = czm_cellular(materialInput.st * frequency);\r\n    float t = 0.1 + (F.y - F.x);\r\n        \r\n    vec4 color = mix(lightColor, darkColor, t);\r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}\r\n';});


define('text!FresnelMaterial.glsl',[],function () { return 'czm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\r\n    vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\r\n    float cosAngIncidence = max(dot(normalWC, positionWC), 0.0);\r\n    \r\n    material.diffuse = mix(reflection.diffuse, refraction.diffuse, cosAngIncidence);\r\n    \r\n    return material;\r\n}\r\n';});


define('text!GrassMaterial.glsl',[],function () { return 'uniform vec4 grassColor;\r\nuniform vec4 dirtColor;\r\nuniform float patchiness;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    vec2 st = materialInput.st;\r\n    float noise1 = (czm_snoise(st * patchiness * 1.0)) * 1.0;\r\n    float noise2 = (czm_snoise(st * patchiness * 2.0)) * 0.5;\r\n    float noise3 = (czm_snoise(st * patchiness * 4.0)) * 0.25;\r\n    float noise = sin(noise1 + noise2 + noise3) * 0.1;\r\n    \r\n    vec4 color = mix(grassColor, dirtColor, noise);\r\n    \r\n    //Make thatch patterns\r\n    float verticalNoise = czm_snoise(vec2(st.x * 100.0, st.y * 20.0)) * 0.02;\r\n    float horizontalNoise = czm_snoise(vec2(st.x * 20.0, st.y * 100.0)) * 0.02;\r\n    float stripeNoise = min(verticalNoise, horizontalNoise);\r\n \r\n    color.rgb += stripeNoise;\r\n    \r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}';});


define('text!ReflectionMaterial.glsl',[],function () { return 'uniform samplerCube cubeMap;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\r\n    vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\r\n    vec3 reflectedWC = reflect(positionWC, normalWC);\r\n    material.diffuse = textureCube(cubeMap, reflectedWC).channels;\r\n\r\n    return material;\r\n}';});


define('text!RefractionMaterial.glsl',[],function () { return 'uniform samplerCube cubeMap;\r\nuniform float indexOfRefractionRatio;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\r\n    vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\r\n    vec3 refractedWC = refract(positionWC, -normalWC, indexOfRefractionRatio);\r\n    material.diffuse = textureCube(cubeMap, refractedWC).channels;\r\n\r\n    return material;\r\n}';});


define('text!TieDyeMaterial.glsl',[],function () { return 'uniform vec4 lightColor;\r\nuniform vec4 darkColor;\r\nuniform float frequency;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    vec3 scaled = materialInput.str * frequency;\r\n    float t = abs(czm_snoise(scaled));\r\n    \r\n    vec4 color = mix(lightColor, darkColor, t);\r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}\r\n';});


define('text!WoodMaterial.glsl',[],function () { return 'uniform vec4 lightWoodColor;\r\nuniform vec4 darkWoodColor;\r\nuniform float ringFrequency;\r\nuniform vec2 noiseScale;\r\nuniform float grainFrequency;\r\n\r\nczm_material czm_getMaterial(czm_materialInput materialInput)\r\n{\r\n    czm_material material = czm_getDefaultMaterial(materialInput);\r\n    \r\n    //Based on wood shader from OpenGL Shading Language (3rd edition) pg. 455\r\n    vec2 st = materialInput.st;\r\n    \r\n    vec2 noisevec;\r\n    noisevec.x = czm_snoise(st * noiseScale.x);\r\n    noisevec.y = czm_snoise(st * noiseScale.y);\r\n    \r\n    vec2 location = st + noisevec;\r\n    float dist = sqrt(location.x * location.x + location.y * location.y);\r\n    dist *= ringFrequency;\r\n    \r\n    float r = fract(dist + noisevec[0] + noisevec[1]) * 2.0;\r\n    if(r > 1.0)\r\n        r = 2.0 - r;\r\n        \r\n    vec4 color = mix(lightWoodColor, darkWoodColor, r);\r\n    \r\n    //streaks\r\n    r = abs(czm_snoise(vec2(st.x * grainFrequency, st.y * grainFrequency * 0.02))) * 0.2;\r\n    color.rgb += lightWoodColor.rgb * r;\r\n    \r\n    material.diffuse = color.rgb;\r\n    material.alpha = color.a;\r\n    \r\n    return material;\r\n}';});


define('text!cellular.glsl',[],function () { return '/**\r\n * @license\r\n * Cellular noise ("Worley noise") in 2D in GLSL.\r\n * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.\r\n * This code is released under the conditions of the MIT license.\r\n * See LICENSE file for details.\r\n */\r\n \r\n//#ifdef GL_OES_standard_derivatives\r\n//    #extension GL_OES_standard_derivatives : enable\r\n//#endif  \r\n//\r\n//float aastep (float threshold , float value)\r\n//{\r\n//    float afwidth = 0.7 * length ( vec2 ( dFdx ( value ), dFdy ( value )));\r\n//    return smoothstep ( threshold - afwidth , threshold + afwidth , value );\r\n//}\r\n\r\n// Permutation polynomial: (34x^2 + x) mod 289\r\nvec3 _czm_permute289(vec3 x)\r\n{\r\n    return mod((34.0 * x + 1.0) * x, 289.0);\r\n}\r\n\r\n/**\r\n * DOC_TBA\r\n *\r\n * Implemented by Stefan Gustavson, and distributed under the MIT License.  {@link http://openglinsights.git.sourceforge.net/git/gitweb.cgi?p=openglinsights/openglinsights;a=tree;f=proceduraltextures}\r\n *\r\n * @name czm_cellular\r\n * @glslFunction\r\n *\r\n * @see Stefan Gustavson\'s chapter, <i>Procedural Textures in GLSL</i>, in <a href="http://www.openglinsights.com/">OpenGL Insights</a>.\r\n */  \r\nvec2 czm_cellular(vec2 P)\r\n// Cellular noise, returning F1 and F2 in a vec2.\r\n// Standard 3x3 search window for good F1 and F2 values\r\n{\r\n#define K 0.142857142857 // 1/7\r\n#define Ko 0.428571428571 // 3/7\r\n#define jitter 1.0 // Less gives more regular pattern\r\n    vec2 Pi = mod(floor(P), 289.0);\r\n    vec2 Pf = fract(P);\r\n    vec3 oi = vec3(-1.0, 0.0, 1.0);\r\n    vec3 of = vec3(-0.5, 0.5, 1.5);\r\n    vec3 px = _czm_permute289(Pi.x + oi);\r\n    vec3 p = _czm_permute289(px.x + Pi.y + oi); // p11, p12, p13\r\n    vec3 ox = fract(p*K) - Ko;\r\n    vec3 oy = mod(floor(p*K),7.0)*K - Ko;\r\n    vec3 dx = Pf.x + 0.5 + jitter*ox;\r\n    vec3 dy = Pf.y - of + jitter*oy;\r\n    vec3 d1 = dx * dx + dy * dy; // d11, d12 and d13, squared\r\n    p = _czm_permute289(px.y + Pi.y + oi); // p21, p22, p23\r\n    ox = fract(p*K) - Ko;\r\n    oy = mod(floor(p*K),7.0)*K - Ko;\r\n    dx = Pf.x - 0.5 + jitter*ox;\r\n    dy = Pf.y - of + jitter*oy;\r\n    vec3 d2 = dx * dx + dy * dy; // d21, d22 and d23, squared\r\n    p = _czm_permute289(px.z + Pi.y + oi); // p31, p32, p33\r\n    ox = fract(p*K) - Ko;\r\n    oy = mod(floor(p*K),7.0)*K - Ko;\r\n    dx = Pf.x - 1.5 + jitter*ox;\r\n    dy = Pf.y - of + jitter*oy;\r\n    vec3 d3 = dx * dx + dy * dy; // d31, d32 and d33, squared\r\n    // Sort out the two smallest distances (F1, F2)\r\n    vec3 d1a = min(d1, d2);\r\n    d2 = max(d1, d2); // Swap to keep candidates for F2\r\n    d2 = min(d2, d3); // neither F1 nor F2 are now in d3\r\n    d1 = min(d1a, d2); // F1 is now in d1\r\n    d2 = max(d1a, d2); // Swap to keep candidates for F2\r\n    d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller\r\n    d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x\r\n    d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz\r\n    d1.y = min(d1.y, d1.z); // nor in  d1.z\r\n    d1.y = min(d1.y, d2.x); // F2 is in d1.y, we\'re done.\r\n    return sqrt(d1.xy);\r\n}\r\n';});


define('text!snoise.glsl',[],function () { return '/**\r\n * @license\r\n * Description : Array and textureless GLSL 2D/3D/4D simplex \r\n *               noise functions.\r\n *      Author : Ian McEwan, Ashima Arts.\r\n *  Maintainer : ijm\r\n *     Lastmod : 20110822 (ijm)\r\n *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\r\n *               Distributed under the MIT License. See LICENSE file.\r\n *               https://github.com/ashima/webgl-noise\r\n */ \r\n\r\nvec4 _czm_mod289(vec4 x)\r\n{\r\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\r\n}\r\n\r\nvec3 _czm_mod289(vec3 x)\r\n{\r\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\r\n}\r\n\r\nvec2 _czm_mod289(vec2 x) \r\n{\r\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\r\n}\r\n\r\nfloat _czm_mod289(float x)\r\n{\r\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\r\n}\r\n  \r\nvec4 _czm_permute(vec4 x)\r\n{\r\n    return _czm_mod289(((x*34.0)+1.0)*x);\r\n}\r\n\r\nvec3 _czm_permute(vec3 x)\r\n{\r\n    return _czm_mod289(((x*34.0)+1.0)*x);\r\n}\r\n\r\nfloat _czm_permute(float x) \r\n{\r\n    return _czm_mod289(((x*34.0)+1.0)*x);\r\n}\r\n\r\nvec4 _czm_taylorInvSqrt(vec4 r)\r\n{\r\n    return 1.79284291400159 - 0.85373472095314 * r;\r\n}\r\n\r\nfloat _czm_taylorInvSqrt(float r)\r\n{\r\n    return 1.79284291400159 - 0.85373472095314 * r;\r\n}\r\n\r\nvec4 _czm_grad4(float j, vec4 ip)\r\n{\r\n    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\r\n    vec4 p,s;\r\n\r\n    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\r\n    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\r\n    s = vec4(lessThan(p, vec4(0.0)));\r\n    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; \r\n\r\n    return p;\r\n}\r\n  \r\n/**\r\n * DOC_TBA\r\n *\r\n * Implemented by Ian McEwan, Ashima Arts, and distributed under the MIT License.  {@link https://github.com/ashima/webgl-noise}\r\n *\r\n * @name czm_snoise\r\n * @glslFunction\r\n *\r\n * @see <a href="https://github.com/ashima/webgl-noise">https://github.com/ashima/webgl-noise</a>\r\n * @see Stefan Gustavson\'s paper <a href="http://www.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf">Simplex noise demystified</a>\r\n */  \r\nfloat czm_snoise(vec2 v)\r\n{\r\n    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\r\n                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\r\n                       -0.577350269189626,  // -1.0 + 2.0 * C.x\r\n                        0.024390243902439); // 1.0 / 41.0\r\n    // First corner\r\n    vec2 i  = floor(v + dot(v, C.yy) );\r\n    vec2 x0 = v -   i + dot(i, C.xx);\r\n\r\n    // Other corners\r\n    vec2 i1;\r\n    //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\r\n    //i1.y = 1.0 - i1.x;\r\n    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\r\n    // x0 = x0 - 0.0 + 0.0 * C.xx ;\r\n    // x1 = x0 - i1 + 1.0 * C.xx ;\r\n    // x2 = x0 - 1.0 + 2.0 * C.xx ;\r\n    vec4 x12 = x0.xyxy + C.xxzz;\r\n    x12.xy -= i1;\r\n\r\n    // Permutations\r\n    i = _czm_mod289(i); // Avoid truncation effects in permutation\r\n    vec3 p = _czm_permute( _czm_permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));\r\n\r\n    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\r\n    m = m*m ;\r\n    m = m*m ;\r\n\r\n    // Gradients: 41 points uniformly over a line, mapped onto a diamond.\r\n    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\r\n    vec3 x = 2.0 * fract(p * C.www) - 1.0;\r\n    vec3 h = abs(x) - 0.5;\r\n    vec3 ox = floor(x + 0.5);\r\n    vec3 a0 = x - ox;\r\n\r\n    // Normalise gradients implicitly by scaling m\r\n    // Approximation of: m *= inversesqrt( a0*a0 + h*h );\r\n    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\r\n\r\n    // Compute final noise value at P\r\n    vec3 g;\r\n    g.x  = a0.x  * x0.x  + h.x  * x0.y;\r\n    g.yz = a0.yz * x12.xz + h.yz * x12.yw;\r\n    return 130.0 * dot(m, g);\r\n}\r\n\r\nfloat czm_snoise(vec3 v)\r\n{ \r\n    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\r\n    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\r\n\r\n    // First corner\r\n    vec3 i  = floor(v + dot(v, C.yyy) );\r\n    vec3 x0 =   v - i + dot(i, C.xxx) ;\r\n\r\n    // Other corners\r\n    vec3 g = step(x0.yzx, x0.xyz);\r\n    vec3 l = 1.0 - g;\r\n    vec3 i1 = min( g.xyz, l.zxy );\r\n    vec3 i2 = max( g.xyz, l.zxy );\r\n\r\n    //   x0 = x0 - 0.0 + 0.0 * C.xxx;\r\n    //   x1 = x0 - i1  + 1.0 * C.xxx;\r\n    //   x2 = x0 - i2  + 2.0 * C.xxx;\r\n    //   x3 = x0 - 1.0 + 3.0 * C.xxx;\r\n    vec3 x1 = x0 - i1 + C.xxx;\r\n    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\r\n    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\r\n\r\n    // Permutations\r\n    i = _czm_mod289(i); \r\n    vec4 p = _czm_permute( _czm_permute( _czm_permute( \r\n                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\r\n              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \r\n              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\r\n\r\n    // Gradients: 7x7 points over a square, mapped onto an octahedron.\r\n    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\r\n    float n_ = 0.142857142857; // 1.0/7.0\r\n    vec3  ns = n_ * D.wyz - D.xzx;\r\n\r\n    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\r\n\r\n    vec4 x_ = floor(j * ns.z);\r\n    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\r\n\r\n    vec4 x = x_ *ns.x + ns.yyyy;\r\n    vec4 y = y_ *ns.x + ns.yyyy;\r\n    vec4 h = 1.0 - abs(x) - abs(y);\r\n\r\n    vec4 b0 = vec4( x.xy, y.xy );\r\n    vec4 b1 = vec4( x.zw, y.zw );\r\n\r\n    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\r\n    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\r\n    vec4 s0 = floor(b0)*2.0 + 1.0;\r\n    vec4 s1 = floor(b1)*2.0 + 1.0;\r\n    vec4 sh = -step(h, vec4(0.0));\r\n\r\n    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\r\n    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\r\n\r\n    vec3 p0 = vec3(a0.xy,h.x);\r\n    vec3 p1 = vec3(a0.zw,h.y);\r\n    vec3 p2 = vec3(a1.xy,h.z);\r\n    vec3 p3 = vec3(a1.zw,h.w);\r\n\r\n    //Normalise gradients\r\n    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\r\n    p0 *= norm.x;\r\n    p1 *= norm.y;\r\n    p2 *= norm.z;\r\n    p3 *= norm.w;\r\n\r\n    // Mix final noise value\r\n    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\r\n    m = m * m;\r\n    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \r\n                                dot(p2,x2), dot(p3,x3) ) );\r\n}\r\n\r\nfloat czm_snoise(vec4 v)\r\n{\r\n    const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4\r\n                          0.276393202250021,  // 2 * G4\r\n                          0.414589803375032,  // 3 * G4\r\n                         -0.447213595499958); // -1 + 4 * G4\r\n\r\n    // (sqrt(5) - 1)/4 = F4, used once below\r\n    #define F4 0.309016994374947451\r\n\r\n    // First corner\r\n    vec4 i  = floor(v + dot(v, vec4(F4)) );\r\n    vec4 x0 = v -   i + dot(i, C.xxxx);\r\n\r\n    // Other corners\r\n\r\n    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)\r\n    vec4 i0;\r\n    vec3 isX = step( x0.yzw, x0.xxx );\r\n    vec3 isYZ = step( x0.zww, x0.yyz );\r\n    //  i0.x = dot( isX, vec3( 1.0 ) );\r\n    i0.x = isX.x + isX.y + isX.z;\r\n    i0.yzw = 1.0 - isX;\r\n    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );\r\n    i0.y += isYZ.x + isYZ.y;\r\n    i0.zw += 1.0 - isYZ.xy;\r\n    i0.z += isYZ.z;\r\n    i0.w += 1.0 - isYZ.z;\r\n\r\n    // i0 now contains the unique values 0,1,2,3 in each channel\r\n    vec4 i3 = clamp( i0, 0.0, 1.0 );\r\n    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\r\n    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\r\n\r\n    //  x0 = x0 - 0.0 + 0.0 * C.xxxx\r\n    //  x1 = x0 - i1  + 1.0 * C.xxxx\r\n    //  x2 = x0 - i2  + 2.0 * C.xxxx\r\n    //  x3 = x0 - i3  + 3.0 * C.xxxx\r\n    //  x4 = x0 - 1.0 + 4.0 * C.xxxx\r\n    vec4 x1 = x0 - i1 + C.xxxx;\r\n    vec4 x2 = x0 - i2 + C.yyyy;\r\n    vec4 x3 = x0 - i3 + C.zzzz;\r\n    vec4 x4 = x0 + C.wwww;\r\n\r\n    // Permutations\r\n    i = _czm_mod289(i); \r\n    float j0 = _czm_permute( _czm_permute( _czm_permute( _czm_permute(i.w) + i.z) + i.y) + i.x);\r\n    vec4 j1 = _czm_permute( _czm_permute( _czm_permute( _czm_permute (\r\n               i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\r\n             + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\r\n             + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\r\n             + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\r\n\r\n    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope\r\n    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.\r\n    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\r\n\r\n    vec4 p0 = _czm_grad4(j0,   ip);\r\n    vec4 p1 = _czm_grad4(j1.x, ip);\r\n    vec4 p2 = _czm_grad4(j1.y, ip);\r\n    vec4 p3 = _czm_grad4(j1.z, ip);\r\n    vec4 p4 = _czm_grad4(j1.w, ip);\r\n\r\n    // Normalise gradients\r\n    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\r\n    p0 *= norm.x;\r\n    p1 *= norm.y;\r\n    p2 *= norm.z;\r\n    p3 *= norm.w;\r\n    p4 *= _czm_taylorInvSqrt(dot(p4,p4));\r\n\r\n    // Mix contributions from the five corners\r\n    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\r\n    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\r\n    m0 = m0 * m0;\r\n    m1 = m1 * m1;\r\n    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\r\n                  + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\r\n}\r\n';});

/*global define*/
define('initialize',[
        'Cesium/Core/Cartesian2',
        'Cesium/Core/Color',
        'Cesium/Renderer/ShaderProgram',
        'Cesium/Scene/Material',
        'text!./AsphaltMaterial.glsl',
        'text!./BlobMaterial.glsl',
        'text!./BrickMaterial.glsl',
        'text!./CementMaterial.glsl',
        'text!./ErosionMaterial.glsl',
        'text!./FacetMaterial.glsl',
        'text!./FresnelMaterial.glsl',
        'text!./GrassMaterial.glsl',
        'text!./ReflectionMaterial.glsl',
        'text!./RefractionMaterial.glsl',
        'text!./TieDyeMaterial.glsl',
        'text!./WoodMaterial.glsl',
        'text!./cellular.glsl',
        'text!./snoise.glsl'
    ], function(
        Cartesian2,
        Color,
        ShaderProgram,
        Material,
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
        czm_cellular,
        czm_snoise) {
    "use strict";

    AsphaltMaterial = AsphaltMaterial.replace(/\r\n/g, '\n');
    BlobMaterial = BlobMaterial.replace(/\r\n/g, '\n');
    BrickMaterial = BrickMaterial.replace(/\r\n/g, '\n');
    CementMaterial = CementMaterial.replace(/\r\n/g, '\n');
    ErosionMaterial = ErosionMaterial.replace(/\r\n/g, '\n');
    FacetMaterial = FacetMaterial.replace(/\r\n/g, '\n');
    FresnelMaterial = FresnelMaterial.replace(/\r\n/g, '\n');
    GrassMaterial = GrassMaterial.replace(/\r\n/g, '\n');
    ReflectionMaterial = ReflectionMaterial.replace(/\r\n/g, '\n');
    RefractionMaterial = RefractionMaterial.replace(/\r\n/g, '\n');
    TieDyeMaterial = TieDyeMaterial.replace(/\r\n/g, '\n');
    WoodMaterial = WoodMaterial.replace(/\r\n/g, '\n');
    czm_cellular = czm_cellular.replace(/\r\n/g, '\n');
    czm_snoise = czm_snoise.replace(/\r\n/g, '\n');

    function initialize() {
        ShaderProgram._czmBuiltinsAndUniforms.czm_cellular = czm_cellular;
        ShaderProgram._czmBuiltinsAndUniforms.czm_snoise = czm_snoise;

        Material.AsphaltType = 'Asphalt';
        Material._materialCache.addMaterial(Material.AsphaltType, {
            fabric : {
                type : Material.AsphaltType,
                uniforms : {
                    asphaltColor : new Color(0.15, 0.15, 0.15, 1.0),
                    bumpSize : 0.02,
                    roughness : 0.2
                },
                source : AsphaltMaterial
            },
            translucent : function(material) {
                return material.uniforms.asphaltColor.alpha < 1.0;
            }
        });

        Material.BlobType = 'Blob';
        Material._materialCache.addMaterial(Material.BlobType, {
            fabric : {
                type : Material.BlobType,
                uniforms : {
                    lightColor : new Color(1.0, 1.0, 1.0, 0.5),
                    darkColor : new Color(0.0, 0.0, 1.0, 0.5),
                    frequency : 10.0
                },
                source : BlobMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });

        Material.BrickType = 'Brick';
        Material._materialCache.addMaterial(Material.BrickType, {
            fabric : {
                type : Material.BrickType,
                uniforms : {
                    brickColor : new Color(0.6, 0.3, 0.1, 1.0),
                    mortarColor : new Color(0.8, 0.8, 0.7, 1.0),
                    brickSize : new Cartesian2(0.3, 0.15),
                    brickPct : new Cartesian2(0.9, 0.85),
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

        Material.CementType = 'Cement';
        Material._materialCache.addMaterial(Material.CementType, {
            fabric : {
                type : Material.CementType,
                uniforms : {
                    cementColor : new Color(0.95, 0.95, 0.85, 1.0),
                    grainScale : 0.01,
                    roughness : 0.3
                },
                source : CementMaterial
            },
            translucent : function(material) {
                return material.uniforms.cementColor.alpha < 1.0;
            }
        });

        Material.ErosionType = 'Erosion';
        Material._materialCache.addMaterial(Material.ErosionType, {
            fabric : {
                type : Material.ErosionType,
                uniforms : {
                    color : new Color(1.0, 0.0, 0.0, 0.5),
                    time : 1.0
                },
                source : ErosionMaterial
            },
            translucent : function(material) {
                return material.uniforms.color.alpha < 1.0;
            }
        });

        Material.FacetType = 'Facet';
        Material._materialCache.addMaterial(Material.FacetType, {
            fabric : {
                type : Material.FacetType,
                uniforms : {
                    lightColor : new Color(0.25, 0.25, 0.25, 0.75),
                    darkColor : new Color(0.75, 0.75, 0.75, 0.75),
                    frequency : 10.0
                },
                source : FacetMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });

        Material.FresnelType = 'Fresnel';
        Material._materialCache.addMaterial(Material.FresnelType, {
            fabric : {
                type : Material.FresnelType,
                materials : {
                    reflection : {
                        type : Material.ReflectionType
                    },
                    refraction : {
                        type : Material.RefractionType
                    }
                },
                source : FresnelMaterial
            },
            translucent : false
        });

        Material.GrassType = 'Grass';
        Material._materialCache.addMaterial(Material.GrassType, {
            fabric : {
                type : Material.GrassType,
                uniforms : {
                    grassColor : new Color(0.25, 0.4, 0.1, 1.0),
                    dirtColor : new Color(0.1, 0.1, 0.1, 1.0),
                    patchiness : 1.5
                },
                source : GrassMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.grassColor.alpha < 1.0) || (uniforms.dirtColor.alpha < 1.0);
            }
        });

        Material.ReflectionType = 'Reflection';
        Material._materialCache.addMaterial(Material.ReflectionType, {
            fabric : {
                type : Material.ReflectionType,
                uniforms : {
                    cubeMap : Material.DefaultCubeMapId,
                    channels : 'rgb'
                },
                source : ReflectionMaterial
            },
            translucent : false
        });

        Material.RefractionType = 'Refraction';
        Material._materialCache.addMaterial(Material.RefractionType, {
            fabric : {
                type : Material.RefractionType,
                uniforms : {
                    cubeMap : Material.DefaultCubeMapId,
                    channels : 'rgb',
                    indexOfRefractionRatio : 0.9
                },
                source : RefractionMaterial
            },
            translucent : false
        });

        Material.TyeDyeType = 'TieDye';
        Material._materialCache.addMaterial(Material.TyeDyeType, {
            fabric : {
                type : Material.TyeDyeType,
                uniforms : {
                    lightColor : new Color(1.0, 1.0, 0.0, 0.75),
                    darkColor : new Color(1.0, 0.0, 0.0, 0.75),
                    frequency : 5.0
                },
                source : TieDyeMaterial
            },
            translucent : function(material) {
                var uniforms = material.uniforms;
                return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
            }
        });

        Material.WoodType = 'Wood';
        Material._materialCache.addMaterial(Material.WoodType, {
            fabric : {
                type : Material.WoodType,
                uniforms : {
                    lightWoodColor : new Color(0.6, 0.3, 0.1, 1.0),
                    darkWoodColor : new Color(0.4, 0.2, 0.07, 1.0),
                    ringFrequency : 3.0,
                    noiseScale : new Cartesian2(0.7, 0.5),
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
define('MaterialPack',[
        './initialize'
    ], function(
        initialize) {
    "use strict";

    initialize();
});

(function() {
"use strict";
/*jshint sub:true*/
/*global define,require,self,Cesium*/

define('Cesium/Core/Cartesian2', function() { return Cesium["Cartesian2"]; });
define('Cesium/Core/Color', function() { return Cesium["Color"]; });
define('Cesium/Renderer/ShaderProgram', function() { return Cesium["ShaderProgram"]; });
define('Cesium/Scene/Material', function() { return Cesium["Material"]; });
require(["MaterialPack"], function(MaterialPack) {
    var scope = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
    scope.MaterialPack = MaterialPack;
}, undefined, true);
})();
})();