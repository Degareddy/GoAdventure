import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserDataService } from 'src/app/Services/user-data.service';
import { LogComponent } from 'src/app/general/log/log.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';

@Component({
  selector: 'app-document-numbers',
  templateUrl: './document-numbers.component.html',
  styleUrls: ['./document-numbers.component.css']
})
export class DocumentNumbersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
 
}
