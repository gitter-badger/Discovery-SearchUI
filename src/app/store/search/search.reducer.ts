import { createFeatureSelector, createSelector } from '@ngrx/store';

import { SearchActionType, SearchActions } from './search.action';
import { SearchType } from '@models';


export interface SearchState {
  isLoading: boolean;
  error: null | string;
  isCanceled: boolean;
  searchResultsAmount: number;
  isResultsAmountLoading: boolean;
  canSearch: boolean;
  totalResults: null | number;
  searchType: SearchType | null;
  nextHyp3JobUrl: null | string;
}

export const initState: SearchState = {
  isLoading: false,
  error: null,
  isCanceled: false,
  searchResultsAmount: 0,
  isResultsAmountLoading: false,
  canSearch: false,
  totalResults: null,
  searchType: SearchType.DATASET,
  nextHyp3JobUrl: null,
};

export function searchReducer(state = initState, action: SearchActions): SearchState {
  switch (action.type) {
    case SearchActionType.MAKE_SEARCH: {
      return {
        ...state,
        error: null,
        isLoading: true,
        isCanceled: false,
      };
    }

    case SearchActionType.ENABLE_SEARCH: {
      return {
        ...state,
        canSearch: true
      };
    }

    case SearchActionType.DISABLE_SEARCH: {
      return {
        ...state,
        canSearch: false
      };
    }

    case SearchActionType.CANCEL_SEARCH: {
      return {
        ...state,
        isLoading: false,
        isCanceled: true,
      };
    }

    case SearchActionType.SET_SEARCH_AMOUNT: {
      return {
        ...state,
        searchResultsAmount: action.payload,
        isResultsAmountLoading: false
      };
    }

    case SearchActionType.SEARCH_RESPONSE: {
      return {
        ...state,
        totalResults: action.payload.totalCount,
        isLoading: false,
        isCanceled: false,
      };
    }

    case SearchActionType.SARVIEWS_SEARCH_RESPONSE: {
      return {
        ...state,
        totalResults: action.payload.events.length,
        isLoading: false,
        isCanceled: false
      };
    }

    case SearchActionType.SEARCH_ERROR: {
      return {
        ...state,
        totalResults: null,
        error: action.payload,
        isLoading: false,
      };
    }

    case SearchActionType.SEARCH_AMOUNT_LOADING: {
      return {
        ...state,
        isResultsAmountLoading: true
      };
    }

    case SearchActionType.SET_SEARCH_TYPE_AFTER_SAVE: {
      return {
        ...state,
        searchType: action.payload,
      };
    }

    case SearchActionType.SET_NEXT_JOBS_URL: {
      return {
        ...state,
        nextHyp3JobUrl: action.payload,
      };
    }

    default: {
      return state;
    }
  }
}

export const getSearchState = createFeatureSelector<SearchState>('search');

export const getIsLoading = createSelector(
  getSearchState,
  (state: SearchState) => state.isLoading
);

export const getTotalResultCount = createSelector(
  getSearchState,
  (state: SearchState) => state.totalResults
);

export const getSearchError = createSelector(
  getSearchState,
  (state: SearchState) => state.error
);

export const getSearchAmount = createSelector(
  getSearchState,
  (state: SearchState) => state.searchResultsAmount
);

export const getIsCanceled = createSelector(
  getSearchState,
  (state: SearchState) => state.isCanceled
);

export const getCanSearch = createSelector(
  getSearchState,
  (state: SearchState) => state.searchType === SearchType.CUSTOM_PRODUCTS || state.canSearch
);

export const getIsMaxResultsLoading = createSelector(
  getSearchState,
  (state: SearchState) => state.isResultsAmountLoading
);

export const getSearchType = createSelector(
  getSearchState,
  state => state.searchType
);

export const getNextHyp3JobsUrl = createSelector(
  getSearchState,
  (state: SearchState) => state.nextHyp3JobUrl
);
