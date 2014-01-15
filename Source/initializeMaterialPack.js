/*global define*/
define([
        './Shaders/AsphaltMaterial',
        './Shaders/BlobMaterial',
        './Shaders/BrickMaterial',
        './Shaders/CementMaterial',
        './Shaders/ErosionMaterial',
        './Shaders/FacetMaterial',
        './Shaders/GrassMaterial',
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
        GrassMaterial,
        TieDyeMaterial,
        WoodMaterial,
        CzmBuiltins) {
	"use strict";

    function initializeMaterialPack(Cesium) {
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

	return initializeMaterialPack;
});