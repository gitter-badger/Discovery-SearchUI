import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { interval, Subject, Observable, of } from 'rxjs';
import { map, takeUntil, take, filter, catchError } from 'rxjs/operators';

import { EnvironmentService } from './environment.service';
import * as jwt_decode from 'jwt-decode';

import * as models from '@models';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private env: EnvironmentService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  public get authUrl() {
    return this.env.currentEnv.auth;
  }

  public get earthdataUrl() {
    return this.env.currentEnv.urs;
  }

  public get ursClientId() {
    return this.env.currentEnv.urs_client_id;
  }

  public login$(): Observable<models.UserAuth | null> {
    const localUrl = window.location.origin;

    const appRedirect = encodeURIComponent(localUrl);

    const redirect = `${this.authUrl}/login&state=${appRedirect}`;
    const clientId = this.ursClientId;

    const url = `${this.earthdataUrl}/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirect};`;

    const loginWindow = window.open(
      url,
      'SAR Search: URS Earth Data Authorization',
      'scrollbars=yes, width=600, height= 600'
    );

    const loginWindowClosed = new Subject();

    return interval(500).pipe(
      takeUntil(loginWindowClosed),
      map(_ => {
        let user = null;

        if (loginWindow.closed) {
          loginWindowClosed.next();
        }

        try {
          if (loginWindow.location.host === window.location.host) {
            loginWindow.close();
            user = this.getUser();
          }
        } catch (e) {
        }

        return user;
      }),
      catchError(_ => {
        this.snackBar.open('Trouble logging in', 'ERROR', {
          duration: 5000,
        });
        loginWindowClosed.next();
        return of(null);
      }),
      filter(user => !!user),
      take(1)
    );
  }

  public logout$(): Observable<models.UserAuth>  {
    return this.http.get(
      `${this.authUrl}/loginservice/logout`, {
        responseType: 'text',
        withCredentials: true
      }).pipe(
        map(_ => this.getUser()),
        catchError(_ => {
          this.snackBar.open('Trouble logging out', 'ERROR', {
            duration: 5000,
          });
          return of(this.getUser());
        }),
        take(1)
      );
  }

  public getUser(): models.UserAuth {
    const cookies = this.loadCookies();
    const token = cookies['asf-urs'];

    if (!token) {
      return this.nullUser();
    }

    const user = jwt_decode(token);

    if (this.isExpired(user)) {
      return this.nullUser();
    }

    return this.makeUser(
      user['urs-user-id'],
      user['urs-groups'],
      token
    );
  }

  private makeUser(id: string, groups: models.URSGroup[], token: string): models.UserAuth {
    return { id, token, groups };
  }

  private nullUser(): models.UserAuth {
    return { id: null, token: null, groups: [] };
  }

  private isExpired(userToken): boolean {
    return Date.now() > userToken.exp * 1000;
  }

  private loadCookies() {
    return document.cookie.split(';')
      .map(s => s.trim().split('='))
      .map(([name, val]) => ({[name]: val}))
      .reduce(
        (allCookies, cookie) => ({ ...allCookies, ...cookie })
      );
  }
}
