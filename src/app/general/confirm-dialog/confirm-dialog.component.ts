import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {
  title: string;
  message: SafeHtml;
  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogModel) {
    this.title = data.title;
    this.message = this.sanitizeMessage(data.message);
  }

  ngOnInit() {
  }
  sanitizeMessage(message: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(message);
  }

  onConfirm(): void {
    this.dialogRef.close("YES");
  }

  onDismiss(): void {
    this.dialogRef.close("NO");
  }
}

export class ConfirmDialogModel {

  constructor(public title: string, public message: string) {
  }
}
