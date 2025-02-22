import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';

import { Subject, combineLatest } from 'rxjs';
import { filter, tap, delay, map, withLatestFrom } from 'rxjs/operators';
import { SubSink } from 'subsink';

import { Store, ActionsSubject } from '@ngrx/store';
import { AppState } from '@store';
import * as scenesStore from '@store/scenes';
import * as filtersStore from '@store/filters';
import * as searchStore from '@store/search';

import { DateRangeExtrema, SearchType } from '@models';
import { DateExtremaService } from '@services';

@Component({
  selector: 'app-date-selector',
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.scss']
})
export class DateSelectorComponent implements OnInit, OnDestroy {
  @ViewChild('dateForm', { static: true }) public dateForm: NgForm;

  public startDateErrors$ = new Subject<void>();
  public endDateErrors$ = new Subject<void>();
  public isStartError = false;
  public isEndError = false;

  public extrema: DateRangeExtrema;

  private currentDate = new Date();
  private selectedDataset$ = this.store$.select(filtersStore.getSelectedDataset);
  public maxDate$ = this.selectedDataset$.pipe(
    withLatestFrom(this.store$.select(searchStore.getSearchType)),
    map(([dataset, searchType]) => {
      if (searchType === SearchType.SARVIEWS_EVENTS) {
        return this.extrema?.end.max;
      }
        return dataset.date.end;
      }
    ),
    map(endDate => endDate <= this.currentDate ? endDate : this.currentDate)
    );

  public minDate$ = this.selectedDataset$.pipe(
    withLatestFrom(this.store$.select(searchStore.getSearchType)),
    map(([dataset, searchType]) => {
        if (searchType === SearchType.SARVIEWS_EVENTS) {
          return this.extrema?.start.min;
        }
        return dataset.date.start;
      }
    )
  );
  public startDate$ = this.store$.select(filtersStore.getStartDate);
  public endDate$ = this.store$.select(filtersStore.getEndDate);
  public startDate: Date = new Date();
  public endDate: Date = new Date();

  private subs = new SubSink();

  private get startControl() {
    return this.dateForm.form
      .controls['startInput'];
  }

  private get endControl() {
    return this.dateForm.form
      .controls['endInput'];
  }

  constructor(
    private store$: Store<AppState>,
    private actions$: ActionsSubject,
    private dateExtremaService: DateExtremaService
  ) { }

  ngOnInit() {
    this.handleDateErrors();

    this.subs.add(
      this.actions$.pipe(
        filter(action => action.type === filtersStore.FiltersActionType.CLEAR_DATASET_FILTERS)
      ).subscribe(_ => this.dateForm.reset())
    );

    const dateExtrema$ = this.dateExtremaService.getExtrema$(
        this.store$.select(filtersStore.getSelectedDataset),
        this.startDate$,
        this.endDate$,
      );
    const baselineDateExtrema$ = this.dateExtremaService.getBaselineExtrema$(
        this.store$.select(scenesStore.getScenes),
        this.startDate$,
        this.endDate$,
    );

    const sarviewsDateExtrema$ = this.dateExtremaService.getSarviewsExtrema$(
      this.store$.select(scenesStore.getSarviewsEvents)
    );

    this.subs.add(
      combineLatest([
        this.store$.select(searchStore.getSearchType),
        dateExtrema$,
        baselineDateExtrema$,
        sarviewsDateExtrema$,
      ]
      ).subscribe(([searchType, extrema, baselineExtrema, sarviewsExtrema]) => {
        if (searchType === SearchType.DATASET) {
          this.extrema = extrema;
        } else if (searchType === SearchType.CUSTOM_PRODUCTS) {
          this.extrema = {
            start: {
              min: null,
              max: null
            },
            end: {
              min: null,
              max: null
            }
          };
         } else if (searchType === SearchType.SARVIEWS_EVENTS) {
           this.extrema = {
             start: {
               min: sarviewsExtrema.start,
               max: null
             },
             end: {
               min: null,
               max: sarviewsExtrema.end
             }
           };
         } else {
          this.extrema = baselineExtrema;
        }
      })
    );

    this.subs.add(
      this.startDate$.subscribe(
        start => {
          this.startDate = start;
          if (this.endDate < this.startDate && !!this.endDate) {
            const endOfDay = this.endDateFormat(this.startDate);
            this.store$.dispatch(new filtersStore.SetEndDate(endOfDay));
          }
        }
      )
    );
    this.subs.add(
      this.endDate$.subscribe(
        end => {
          this.endDate = end;
          if (this.startDate > this.endDate && !!this.startDate) {
            this.store$.dispatch(new filtersStore.SetStartDate(this.endDate));
          }
        }
      )
    );
  }

  public onStartDateChange(e: MatDatepickerInputEvent<moment.Moment>): void {

    let date: null | Date;

    if (!this.startControl.valid || !e.value) {
      date = null;
      this.startDateErrors$.next();
    } else {
      const momentDate = e.value.set({h: 0});
      date = this.toJSDate(momentDate);
    }

    this.store$.dispatch(new filtersStore.SetStartDate(date));
  }

  public onEndDateChange(e: MatDatepickerInputEvent<moment.Moment>): void {
    let date: null | Date;

    if (!this.endControl.valid || !e.value) {
      date = null;
      this.endDateErrors$.next();
    } else {
      date = this.endDateFormat(e.value);
    }

      this.store$.dispatch(new filtersStore.SetEndDate(date));
  }

  private endDateFormat(date: Date | moment.Moment) {
    const endDate = moment(date).utc().endOf('day');
    return this.toJSDate(endDate);
  }

  private toJSDate(date: moment.Moment) {
    return date.toDate();
  }

  private handleDateErrors(): void {
    this.subs.add(
      this.startDateErrors$.pipe(
        tap(_ => {
          this.isStartError = true;
          this.startControl.reset();
          this.startControl.setErrors({'incorrect': true});
        }),
        delay(820),
      ).subscribe(_ => {
        this.isStartError = false;
        this.startControl.setErrors(null);
      })
    );

    this.subs.add(
      this.endDateErrors$.pipe(
        tap(_ => {
          this.isEndError = true;
          this.endControl.reset();
          this.endControl.setErrors({'incorrect': true});
        }),
        delay(820),
      ).subscribe(_ => {
        this.isEndError = false;
        this.endControl.setErrors(null);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
