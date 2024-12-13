export class Customer {
   public mode!: string
   public company!: string
   public location!: string
   public groupName!: string
   public code!: string
   public custName!: string
   public effectiveDate!: Date
   public custStatus!: string
   public vATPINNo!: string
   public currency!: string
   public payTerm!: string
   public pricing!: string
   public maxCrLimit!: number
   public secuItemDesc!: string
   public salesExecutive!: string
   public notes!: string
   public refNo!: string
   public user!: string
}

export class Address {
   public mode!: string
   public company!: string
   public location!: string
   public code!: string
   public slNo!: number
   public address1!: string
   public address2!: string
   public address3!: string
   public pO_PIN_ZIP!: string
   public city!: string
   public province!: string
   public country!: string
   public phone1!: string
   public phone2!: string
   public phone3!: string
   public fax!: string
   public eMail!: string
   public currStatus!: string
   public notes!: string
   public user!: string
}

export class CustomerParams {
   public company!: string
   public location!: string
   public code !: string
   public slNo!: number
   public contactId ?: number
   public user !: string
   public refNo!: string
}

export class Contact {
   public mode!: string
   public company!: string
   public location!: string
   public code!: string
   public slNo!: number
   public contactID!: number
   public contactName!: string
   public department!: string
   public designation!: string
   public phone1!: string
   public phone2!: string
   public phone3!: string
   public eMail!: string
   public currStatus!: string
   public remarks!: string
   public user!: string
}