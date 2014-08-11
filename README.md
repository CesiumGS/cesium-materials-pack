<p align="center">
<a href="http://cesium.agi.com/">
<img src="https://github.com/AnalyticalGraphicsInc/cesium/wiki/logos/Cesium_Logo_Color.jpg" width="50%" />
</a>
</p>

**Cesium Material Pack**: A plugin with procedurally-shaded materials such as bricks, wood, and noise patterns.

Check out the [demo](http://analyticalgraphicsinc.github.io/cesium-materials-pack/Example/).

| Name | Screenshot | Description |
|:-----|:-----------|:------------|
| `Asphalt` | <img src="Documentation/Images/Asphalt.PNG" width="200" height="92" /> | Asphalt generated with a combination of simplex and cellular noise. |
| `Blob` | <img src="Documentation/Images/Blob.PNG" width="200" height="92" /> | Blob generated with cellular noise.  Resembles water, but clumped in a cell pattern. |
| `Brick` | <img src="Documentation/Images/Brick.PNG" width="200" height="92" /> | Brick generated with a combination of a simple brick pattern and simplex noise for roughness. |
| `Cement` | <img src="Documentation/Images/Cement.PNG" width="200" height="92" /> | Cement generated with simplex noise. |
| `Erosion` | <img src="Documentation/Images/Erosion.png" width="200" height="92" /> | Animated erosion. |
| `Facet` | <img src="Documentation/Images/Facet.PNG" width="200" height="92" /> | Facet generated with cellular noise. |
| `Fresnel` | <img src="Materials/Fresnel.PNG" width="200" height="92" /> | A view-dependent combination of reflection and refraction.  Similar to water, when the viewer is looking straight down, the material refracts light; as the viewer looks more edge on, the material refracts less and reflects more. |
| `Grass` | <img src="Documentation/Images/Grass.PNG" width="200" height="92" /> | Grass generated with simplex noise. |
| `Reflection` | <img src="Materials/Reflection.PNG" width="200" height="92" /> | Cube map reflection for mirror-like surfaces that reflect light, e.g., paint on a car. |
| `Refraction` | <img src="Materials/Refraction.PNG" width="200" height="92" /> | Cube map refraction for translucent surfaces that refract light, e.g., glass. |
| `TieDye` | <img src="Documentation/Images/TieDye.PNG" width="200" height="92" /> | Tie-dye generated with simplex noise. |
| `Wood` | <img src="Documentation/Images/Wood.PNG" width="200" height="92" /> | Wood generated with simplex noise. |

**Cesium version**: Tested against [1.0](http://cesiumjs.org/downloads.html). Most likely works with older and newer versions.  Post a message to the [Cesium forum](http://cesiumjs.org/forum.html) if you have compatibility issues.

**License**: Apache 2.0.  Free for commercial and non-commercial use.  See [LICENSE.md](LICENSE.md).

**Usage**

Prebuilt minified and unminified versions of the plugin are in the [Build](Build/) directory.  Include the `MaterialPack.js` file using a `script` tag after the `Cesium.js` `script` tag.

```html
<script type="text/javascript" src="path/to/Cesium.js" />
<script type="text/javascript" src="path/to/MaterialPack.js" />
<script type="text/javascript">
// ...
var primitives = scene.primitives;
primitives.add(new Cesium.RectanglePrimitive({
    rectangle : Cesium.Rectangle.fromDegrees(-80.0, 30.0, -60.0, 40.0),
    material : Cesium.Material.fromType('Brick')
}));
</script>
```

Uniforms are used to change material properties.  For example:

```javascript
rectangle.material = new Cesium.Material({
  fabric : {
    type : 'Wood',
    uniforms : {
      lightWoodColor : new Cesium.Color(0.7, 0.4, 0.1, 1.0),
      darkWoodColor : new Cesium.Color(0.3, 0.1, 0.0, 1.0),
      ringFrequency : 4.0,
      noiseScale : new Cesium.Cartesian2(0.4, 0.8),
      grainFrequency : 18.0
    }
  }
});
```

Material uniforms:
* `Asphalt`
   * `asphaltColor`:  rgba color object for the asphalt's color.
   * `bumpSize`:  Number for the size of the asphalt's bumps.
   * `roughness`:  Number that controls how rough the asphalt looks.
* `Blob`
   * `lightColor`:  rgba color object for the light color.
   * `darkColor`:  rgba color object for the dark color.
   * `frequency`:  Number that controls the frequency of the pattern.
* `Brick`
   * `brickColor`:  rgba color object for the brick color.
   * `mortarColor`:  rgba color object for the mortar color.
   * `brickSize`:  Number between 0.0 and 1.0 where 0.0 is many small bricks and 1.0 is one large brick.
   * `brickPct`:  Number for the ratio of brick to mortar where 0.0 is all mortar and 1.0 is all brick.
   * `brickRoughness`:  Number between 0.0 and 1.0 representing how rough the brick looks.
   * `mortarRoughness`:  Number between 0.0 and 1.0 representing how rough the mortar looks.
* `Cement`
   * `cementColor`:  rgba color object for the cement's color.
   * `grainScale`:  Number for the size of rock grains in the cement.
   * `roughness`:  Number that controls how rough the cement looks.
* `Erosion`
   * `color`:  diffuse color and alpha.
   * `time`:  Time of erosion.  1.0 is no erosion; 0.0 is fully eroded.
* `Facet`
   * `lightColor`:  rgba color object for the light color.
   * `darkColor`:  rgba color object for the dark color.
   * `frequency`:  Number that controls the frequency of the pattern.
* `Fresnel`
   * `reflection`:  Reflection Material.
   * `refraction`:  Refraction Material.
* `Grass`
   * `grassColor`:  rgba color object for the grass' color.
   * `dirtColor`:  rgba color object for the dirt's color.
   * `patchiness`:  Number that controls the size of the color patches in the grass.
* `Reflection`
   * `cubeMap`:  Object with positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ image paths.
   * `channels`:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.
* `Refraction`
   * `cubeMap`:  Object with positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ image paths.
   * `channels`:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.
   * `indexOfRefractionRatio`:  Number representing the refraction strength where 1.0 is the lowest and 0.0 is the highest.
* `TieDye`
   * `lightColor`:  rgba color object for the light color.
   * `darkColor`:  rgba color object for the dark color.
   * `frequency`:  Number that controls the frequency of the pattern.
* `Wood`
   * `lightWoodColor`:  rgba color object for the wood's base color.
   * `darkWoodColor`:  rgba color object for the color of rings in the wood.
   * `ringFrequency`:  Number for the frequency of rings in the wood.
   * `noiseScale`:  Object with x and y values specifying the noisiness of the ring patterns in both directions.
   * `grainFrequency`:  Number for the frequency of grains in the wood.

For more on how to use Cesium materials, see [code for the example](Example/index.html) and the [Fabric tutorial](https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric).  To run the example locally, run `npm install`, then run `node server.js` and navigate to [http://localhost:8080](http://localhost:8080) and select the example application to run.

**Build**

To build, run `npm install`, then run `node build.js`.

**Contributions**

Contributions welcome.  We use the [same CLA as Cesium](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md).  Please email yours before opening a pull request.
