const fs = require('fs');
const BulkstatConfig = require('./BulkstatConfig');
const BulkstatData = require("./BulkstatData");
const FileReader = require("./FileReader");

//      port schema portSch1 format PPM,port,portSch1,%epochtime%,%localdate%,%localtime%,%uptime%,%card%,%port%,%maxrate%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpack
//      port schema port format EMS,Port,%date%,%time%,%card%,%port%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpackets%,%rxdiscbytes%,%rxdiscpackets%,%txdiscbytes%,%txdiscpackets%,%maxrate%,%frag-rcvd%,%pkt-reassembled%,%frag-tokernel%,%util-rx-curr%,%util-tx-curr%,%util-rx-5min%,%util-tx-5min%,%util-rx-15min%,%util-tx-15min%,%port-5peak-rx-util%,%port-5peak-tx-util%,%port-15peak-rx-util%,%port-15peak-tx-util%,%rxerrorbytes%,%rxerrorpackets%,%txerrorbytes%,%txerrorpackets%

/** 
 * @typedef {
 * [x: string]: BulkstatData
 * } Bulkstas
 * 
 * */

module.exports = class BulkstatReader extends FileReader{
    constructor(filename) {
        super(filename);
        this._bulkstats = {};     
    }

    /**
     * {[x: string]: BulkstatData}
     */
    getStats() {
        return this._bulkstats;
    }

    /**
     * 
     * @param {BulkstatConfig} schemas 
     */
    async getBulkstatDataAsync(schemas) {
        const fd = await this._openFileAsync();
        this._bulkstats = {};
        while(1) {
            const line = await this._readLineAsync(fd);
            if (line == null) {
                break;
            }
            const bulkData = BulkstatData.createFromString(line);
            const schemaName = bulkData.getSchemaName();
            if (schemaName == null) {
                console.log("Unexpected schema", line);
                continue;
            }
            const schema = schemas.getSchemaByName(schemaName);
            if (schema == null) {
                console.log(`Unknown schema ${schemaName}`);
                continue;
            }
            bulkData.setSchema(schema);
            const statName = bulkData.getStatName();
            if (this._bulkstats[statName] != null) {
                throw new Error(`Duplicate stat ${statName}.`);                
            }
            this._bulkstats[statName] = bulkData;
        }
        await this._closeFileAsync(fd);
    }

    static createReader(filename) {
        return new BulkstatReader(filename);
    }
}