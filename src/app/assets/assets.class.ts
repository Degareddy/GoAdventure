export class assetTransfer {
    public company!: string
    public location!: string
    public langID!: number
    public tranNo!: string
    public tranDate!: Date
    public fromCustodian!: string
    public fromDepartment!: string
    public fromLocation!: string
    public toCustodian!: string
    public toDepartment!: string
    public toLocation!: string
    public tranStatus!: string
    public remarks!: string
    public mode!: string
    public user!: string
    public refNo!: string
}

export class assetAMc {
    public company!: string
    public location!: string
    public tranNo!: string
    public aMCType!: string
    public tranDate!: Date
    public supplier!: string
    public effectiveDate!: Date
    public expiryDate!: Date
    public aMCAmount!: number
    public tranStatus!: string
    public notes!: string
    public refNo!: string
    public mode!: string
    public user!: string
}

export class insurance {
    public company!: string
    public location!: string
    public tranNo!: string
    public insType!: string
    public tranDate!: Date
    public insCompany!: string
    public policyNo!: string
    public effectiveDate!: Date
    public expiryDate!: Date
    public annualPremium!: number
    public policyAmt!: number
    public tranStatus!: string
    public notes!: string
    public refNo!: string
    public mode!: string
    public user!: string
}

export class AssetDetails {
    public company!: string
    public location!: string
    public groupID!: string
    public groupCode!:string;
    public assetID!: string
    public assignedSlNo!: string
    public assetDesc!: string
    public uom!: string
    public asstLocation!: string
    public initialValue!: number
    public supplier!: string
    public make!: string
    public model!: string
    public mfrSerial!: string
    public condition!: string
    public addedOn!: Date
    public depLevel!: string
    public applyOn!: string
    public depType!: string
    public depRate!: number
    public currValue!: number
    public disposedValue!: number
    public disposedOn!: Date
    public lifeYears!: number
    public lifeMonths!: number
    public assetStatus!: string
    public remarks!: string
    public currentCustodian!: string
    public custodianName!: string
    public applyWarranty!: boolean
    public warrExpiry!: Date
    public warrDesc!: string
    public refNo!: string
    public mode!: string
    public user!: string
    public quantity!:number;
}

export class AssetTranfer {
    public company!: string
    public location!: string
    public langID!: number
    public tranNo!: string
    public tranDate!: Date
    public fromCustodian!: string
    public fromCustodianName!: string
    public fromDepartment!: string
    public fromLocation!: string
    public toCustodian!: string
    public toCustodianName!: string
    public toDepartment!: string
    public toLocation!: string
    public tranStatus!: string
    public remarks!: string
    public refNo!: string
    public mode!: string
    public user!: string
}

export class assetConditions {
    public company!: string
    public location!: string
    public mode!: string
    public langID!: number
    public condCode!: string
    public condition!: string
    public condDate!: string
    public usable!: boolean
    public itemStatus!: string
    public notes!: string
    public user!: string
    public refNo!: string

}
// export class assetCondition{
//     public company! : string
// public location! : string
// public condCode! : string
// public condition! : string
// public condDate! : Date
// public usable! : boolean
// public itemStatus! : string
// public notes! : string
// }
export class assetLeasing {
    public company!: string
    public location!: string
    public langID!: number
    public tranNo!: string
    public tranDate!: Date
    public customer!: string
    public tranStatus!: string
    public remarks!: string
    public refNo!: string
    public mode!: string
    public user!: string
}

export class assetleaseDetailsHdr {
    public company!: string
    public location!: string
    public langID!: number
    public tranNo!: string
    public slNo!: number
    public assetID!: string
    public traceNo!: string
    public returnDate!: Date
    public retCondition!: string
    public leaseAmount!: number
    public damageCharges!: number
    public totalAmount!: number
    public paidAmount!: number
    public balAmount!: number
    public refNo!: string
    public mode!: string
    public user!: string
}

export class assetAMCDetails {
    public company!: string
    public location!: string
    public tranNo!: string
    public slNo!: number
    public traceNo!: string
    public assetDesc!: string
    public refNo!: string
    public mode!: string
    public user!: string
}

export class assetTranferDetails {
    public company!: string
    public location!: string
    public langId!: number
    public tranNo!: string
    public slNo!: number
    public assetID!: string
    public remarks!: string
    public user!: string
    public mode!: string
    public assetDesc!: string
    public assignedSlNo!: string
    public refNo!: string
}

export class AssetGroups {
    public company!: string
    public location!: string
    public itemGroupID!: string
    // public itemGroupCode!: string
    public itemGroupDesc!: string
    public effectiveDate!: string
    public groupStatus!: string
    public notes!: string
    public depOn!: string
    public depType!: string
    public depValue!: number
    public refNo!: string
    public mode!: string
    public user!: string
}
