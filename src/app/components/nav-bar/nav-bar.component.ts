import { Component, OnInit, EventEmitter, Output, ViewChild, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import {
  trigger, state, style, animate, transition
} from '@angular/animations';

import { Subject } from 'rxjs';
import { tap, map, filter, delay } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { Store, ActionsSubject } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { ClipboardService } from 'ngx-clipboard';

import { AppState } from '@store';
import * as searchStore from '@store/search';
import * as uiStore from '@store/ui';
import * as queueStore from '@store/queue';

import { MapService, WktService, LegacyAreaFormatService } from '@services';

import { MatDialog } from '@angular/material/dialog';
import { QueueComponent } from '@components/nav-bar/queue';

import * as models from '@models/index';
import * as filtersStore from '@store/filters';

enum BreadcrumbFilterType {
  SEARCH_TYPE = 'Search Type',
  DATASET = 'Dataset',
  DATE = 'Date',
  AOI = 'Area of Interest',
  PATH_FRAME = 'Path/Frame',
  ADDITIONAL = 'Additional Filters',
  FILTERS_MENU = '...',
  NONE = 'None'
}

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],

  animations: [
    trigger('fadeTransition', [
      transition(':enter', [
        style({opacity: 0}),
        animate('100ms ease-in', style({opacity: 1}))
      ]),
      transition(':leave', [
        style({opacity: 1}),
        animate('100ms ease-out', style({opacity: 0}))
      ])
    ])
  ],
})
export class NavBarComponent implements OnInit {
  @Input() isLoading: boolean;

  @ViewChild('polygonForm', { static: false }) public polygonForm: NgForm;

  public aoiErrors$ = new Subject<void>();
  public isAOIError = false;
  public isHoveringAOISelector = false;

  public filterTypes = BreadcrumbFilterType;
  public selectedFilter = BreadcrumbFilterType.NONE;

  public searchType: models.SearchType = models.SearchType.DATASET;
  public searchTypes = models.SearchType;

  public polygon: string;

  public queuedProducts$ = this.store$.select(queueStore.getQueuedProducts);

  constructor(
    private store$: Store<AppState>,
    private actions$: ActionsSubject,
    private legacyAreaFormat: LegacyAreaFormatService,
    private mapService: MapService,
    private wktService: WktService,
    private dialog: MatDialog,
    private clipboard: ClipboardService,
  ) { }

  ngOnInit() {
    this.store$.select(uiStore.getSearchType).pipe(
      tap(() => this.clearSelectedBreadcrumb())
    ).subscribe(
      searchType => this.searchType = searchType
    );

    this.actions$.pipe(
      ofType<searchStore.MakeSearch>(searchStore.SearchActionType.MAKE_SEARCH),
    ).subscribe(
      _ => this.onSearch()
    );

    const polygon$ = this.mapService.searchPolygon$;
    polygon$.subscribe(
      p => this.polygon = p
    );

    this.handleAOIErrors();
  }

  public onSearch(): void {
    this.clearSelectedBreadcrumb();
  }

  public onClearSearch(): void {
    this.store$.dispatch(new searchStore.ClearSearch());
  }

  public onOpenDownloadQueue(): void {
    this.dialog.open(QueueComponent, {
      id: 'dlQueueDialog',
    });
  }

  public clearSelectedBreadcrumb(): void {
    this.store$.dispatch(new uiStore.CloseFiltersMenu());
    this.selectedFilter = BreadcrumbFilterType.NONE;
  }

  public onInputSearchPolygon(polygon: string): void {
    if (this.legacyAreaFormat.isValid(polygon)) {
      polygon = this.legacyAreaFormat.toWkt(polygon);
    }

    this.loadWKT(polygon);
  }

  private productType$() {
    return this.store$.select(filtersStore.getProductTypes).pipe(
      map(types => types.map(type => type.apiValue)),
      map(
        types => Array.from(new Set(types))
          .join(',')
      ),
      map(types => ({ processinglevel: types }))
    );
  }

  private loadWKT(polygon: string): void {
    try {
      const features = this.wktService.wktToFeature(
        polygon,
        this.mapService.epsg()
      );

      this.mapService.setDrawFeature(features);
    } catch (e) {
      this.aoiErrors$.next();
    }
  }

  public onNewSelectedFilter(filterType: BreadcrumbFilterType): void {
    this.selectedFilter = this.selectedFilter === filterType ?
      BreadcrumbFilterType.NONE : filterType;

    this.store$.dispatch(new uiStore.CloseFiltersMenu());
  }

  public onToggleFiltersMenu(): void {
    this.store$.dispatch(new uiStore.ToggleFiltersMenu());
    this.selectedFilter = BreadcrumbFilterType.NONE;
  }

  public onCopy(): void {
    this.clipboard.copyFromContent(this.polygon);
  }

  private handleAOIErrors(): void {
    this.aoiErrors$.pipe(
      tap(_ => {
        this.isAOIError = true;
        this.mapService.clearDrawLayer();
        this.polygonForm.reset();
        this.polygonForm.form
          .controls['searchPolygon']
          .setErrors({'incorrect': true});
      }),
      delay(820),
    ).subscribe(_ => {
      this.isAOIError = false;
      this.polygonForm.form
        .controls['searchPolygon']
        .setErrors(null);
    });
  }
}

