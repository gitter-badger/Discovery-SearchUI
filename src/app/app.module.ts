import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '@environments/environment';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { ToastContainerModule, ToastrModule } from 'ngx-toastr';

import * as store from './store';

import { MatSharedModule } from '@shared';
import { SavedSearchesModule } from '@components/shared/saved-searches';
import { SaveUserFiltersModule } from '@components/shared/save-user-filters';
import { HeaderModule } from '@components/header';
import { MapModule } from '@components/map';
import { ResultsMenuModule } from '@components/results-menu';
import { BaselineChartModule } from '@components/baseline-chart';
import { HelpModule } from './components/help';
import { AppComponent } from './app.component';
import { CustomBreakPointsProvider } from '@services/custom-breakpoints';
import * as services from '@services';

import { NgcCookieConsentModule, NgcCookieConsentConfig } from 'ngx-cookieconsent';
import { getSaver, SAVER } from '@services/saver.provider';
// import { OnlynumberDirective } from './directives/onlynumber.directive';
// import { FileDownloadDirective } from './directives/file-download.directive';

// info about cookie consent module: https://tinesoft.github.io/ngx-cookieconsent/home
const cookieConfig: NgcCookieConsentConfig = {
  'autoOpen': false,
    'cookie': {
      'domain': window.location.hostname
  },
    'position': 'bottom',
    'theme': 'edgeless',
    'palette': {
    'popup': {
      'background': '#000000',
        'text': '#ffffff',
        'link': '#ffffff'
    },
    'button': {
      'background': '#236192',
        'text': '#ffffff',
        'border': 'transparent'
    }
  },
    'type': 'info',
    'content': {
      'message': 'This website uses cookies to ensure you get the best experience on our website.',
        'dismiss': 'Dismiss',
        'deny': 'Refuse cookies',
        'link': 'Learn more',
        'href': 'https://cookiesandyou.com',
        'policy': 'Cookie Policy'
    }
};

export const routes = [
  { path: '**', name: 'AppComponent', component: AppComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    // OnlynumberDirective,
    // FileDownloadDirective,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgcCookieConsentModule.forRoot(cookieConfig),
    MatBottomSheetModule,
    MatSharedModule,
    FlexLayoutModule.withConfig({disableDefaultBps: true},
      CustomBreakPointsProvider.useValue),
    RouterModule.forRoot(routes, {useHash: true}),
    StoreModule.forRoot(store.reducers, {metaReducers: store.metaReducers}),
    EffectsModule.forRoot(store.appEffects),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    MatSidenavModule,
    SavedSearchesModule,
    SaveUserFiltersModule,
    MapModule,
    ResultsMenuModule,
    HeaderModule,
    MatMenuModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
    BaselineChartModule,
    HelpModule,
    ToastrModule.forRoot({positionClass: 'inline', preventDuplicates: true}),
    ToastContainerModule,
  ],
  providers: [
    services.AsfApiService,
    services.UrlStateService,
    services.MapService,
    services.DrawService,
    services.WktService,
    services.ProductService,
    services.BulkDownloadService,
    services.SearchParamsService,
    services.RangeService,
    services.PolygonValidationService,
    services.DateExtremaService,
    services.EnvironmentService,
    services.PropertyService,
    services.LegacyAreaFormatService,
    services.BannerApiService,
    services.ScreenSizeService,
    services.KeyboardService,
    CustomBreakPointsProvider,
    services.UserDataService,
    services.SavedSearchService,
    services.UnzipApiService,
    services.ChartService,
    services.ScenesService,
    services.SearchService,
    services.Hyp3Service,
    services.PairService,
    services.SceneSelectService,
    {provide: SAVER, useFactory: getSaver},
    // { provide: Window, useValue: window },
  ],
  bootstrap: [AppComponent],
  exports: [
  ]
})
export class AppModule {}
