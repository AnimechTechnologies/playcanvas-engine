Object.assign(pc, function () {

    var GLB_EXTENSION_TYPES = ["node", "scene", "texture", "material", "mesh", "skin", "animation"];

    var getEmptyExtensionIndex = function () {
        return GLB_EXTENSION_TYPES.reduce(function (extensions, type) {
            extensions[type] = {};
            return extensions;
        }, {});
    };

    var GlbExtensionRegistry = function () {
        this._extensionIndex = getEmptyExtensionIndex();
    };

    GlbExtensionRegistry.prototype.destroy = function () {
        this._extensionIndex = null;
    };

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

    GlbExtensionRegistry.prototype.index = function () {
        return this._extensionIndex;
    };

    GlbExtensionRegistry.prototype.apply = function (type, name, item, itemData, gltf) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extension of invalid type: ' + type);
            // #endif
            return item;
        }

        var extension = this._extensionIndex[type][name];
        if (!extension) {
            return item;
        }

        return extension(item, itemData, gltf);
    };

    GlbExtensionRegistry.prototype.applyAll = function (type, item, itemData, gltf) {
        if (!this._extensionIndex.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extensions of invalid type: ' + type);
            // #endif
            return item;
        }

        var extensions = this._extensionIndex[type];

        return Object.keys(itemData.extensions || {})
            .filter(function (extensionId) {
                return extensions.hasOwnProperty(extensionId);
            })
            .reduce(function (prevItem, extensionId) {
                var extension = extensions[extensionId];
                return extension(prevItem, itemData, gltf);
            }, item);
    };

    return {
        GlbExtensionRegistry: GlbExtensionRegistry
    };

}());
