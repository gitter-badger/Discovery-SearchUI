import { Injectable } from '@angular/core';

import { BehaviorSubject, Subject } from 'rxjs';
import { map, sampleTime } from 'rxjs/operators';

import { Map, Overlay } from 'ol';
import { Layer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import * as proj from 'ol/proj';
import Point from 'ol/geom/Point';

import { click, pointerMove } from 'ol/events/condition';
import Select from 'ol/interaction/Select';

import { WktService } from '../wkt.service';
import { DrawService } from './draw.service';
import { LegacyAreaFormatService } from '../legacy-area-format.service';
import * as models from '@models';

import * as polygonStyle from './polygon.style';
import * as views from './views';
import { SarviewsEvent } from '@models';
import MultiPolygon from 'ol/geom/MultiPolygon';
import { Coordinate } from 'ol/coordinate';
import { EventEmitter } from '@angular/core';
// import { SarviewsEventsService } from '@services';


@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapView: views.MapView;
  private map: Map;
  private polygonLayer: VectorLayer;
  private gridLinesVisible: boolean;
  private popupOverlay: Overlay;

  public mapInit$: EventEmitter<Map> = new EventEmitter();
  // private gridlinesActive: boolean;

  private selectClick = new Select({
    condition: click,
    style: polygonStyle.hidden,
    layers: l => l.get('selectable') || false
  });

  public setMapOverlay(popupContainer: Overlay) {
    this.popupOverlay = popupContainer;
  }

  private selectHover = new Select({
    condition: pointerMove,
    style: polygonStyle.hover,
    layers: l => l.get('selectable') || false
  });

  private selectedSource = new VectorSource({
    wrapX: models.mapOptions.wrapX
  });

  private selectedLayer = new VectorLayer({
    source: this.selectedSource,
    style: polygonStyle.invalid
  });

  private focusSource = new VectorSource({
    wrapX: models.mapOptions.wrapX
  });

  private focusLayer = new VectorLayer({
    source: this.focusSource,
    style: polygonStyle.hover
  });

  public zoom$ = new Subject<number>();
  public center$ = new Subject<models.LonLat>();
  public epsg$ = new Subject<string>();

  private mousePositionSubject$ = new BehaviorSubject<models.LonLat>({
    lon: 0, lat: 0
  });
  public mousePosition$ = this.mousePositionSubject$.pipe(
    sampleTime(100)
  );

  public newSelectedScene$ = new Subject<string>();

  public isDrawing$ = this.drawService.isDrawing$;
  public searchPolygon$ = this.drawService.polygon$.pipe(
    map(
      feature => feature !== null ?
        this.wktService.featureToWkt(feature, this.epsg()) :
        null
    )
  );

  constructor(
    private wktService: WktService,
    private legacyAreaFormat: LegacyAreaFormatService,
    private drawService: DrawService,
    // private sarviewsEventService: SarviewsEventsService,
  ) {}

  public epsg(): string {
    return this.mapView.projection.epsg;
  }

  public zoomIn(): void {
    this.zoom(0.5);
  }

  public zoomOut(): void {
    this.zoom(-0.5);
  }

  public enableInteractions(): void {
    this.selectHover.setActive(true);
    this.selectClick.setActive(true);
  }

  public disableInteractions(): void {
    this.selectHover.setActive(false);
    this.selectClick.setActive(false);
  }

  private zoom(amount: number): void {
    this.map.getView().animate({
      zoom: this.map.getView().getZoom() + amount,
      duration: 150
    });
  }

  public loadPolygonFrom(polygon: string): boolean {
    if (this.legacyAreaFormat.isValid(polygon)) {
      polygon = this.legacyAreaFormat.toWkt(polygon);
    }

    return this.loadWKT(polygon);
  }

  private loadWKT(polygon: string): boolean {
    let didLoad = true;

    try {
      const features = this.wktService.wktToFeature(
        polygon,
        this.epsg()
      );

      this.setDrawFeature(features);
    } catch (e) {
      didLoad = false;
    }

    return didLoad;
  }


  public setLayer(layer: VectorLayer): void {
    if (!!this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
    }

    this.polygonLayer = layer;
    this.map.addLayer(this.polygonLayer);
  }

  public setLayers(layer: Layer): void {
    // for(const layer in layers) {
      this.map.addLayer(layer);
    // }
  }

  public setSarviewsEventsLayers(layers: Layer[]): void {
    for(const layer of layers) {
      this.map.addLayer(layer);
    }
  }

  public sarviewsEventsToFeatures(events: SarviewsEvent[], projection: string) {
    const features = events
      .map(sarviewEvent => {
        const wkt = sarviewEvent.wkt;
        const feature = this.wktService.wktToFeature(wkt, projection);
        feature.set('filename', sarviewEvent.description);

        const geom = (feature.getGeometry() as MultiPolygon).getCoordinates();

        const polygon: Coordinate[] = geom[0][0].slice(0, 4);

        if(polygon.length === 2) {
          const point = new Point([polygon[0][0], polygon[0][1]]);
          feature.set("eventPoint", point);
          feature.setGeometryName("eventPoint");
          return feature;
        }

        const centerLat = (polygon[0][0] + polygon[1][0] + polygon[2][0] + polygon[3][0]) / 4.0;
        const centerLon = (polygon[0][1] + polygon[1][1] + polygon[2][1] + polygon[3][1]) / 4.0;
        const point = new Point([centerLat, centerLon]);


        feature.set("eventPoint", point);
        feature.setGeometryName("eventPoint");
        feature.set("sarviews_id", sarviewEvent.event_id);

        // console.log(feature);
        return feature;
      });
      // console.log(features);
      return features;
  }

  public setOverlayUpdate(updateCallback): void {
    this.drawService.setDrawEndCallback(updateCallback);
  }

  public setDrawStyle(style: models.DrawPolygonStyle): void {
    this.drawService.setDrawStyle(style);
  }

  public setDrawFeature(feature): void {
    this.drawService.setFeature(feature, this.epsg());
  }

  public setInteractionMode(mode: models.MapInteractionModeType) {
    this.drawService.setInteractionMode(this.map, mode);
  }

  public setGridLinesActive(active: boolean) {
    this.gridLinesVisible = active;
    this.map = this.updatedMap();
  }

  public setDrawMode(mode: models.MapDrawModeType): void {
    this.drawService.setDrawMode(this.map, mode);
  }

  public clearDrawLayer(): void {
    this.drawService.clear();
    this.clearFocusedScene();
    this.clearSelectedScene();
  }

  public setCenter(centerPos: models.LonLat): void {
    const { lon, lat } = centerPos;

    this.map.getView().animate({
      center: proj.fromLonLat([lon, lat]),
      duration: 500
    });
  }

  public setZoom(zoom: number): void {
    this.map.getView().animate({
      zoom, duration: 500
    });
  }

  public setMapView(viewType: models.MapViewType, layerType: models.MapLayerTypes, overlay): void {
    const view = {
      [models.MapViewType.ANTARCTIC]: views.antarctic(),
      [models.MapViewType.ARCTIC]: views.arctic(),
      [models.MapViewType.EQUITORIAL]: layerType === models.MapLayerTypes.SATELLITE ?
        views.equatorial() :
        views.equatorialStreet(),
    }[viewType];

    this.setMap(view, overlay);
  }

  public clearSelectedScene(): void {
    this.selectedSource.clear();
    this.selectClick.getFeatures().clear();
  }

  public setSelectedFeature(feature): void {
    this.selectedSource.clear();
    this.selectedSource.addFeature(feature);
  }

  public setSelectedPair(features): void {
    this.selectedSource.clear();

    features.forEach(feature =>
      this.selectedSource.addFeature(feature)
    );
  }
  public clearFocusedScene(): void {
    this.focusSource.clear();
    this.selectHover.getFeatures().clear();
  }

  public setFocusedFeature(feature): void {
    this.focusSource.clear();
    this.focusSource.addFeature(feature);
  }

  public zoomToResults(): void {
    const extent = this.polygonLayer
      .getSource()
      .getExtent();

    this.zoomToExtent(extent);
  }

  public zoomToScene(scene: models.CMRProduct): void {
    const feature = this.wktService.wktToFeature(
      scene.metadata.polygon,
      this.epsg()
    );

    this.zoomToFeature(feature);
  }

  public zoomToFeature(feature): void {
    const extent = feature
      .getGeometry()
      .getExtent();

    this.zoomToExtent(extent);
  }

  private zoomToExtent(extent): void {
    this.map
      .getView()
      .fit(extent, {
        size: this.map.getSize(),
        padding: [0, 0, 500, 0],
        duration: 750,
      });
  }

  private setMap(mapView: views.MapView, overlay): void {
    this.mapView = mapView;

    this.map = (!this.map) ?
      this.createNewMap(overlay) :
      this.updatedMap();
  }


  private createNewMap(overlay): Map {
    const newMap = new Map({
      layers: [ this.mapView.layer, this.drawService.getLayer(), this.focusLayer, this.selectedLayer, this.mapView?.gridlines ],
      target: 'map',
      view: this.mapView.view,
      controls: [],
      overlays: [overlay]
    });

    newMap.addInteraction(this.selectClick);
    newMap.addInteraction(this.selectHover);
    this.selectClick.on('select', e => {
      e.target.getFeatures().forEach(
        feature => this.newSelectedScene$.next(feature.get('filename'))
      );
    });

    this.selectHover.on('select', e => {
      this.map.getTargetElement().style.cursor =
        e.selected.length > 0 ? 'pointer' : '';
    });

    newMap.on('pointermove', e => {
      const [ lon, lat ] = proj.toLonLat(e.coordinate, this.epsg());
      this.mousePositionSubject$.next({ lon, lat });
    });

    // const popupOverlay = new Overlay({
    //   element: this.popupOverlay,
    //   autoPan: true,
    //   autoPanAnimation: {
    //     duration: 250,
    //   },
    // });

    newMap.once('postrender', () => {
      this.onMapReady(newMap);
    });

    // newMap.addOverlay(this.popupOverlay);

    newMap.on("singleclick", (evnt) => this.map.forEachFeatureAtPixel(
      evnt.pixel,
      (feature) => {
        var sarview_id = feature.get('sarviews_id');
        if(!!sarview_id) {
          // window.open(`https://sarviews-hazards.alaska.edu/Event/${sarview_id}`)
        }
        this.popupOverlay.setPosition(evnt.coordinate);
        this.popupOverlay.getElement().innerHTML = '<p>You clicked here:</p>';
        evnt.preventDefault();
      }))

    this.drawService.getLayer().setZIndex(100);
    this.focusLayer.setZIndex(99);
    this.selectedLayer.setZIndex(98);

    newMap.on('moveend', e => {
      const currentMap = e.map;

      const view = currentMap.getView();

      const [lon, lat] = proj.toLonLat(view.getCenter());
      const zoom = view.getZoom();

      this.zoom$.next(zoom);
      this.center$.next({lon, lat});
    });

    return newMap;
  }

  public onMapReady(map: Map) {
    this.mapInit$.next(map);
  }
  private updatedMap(): Map {
    if (this.map.getView().getProjection().getCode() !== this.mapView.projection.epsg) {
      this.map.setView(this.mapView.view);
    }

    const layers = this.map.getLayers().getArray();
    if (this.mapView.projection.epsg === 'EPSG:3857') {
      const gridlineIdx = layers.findIndex(l => l.get('ol_uid') === '100');
      layers[gridlineIdx] = this.mapView.gridlines;
      layers[gridlineIdx]?.setVisible(this.gridLinesVisible);
    } else {
      layers.find(l => l.get('ol_uid') === '100')?.setVisible(false);
    }
    this.mapView.layer.setOpacity(1);

    const mapLayers = this.map.getLayers();
    mapLayers.setAt(0, this.mapView.layer);

    return this.map;
  }
}
