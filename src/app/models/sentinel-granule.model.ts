export interface Sentinel1Product {
  name: string;
  file: string;
  id: string;
  downloadUrl: string;
  bytes: number;
  browse: string;
  platform: string;
  groupId: string;
  metadata: Sentinel1Metadata;
}

export interface Sentinel1Metadata {
  date: Date;
  polygon: string;

  productType: Sentinel1ProductType;
  beamMode: Sentinel1BeamMode;
  polarization: Sentinel1Polarization;
  flightDirection: FlightDirection;
  frequency: string;

  path: number;
  frame: number;
  absoluteOrbit: number;
}

export enum FlightDirection {
  ASCENDING = 'ASCENDING',
  DESCENDING = 'DESCENDING',
}

export type Sentinel1ProductType =
  'GRD' | 'SLC' | 'OCN' | 'RAW' |
  'METADATA_SLC' | 'METADATA_RAW' |
  'METADATA_GRD_MD' | 'GRD_MD'
;

export type Sentinel1BeamMode =
  'IW'| 'EW'| 'WV'|
  'S1'| 'S2'| 'S3'|
  'S4'| 'S5'| 'S6';

export type Sentinel1Polarization =
  'HH'|
  'VV'|
  'HH+HV'|
  'VV+VH';
