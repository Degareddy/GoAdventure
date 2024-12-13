import { Component, ComponentFactoryResolver, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-side-overlay',
  templateUrl: './side-overlay.component.html',
  styleUrls: ['./side-overlay.component.css']
})
export class SideOverlayComponent implements OnInit, OnDestroy {

  @ViewChild('content', { read: ViewContainerRef, static: false })
  public panelContentRef!: ViewContainerRef;

  public isPanelVisible: boolean = false;
  // public panelContentRef!: ViewContainerRef;
  private _sidePanelServiceSubject$ = new Subject<void>();

  constructor(private _componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnInit(): void {}

  public open(component: Type<any>): void {
    this.isPanelVisible = true;
    // this._setPanelContent(component);
    setTimeout(() => { // Use setTimeout to ensure `panelContentRef` is initialized after view update
      if (this.panelContentRef) {
        this._setPanelContent(component);
      } else {
        console.error('panelContentRef is not initialized.');
      }
    }, 0);
  }

  public close(): void {
    this.isPanelVisible = false;
  }

  private _setPanelContent(component: Type<any>) {
    if (this.panelContentRef) {
      const componentFactory = this._componentFactoryResolver.resolveComponentFactory(component);
      this.panelContentRef.clear();
      this.panelContentRef.createComponent(componentFactory);
    } else {
      console.error('panelContentRef is not initialized.');
    }
    // const componentFactory = this._componentFactoryResolver.resolveComponentFactory(component);
    // this.panelContentRef.clear();
    // this.panelContentRef.createComponent(componentFactory);
  }

  ngOnDestroy() {
    this._sidePanelServiceSubject$.next();
    this._sidePanelServiceSubject$.complete();
  }
}
