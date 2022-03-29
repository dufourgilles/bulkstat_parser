import { BulkstatAnalyzer } from "./BulkstatAnalyzer";
import { BulkstatConfig } from "./BulkstatConfig";
import { BulkLineIdentifier } from "./BulkstatLine";
import { StatRecords } from "./BulkstatReader";
import { BulkstatSchema } from "./BulkstatSchema";

interface LinePointer {
    line: string;
    pos: number;
}

export class BulkFormula {    
    constructor(readonly formula: string, readonly bsData: StatRecords[], readonly bsAnalyzer: BulkstatAnalyzer, readonly bsConfig: BulkstatConfig) {}

    //(%tun-sent-cresessrespaccept%+%tun-sent-cresessrespdeniedUserAuthFailed%+%tun-sent-cresessrespdeniedPrefPdnTypeUnsupported%+%tun-sent-cresessrespdeniedCtxtNotFound%) / %tun-recv-cresess%  * 100
    protected extractStatNames(formula: string): string[] {
        const statNames = [];
        let insideKey = false;
        let key = "";
        for(let index = 0; index < formula.length; index++) {
            if (insideKey) {
                if (formula[index] == '%') {
                    insideKey = false;
                    //console.log("end of key", key);
                    statNames.push(`%${key}%`);
                    key = "";
                } else {
                    key += formula[index];
                }
            } else if (formula[index] == '%') {
                //console.log("start of key");
                insideKey = true
            }
        }
        return statNames;
    }

    protected getCounterLineIdentifier(statName: string): string[] {
        //console.log("looking for ", statName);
        const m = statName.match(/[%]?([^@%]+)([@][^%]+)?[%]?/);
        if (m[2] != null) {
            // We have the schema in the name
            return [m[2].slice(1)];
        }
        return this.bsAnalyzer.getStatLineIdentifiers(statName);
    }

    computeKPI() {
        const counterNames = this.extractStatNames(this.formula);
        //console.log("statNames", statNames);
        const counterLineIdentifiers = counterNames.map(name => this.getCounterLineIdentifier(name));
        //console.log("extendedSchemaNames", extendedSchemaNames);
        let needMoreInfo = false;
        for (let i = 0; i <  counterLineIdentifiers.length; i++) {
            if (counterLineIdentifiers[i].length > 1) {
                console.log("Please chose which extact stat");
                console.log(counterLineIdentifiers[i].map(sch => `${counterNames[i].slice(0,counterNames[i].length - 1)}@${sch}%`));
                needMoreInfo = true;
            }
        }
        if (needMoreInfo) {
            process.exit(0);
        }
        const schemas: Map<BulkLineIdentifier, BulkstatSchema> = new Map();
        counterLineIdentifiers.forEach(lineIdentifiers => {
            if (schemas.has(lineIdentifiers[0])) { // should be only one as we do the check above
                return; // We already have it. No need to add it a second time.
            }
            schemas.set(lineIdentifiers[0], this.bsConfig.getSchemaFromStatLineIdentifier(lineIdentifiers[0]));
        })

        //console.log("schemas", schemas);
        
        const kpiValues = this.bsData.map(data => {
            let convertedFormula = this.formula;
            counterNames.forEach((name, index) => {
                let counterInfo = name.match(/([^%]+)[@]([^%]+)/);
                if (counterInfo == null) {
                    counterInfo = [
                        "single",
                        name,
                        counterLineIdentifiers[index][0]
                    ]
                }
                const schema = schemas.get(counterInfo[2]);
                if (schema == null) {
                    throw new Error(`Schema not found ${counterInfo[2]}`);
                }
                const pos = schema.findCounterPosByName(`%${counterInfo[1]}%`);
                //console.log(counterInfo[1], counterInfo[2], pos);
                const value = `${data[counterInfo[2]].data[pos]}`;
                convertedFormula = convertedFormula.replace(name, value);
            });

            const val = this.computeParentheses({line: convertedFormula, pos: 0});
            //console.log(convertedFormula, val);
            return val;
        });
        console.log("KPI");
        console.log(kpiValues);
    }

    protected computeOperand(left: number, right: number, operand: string | null) {
        //console.log("op", left,right, operand);
        switch(operand) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '/':
                return left / right;
            case '*':
                return left * right;
            case null:
                return right;
            default:
                throw new Error(`Unknown operand ${operand}`);
        }
    }

    protected computeParentheses(data: LinePointer): number {
        let leftOperand = 0;
        let rightOperand = 0;
        let operand = null;
        let acc = '';
        const line = data.line;
        for(; data.pos < line.length; data.pos++) {
            if (line[data.pos] === '(') {
                //console.log("open");
                data.pos++; // skip parentheses
                leftOperand = this.computeOperand(leftOperand, this.computeParentheses(data), operand);
                //console.log("Close:", leftOperand)
            } else if (line[data.pos] >= '0' && line[data.pos] <= '9') {
                acc += line[data.pos];
            } else if (['+', '-', '*', '/'].includes(line[data.pos])) {       
                if (acc.length > 0) {         
                    leftOperand = this.computeOperand(leftOperand, Number(acc), operand);
                    acc = '';
                }
                operand = line[data.pos];
            } else if (line[data.pos] === ' ' || line[data.pos] === '\t') {
                continue;
            } else if (line[data.pos] === ')') {
                data.pos++; // skip parentheses
                rightOperand = Number(acc);
                const res = this.computeOperand(leftOperand, rightOperand, operand);
                return res;
            }
        }
        rightOperand = Number(acc);
        return this.computeOperand(leftOperand, rightOperand, operand);
    }
}


// "(%tun-sent-cresessrespaccept@egtpcSch1/VPN-gwctx/SERVICE-egtp-sgw-s11%+%tun-sent-cresessrespdeniedUserAuthFailed@egtpcSch16/VPN-gwctx/SERVICE-egtp-sgw-s11%+%tun-sent-cresessrespdeniedPrefPdnTypeUnsupported@egtpcSch16/VPN-gwctx/SERVICE-egtp-sgw-s11%+%tun-sent-cresessrespdeniedCtxtNotFound@egtpcSch16/VPN-gwctx/SERVICE-egtp-sgw-s11%) / %tun-recv-cresess@egtpcSch1/VPN-gwctx/SERVICE-egtp-sgw-s11%  * 100"