import { path } from '../core/path.js';

import { http, Http } from '../net/http.js';

import { Asset } from '../asset/asset.js';

import { GlbParser } from './parser/glb-parser.js';

/**
 * @class
 * @name pc.ContainerResource
 * @classdesc Container for a list of animations, textures, materials, models, nodes, scenes, default scene
 * cameras and lights. Entities in scene hierarchies will have model, camera and light components attached to them.
 * Animation components have to be added manually (using animationIndicesByNode) as either pc.AnimComponent or pc.AnimationComponent.
 * @param {object} data - The loaded GLB data.
 * @property {pc.Entity|null} scene - Root entity of the default GLB scene.
 * @property {pc.Entity[]} scenes - Root entities of scenes indexed by GLB scenes.
 * @property {pc.CameraComponent[]} cameras - Instanced camera components, does not match index of GLB cameras.
 * @property {pc.LightComponent[]} lights - Instanced light components, does not match index of GLB lights.
 * @property {pc.Entity[]} nodes - Entities indexed by GLB nodes.
 * @property {number[][]} animationIndicesByNode - Animation asset indices indexed by GLB nodes.
 * @property {pc.Asset[]} animations - Array of assets of animations in the GLB container.
 * @property {pc.Asset[]} textures - Array of assets of textures in the GLB container.
 * @property {pc.Asset[]} materials - Array of assets of materials in the GLB container.
 * @property {pc.Asset[]} models - Model assets indexed by GLB meshes.
 * @property {pc.AssetRegistry} registry - The asset registry.
 */
function ContainerResource(data) {
    this.data = data;
    this.scene = null;
    this.scenes = [];
    this.cameras = [];
    this.lights = [];
    this.nodes = [];
    this.materials = [];
    this.textures = [];
    this.animations = [];
    this.animationIndicesByNode = [];
    this.models = [];
    this._modelByNode = []; // not public since it is only used to keep model refs for when container is destroyed
    this.registry = null;
}

Object.assign(ContainerResource.prototype, {
    destroy: function () {

        var registry = this.registry;

        var destroyAsset = function (asset) {
            registry.remove(asset);
            asset.unload();
        };

        var destroyAssets = function (assets) {
            assets.forEach(function (asset) {
                if (asset) {
                    destroyAsset(asset);
                }
            });
        };

        // destroy entities
        if (this.scene) {
            this.scene.destroy();
            this.scene = null;
        }

        if (this.scenes) {
            this.scenes.forEach(function (scene) {
                scene.destroy();
            });
            this.scenes = null;
        }

        if (this.cameras) {
            this.cameras = null;
        }

        if (this.lights) {
            this.lights = null;
        }

        if (this.nodes) {
            this.nodes.forEach(function (node) {
                node.destroy();
            });
            this.nodes = null;
        }

        // unload and destroy assets
        if (this.animations) {
            destroyAssets(this.animations);
            this.animations = null;
        }

        if (this.animationIndicesByNode) {
            this.animationIndicesByNode = null;
        }

        if (this.models) {
            destroyAssets(this.models);
            this.models = null;
        }

        if (this._modelByNode) {
            destroyAssets(this._modelByNode);
            this._modelByNode = null;
        }

        if (this.textures) {
            destroyAssets(this.textures);
            this.textures = null;
        }

        if (this.materials) {
            destroyAssets(this.materials);
            this.materials = null;
        }

        this.data = null;
        this.assets = null;
    }
});

