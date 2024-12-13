import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.css']
})
export class MessageBoxComponent implements OnInit {
  @Input() msg!: string;
  @Input() classtype!: string;
  constructor() {
      this.msg ="";
      this.classtype="";
  }

  ngOnInit(): void {
  }

}
