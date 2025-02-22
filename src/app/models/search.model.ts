import { SearchType } from './search-type.model';
import { ListSearchType } from './filter-types.model';
import { Range } from './range.model';
import { FlightDirection } from './cmr-product.model';
import * as fromDatasets from './dataset.model';
import { Hyp3JobStatusCode } from './hyp3.model';
import { SarviewsEventType } from '@models';
// import { SarviewsEventType } from './sarviews-event.model';

export interface Search {
  searchType: SearchType;
  name: string;
  id: string;
  filters: FilterType;
}

export type FilterType =
  ListFiltersType |
  GeographicFiltersType |
  BaselineFiltersType |
  CustomProductFiltersType |
  SbasFiltersType |
  SarviewsFiltersType;

export interface ListFiltersType {
  listType: ListSearchType;
  list: string[];
}

export interface BaselineFiltersType {
  filterMaster: string | null;
  reference: string | null;

  dateRange: Range<null | Date>;

  season: Range<number | null>;
  temporalRange: Range<number | null>;
  perpendicularRange: Range<number | null>;
}

export interface SbasFiltersType {
  reference: string | null;

  dateRange: Range<null | Date>;

  season: Range<number | null>;
  temporal: number;
  perpendicular: number;
  customPairIds: string[][];

  thresholdOverlap: boolean;
}

export interface CustomProductFiltersType {
  jobStatuses: Hyp3JobStatusCode[];

  dateRange: Range<null | Date>;

  projectName: string;
  productFilterName: string;
}

export interface GeographicFiltersType {
  selectedDataset: string;
  maxResults: number;

  polygon: string;
  dateRange: Range<null | Date>;

  pathRange: Range<number | null>;
  frameRange: Range<number | null>;
  season: Range<number | null>;

  productTypes: fromDatasets.DatasetProductTypes;
  beamModes: fromDatasets.DatasetBeamModes;
  polarizations: fromDatasets.DatasetPolarizations;
  flightDirections: FlightDirection[];
  subtypes: fromDatasets.DatasetSubtypes;

  selectedMission: null | string;
}

export interface SarviewsFiltersType {
  sarviewsEventTypes: SarviewsEventType[];

  // pathRange: Range<number | null>;
  // frameRange: Range<number | null>;
  // season: Range<number | null>;
  dateRange: Range<null | Date>;
  magnitude: Range<null | number>;
  activeOnly: boolean;
  sarviewsEventNameFilter: string;
}
