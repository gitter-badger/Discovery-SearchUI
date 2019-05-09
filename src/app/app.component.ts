import { Component, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { MatBottomSheet } from '@angular/material';

import { Store } from '@ngrx/store';

import { of } from 'rxjs';
import { skip, filter, map, switchMap, tap, catchError } from 'rxjs/operators';

import { AppState } from '@store';
import * as granulesStore from '@store/granules';
import * as filterStore from '@store/filters';
import * as searchStore from '@store/search';
import * as uiStore from '@store/ui';
import * as missionStore from '@store/mission';
import * as mapStore from '@store/map';

import * as services from '@services';
import * as models from './models';

@Component({
  selector   : 'app-root',
  templateUrl: './app.component.html',
  styleUrls  : ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public shouldOmitSearchPolygon$ = this.store$.select(filterStore.getShouldOmitSearchPolygon);
  public uiView$ = this.store$.select(uiStore.getUiView);

  public interactionTypes = models.MapInteractionModeType;

  constructor(
    private store$: Store<AppState>,
    private mapService: services.MapService,
    private urlStateService: services.UrlStateService,
    private polygonValidationService: services.PolygonValidationService,
    private asfSearchApi: services.AsfApiService,
  ) {}

  public ngOnInit(): void {
    this.polygonValidationService.validate();
    this.store$.dispatch(new missionStore.LoadMissions());

    this.store$.select(uiStore.getSearchType).pipe(
      skip(1),
      map(searchType => {
        return searchType === models.SearchType.DATASET ?
          models.MapInteractionModeType.DRAW :
          models.MapInteractionModeType.NONE;
      })
    ).subscribe(
      mode => this.store$.dispatch(new mapStore.SetMapInteractionMode(mode))
    );

    this.asfSearchApi.health().pipe(
      map(health => {
        const { ASFSearchAPI, CMRSearchAPI } = health;

        if (!CMRSearchAPI.health.echo['ok?']) {
          this.store$.dispatch(new searchStore.SearchError('CMR is experiencing errors, try searching later.'));
        } else if (!ASFSearchAPI['ok?']) {
          this.store$.dispatch(new searchStore.SearchError('ASF API is experiencing errors, try searching later.'));
        }
      }),
    ).subscribe(_ => _);
  }

  public onLoadUrlState(): void {
    this.urlStateService.load();
  }

  public onNewSearch(): void {
    this.store$.dispatch(new searchStore.MakeSearch());
  }

  public onClearSearch(): void {
    this.store$.dispatch(new granulesStore.ClearGranules());
    this.store$.dispatch(new filterStore.ClearFilters());
    this.store$.dispatch(new missionStore.SelectMission(null));
    this.mapService.clearDrawLayer();
  }

  public onLoginClosed(): void {
    this.store$.dispatch(new uiStore.SetUiView(models.ViewType.MAIN));
  }
}
