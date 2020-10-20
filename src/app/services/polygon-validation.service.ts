import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { of } from 'rxjs';
import { filter, map, switchMap, catchError } from 'rxjs/operators';

import { MapService } from './map/map.service';
import { AsfApiService } from './asf-api.service';
import { WktService } from './wkt.service';

import * as models from '@models';

@Injectable({
  providedIn: 'root'
})
export class PolygonValidationService {
  private polygons: Set<string> = new Set([]);

  constructor(
    private snackBar: MatSnackBar,
    private mapService: MapService,
    private asfApiService: AsfApiService,
    private wktService: WktService,
  ) { }

  public validate(): void {
    this.mapService.searchPolygon$.pipe(
      filter(p => !!p || this.polygons.has(p)),
      switchMap(polygon => this.asfApiService.validate(polygon).pipe(
        catchError(_ => of(null))
      )),
      filter(resp => !!resp),
      map(resp => {
        const error = this.getErrorFrom(resp);

        if (error) {
          this.displayDrawError(error);
        } else {
          this.setValidPolygon(resp);
        }
      }),
      catchError((_, source) => source)
    ).subscribe(_ => _);
  }

  private getErrorFrom(resp) {
    if (resp.error) {
      return resp.error;
    } else if (resp.errors) {
      return resp.errors.pop();
    } else {
      return null;
    }
  }

  private displayDrawError(error) {
    const { report } = error;

    this.mapService.setDrawStyle(models.DrawPolygonStyle.INVALID);
    this.snackBar.open(
      report, 'INVALID POLYGON',
      { duration: 4000, }
    );
  }

  private setValidPolygon(resp) {
    this.polygons.add(resp.wkt.wrapped);
    this.mapService.setDrawStyle(models.DrawPolygonStyle.VALID);

    const repairs = resp.repairs
      .filter(repair =>
        repair.type !== models.PolygonRepairTypes.ROUND
      );

    if (repairs.length === 0) {
      return resp.wkt.wrapped;
    }

    const { report, type }  = resp.repairs.pop();

    if (type !== models.PolygonRepairTypes.WRAP) {
      this.snackBar.open(
        report, type,
        { duration: 4000, }
      );
    }

    const features = this.wktService.wktToFeature(
      resp.wkt.wrapped,
      this.mapService.epsg()
    );

    this.mapService.setDrawFeature(features);
  }
}
