import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SubSink } from 'subsink';

import { filter, map, tap, debounceTime, first, distinctUntilChanged, delay, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AppState } from '@store';
import * as scenesStore from '@store/scenes';
import * as queueStore from '@store/queue';
import * as uiStore from '@store/ui';
import * as searchStore from '@store/search';

import * as models from '@models';
import { BrowseMapService, DatasetForProductService, SarviewsEventsService } from '@services';
import * as services from '@services/index';
import { SarviewProductGranule, SarviewsProduct } from '@models';
import { ClipboardService } from 'ngx-clipboard';
import { MatSliderChange } from '@angular/material/slider';
import { PinnedProduct } from '@services/browse-map.service';

@Component({
  selector: 'app-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrls: ['./image-dialog.component.scss'],
  providers: [ BrowseMapService ]
})
export class ImageDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  public scene$ = this.store$.select(scenesStore.getSelectedScene);
  public browses$ = this.store$.select(scenesStore.getSelectedSceneBrowses);
  public sarviewsEventProducts$ = this.store$.select(scenesStore.getSelectedSarviewsEventProducts);
  public sarviewsEventBrowses$ = this.store$.select(scenesStore.getSelectedSarviewsEventProductBrowses);
  public sarviewsEvent$ = this.store$.select(scenesStore.getSelectedSarviewsEvent);
  public masterOffsets$ = this.store$.select(scenesStore.getMasterOffsets);
  public searchType$ = this.store$.select(searchStore.getSearchType);
  public searchTypes = models.SearchType;
  public onlyShowScenesWithBrowse: boolean;
  public queuedProductIds: Set<string>;
  public scene: models.CMRProduct;
  public sarviewsEvent: models.SarviewsEvent;
  public currentSarviewsProduct: models.SarviewsProduct;
  public products: models.CMRProduct[];
  public sarviewsProducts: models.SarviewsProduct[];
  public dataset: models.Dataset;
  public isImageLoading = false;
  public isShow = false;
  public currentBrowse = null;
  public paramsList: any;

  public breakpoint$ = this.screenSize.breakpoint$.pipe(distinctUntilChanged((a, b) => a === b));
  public breakpoints = models.Breakpoints;

  private image: HTMLImageElement = new Image();
  private subs = new SubSink();

  private pinnedProducts: {[product_id in string]: PinnedProduct} = {};

  constructor(
    private store$: Store<AppState>,
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    private browseMap: BrowseMapService,
    private datasetForProduct: DatasetForProductService,
    private screenSize: services.ScreenSizeService,
    private clipboard: ClipboardService,
    private notificationService: services.NotificationService,
    private sarviewsService: SarviewsEventsService,
  ) { }

  ngOnInit() {
    this.subs.add(
      this.store$.select(scenesStore.getSelectedSceneProducts).subscribe(
        products => {
          this.products = products;
        }
      )
    );

    this.subs.add(
      this.store$.select(scenesStore.getAllProducts).pipe(
        first(),
        withLatestFrom(this.searchType$),
        filter(([_, searchtype]) => searchtype !== models.SearchType.SARVIEWS_EVENTS),
        map(([products, _]) => products)
      ).subscribe(
        products => {
          if (!!products) {
            this.pinnedProducts = {};
            products.forEach(prod => this.pinnedProducts[prod.id] = {
              isPinned: false,
              url: prod.browses[0],
              wkt: prod.metadata.polygon,
            });

            this.store$.dispatch(new scenesStore.SetImageBrowseProducts(this.pinnedProducts));
          }
        }
      )
    );

    this.subs.add(
      this.store$.select(uiStore.getOnlyScenesWithBrowse).subscribe(
        onlyBrowses => this.onlyShowScenesWithBrowse = onlyBrowses
      )
    );

    this.subs.add(
      this.store$.select(queueStore.getQueuedProductIds).pipe(
        map(names => new Set(names))
      ).subscribe(queuedProducts => this.queuedProductIds = queuedProducts)
    );

    this.subs.add(
      this.scene$.pipe(
        filter(g => !!g),
        tap(g => this.scene = g),
        map(scene => this.datasetForProduct.match(scene)),
      ).subscribe(dataset => this.dataset = dataset)
    );
    this.subs.add(
      this.scene$.pipe(
        filter(prod => !!prod?.metadata)
      ).subscribe( prod => {
        this.paramsList = this.jobParamsToList(prod.metadata);
      }
    )
    );
    this.subs.add(
      this.sarviewsEventProducts$.pipe(
        first(),
        withLatestFrom(this.searchType$),
        filter(([_, searchtype]) => searchtype === models.SearchType.SARVIEWS_EVENTS),
        map(([products, _]) => products),
      ).subscribe(
        products => {
          this.sarviewsProducts = products;
          if (!!this.sarviewsProducts) {
            this.pinnedProducts = {};
            this.sarviewsProducts.forEach(prod => this.pinnedProducts[prod.product_id] = {
              isPinned: false,
              url: prod.files.browse_url,
              wkt: prod.granules[0].wkt,
            });

            this.store$.dispatch(new scenesStore.SetImageBrowseProducts(this.pinnedProducts));
          }
        }
      )
    );

    this.subs.add(
      this.store$.select(scenesStore.getImageBrowseProducts).subscribe(browseStates => this.pinnedProducts = browseStates)
    );

    this.subs.add(
      this.sarviewsEvent$.subscribe(
        event => this.sarviewsEvent = event
      )
    );
    this.subs.add(
      this.store$.select(scenesStore.getSelectedSarviewsProduct).pipe(
        delay(100),
      ).subscribe(
        product => {
          if (!!product) {
            this.onNewSarviewsBrowseSelected(product);
          }
        }
      )
    );
  }

  ngAfterViewInit() {
    this.subs.add(
      this.scene$.pipe(
        filter(scene => !!scene),
        debounceTime(250)
      ).subscribe(
        scene => {
          this.currentBrowse = scene.browses[0];
          this.loadBrowseImage(scene, this.currentBrowse);
        }
      )
    );
    this.subs.add(
      this.sarviewsEventProducts$.pipe(
        withLatestFrom(this.searchType$),
        filter(([_, searchtype]) => searchtype === models.SearchType.SARVIEWS_EVENTS),
        map(([products, _]) => products),
        filter(products => !!products),
        debounceTime(500),
        first(),
      ).subscribe(
        products => {
          if (!this.currentSarviewsProduct) {
            this.currentBrowse = products[0].files.product_url;
            this.loadSarviewsBrowseImage(products[0]);
          }
        }
      )
    );
  }

  private loadBrowseImage(scene: models.CMRProduct, browse): void {
    this.isImageLoading = true;
    this.image = new Image();
    const browseService = this.browseMap;
    const currentScene = this.scene;
    const self = this;

    this.image.addEventListener('load', function() {
      if (currentScene !== scene) {
        return;
      }

      self.isImageLoading = false;

      const wkt = scene.metadata.polygon;

      browseService.setBrowse(browse, wkt);
    });

    this.image.src = browse;
  }

  private loadSarviewsBrowseImage(product: SarviewsProduct): void {
    this.isImageLoading = true;
    this.image = new Image();
    const browseService = this.browseMap;
    const currentProd = this.currentSarviewsProduct;
    this.currentSarviewsProduct = product;
    const self = this;

    this.image.addEventListener('load', function() {
      if (currentProd === product) {
        return;
      }

      self.isImageLoading = false;

      browseService.setBrowse(product.files.browse_url, product.granules[0].wkt );
    });

    this.image.src = product.files.browse_url;
  }

  public jobParamsToList(metadata) {
    if (!metadata.job) {
      return [];
    }

    const jobType = models.hyp3JobTypes[metadata.job.job_type];
    const options = !!jobType ? jobType.options : models.hyp3JobOptionsOrdered;

    return options
      .filter(option => metadata.job.job_parameters[option.apiName])
      .map(option => {
        return {name: option.name, val: metadata.job.job_parameters[option.apiName]};
      });
  }
  public closeDialog() {
    this.dialogRef.close();
  }

  public onToggleQueueProduct(product: models.CMRProduct): void {
    this.store$.dispatch(new queueStore.ToggleProduct(product));
  }

  public toggleDisplay() {
    this.isShow = !this.isShow;
  }

  public setOnlyShowBrowse(isChecked: boolean) {
    this.store$.dispatch(new uiStore.SetOnlyScenesWithBrowse(isChecked));
  }

  public onNewBrowseSelected(scene, browse): void {
    this.loadBrowseImage(scene, browse);
  }

  public onNewSarviewsBrowseSelected(browse: SarviewsProduct): void {
    this.loadSarviewsBrowseImage(browse);
  }

  public prodDownloaded( _product ) {
  }

  public onCopyLink(content: SarviewProductGranule[]): void {
    const names = content.map(val => val.granule_name).join(',');
    this.clipboard.copyFromContent(names);
    this.notificationService.info( '', `Scene${content.length > 1 ? 's ' : ' '}Copied`);
  }

  public onSetOpacity(event: MatSliderChange) {
    this.browseMap.updateBrowseOpacity(event.value);
  }

  public downloadSarviewsProduct(product: SarviewsProduct) {
    window.open(product.files.product_url, '_blank');
  }

  public OpenProductInSarviews() {
    const url = this.sarviewsService.getSarviewsEventPinnedUrl(this.sarviewsEvent.event_id, [this.currentSarviewsProduct.product_id]);
    window.open(url);
  }

  public onPinProduct(product_id: string) {
    const temp = {
      ...this.pinnedProducts,
    };
    temp[product_id].isPinned = !this.pinnedProducts[product_id].isPinned;
    this.store$.dispatch(new scenesStore.SetImageBrowseProducts(this.pinnedProducts));
    this.browseMap.setPinnedProducts(this.pinnedProducts);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
