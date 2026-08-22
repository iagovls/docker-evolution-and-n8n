import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { PropertiesListComponent } from '../properties-list/properties-list';
import { PropertyFormComponent } from '../property-form/property-form';
import { PropertyImagesComponent } from '../property-images/property-images';
import { Imovel } from '../../../services/properties.service';

type ViewMode = 'list' | 'form' | 'images';

@Component({
  selector: 'app-properties-component',
  standalone: true,
  imports: [PropertiesListComponent, PropertyFormComponent, PropertyImagesComponent],
  template: `
    <div class="flex w-full h-full min-h-0 overflow-hidden">
      <div class="w-full h-full min-w-0 min-h-0 flex flex-col">
        @switch (viewMode()) {
          @case ('list') {
            <app-properties-list
              class="flex-1 min-h-0 w-full flex flex-col"
              (imovelSelected)="onImovelSelected($event)"
              (createNew)="onCreateNew()"
            />
          }
          @case ('form') {
            <app-property-form
              class="flex-1 min-h-0 w-full flex flex-col"
              [imovel]="selectedImovel()"
              [isNew]="isNew()"
              (goBack)="goToList()"
              (openImages)="goToImages()"
              (saved)="onImovelSaved($event)"
            />
          }
          @case ('images') {
            <app-property-images
              class="flex-1 min-h-0 w-full flex flex-col"
              [imovel]="selectedImovel()!"
              (goBack)="goToFormFromImages()"
              (principalChanged)="onPrincipalChanged($event)"
            />
          }
        }
      </div>
    </div>
  `,
})
export class PropertiesComponent implements OnDestroy {
  viewMode = signal<ViewMode>('list');
  selectedImovel = signal<Imovel | null>(null);
  isNew = signal(false);
  private bodyOverflow = '';

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (this.viewMode() === 'images') {
      event.preventDefault();
      this.goToFormFromImages();
    } else if (this.viewMode() === 'form') {
      event.preventDefault();
      this.goToList();
    }
  }

  onImovelSelected(imovel: Imovel | null) {
    if (!imovel) return;
    this.selectedImovel.set(imovel);
    this.isNew.set(false);
    this.viewMode.set('form');
  }

  onCreateNew() {
    this.selectedImovel.set(null);
    this.isNew.set(true);
    this.viewMode.set('form');
  }

  onImovelSaved(imovel: Imovel) {
    this.selectedImovel.set(imovel);
    if (this.isNew()) {
      this.isNew.set(false);
    }
  }

  goToList() {
    this.viewMode.set('list');
    this.selectedImovel.set(null);
    this.isNew.set(false);
  }

  goToImages() {
    if (this.selectedImovel()?.id) {
      this.viewMode.set('images');
    }
  }

  goToFormFromImages() {
    this.viewMode.set('form');
  }

  onPrincipalChanged(imovel: Imovel) {
    this.selectedImovel.set(imovel);
  }

  ngOnDestroy() {
    document.body.style.overflow = this.bodyOverflow;
  }
}
