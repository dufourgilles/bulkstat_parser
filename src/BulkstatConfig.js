const BulkstatSchema = require("./BulkstatSchema");

module.exports = class BulkstatConfig {
    constructor() {
        this._config = {}
    }

    /**
     * 
     * @param {string} file
     * @returns {boolean}
     */
    hasFileSection(file) {
        return this._config[file] != null;
    }

    /**
     * 
     * @param {BulkstatSchema} schema 
     * @param {string|number|null} file
     * @returns {boolean}
     */
    hasSchema(schema, file = null) {
        return this.getSchemaByName(schema.name, file) != null;
    }

    /**
     * 
     * @param {string} file 
     */
    addFileSection(file) {
        if (this.hasFileSection[file]) {
            throw new Error(`Section file ${file} already present.`)
        }
        this._config[file] = {
            id: file,
            all: [],
            schemas: {}
        }
    }

    /**
     * 
     * @param {BulkstatSchema} schema 
     * @param {string} file 
     */
    addSchema(schema, file) {
        if (!this.hasFileSection(file)) {
            throw new Error(`Section file ${file} unknown.`)
        }
        if (this.hasSchema(schema, file)) {
            throw new Error(`Duplicate schema name ${schema.name} in file ${file}`);
        }
        this._config[file].all.push(schema);
        this._config[file].schemas[schema.name] = schema;
    }

    /**
     * 
     * @param {string} name 
     * @param {string} file 
     * @returns {BulkstatSchema}
     */
    getSchemaByName(name, file = null) {
        if (file) {
            if (!this.hasFileSection(file)) {
                return null;
            }
            return this._config[file].schemas[name];
        }
        for(let file in this._config) {
            const schema = this.getSchemaByName(name, file);
            if (schema != null) {
                return schema;
            }
        }
        return null;
    }

    findSchemaNameWithStatName(statName) {
        const result = [];
        for(let file in this._config) {
            for(let schemaName in this._config[file].schemas) {
                const schema = this._config[file].schemas[schemaName];
                if (schema.findCounterByName(statName) >= 0) {
                    result.push(schemaName);
                }
            }
        }
        return result;
    }

    getSchemaFromExtendedSchemaName(extendedSchemaName) {
        const index = extendedSchemaName.indexOf("/");
        const schemaName = index > 0 ? extendedSchemaName.slice(0, index) : extendedSchemaName;
        return this.getSchemaByName(schemaName);
    }
}