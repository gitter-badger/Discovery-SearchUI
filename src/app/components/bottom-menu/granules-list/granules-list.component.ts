import {
  Component, OnInit, Input, ViewChild,
  ViewEncapsulation, Output, EventEmitter,
  HostListener
} from '@angular/core';

import { Observable, fromEvent } from 'rxjs';
import { tap, distinctUntilChanged, withLatestFrom, filter, map } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { AppState } from '@store';
import * as searchStore from '@store/search';
import * as granulesStore from '@store/granules';
import * as mapStore from '@store/map';
import * as uiStore from '@store/ui';

import { faFileDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { MatPaginator } from '@angular/material/paginator';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import * as services from '@services';
import { CMRProduct, SearchType, MapInteractionModeType, Props, datasetProperties, Platform } from '@models';

@Component({
  selector: 'app-granules-list',
  templateUrl: './granules-list.component.html',
  styleUrls: ['./granules-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GranulesListComponent implements OnInit {
  @Input() granules$: Observable<CMRProduct[]>;
  @Input() selected: string;
  @Input() platform: Platform;

  @Output() newSelected = new EventEmitter<string>();
  @Output() queueGranule = new EventEmitter<string>();
  @Output() newFocusedGranule = new EventEmitter<CMRProduct>();
  @Output() clearFocusedGranule = new EventEmitter<void>();

  @ViewChild(CdkVirtualScrollViewport, { static: true }) scroll: CdkVirtualScrollViewport;

  public granules: CMRProduct[];
  public pageSizeOptions = [5, 10];
  public pageSize = this.pageSizeOptions[0];
  public pageIndex = 0;

  public downloadIcon = faFileDownload;
  public queueIcon = faPlus;
  public searchType: SearchType;
  public selectedFromList = false;
  public p = Props;

  constructor(
    private store$: Store<AppState>,
    private mapService: services.MapService,
    private wktService: services.WktService,
    public prop: services.PropertyService,
  ) {}

  ngOnInit() {
    this.store$.select(granulesStore.getSelectedGranule).pipe(
      withLatestFrom(this.granules$),
      filter(([selected, _]) => !!selected),
      map(([selected, granules]) => granules.indexOf(selected)),
    ).subscribe(
      idx => {
        if (!this.selectedFromList) {
          this.scrollTo(idx);
        }

        this.selectedFromList = false;
      }
    );

    this.granules$.subscribe(
      granules => this.granules = granules
    );

    this.store$.select(searchStore.getIsLoading).subscribe(
      _ => this.scroll.scrollToOffset(0)
    );

    fromEvent(document, 'keydown').subscribe((e: KeyboardEvent) => {
      const { key } = e;

      switch ( key ) {
        case 'ArrowRight': {
          this.selectNextGranule();
          break;
        }
        case 'ArrowLeft': {
          this.selectPreviousGranule();
          break;
        }
      }
    });

    this.store$.select(uiStore.getSearchType).subscribe(
      searchType => this.searchType = searchType
    );
  }

  private selectNextGranule(): void {
    this.store$.dispatch(new granulesStore.SelectNextGranule());
  }

  private selectPreviousGranule(): void {
    this.store$.dispatch(new granulesStore.SelectPreviousGranule());
  }

  private scrollTo(idx: number): void {
    this.scroll.scrollToIndex(idx);
  }

  public onGranuleSelected(name: string): void {
    this.selectedFromList = true;
    this.newSelected.emit(name);
  }

  public onQueueGranule(e: Event, groupId: string): void {
    this.queueGranule.emit(groupId);

    e.stopPropagation();
  }

  public onSetFocusedGranule(granule: CMRProduct): void {
    this.newFocusedGranule.emit(granule);
  }

  public onClearFocusedGranule(): void {
    this.clearFocusedGranule.emit();
  }

  public clearResults(): void {
    this.store$.dispatch(new granulesStore.ClearGranules());

    if (this.searchType === SearchType.DATASET) {
      this.store$.dispatch(
        new mapStore.SetMapInteractionMode(MapInteractionModeType.DRAW)
      );
    }
  }

  public onZoomTo(granule: CMRProduct): void {
    const features = this.wktService.wktToFeature(
      granule.metadata.polygon,
      this.mapService.epsg()
    );

    this.mapService.zoomTo(features);
  }
}
