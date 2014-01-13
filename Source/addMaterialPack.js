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
        './Shaders/WoodMaterial'
    ], function(
        AsphaltMaterial,
        BlobMaterial,
        BrickMaterial,
        CementMaterial,
        ErosionMaterial,
        FacetMaterial,
        GrassMaterial,
        TieDyeMaterial,
        WoodMaterial) {
	"use strict";
	
	function addMaterialPack(Material) {
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
	
	return addMaterialPack;
});