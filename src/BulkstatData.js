const { createSchemaFromStringFormat } = require("./BulkstatSchema")

//EMS,Card2,20200525,070000,4,7.65,30.05,8.86,30.17,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0.00,0.00,0,0.00,0.00,34,34,34,49.57,130.74,50.33,131.73,50.78,141.70,51.54,142.61,50.83,141.90,51.58,142.86,4,7.61,21.80,8.03,21.91,0,0.00,0.00,0.00,0.00,1,6.86,8.07,6.86,8.07,1,14.13,15.74,14.13,15.74,0,0.00,0.00,0.00,0.00
//      card schema Card2 format EMS,Card2,%date%,%time%,%card%,%task-sessmgr-avgcpu%,%task-sessmgr-avgmem%,%task-sessmgr-maxcpu%,%task-sessmgr-maxmem%,%task-a11mgr-num%,%task-a11mgr-maxcpu%,%task-a11mgr-maxmem%,%task-l2tpmgr-num%,%task-l2tpmgr-maxcpu%,%task-l2tpmgr-maxmem%,%task-famgr-num%,%task-famgr-maxcpu%,%task-famgr-maxmem%,%task-hamgr-num%,%task-hamgr-maxcpu%,%task-hamgr-maxmem%,%task-acsmgr-num%,%task-acsmgr-avgcpu%,%task-acsmgr-avgmem%,%task-acsmgr-maxcpu%,%task-acsmgr-maxmem%,%task-vpnmgr-num%,%task-vpnmgr-maxcpu%,%task-vpnmgr-maxmem%,%npuutil-now%,%npuutil-5minave%,%npuutil-15minave%,%npuutil-rxpkts-5secave%,%npuutil-rxbytes-5secave%,%npuutil-txpkts-5secave%,%npuutil-txbytes-5secave%,%npuutil-rxpkts-5minave%,%npuutil-rxbytes-5minave%,%npuutil-txpkts-5minave%,%npuutil-txbytes-5minave%,%npuutil-rxpkts-15minave%,%npuutil-rxbytes-15minave%,%npuutil-txpkts-15minave%,%npuutil-txbytes-15minave%,%task-mmemgr-num%,%task-mmemgr-avgcpu%,%task-mmemgr-avgmem%,%task-mmemgr-maxcpu%,%task-mmemgr-maxmem%,%task-imsimgr-num%,%task-imsimgr-avgcpu%,%task-imsimgr-avgmem%,%task-imsimgr-maxcpu%,%task-imsimgr-maxmem%,%task-linkmgr-num%,%task-linkmgr-avgcpu%,%task-linkmgr-avgmem%,%task-linkmgr-maxcpu%,%task-linkmgr-maxmem%,%task-gbmgr-num%,%task-gbmgr-avgcpu%,%task-gbmgr-avgmem%,%task-gbmgr-maxcpu%,%task-gbmgr-maxmem%,%task-mmgr-num%,%task-mmgr-avgcpu%,%task-mmgr-avgmem%,%task-mmgr-maxmem%,%task-mmgr-maxcpu%
//  port schema port format EMS,Port,%date%,%time%,%card%,%port%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpackets%,%rxdiscbytes%,%rxdiscpackets%,%txdiscbytes%,%txdiscpackets%,%maxrate%,%frag-rcvd%,%pkt-reassembled%,%frag-tokernel%,%util-rx-curr%,%util-tx-curr%,%util-rx-5min%,%util-tx-5min%,%util-rx-15min%,%util-tx-15min%,%port-5peak-rx-util%,%port-5peak-tx-util%,%port-15peak-rx-util%,%port-15peak-tx-util%,%rxerrorbytes%,%rxerrorpackets%,%txerrorbytes%,%txerrorpackets%
module.exports = class BulkstatData {
    /**
     * 
     * @param {(number|string)[]} rawData 
     */
    constructor(rawData) {
        this._rawData = rawData;
        this._schema = null;
        this._name = null;
    }

    getData() {
        return this._rawData;
    }

    /**
     * 
     * @param {BulkstatSchema} bulkstatSchema 
     */
    setSchema(bulkstatSchema) {
        this._schema = bulkstatSchema;
    }

    /**
     * @returns {string}
     */
    getSchemaName() {
        if (this._rawData && this._rawData.length > 2) {
            return  this._rawData[0] === 'EMS' ? this._rawData[1] : this._rawData[2];
        }
    }

    _getCardStatName(cardPos) {
        const portPos = this._schema.findCounterByName("%port%");
        this._name = `${this.getSchemaName()}/Card-${this._rawData[cardPos]}${portPos >= 0 ? "/Port-" + this._rawData[portPos] : ""}}`;
        return this._name;
    }

    /**
     * @returns {string}
     */
    getStatName() {
        if (this._name != null) {
            return this._name;
        }
        if (this._schema == null) {
            throw new Error("No schema available.");
        }
        const cardPos = this._schema.findCounterByName("%card%");
        if (cardPos >= 0 ) { 
            const portPos = this._schema.findCounterByName("%port%");
            this._name = `${this.getSchemaName()}/Card-${this._rawData[cardPos]}${portPos >= 0 ? "/Port-" + this._rawData[portPos] : ""}`;
            return this._name;
        }
        //%mcc%,%mnc%,%lac%,%rac%
        const lacPos = this._schema.findCounterByName("%lac%");
        const vpnNamePos = this._schema.findCounterByName("%vpnname%", "%vpn-name%");
        const servnamePos = this._schema.findCounterByName("%servname%", "%service-name%");
        if (lacPos >= 0) {
            const racPos = this._schema.findCounterByName("%rac%");
            const mncPos = this._schema.findCounterByName("%mnc%");
            const mccPos = this._schema.findCounterByName("%mcc%");
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this._rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0? "/SERVICE-" + this._rawData[servnamePos] : ""}`+
                `/LAC` +
                `${mncPos >= 0 ? "-" + this._rawData[mncPos] : ""}` +
                `${mccPos >= 0 ? "-" + this._rawData[mccPos] : ""}`+
                `-${this._rawData[lacPos]}`+
                `${racPos >= 0 ? "-" + this._rawData[racPos] : ""}`;
            return this._name;
        }
        //%iups-service%,%rnc-address%
        const rncPos = this._schema.findCounterByName("%rnc-address%");
        const iupsPos = this._schema.findCounterByName("%iups-service%");
        if (iupsPos >= 0 || rncPos >= 0) {
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this._rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0 ? "/SERVICE-" + this._rawData[servnamePos] : ""}`+
                `${iupsPos >= 0 ? "/IUPS-" + this._rawData[iupsPos] : ""}` +
                `${rncPos >= 0 ? "/RNC-" + this._rawData[rncPos] : ""}`;
            return this._name;
        }
        // %nse-id%
        const nsePos = this._schema.findCounterByName("%nse-id%");
        if (nsePos >= 0) {
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this._rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0 ? "/SERVICE-" + this._rawData[servnamePos] : ""}`+
                `/NSE-${this._rawData[nsePos]}`;
            return this._name;
        }
        //%tai-mnc%,%tai-mcc%
        const tacPos = this._schema.findCounterByName("%tai-tac%");
        if (tacPos >= 0 ) {
            const mncPos = this._schema.findCounterByName("%tai-mnc%");
            const mccPos = this._schema.findCounterByName("%tai-mcc%");
            this._name = `${this.getSchemaName()}/TAI` +
                `${mncPos >= 0 ? "-" + this._rawData[mncPos] : ""}` +
                `${mccPos >= 0 ? "-" + this._rawData[mccPos] : ""}`+
                `${"-" + this._rawData[tacPos]}`;
            return this._name;
        }
        
        if (vpnNamePos >= 0 || servnamePos >= 0) {
            this._name = `${this.getSchemaName()}` + 
                `${vpnNamePos >= 0? "/VPN-" + this._rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0? "/SERVICE-" + this._rawData[servnamePos] : ""}`;
            return this._name;
        }
        return this.getSchemaName();
        
    }

    static createFromString(txt) {
        return new BulkstatData(txt.trim().split(","));
    }
}