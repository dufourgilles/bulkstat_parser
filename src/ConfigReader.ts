import {BulkstatSchema} from "./BulkstatSchema";
import {FileReader} from "./FileReader";
import {BulkstatConfig} from "./BulkstatConfig";


export class ConfigReader extends FileReader {
    protected constructor(filename: string) {
        super(filename);
    }

    async getBulkstatSchemaAsync(): Promise<BulkstatConfig> {
        const fd = await this.openFileAsync();
        const bulkstatConfig = new BulkstatConfig();
        let fileSection = "";
        while(1) {
            const line = await this.readLineAsync(fd);
            let matchRes = line.match(/\s+file (\d+)/);            
            if (matchRes) {
                fileSection = matchRes[1];
                if (bulkstatConfig.hasFileSection(fileSection)) {
                    throw new Error(`Bulkstat file collision. File ${fileSection}`);
                }
                bulkstatConfig.addFileSection(fileSection);
                continue;
            }
            matchRes = line.match(/(\S*)\s*schema (\S+) format (.*)/);
            if (matchRes) {
                const schema = BulkstatSchema.createSchemaFromStringFormat(matchRes[3], matchRes[2], matchRes[1]);
                bulkstatConfig.addSchema(schema, fileSection);
            }
            else if (line == null || (fileSection != "" && line.match(/[*][*][*] show/))) {
                await this.closeFileAsync(fd);
                return bulkstatConfig;
            }
        }
        await this.closeFileAsync(fd);
    }


    static createReader(filename: string): ConfigReader {
        return new ConfigReader(filename);
    }
}