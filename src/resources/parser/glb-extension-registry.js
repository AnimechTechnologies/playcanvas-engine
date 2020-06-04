Object.assign(pc, function () {

    /**
     * An object type in the glTF 2.0 specification.
     *
     * @typedef {("node"|"scene"|"texture"|"material"|"mesh"|"skin"|"animation")} pc.GlbExtensionType
     */
    var GLB_EXTENSION_TYPES = ["node", "scene", "texture", "material", "mesh", "skin", "animation"];

    /**
     * Engine objects that can be extended with {@link pc.GlbExtensionRegistry}.
     *
     * @typedef {(pc.Entity|pc.Texture|pc.Material|pc.Mesh[]|pc.Skin|pc.AnimTrack)} pc.GlbExtensionItem
     */

    /**
     * A mapping of extension names to {@link pc.callbacks.ApplyGlbExtension}, grouped by {@link pc.GlbExtensionType}.
     *
     * @typedef {object.<string, object.<string, pc.callbacks.ApplyGlbExtension>>} pc.GlbExtensionIndex
     */

    var getEmptyExtensionIndex = function () {
        return GLB_EXTENSION_TYPES.reduce(function (extensions, type) {
            extensions[type] = {};
            return extensions;
        }, {});
    };

    /**
     * @class
     * @name pc.GlbExtensionRegistry
     * @description Container for callbacks to be used when parsing extensions in GLB files.
     */
    var GlbExtensionRegistry = function () {
        this._extensionIndex = getEmptyExtensionIndex();

        this.destroy = this.destroy.bind(this);
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.removeAll = this.removeAll.bind(this);
        this.find = this.find.bind(this);
        this.index = this.index.bind(this);
        this.applyExtensions = this.applyExtensions.bind(this);
        this.applyNodeExtensions = this.applyNodeExtensions.bind(this);
        this.applySceneExtensions = this.applySceneExtensions.bind(this);
        this.applyTextureExtensions = this.applyTextureExtensions.bind(this);
        this.applyMaterialExtensions = this.applyMaterialExtensions.bind(this);
        this.applyMeshExtensions = this.applyMeshExtensions.bind(this);
        this.applySkinExtensions = this.applySkinExtensions.bind(this);
        this.applyAnimationExtensions = this.applyAnimationExtensions.bind(this);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#destroy
     * @description Let go of all internal data of the registry instance.
     */
    GlbExtensionRegistry.prototype.destroy = function () {
        this._extensionIndex = null;
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#add
     * @description Add a new extension callback to the extension registry.
     * @param {pc.GlbExtensionType} type - The target GLB object type for the extension.
     * @param {string} name - The name of the extension.
     * @param {pc.callbacks.ApplyGlbExtension} callback - Function used to apply extension data to engine objects that match type "type" and have an extension named "name".
     * @returns {boolean} Returns true if the callback was successfully added to the registry, false otherwise.
     */
    GlbExtensionRegistry.prototype.add = function (type, name, callback) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add extension of invalid type: ' + type);
            // #endif
            return false;
        }

        var extensions = this._extensionIndex[type];
        if (extensions.hasOwnProperty(name)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add more than one extension named: ' + name);
            // #endif
            return false;
        }

        extensions[name] = callback;

        return true;
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#remove
     * @description Remove an extension callback from the extension registry.
     * @param {pc.GlbExtensionType} type - The target GLB object type for the extension.
     * @param {string} name - The name of the extension.
     */
    GlbExtensionRegistry.prototype.remove = function (type, name) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to remove extension of invalid type: ' + type);
            // #endif
            return;
        }

        var extensions = this._extensionIndex[type];
        if (!extensions.hasOwnProperty(name)) {
            return;
        }

        delete extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#removeAll
     * @description Remove all extension callbacks from the extension registry.
     * @param {pc.GlbExtensionType} [type] - If defined, only extensions of the matching type will be removed.
     */
    GlbExtensionRegistry.prototype.removeAll = function (type) {
        if (this._type === undefined) {
            this._extensionIndex = getEmptyExtensionIndex();
            return;
        }

        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to remove extensions of invalid type: ' + type);
            // #endif
            return;
        }

        this._extensionIndex[type] = {};
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#find
     * @description Find an extension callback in the extension registry.
     * @param {pc.GlbExtensionType} type - The target GLB object type for the extension.
     * @param {string} name - The name of the extension.
     * @returns {pc.callbacks.ApplyGlbExtension|null} - The found extension callback or null.
     */
    GlbExtensionRegistry.prototype.find = function (type, name) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to find extension of invalid type: ' + type);
            // #endif
            return null;
        }

        var extensions = this._extensionIndex[type];
        if (!extensions.hasOwnProperty(name)) {
            return null;
        }

        return extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#index
     * @description Get the index of all extension callbacks currently in the registry, grouped by type.
     * @returns {pc.GlbExtensionIndex} - The index.
     */
    GlbExtensionRegistry.prototype.index = function () {
        return this._extensionIndex;
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyExtension
     * @description Apply a single extension on an engine object.
     * @param {pc.GlbExtensionType} type - The GLB object type of "item".
     * @param {string} name - The name of the extension to be applied to "item".
     * @param {pc.GlbExtensionItem} item - The engine object to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to "item".
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.GlbExtensionItem} The new or modified engine object derived from "item" using "extensionData". Must be of the same type as "item".
     */
    GlbExtensionRegistry.prototype.applyExtension = function (type, name, item, extensionData, gltf) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extension of invalid type: ' + type);
            // #endif
            return item;
        }

        var extensionCallback = this._extensionIndex[type][name];
        if (!extensionCallback) {
            return item;
        }

        return extensionCallback(item, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyExtensions
     * @description Apply multiple extensions on an engine object.
     * @param {pc.GlbExtensionType} type - The GLB object type of "item".
     * @param {pc.GlbExtensionItem} item - The engine object to be modified or replaced.
     * @param {object} extensionDataByName - The object containing extension data that should be applied to "item", grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.GlbExtensionItem} The new or modified engine object derived from "item" using "extensionData". Must be of the same type as "item".
     */
    GlbExtensionRegistry.prototype.applyExtensions = function (type, item, extensionDataByName, gltf) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extensions of invalid type: ' + type);
            // #endif
            return item;
        }

        var extensionCallbacks = this._extensionIndex[type];

        return Object.keys(extensionDataByName || {})
            .filter(function (extensionId) {
                return extensionCallbacks.hasOwnProperty(extensionId);
            })
            .reduce(function (prevItem, extensionId) {
                var extensionCallback = extensionCallbacks[extensionId];
                var extensionData = extensionDataByName[extensionId];
                return extensionCallback(prevItem, extensionData, gltf);
            }, item);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyNodeExtensions
     * @description Apply extensions to a pc.Entity spawned from a GLB node object.
     * @param {pc.Entity} node - The node entity to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the entity, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Entity} The new or modified node entity.
     */
    GlbExtensionRegistry.prototype.applyNodeExtensions = function (node, extensionData, gltf) {
        return this.applyExtensions("node", node, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applySceneExtensions
     * @description Apply extensions to a pc.Entity spawned from a GLB scene object.
     * @param {pc.Entity} scene - The scene entity to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the entity, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Entity} The new or modified scene entity.
     */
    GlbExtensionRegistry.prototype.applySceneExtensions = function (scene, extensionData, gltf) {
        return this.applyExtensions("scene", scene, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyTextureExtensions
     * @description Apply extensions to a pc.Texture spawned from a GLB texture object.
     * @param {pc.Texture} texture - The texture to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the texture, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Texture} The new or modified texture.
     */
    GlbExtensionRegistry.prototype.applyTextureExtensions = function (texture, extensionData, gltf) {
        return this.applyExtensions("texture", texture, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyMaterialExtensions
     * @description Apply extensions to a pc.Material spawned from a GLB material object.
     * @param {pc.Material} material - The material to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the material, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Material} The new or modified material.
     */
    GlbExtensionRegistry.prototype.applyMaterialExtensions = function (material, extensionData, gltf) {
        return this.applyExtensions("material", material, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyMeshExtensions
     * @description Apply extensions to a pc.Mesh[] spawned from a GLB mesh object.
     * @param {pc.Mesh[]} meshes - The meshes to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the meshes, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Mesh[]} The new or modified meshes.
     */
    GlbExtensionRegistry.prototype.applyMeshExtensions = function (meshes, extensionData, gltf) {
        return this.applyExtensions("mesh", meshes, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applySkinExtensions
     * @description Apply extensions to a pc.Skin spawned from a GLB skin object.
     * @param {pc.Skin} skin - The skin to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the skin, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.Skin} The new or modified skin.
     */
    GlbExtensionRegistry.prototype.applySkinExtensions = function (skin, extensionData, gltf) {
        return this.applyExtensions("skin", skin, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#applyAnimationExtensions
     * @description Apply extensions to a pc.AnimTrack spawned from a GLB animation object.
     * @param {pc.AnimTrack} animation - The animation to be modified or replaced.
     * @param {object} extensionData - The object containing extension data that should be applied to the animation, grouped by extension name.
     * @param {object} gltf - The original glTF file. Can be used to find objects referenced in "extensionData".
     * @returns {pc.AnimTrack} The new or modified animation.
     */
    GlbExtensionRegistry.prototype.applyAnimationExtensions = function (animation, extensionData, gltf) {
        return this.applyExtensions("animation", animation, extensionData, gltf);
    };

    GlbExtensionRegistry.prototype.globalExtensionData = function () {
        // TODO: how to handle global extensions data
    };

    return {
        GlbExtensionRegistry: GlbExtensionRegistry
    };

}());
