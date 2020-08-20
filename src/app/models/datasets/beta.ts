import { Props } from '../filters.model';

export const beta = {
  id: 'SENTINEL-1 INTERFEROGRAM (BETA)',
  name: 'S1 InSAR',
  subName: '(NISAR Format Beta)',
  properties: [
    Props.DATE,
    Props.BEAM_MODE,
    Props.PATH,
    Props.FLIGHT_DIRECTION,
    Props.POLARIZATION,
    Props.MISSION_NAME,
  ],
  apiValue: { asfplatform: 'SENTINEL-1 INTERFEROGRAM (BETA)' },
  date: { start: new Date(2014, 3, 25) },
  infoUrl: 'https://asf.alaska.edu/data-sets/derived-data-sets/sentinel-1-interferograms/',
  citationUrl: 'https://asf.alaska.edu/information/how-to-cite-data/',
  frequency: 'C-Band',
  source: {
    name: 'ESA',
    url: 'https://www.esa.int/ESA'
  },
  productTypes: [
    {
      apiValue: 'GUNW_STD',
      displayName: 'Standard Product, NetCDF'
    },
    {
      apiValue: 'GUNW_AMP',
      displayName: 'Amplitude, GeoTIFF'
    },
    {
      apiValue: 'GUNW_CON',
      displayName: 'Connected Components, GeoTIFF'
    },
    {
      apiValue: 'GUNW_COH',
      displayName: 'Coherence, GeoTIFF'
    },
    {
      apiValue: 'GUNW_UNW',
      displayName: 'Unwrapped Phase, GeoTIFF'
    },
  ],
  beamModes: ['slc'],
  polarizations: ['VV'],
  subtypes: [],
};
