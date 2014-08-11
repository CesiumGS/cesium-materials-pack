(function() {
"use strict";
/*jshint sub:true*/
/*global define,require,self,Cesium*/
/**
 * @license
 * Cellular noise ("Worley noise") in 2D in GLSL.
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
 * This code is released under the conditions of the MIT license.
 * See LICENSE file for details.
 */
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
define('Cesium/Core/Cartesian2', function() { return Cesium["Cartesian2"]; });
define('Cesium/Core/Color', function() { return Cesium["Color"]; });
define('Cesium/Renderer/ShaderProgram', function() { return Cesium["ShaderProgram"]; });
define('Cesium/Scene/Material', function() { return Cesium["Material"]; });
require(["MaterialPack"], function(MaterialPack) {
    var scope = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
    scope.MaterialPack = MaterialPack;
}, undefined, true);
})();