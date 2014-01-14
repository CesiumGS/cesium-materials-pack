<p align="center">
<a href="http://cesium.agi.com/">
<img src="https://github.com/AnalyticalGraphicsInc/cesium/wiki/logos/Cesium_Logo_Color.jpg" width="50%" />
</a>
</p>

**Cesium Material Pack**: A plugin with procedurally-shaded materials such as bricks, wood, and noise patterns.

| Name | Screenshot | Description |
|:-----|:-----------|:------------|
| `Asphalt` | <img src="Documentation/Images/Asphalt.PNG" width="200" height="92" /> | Asphalt generated with a combination of simplex and cellular noise. |
| `Blob` | <img src="Documentation/Images/Blob.PNG" width="200" height="92" /> | Blob generated with cellular noise.  Resembles water, but clumped in a cell pattern. |
| `Brick` | <img src="Documentation/Images/Brick.PNG" width="200" height="92" /> | Brick generated with a combination of a simple brick pattern and simplex noise for roughness. |
| `Cement` | <img src="Documentation/Images/Cement.PNG" width="200" height="92" /> | Cement generated with simplex noise. |
| `Erosion` | <img src="Documentation/Images/Erosion.png" width="200" height="92" /> | Animated erosion. |
| `Facet` | <img src="Documentation/Images/Facet.PNG" width="200" height="92" /> | Facet generated with cellular noise. |
| `Grass` | <img src="Documentation/Images/Grass.PNG" width="200" height="92" /> | Grass generated with simplex noise. |
| `TieDye` | <img src="Documentation/Images/TieDye.PNG" width="200" height="92" /> | Tie-dye generated with simplex noise. |
| `Wood` | <img src="Documentation/Images/Wood.PNG" width="200" height="92" /> | Wood generated with simplex noise. |

**Cesium version**: Tested against [b24](http://cesiumjs.org/downloads.html).  Most likely works with older and newer versions.  Post a message to the [Cesium forum](http://cesiumjs.org/forum.html) if you have compatibility issues.

**License**: Apache 2.0.  Free for commercial and non-commercial use.  See [LICENSE.md](LICENSE.md).

TODO: install
TODO: usage

For how to use Cesium materials, see the [Fabric tutorial](https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric).

Material uniforms:
<ul>
    <li>Asphalt</li>
    <ul>
        <li><code>asphaltColor</code>:  rgba color object for the asphalt's color.</li>
        <li><code>bumpSize</code>:  Number for the size of the asphalt's bumps.</li>
        <li><code>roughness</code>:  Number that controls how rough the asphalt looks.</li>
    </ul>
    <li>Blob</li>
    <ul>
        <li><code>lightColor</code>:  rgba color object for the light color.</li>
        <li><code>darkColor</code>:  rgba color object for the dark color.</li>
        <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
    </ul>
	<li>Brick</li>
	<ul>
		<li><code>brickColor</code>:  rgba color object for the brick color.</li>
		<li><code>mortarColor</code>:  rgba color object for the mortar color.</li>
		<li><code>brickSize</code>:  Number between 0.0 and 1.0 where 0.0 is many small bricks and 1.0 is one large brick.</li>
		<li><code>brickPct</code>:  Number for the ratio of brick to mortar where 0.0 is all mortar and 1.0 is all brick.</li>
		<li><code>brickRoughness</code>:  Number between 0.0 and 1.0 representing how rough the brick looks.</li>
		<li><code>mortarRoughness</code>:  Number between 0.0 and 1.0 representing how rough the mortar looks.</li>
	</ul>
    <li>Cement</li>
    <ul>
        <li><code>cementColor</code>:  rgba color object for the cement's color. </li>
        <li><code>grainScale</code>:  Number for the size of rock grains in the cement. </li>
        <li><code>roughness</code>:  Number that controls how rough the cement looks.</li>
    </ul>
    <li>Erosion</li>
    <ul>
        <li><code>color</code>:  diffuse color and alpha.</li>
        <li><code>time</code>:  Time of erosion.  1.0 is no erosion; 0.0 is fully eroded.</li>
    </ul>
    <li>Facet</li>
    <ul>
        <li><code>lightColor</code>:  rgba color object for the light color.</li>
        <li><code>darkColor</code>:  rgba color object for the dark color.</li>
        <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
    </ul>
    <li>Grass</li>
    <ul>
        <li><code>grassColor</code>:  rgba color object for the grass' color. </li>
        <li><code>dirtColor</code>:  rgba color object for the dirt's color. </li>
        <li><code>patchiness</code>:  Number that controls the size of the color patches in the grass.</li>
    </ul>
    <li>TieDye</li>
    <ul>
        <li><code>lightColor</code>:  rgba color object for the light color.</li>
        <li><code>darkColor</code>:  rgba color object for the dark color.</li>
        <li><code>frequency</code>:  Number that controls the frequency of the pattern.</li>
    </ul>
    <li>Wood</li>
    <ul>
        <li><code>lightWoodColor</code>:  rgba color object for the wood's base color.</li>
        <li><code>darkWoodColor</code>:  rgba color object for the color of rings in the wood.</li>
        <li><code>ringFrequency</code>:  Number for the frequency of rings in the wood.</li>
        <li><code>noiseScale</code>:  Object with x and y values specifying the noisiness of the ring patterns in both directions.</li>
    </ul>
</ul>

Contributions welcome.  We use the [same CLA as Cesium](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md).  Please email yours before opening a pull request.
