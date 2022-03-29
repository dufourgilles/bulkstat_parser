
export class BulkstatSchema {
    constructor(readonly name: string, readonly schemaCounterNames: string[] = [], readonly type: string = 'system') {}

    getCounterNameAtPos(i: number): string {
        return this.schemaCounterNames[i];
    }

    findCounterPosByName(...names: string[]): number {
        for(let i = 0; i < this.schemaCounterNames.length; i++) {
            for(const name of names) {
                if (this.schemaCounterNames[i] == name) {
                    return i;
                }
            }
        }
        return -1;
    }

    static createSchemaFromStringFormat(format: string, name: string, type: string): BulkstatSchema {
        const formats = format.split(",");
        const formatName = formats[0] === "EMS" ? formats[1] : formats[2];
        return new BulkstatSchema(formatName, formats, type);
    }
}