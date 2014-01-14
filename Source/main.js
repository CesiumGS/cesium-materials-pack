/*global require*/
// require in the complete Cesium object and reassign it globally.
// This is meant for use with the Almond loader.
require(['CesiumMaterials'], function(CesiumMaterials) {
    "use strict";
    /*global self*/
    var scope = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

    scope.CesiumMaterials = CesiumMaterials;
}, undefined, true);
