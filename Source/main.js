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