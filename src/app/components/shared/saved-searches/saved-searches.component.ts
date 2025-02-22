import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { SubSink } from 'subsink';
import { switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '@store';
import * as userStore from '@store/user';
import * as searchStore from '@store/search';
import * as uiStore from '@store/ui';

import { SavedSearchService, ScreenSizeService, SearchService } from '@services';
import { SaveSearchDialogComponent } from '@components/shared/save-search-dialog';
import * as models from '@models';

@Component({
  selector: 'app-saved-searches',
  templateUrl: './saved-searches.component.html',
  styleUrls: ['./saved-searches.component.scss'],
})
export class SavedSearchesComponent implements OnInit, OnDestroy {
  @ViewChild('filterInput', { static: true }) filterInput: ElementRef;

  public searchType$ = this.store$.select(searchStore.getSearchType);
  public SearchType = models.SearchType;
  public savedSearchType: models.SavedSearchType;
  public lockedFocus = false;

  public savedSearchType$ = this.store$.select(uiStore.getSaveSearchType);
  public SavedSearchType = models.SavedSearchType;
  public searches$ = this.savedSearchType$.pipe(
    switchMap(savedSearchType =>
      (savedSearchType === models.SavedSearchType.SAVED) ?
        this.store$.select(userStore.getSavedSearches) :
        this.store$.select(userStore.getSearchHistory)
    )
  );

  public breakpoint: models.Breakpoints;
  public breakpoints = models.Breakpoints;

  private filterTokens = [];
  public filteredSearches = new Set<string>();
  public searchFilter = '';
  public expandedSearchId: string;
  public newSearchId: string;

  private subs = new SubSink();

  constructor(
    private dialog: MatDialog,
    private store$: Store<AppState>,
    private savedSearchService: SavedSearchService,
    private screenSize: ScreenSizeService,
    private searchService: SearchService,
  ) { }

  ngOnInit() {
    this.savedSearchService.loadSearches();

    this.subs.add(
      this.screenSize.breakpoint$.subscribe(
        breakpoint => this.breakpoint = breakpoint
      )
    );

    this.subs.add(
      this.savedSearchType$.subscribe(
        savedSearchType => this.savedSearchType = savedSearchType
      )
    );

    this.subs.add(
      this.searches$.subscribe(
        searches => {
          this.filterTokens = this.savedSearchService.filterTokensFrom(searches);
          this.updateFilter();
        }
      )
    );
  }

  public onSavedSearchTypeChange(savedSearchType: models.SavedSearchType): void {
    this.store$.dispatch(new uiStore.SetSavedSearchType(savedSearchType));
  }

  public saveCurrentSearch(): void {
    this.dialog.open(SaveSearchDialogComponent, {
      id: 'ConfirmProcess',
      width: '550px',
      height: '500px',
      maxWidth: '550px',
      maxHeight: '500px',
      data: { saveType: models.SavedSearchType.SAVED }
    });
  }

  public updateSearchFilters(id: string): void {
    this.savedSearchService.updateSearchWithCurrentFilters(id);
  }

  public onNewFilter(event: Event): void {
    const filterStr = (event.target as HTMLInputElement).value;
    this.searchFilter = filterStr;
    this.updateFilter();
  }

  private updateFilter(): void {
    this.filteredSearches = new Set();
    const filterStr = this.searchFilter.toLocaleLowerCase();

    this.filterTokens.forEach(
      search => {
        if (search.token.includes(filterStr)) {
          this.filteredSearches.add(search.id);
        }
      }
    );
  }

  public unfocusFilter(): void {
    this.filterInput.nativeElement.blur();
  }

  public updateSearchName(update: {id: string, name: string}): void {
    if (update.name === '') {
      update.name = '(No name)' ;
    }
    this.newSearchId = '';

    this.savedSearchService.updateSearchName(update.id, update.name);
  }

  public onClose(): void {
    this.store$.dispatch(new uiStore.CloseSidebar());
  }

  public deleteSearch(id: string): void {
    this.savedSearchService.deleteSearch(id);
  }

  public onSetSearch(search: models.Search): void {
    this.searchService.load(search);
  }


  public onUnlockFocus(): void {
    this.lockedFocus = false;
  }

  public onExpandSearch(searchId: string): void {
    this.expandedSearchId = this.expandedSearchId === searchId ?
    '' : searchId;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
