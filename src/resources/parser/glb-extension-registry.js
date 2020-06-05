/* eslint-disable jsdoc/check-tag-names, jsdoc/no-undefined-types */

Object.assign(pc, function () {

    /**
     * @class
     * @name pc.GlbExtensionParserRegistry
     * @description Container for extension parsers for a single glTF object type.
     * @template TObject
     */
    var GlbExtensionParserRegistry = function () {
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
     * @name  pc.GlbExtensionParserRegistry#destroy
     * @description Let go of all registered parsers.
     */
    GlbExtensionParserRegistry.prototype.destroy = function () {
        this._extensions = null;
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#add
     * @description Add a new extension parser to the registry.
     * @param {string} name - The name of the extension.
     * @param {pc.callbacks.ParseGlbExtension<TObject>} parser - Function used transform objects that have an extension matching name.
     * @returns {boolean} Returns true if the parser was successfully added to the registry, false otherwise.
     */
    GlbExtensionParserRegistry.prototype.add = function (name, parser) {
        if (this._extensions.hasOwnProperty(name)) {
            // #ifdef DEBUG
            console.warn('pc.GlbExtensionRegistry: trying to add more than one extension named: ' + name);
            // #endif
            return false;
        }

        this._extensions[name] = parser;
        return true;
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#remove
     * @description Remove an extension parser from the registry.
     * @param {string} name - The name of the extension.
     */
    GlbExtensionParserRegistry.prototype.remove = function (name) {
        if (!this._extensions.hasOwnProperty(name)) {
            return;
        }

        delete this._extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#removeAll
     * @description Remove all extension parsers from the registry.
     */
    GlbExtensionParserRegistry.prototype.removeAll = function () {
        this._extensions = {};
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#find
     * @description Find an extension parser in the registry.
     * @param {string} name - The name of the extension.
     * @returns {pc.callbacks.ParseGlbExtension<TObject>|null} The found extension parser or null.
     */
    GlbExtensionParserRegistry.prototype.find = function (name) {
        if (!this._extensions.hasOwnProperty(name)) {
            return null;
        }

        return this._extensions[name];
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#index
     * @description Get the index of all extension parsers currently in the registry.
     * @returns {object.<string, pc.callbacks.ParseGlbExtension<TObject>>} An object of parsers by extension name.
     */
    GlbExtensionParserRegistry.prototype.index = function () {
        return this._extensions;
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#apply
     * @description Apply a single extension to an object.
     * @param {string} name - The name of the extension to be applied to "object".
     * @param {TObject} object - The object to be modified or replaced.
     * @param {object} extensionData - Extension data that should be applied to "object".
     * @param {object} gltf - The contents of the glTF file being parsed. Can be used to find glTF objects referenced in "extensionData".
     * @returns {TObject} The new or modified object derived from "object" using "extensionData". Must be of the same type as "object".
     */
    GlbExtensionParserRegistry.prototype.apply = function (name, object, extensionData, gltf) {
        var extensionParser = this._extensions[name];
        if (!extensionParser) {
            return object;
        }

        return extensionParser(object, extensionData, gltf);
    };

    /**
     * @function
     * @name  pc.GlbExtensionParserRegistry#applyAll
     * @description Apply multiple extensions on an object.
     * @param {TObject} object - The object to be modified or replaced.
     * @param {object} extensionDataByName - Object containing extension data that should be applied to "object", grouped by extension name.
     * @param {object} gltf - The contents of the glTF file being parsed. Can be used to find glTF objects referenced in "extensionData".
     * @returns {TObject} The new or modified object derived from "object" using "extensionData". Must be of the same type as "object".
     */
    GlbExtensionParserRegistry.prototype.applyAll = function (object, extensionDataByName, gltf) {
        var extensionParsers = this._extensions;
        return Object.keys(extensionDataByName || {})
            .filter(function (extensionId) {
                return extensionParsers.hasOwnProperty(extensionId);
            })
            .reduce(function (prevItem, extensionId) {
                var extensionParser = extensionParsers[extensionId];
                var extensionData = extensionDataByName[extensionId];
                return extensionParser(prevItem, extensionData, gltf);
            }, object);
    };

    /**
     * @class
     * @name pc.GlbExtensionRegistry
     * @description Container for extension parsers to be used when parsing glTF files.
     */
    var GlbExtensionRegistry = function () {
        this._node = new pc.GlbExtensionParserRegistry();
        this._scene = new pc.GlbExtensionParserRegistry();
        this._texture = new pc.GlbExtensionParserRegistry();
        this._material = new pc.GlbExtensionParserRegistry();
        this._mesh = new pc.GlbExtensionParserRegistry();
        this._skin = new pc.GlbExtensionParserRegistry();
        this._animation = new pc.GlbExtensionParserRegistry();

        this.destroy = this.destroy.bind(this);
        this.removeAll = this.removeAll.bind(this);
    };

    Object.defineProperties(GlbExtensionRegistry.prototype, {
        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#node
         * @description Registry for handling node extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Entity>}
         */
        node: {
            get: function () {
                return this._node;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#scene
         * @description Registry for handling scene extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Entity>}
         */
        scene: {
            get: function () {
                return this._scene;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#texture
         * @description Registry for handling texture extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Texture>}
         */
        texture: {
            get: function () {
                return this._texture;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#material
         * @description Registry for handling material extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Material>}
         */
        material: {
            get: function () {
                return this._material;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#mesh
         * @description Registry for handling mesh extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Mesh[]>}
         */
        mesh: {
            get: function () {
                return this._mesh;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#skin
         * @description Registry for handling skin extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.Skin>}
         */
        skin: {
            get: function () {
                return this._skin;
            }
        },

        /**
         * @readonly
         * @name pc.GlbExtensionRegistry#animation
         * @description Registry for handling animation extension parsers.
         * @type {pc.GlbExtensionParserRegistry<pc.AnimTrack>}
         */
        animation: {
            get: function () {
                return this._animation;
            }
        }
    });

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#destroy
     * @description Destroy all registered extension parsers.
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

    /**
     * @function
     * @name  pc.GlbExtensionRegistry#removeAll
     * @description Remove all extension parsers.
     */
    GlbExtensionRegistry.prototype.removeAll = function () {
        this._node.removeAll();
        this._scene.removeAll();
        this._texture.removeAll();
        this._material.removeAll();
        this._mesh.removeAll();
        this._skin.removeAll();
        this._animation.removeAll();
    };

    return {
        GlbExtensionParserRegistry: GlbExtensionParserRegistry,
        GlbExtensionRegistry: GlbExtensionRegistry
    };

}());
