/*global require*/
// require in the complete Cesium object and reassign it globally.
// This is meant for use with the Almond loader.
require(['MaterialPack'], function(MaterialPack) {
    "use strict";
    /*global self*/
    var scope = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

    scope.MaterialPack = MaterialPack;
}, undefined, true);
