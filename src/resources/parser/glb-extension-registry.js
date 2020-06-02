Object.assign(pc, function () {

    var GLB_EXTENSION_TYPES = ["node", "scene", "texture", "material", "mesh", "skin", "animation"];

    var GlbExtensionRegistryItem = function (type, name, callback) {
        this.type = type;
        this.name = name;
        this.callback = callback;
    };

    var GlbExtensionRegistry = function () {
        this._extensions = GLB_EXTENSION_TYPES.reduce(function (typeObject, type) {
            typeObject[type] = {
                list: [],
                index: {}
            };
            return typeObject;
        }, {});
    };

    GlbExtensionRegistry.prototype.destroy = function () {
    };

    GlbExtensionRegistry.prototype.add = function (type, name, callback) {
        if (!this._extensions.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add extension of invalid type: ' + type);
            // #endif
            return false;
        }
        var extensionType = this._extensions[type];
        if (extensionType.index.hasOwnProperty(name)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add more than one extension named: ' + name);
            // #endif
            return false;
        }

        var item = new pc.GlbExtensionRegistryItem(type, name, callback);
        var itemIndex = extensionType.list.push(item) - 1;
        extensionType.index[item.name] = itemIndex;

        return true;
    };

    GlbExtensionRegistry.prototype.remove = function (type, name) {
    };

    GlbExtensionRegistry.prototype.removeAll = function (type) {
    };

    GlbExtensionRegistry.prototype.list = function (type) {
        if (!this._extensions.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to list extensions of invalid type: ' + type);
            // #endif
            return [];
        }
        return this._extensions[type].list;
    };

    GlbExtensionRegistry.prototype.find = function (type, name) {
        if (!this._extensions.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to find extension of invalid type: ' + type);
            // #endif
            return null;
        }
        var extensionType = this._extensions[type];
        if (!extensionType.index.hasOwnProperty(name)) {
            return null;
        }
        return extensionType.list[extensionType.index[name]];
    };

    GlbExtensionRegistry.prototype.apply = function (type, name, item, itemData, gltf) {
        if (!this._extensions.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extension of invalid type: ' + type);
            // #endif
            return;
        }
        // TODO
    };

    GlbExtensionRegistry.prototype.applyAll = function (type, item, itemData, gltf) {
        if (!this._extensions.hasOwnProperty(type)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to apply extensions of invalid type: ' + type);
            // #endif
            return;
        }

        var extensionList = this._extensions[type].list;
        var extensionIndex = this._extensions[type].index;

        return Object.keys(itemData.extensions || {})
            .filter(function (id) {
                return extensionIndex.hasOwnProperty(id);
            })
            .reduce(function (prevItem, id) {
                var apply = extensionList[extensionIndex[id]].callback;
                return apply(prevItem, itemData, gltf);
            }, item);
    };

    return {
        GlbExtensionRegistry: GlbExtensionRegistry,
        GlbExtensionRegistryItem: GlbExtensionRegistryItem
    };

}());
