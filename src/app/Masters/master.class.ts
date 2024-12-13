export class FileData {
    public company!: string
    public location!: string
    public tranType!: string
    public tranNo!: string
    public uploadedDate!: Date
    public fileType!: string
    public fileFullPath!: string
    public fileSizeMb!: number
    public unit!: string
    public mode!: string
    public user!: string
    public refNo!: string
    public file!: File
}


export class DelFileInfo {
    public mode!: string
    public company!: string
    public location!: string
    public tranType!: string
    public tranNo!: string
    public fileName!: string
    public user!: string
    public refNo!: string
  }