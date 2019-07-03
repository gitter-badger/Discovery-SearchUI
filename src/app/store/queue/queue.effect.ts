import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';

import * as FileSaver from 'file-saver';

import { Observable, combineLatest } from 'rxjs';
import { map, withLatestFrom, startWith, switchMap, tap, filter } from 'rxjs/operators';

import { AppState } from '../app.reducer';
import { QueueActionType, DownloadMetadata, QueueGranule, AddItems, RemoveItems, RemoveGranuleFromQueue } from './queue.action';
import { getQueuedProducts } from './queue.reducer';
import * as granulesStore from '@store/granules';

import * as services from '@services';
import * as models from '@models';

export interface MetadataDownload {
  params: {[id: string]: string | null};
  format: models.AsfApiOutputFormat;
}

@Injectable()
export class QueueEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private searchParams$: services.SearchParamsService,
    private asfApiService: services.AsfApiService,
    private bulkDownloadService: services.BulkDownloadService,
  ) {}

  @Effect({ dispatch: false })
  private makeDownloadScript: Observable<void> = this.actions$.pipe(
    ofType(QueueActionType.MAKE_DOWNLOAD_SCRIPT),
    withLatestFrom(this.store$.select(getQueuedProducts)),
    map(([action, products]) => products),
    switchMap(
      products => this.bulkDownloadService.downloadScript$(products)
    ),
    map(
      blob => FileSaver.saveAs(blob, `download-all-${this.currentDate()}.py`)
    )
  );

  @Effect({ dispatch: false })
  private downloadMetadata: Observable<void> = this.actions$.pipe(
    ofType<DownloadMetadata>(QueueActionType.DOWNLOAD_METADATA),
    map(action => action.payload),
    withLatestFrom(this.store$.select(getQueuedProducts).pipe(
        map(
          products => products
            .map(product => product.id)
            .join(',')
        ),
        map(
          productIds => ({
            product_list: productIds
          })
        )
      )
    ),
    map(
      ([format, params]): MetadataDownload => ({
        params: { ...params, ...{output: format} },
        format
      })
    ),
    switchMap(
      (search: MetadataDownload) => this.asfApiService.query<string>(search.params).pipe(
        map(resp => new Blob([resp], { type: 'text/plain'})),
        map(
          blob => FileSaver.saveAs(blob,
            `asf-datapool-results-${this.currentDate()}.${search.format.toLowerCase()}`
          )
        )
      ),
    ),
  );

  @Effect()
  private queueGranule: Observable<Action> = this.actions$.pipe(
    ofType<QueueGranule>(QueueActionType.QUEUE_GRANULE),
    withLatestFrom(this.store$.select(granulesStore.getGranuleProducts)),
    map(([action, granuleProducts]) => granuleProducts[action.payload]),
    map(products => new AddItems(products))
  );

  @Effect()
  private removeGranule: Observable<Action> = this.actions$.pipe(
    ofType<RemoveGranuleFromQueue>(QueueActionType.REMOVE_GRANULE_FROM_QUEUE),
    withLatestFrom(this.store$.select(granulesStore.getGranuleProducts)),
    map(([action, granuleProducts]) => granuleProducts[action.payload]),
    map(products => new RemoveItems(products))
  );

  private currentDate(): string {
    const today = new Date();

    const [ y, m, d, h, min, s] = [
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds()
    ];

    return `${y}-${m}-${d}_${h}-${min}-${s}`;
  }
}
