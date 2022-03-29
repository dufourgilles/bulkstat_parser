import { BulkLineIdentifier, BulkstatLine } from "./BulkstatLine";

import {BulkstatConfig} from './BulkstatConfig';
import {FileReader} from "./FileReader";

//      port schema portSch1 format PPM,port,portSch1,%epochtime%,%localdate%,%localtime%,%uptime%,%card%,%port%,%maxrate%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpack
//      port schema port format EMS,Port,%date%,%time%,%card%,%port%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpackets%,%rxdiscbytes%,%rxdiscpackets%,%txdiscbytes%,%txdiscpackets%,%maxrate%,%frag-rcvd%,%pkt-reassembled%,%frag-tokernel%,%util-rx-curr%,%util-tx-curr%,%util-rx-5min%,%util-tx-5min%,%util-rx-15min%,%util-tx-15min%,%port-5peak-rx-util%,%port-5peak-tx-util%,%port-15peak-rx-util%,%port-15peak-tx-util%,%rxerrorbytes%,%rxerrorpackets%,%txerrorbytes%,%txerrorpackets%

export type StatRecords = Record<BulkLineIdentifier, BulkstatLine>;

export class BulkstatReader extends FileReader{
    protected _bulkLines: StatRecords = {};     

    protected constructor(filename: string) {
        super(filename);
    }


    get stats(): StatRecords {
        return this._bulkLines;
    }

    async getBulkstatDataAsync(schemas: BulkstatConfig, _filters: string[] = []) {
        const fd = await this.openFileAsync();
        const filters = ['EndOfFile', 'Version'].concat(_filters);
        this._bulkLines = {};
        let lineNum = 1;
        while(1) {
            lineNum++;
            const line = await this.readLineAsync(fd);
            if (line == null) {
                break;
            }
            let filteredOut = false;
            for(let filter of filters) {
                if (line.indexOf(filter) >= 0) {
                    filteredOut = true;
                    break;
                }
            }
            if (filteredOut) { continue; }
            const bulkData = BulkstatLine.createFromString(line, lineNum);
            const schemaName = bulkData.getSchemaName();
            if (schemaName == null) {
                console.log(`Unexpected schema @line num ${lineNum}`, line);
                continue;
            }
            const schema = schemas.getSchemaByName(schemaName);
            if (schema == null) {
                console.log(`Unknown schema ${schemaName}`);
                continue;
            }
            bulkData.setSchema(schema);
            const bulkIdentifier = bulkData.getBulkLineIdentifier();
            if (this._bulkLines[bulkIdentifier] != null) {                
                if (bulkIdentifier.startsWith("SGSN") || bulkIdentifier.startsWith("SGTP") || bulkIdentifier.startsWith("SS7")) {
                    //console.log(`Duplicate stat ${statName} at line ${lineNum} and ${this._bulkLines[statName].lineNum}`);
                    continue;
                }
                console.log(line);
                console.log(this._bulkLines[bulkIdentifier].data);
                console.log(schema.schemaCounterNames);
                throw new Error(`Duplicate stat ${bulkIdentifier} at line ${lineNum} and ${this._bulkLines[bulkIdentifier].lineNumber}`);
            }
            this._bulkLines[bulkIdentifier] = bulkData;
        }
        await this.closeFileAsync(fd);
    }

    static createReader(filename: string): BulkstatReader {
        return new BulkstatReader(filename);
    }
}