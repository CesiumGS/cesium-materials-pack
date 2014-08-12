/*global define*/
define([
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

    function replaceNewLines(s) {
        return s.replace(/\r\n/g, '\n');
    }

    // remove Windows line endings, if present, to work around
    // the crash fixed in https://github.com/AnalyticalGraphicsInc/cesium/pull/2048
    AsphaltMaterial = replaceNewLines(AsphaltMaterial);
    BlobMaterial = replaceNewLines(BlobMaterial);
    BrickMaterial = replaceNewLines(BrickMaterial);
    CementMaterial = replaceNewLines(CementMaterial);
    ErosionMaterial = replaceNewLines(ErosionMaterial);
    FacetMaterial = replaceNewLines(FacetMaterial);
    FresnelMaterial = replaceNewLines(FresnelMaterial);
    GrassMaterial = replaceNewLines(GrassMaterial);
    ReflectionMaterial = replaceNewLines(ReflectionMaterial);
    RefractionMaterial = replaceNewLines(RefractionMaterial);
    TieDyeMaterial = replaceNewLines(TieDyeMaterial);
    WoodMaterial = replaceNewLines(WoodMaterial);
    czm_cellular = replaceNewLines(czm_cellular);
    czm_snoise = replaceNewLines(czm_snoise);

    var initialized = false;
    var initialize = function() {
        if (initialized) {
            return;
        }

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

        initialized = true;
    };

    return initialize;
});