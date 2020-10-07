
module.exports = class BulkstatSchema {
    /**
     * 
     * @param {string} name 
     * @param {string} format 
     * @param {string} type 
     */
    constructor(name, format = [], type = 'system') {
        this.name = name;
        this.format = format;
        this.type = type;
    }

    /**
     * 
     * @param {number} i 
     * @returns {string}
     */
    getCounterAtPos(i) {
        return this.format[i];
    }

    /**
     * 
     * @param {string[]} names 
     * @returns {number}
     */
    findCounterByName(...names) {
        for(let i = 0; i < this.format.length; i++) {
            for(let name of names) {
                if (this.format[i] == name) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * 
     * @param {string} format 
     * @param {string} name 
     * @param {string} type
     * @returns {BulkstatSchema}
     */
    static createSchemaFromStringFormat(format, name, type) {
        const formats = format.split(",");
        const formatName = formats[0] === "EMS" ? formats[1] : formats[2];
        return new BulkstatSchema(formatName, formats, type);
    }
}