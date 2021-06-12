import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatSharedModule } from '@shared';
import { SaveUserFiltersComponent } from './save-user-filters.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SaveUserFiltersComponent
  ],
  imports: [
    CommonModule,
    MatSharedModule,
    MatButtonToggleModule,
    MatInputModule,
    FormsModule,
    MatMenuModule,
  ],
  exports: [
    SaveUserFiltersComponent
  ]
})
export class SaveUserFiltersModule { }
