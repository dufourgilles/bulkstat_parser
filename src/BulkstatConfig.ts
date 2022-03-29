import { BulkLineIdentifier } from "./BulkstatLine";
import {BulkstatSchema} from "./BulkstatSchema";

interface ConfigSection {
    id: string;
    all: BulkstatSchema[];
    schemas: Record<string, BulkstatSchema>;
}

export class BulkstatConfig {
    protected _config: Record<string, ConfigSection> = {};

    hasFileSection(filename: string): boolean {
        return this._config[filename] != null;
    }

    hasSchema(schema: BulkstatSchema, file: string | null = null): boolean {
        return this.getSchemaByName(schema.name, file) != null;
    }


    addFileSection(filename: string): void {
        if (this.hasFileSection(filename)) {
            throw new Error(`File ${filename} already present.`)
        }
        this._config[filename] = {
            id: filename,
            all: [],
            schemas: {}
        }
    }

    addSchema(schema: BulkstatSchema, filename: string): void {
        if (!this.hasFileSection(filename)) {
            throw new Error(`File ${filename} unknown.`)
        }
        if (this.hasSchema(schema, filename)) {
            throw new Error(`Duplicate schema name ${schema.name} in file ${filename}`);
        }
        this._config[filename].all.push(schema);
        this._config[filename].schemas[schema.name] = schema;
    }

    getSchemaByName(name: string, file?: string): BulkstatSchema | null {
        if (file) {
            if (!this.hasFileSection(file)) {
                return null;
            }
            return this._config[file].schemas[name];
        }
        for(const file in this._config) {
            const schema = this.getSchemaByName(name, file);
            if (schema != null) {
                return schema;
            }
        }
        return null;
    }

    findSchemaNameWithStatName(statName: string): string[] {
        const result: string[] = [];
        for(let file in this._config) {
            for(let schemaName in this._config[file].schemas) {
                const schema = this._config[file].schemas[schemaName];
                if (schema.findCounterPosByName(statName) >= 0) {
                    result.push(schemaName);
                }
            }
        }
        return result;
    }

    getSchemaFromStatLineIdentifier(statLineIdentified: BulkLineIdentifier): BulkstatSchema | null {
        const index = statLineIdentified.indexOf("/");
        const schemaName = index > 0 ? statLineIdentified.slice(0, index) : statLineIdentified;
        return this.getSchemaByName(schemaName);
    }
}