/**
 * @class
 * @name pc.ContainerHandler
 * @implements {pc.ResourceHandler}
 * @classdesc Loads files that contain multiple resources. For example glTF files can contain
 * textures, scenes and animations.
 * The asset options object can be used to pass load time callbacks for handling the various resources
 * at different stages of loading. The table below lists the resource types and the corresponding
 * supported process functions.
 * ```
 * |---------------------------------------------------------------------|
 * |  resource   |  preprocess |   process   |processAsync | postprocess |
 * |-------------+-------------+-------------+-------------+-------------|
 * | global      |      x      |             |             |      x      |
 * | node        |      x      |      x      |             |      x      |
 * | scene       |      x      |      x      |             |      x      |
 * | camera      |      x      |      x      |             |      x      |
 * | light       |      x      |      x      |             |      x      |
 * | animation   |      x      |             |             |      x      |
 * | material    |      x      |      x      |             |      x      |
 * | image       |      x      |             |      x      |      x      |
 * | texture     |      x      |             |      x      |      x      |
 * | buffer      |      x      |             |      x      |      x      |
 * | bufferView  |      x      |             |      x      |      x      |
 * |---------------------------------------------------------------------|
 * ```
 * For example, to receive a texture preprocess callback:
 * ```javascript
 * var containerAsset = new pc.Asset(filename, 'container', { url: url, filename: filename }, null, {
 *     texture: {
 *         preprocess: function (gltfTexture) { console.log("texture preprocess"); }
 *     },
 * });
 * ```
 * @param {pc.GraphicsDevice} device - The graphics device that will be rendering.
 * @param {pc.StandardMaterial} defaultMaterial - The shared default material that is used in any place that a material is not specified.
 */
function ContainerHandler(device, defaultMaterial) {
    this._device = device;
    this._defaultMaterial = defaultMaterial;
}

Object.assign(ContainerHandler.prototype, {
    _getUrlWithoutParams: function (url) {
        return url.indexOf('?') >= 0 ? url.split('?')[0] : url;
    },

    load: function (url, callback, asset) {
        if (typeof url === 'string') {
            url = {
                load: url,
                original: url
            };
        }

        var options = {
            responseType: Http.ResponseType.ARRAY_BUFFER,
            retry: false
        };

        var self = this;

        // parse downloaded file data
        var parseData = function (arrayBuffer) {
            GlbParser.parseAsync(self._getUrlWithoutParams(url.original),
                                 path.extractPath(url.load),
                                 arrayBuffer,
                                 self._device,
                                 self._defaultMaterial,
                                 asset.registry,
                                 asset.options,
                                 function (err, result) {
                                     if (err) {
                                         callback(err);
                                     } else {
                                         // return everything
                                         callback(null, new ContainerResource(result));
                                     }
                                 });
        };

        if (asset && asset.file && asset.file.contents) {
            // file data supplied by caller
            parseData(asset.file.contents);
        } else {
            // data requires download
            http.get(url.load, options, function (err, response) {
                if (!callback)
                    return;

                if (err) {
                    callback("Error loading model: " + url.original + " [" + err + "]");
                } else {
                    parseData(response);
                }
            });
        }
    },

    open: function (url, data, asset) {
        return data;
    },

    // Create assets to wrap the loaded engine resources - models, materials, textures and animations.
    patch: function (asset, assets) {
        var container = asset.resource;
        var data = container.data;

        if (data) {
            var createAsset = function (type, resource, index) {
                var subAsset = new Asset(asset.name + '/' + type + '/' + index, type, {
                    url: ''
                });
                subAsset.resource = resource;
                subAsset.loaded = true;
                assets.add(subAsset);
                return subAsset;
            };

            // create model assets
            var modelAssets = data.models.map(function (model, index) {
                return createAsset('model', model, index);
            });

            // create node model assets
            var modelAssetByNode = data.modelByNode.map(function (model, index) {
                return model !== null ? createAsset('model', model, index) : null;
            });

            // create material assets
            var materialAssets = data.materials.map(function (material, index) {
                return createAsset('material', material, index);
            });

            // create animation assets
            var animationAssets = data.animations.map(function (animation, index) {
                return createAsset('animation', animation, index);
            });

            // add model components to nodes
            data.nodes.forEach(function (node, nodeIndex) {
                var modelAsset = modelAssetByNode[nodeIndex];
                if (modelAsset !== null) {
                    node.addComponent('model', {
                        type: 'asset',
                        asset: modelAsset
                    });
                }
            });

            container.data = null;                      // since assets are created, release GLB data
            container.scene = data.scene;
            container.scenes = data.scenes;
            container.cameras = data.cameras;
            container.lights = data.lights;
            container.nodes = data.nodes;
            container.materials = materialAssets;
            container.textures = data.textures;         // texture assets are created in parser
            container.animations = animationAssets;
            container.animationIndicesByNode = data.animationIndicesByNode;
            container.models = modelAssets;
            container._modelByNode = modelAssetByNode;    // keep model refs for when container is destroyed
            container.registry = assets;
        }
    }
});

export { ContainerHandler, ContainerResource };
