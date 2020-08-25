import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';

import { Observable, combineLatest } from 'rxjs';
import { map, withLatestFrom, startWith, switchMap, tap, filter, delay } from 'rxjs/operators';

import { Hyp3Service, AsfApiService } from '@services';
import { AppState } from '../app.reducer';
import { Hyp3ActionType, SetJobs, SuccessfulJobSumbission, ErrorJobSubmission, SubmitJob, SetUser } from './hyp3.action';
import { SetSearchList } from '../filters/filters.action';
import { MakeSearch } from '../search/search.action';

@Injectable()
export class Hyp3Effects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private hyp3Service: Hyp3Service,
    private snackbar: MatSnackBar,
    public asfSearchApi: AsfApiService,
  ) {}

  private loadJobs = createEffect(() => this.actions$.pipe(
    ofType(Hyp3ActionType.LOAD_JOBS),
    switchMap(_ => this.hyp3Service.getJobs$()),
    switchMap(jobs => {
      const granules = jobs.map(
        job => job.job_parameters.granule
      );

      return [
        new SetJobs(jobs),
        new SetSearchList(granules)
      ];
    })
  ));

  private onSetJobs = createEffect(() => this.actions$.pipe(
    ofType<SetJobs>(Hyp3ActionType.SET_JOBS),
    delay(200),
    map(action => new MakeSearch()),
  ));

  private loadUser = createEffect(() => this.actions$.pipe(
    ofType(Hyp3ActionType.LOAD_USER),
    switchMap(_ => this.hyp3Service.getUser$()),
    map(user => new SetUser(user))
  ));

  private submitJob = createEffect(() => this.actions$.pipe(
    ofType<SubmitJob>(Hyp3ActionType.SUBMIT_JOB),
    switchMap(action => this.hyp3Service.submitJob$(action.payload).pipe(
      map((jobs: any) => {
        const [job] = jobs.jobs;

        if ( job.status_code === 'PENDING' ) {
          return new SuccessfulJobSumbission();
        } else {
          return new ErrorJobSubmission();
        }
      })
    ))
  ));

  private successfulJobSubmission = createEffect(() => this.actions$.pipe(
    ofType(Hyp3ActionType.SUCCESSFUL_JOB_SUBMISSION),
    map(_ => this.snackbar.open(
      'Job successfully submitted', 'RTC_GAMMA',
      { duration: 3000 }
    ))
  ), {dispatch: false});

  private errorJobSubmission = createEffect(() => this.actions$.pipe(
    ofType<SubmitJob>(Hyp3ActionType.ERROR_JOB_SUBMISSION),
    map(action => this.snackbar.open(
      'Fail to submit job', 'RTC_GAMMA',
      { duration: 3000 }
    ))
  ), {dispatch: false});
}
