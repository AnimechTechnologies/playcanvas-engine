/* eslint-disable jsdoc/check-tag-names, jsdoc/no-undefined-types */

Object.assign(pc, function () {

    /**
     * @class
     * @name pc.GlbExtensionSubRegistry
     * @description Container for extension callbacks for a single GLB object type.
     * @template TObject
     */
    var GlbExtensionSubRegistry = function () {
        this._extensions = {};

        this.destroy = this.destroy.bind(this);
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.removeAll = this.removeAll.bind(this);
        this.find = this.find.bind(this);
        this.index = this.index.bind(this);
        this.apply = this.apply.bind(this);
        this.applyAll = this.applyAll.bind(this);
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#destroy
     * @description Let go of all internal data of the registry instance.
     */
    GlbExtensionSubRegistry.prototype.destroy = function () {
        this._extensions = null;
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#add
     * @description Add a new extension callback to the registry.
     * @param {string} name - The name of the extension.
     * @param {pc.callbacks.ApplyGlbExtension<TObject>} callback - Callback used transform objects that have an extension matching name.
     * @returns {boolean} Returns true if the callback was successfully added to the registry, false otherwise.
     */
    GlbExtensionSubRegistry.prototype.add = function (name, callback) {
        if (this._extensions.hasOwnProperty(name)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add more than one extension named: ' + name);
            // #endif
            return false;
        }

        this._extensions[name] = callback;
        return true;
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#remove
     * @description Remove an extension callback from the registry.
     * @param {string} name - The name of the extension.
     */
    GlbExtensionSubRegistry.prototype.remove = function (name) {
        if (!this._extensions.hasOwnProperty(name)) {
            return;
        }

        delete this._extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#removeAll
     * @description Remove all extension callbacks from the registry.
     */
    GlbExtensionSubRegistry.prototype.removeAll = function () {
        this._extensions = {};
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#find
     * @description Find an extension callback in the registry.
     * @param {string} name - The name of the extension.
     * @returns {pc.callbacks.ApplyGlbExtension<TObject>|null} - The found extension callback or null.
     */
    GlbExtensionSubRegistry.prototype.find = function (name) {
        if (!this._extensions.hasOwnProperty(name)) {
            return null;
        }

        return this._extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#index
     * @description Get the index of all extension callbacks currently in the registry.
     * @returns {object.<string, pc.callbacks.ApplyGlbExtension<TObject>>} - The extension index.
     */
    GlbExtensionSubRegistry.prototype.index = function () {
        return this._extensions;
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#apply
     * @description Apply a single extension to an object.
     * @param {string} name - The name of the extension to be applied to "object".
     * @param {TObject} object - The object to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to "object".
     * @param {object} glb - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {TObject} The new or modified object derived from "object" using "extensionData". Must be of the same type as "object".
     */
    GlbExtensionSubRegistry.prototype.apply = function (name, object, extensionData, glb) {
        var extensionCallback = this._extensions[name];
        if (!extensionCallback) {
            return object;
        }

        return extensionCallback(object, extensionData, glb);
    };

    /**
     * @function
     * @name  pc.GlbExtensionSubRegistry#applyAll
     * @description Apply multiple extensions on an object.
     * @param {object} object - The object to be modified or replaced.
     * @param {object} extensionDataByName - The object containing extension data that should be applied to "object", grouped by extension name.
     * @param {object} glb - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {object} The new or modified object derived from "object" using "extensionData". Must be of the same type as "object".
     */
    GlbExtensionSubRegistry.prototype.applyAll = function (object, extensionDataByName, glb) {
        var extensionCallbacks = this._extensions;
        return Object.keys(extensionDataByName || {})
            .filter(function (extensionId) {
                return extensionCallbacks.hasOwnProperty(extensionId);
            })
            .reduce(function (prevItem, extensionId) {
                var extensionCallback = extensionCallbacks[extensionId];
                var extensionData = extensionDataByName[extensionId];
                return extensionCallback(prevItem, extensionData, glb);
            }, object);
    };

    /**
     * @class
     * @name pc.GlbExtensionRegistry
     * @description Container for callbacks to be used when parsing extensions on various objects in GLB files.
     */
    var GlbExtensionRegistry = function () {
        this._node = new pc.GlbExtensionSubRegistry();
        this._scene = new pc.GlbExtensionSubRegistry();
        this._texture = new pc.GlbExtensionSubRegistry();
        this._material = new pc.GlbExtensionSubRegistry();
        this._mesh = new pc.GlbExtensionSubRegistry();
        this._skin = new pc.GlbExtensionSubRegistry();
        this._animation = new pc.GlbExtensionSubRegistry();

        this.destroy = this.destroy.bind(this);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#destroy
     * @description Destroy the registry and all sub-registries.
     */
    GlbExtensionRegistry.prototype.destroy = function () {
        this._node.destroy();
        this._scene.destroy();
        this._texture.destroy();
        this._material.destroy();
        this._mesh.destroy();
        this._skin.destroy();
        this._animation.destroy();
    };

    Object.defineProperties(GlbExtensionRegistry.prototype, {
        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#node
         * @type {pc.GlbExtensionSubRegistry<pc.Entity>}
         */
        node: {
            get: function () {
                return this._node;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#scene
         * @type {pc.GlbExtensionSubRegistry<pc.Entity>}
         */
        scene: {
            get: function () {
                return this._scene;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#texture
         * @type {pc.GlbExtensionSubRegistry<pc.Texture>}
         */
        texture: {
            get: function () {
                return this._texture;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#material
         * @type {pc.GlbExtensionSubRegistry<pc.Material>}
         */
        material: {
            get: function () {
                return this._material;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#mesh
         * @type {pc.GlbExtensionSubRegistry<pc.Mesh[]>}
         */
        mesh: {
            get: function () {
                return this._mesh;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#skin
         * @type {pc.GlbExtensionSubRegistry<pc.Skin>}
         */
        skin: {
            get: function () {
                return this._skin;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#animation
         * @type {pc.GlbExtensionSubRegistry<pc.AnimTrack>}
         */
        animation: {
            get: function () {
                return this._animation;
            }
        }
    });

    return {
        GlbExtensionSubRegistry: GlbExtensionSubRegistry,
        GlbExtensionRegistry: GlbExtensionRegistry
    };

}());
