const fs = require('fs');
const BulkstatSchema = require("./BulkstatSchema");
const FileReader = require("./FileReader");
const BulkstatConfig = require("./BulkstatConfig");
const MAX_LINE = 8192;


module.exports = class ConfigReader extends FileReader{
    constructor(filename) {
        super(filename);
    }

    /**
     * @returns {Promise<BulkstatConfig>}
     */
    async getBulkstatSchemaAsync() {
        const fd = await this._openFileAsync();
        const bulkstatConfig = new BulkstatConfig();
        let file = "";
        while(1) {
            const line = await this._readLineAsync(fd);
            let matchRes = line.match(/\s+file (\d+)/);            
            if (matchRes) {
                file = matchRes[1];
                if (bulkstatConfig.hasFileSection(file)) {
                    throw new Error(`Bulkstat file collision. File ${file}`);
                }
                bulkstatConfig.addFileSection(file);
                continue;
            }
            matchRes = line.match(/(\S*)\s*schema (\S+) format (.*)/);
            if (matchRes) {
                const schema = BulkstatSchema.createSchemaFromStringFormat(matchRes[3], matchRes[2], matchRes[1]);
                bulkstatConfig.addSchema(schema, file);
            }
            else if (line == null || (file != "" && line.match(/[*][*][*] show/))) {
                await this._closeFileAsync(fd);
                return bulkstatConfig;
            }
        }
        await this._closeFileAsync(fd);
    }

    /**
     * 
     * @param {string} filename 
     * @returns {ConfigReader}
     */
    static createReader(filename) {
        return new ConfigReader(filename);
    }
}