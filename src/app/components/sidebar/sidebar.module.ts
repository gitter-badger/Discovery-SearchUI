import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TruncateModule } from '@yellowspot/ng-truncate';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MatSharedModule } from '@shared';
import { PipesModule } from '@pipes';

import { SidebarComponent } from './sidebar.component';

import { ToggleButtonModule } from './toggle-button';
import { SearchBarModule } from './search/search-bar';

import { PlatformSelectorModule } from './search/platform-selector';
import { FilterSelectorModule } from './search/filter-selector';
import { DateSelectorModule } from './search/date-selector';
import { PathSelectorModule } from './search/path-selector';
import { OtherSelectorModule } from './search/other-selector';

import { ProductsListModule } from './products/products-list';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';

@NgModule({
  imports: [
    CommonModule,

    TruncateModule,
    FontAwesomeModule,

    MatSharedModule,
    PipesModule,

    SearchBarModule,
    ToggleButtonModule,
    ProductsListModule,

    FilterSelectorModule,
    PlatformSelectorModule,
    DateSelectorModule,
    PathSelectorModule,
    OtherSelectorModule,
  ],
  declarations: [
    SidebarComponent,
    ProductDetailComponent,
  ],
  exports: [
    SidebarComponent
  ]
})
export class SidebarModule { }
