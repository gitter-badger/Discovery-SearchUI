import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TruncateModule } from '@yellowspot/ng-truncate';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ClipboardModule } from 'ngx-clipboard';

import { MatSharedModule } from '@shared';
import { PipesModule } from '@pipes';

import { ProductsListComponent } from './products-list.component';
import { Sentinel1ProductComponent } from './sentinel1-product/sentinel1-product.component';
import { ProductNameComponent } from './sentinel1-product/product-name/product-name.component';


@NgModule({
  declarations: [
    ProductsListComponent,
    Sentinel1ProductComponent,
    ProductNameComponent,
  ],
  imports: [
    CommonModule,
    MatSharedModule,
    PipesModule,

    TruncateModule,
    FontAwesomeModule,
    ClipboardModule,
  ],
  exports: [
    ProductsListComponent
  ]
})
export class ProductsListModule { }
