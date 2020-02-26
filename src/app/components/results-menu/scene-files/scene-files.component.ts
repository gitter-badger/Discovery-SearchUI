import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { AppState } from '@store';
import * as scenesStore from '@store/scenes';
import * as queueStore from '@store/queue';
import * as userStore from '@store/user';

import * as models from '@models';

@Component({
  selector: 'app-scene-files',
  templateUrl: './scene-files.component.html',
  styleUrls: ['./scene-files.component.scss']
})
export class SceneFilesComponent implements OnInit {
  public products: models.CMRProduct;
  public queuedProductIds$ = this.store$.select(queueStore.getQueuedProductIds).pipe(
      map(names => new Set(names))
  );
  public unzippedLoading: string;

  public showUnzippedProductScreen: boolean;
  public openUnzippedProduct$ = this.store$.select(scenesStore.getOpenUnzippedProduct);
  public unzippedProducts: {[id: string]: models.UnzippedFolder[]};
  public isUserLoggedIn: boolean;

  constructor(
    private store$: Store<AppState>
  ) { }

  ngOnInit() {
    this.store$.select(userStore.getIsUserLoggedIn).subscribe(
      isLoggedIn => this.isUserLoggedIn = isLoggedIn
    );
    this.store$.select(scenesStore.getShowUnzippedProduct).subscribe(
      showUnzipped => this.showUnzippedProductScreen = showUnzipped
    );
    this.store$.select(scenesStore.getUnzippedProducts).subscribe(
      unzippedProducts => this.unzippedProducts = unzippedProducts
    );
    this.store$.select(scenesStore.getSelectedSceneProducts).subscribe(
      products => this.products = products
    );
    this.store$.select(scenesStore.getUnzipLoading).subscribe(
      unzippedLoading => this.unzippedLoading = unzippedLoading
    );
  }

  public onToggleQueueProduct(product: models.CMRProduct): void {
    this.store$.dispatch(new queueStore.ToggleProduct(product));
  }

  public onOpenUnzipProduct(product: models.CMRProduct): void {
    if (this.unzippedProducts[product.id]) {
      this.store$.dispatch(new scenesStore.OpenUnzippedProduct(product));
    } else {
      this.store$.dispatch(new scenesStore.LoadUnzippedProduct(product));
    }
  }

  public onCloseProduct(product: models.CMRProduct): void {
    this.store$.dispatch(new scenesStore.CloseZipContents(product));
  }
}
