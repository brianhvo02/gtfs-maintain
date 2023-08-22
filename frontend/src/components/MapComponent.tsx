import 'mapbox-gl/dist/mapbox-gl.css';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox/typed';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import Map, { useControl, NavigationControl, FullscreenControl, GeolocateControl, MapRef } from 'react-map-gl';
import { MapDatum, checkRouteFeature, flattenFeatureCollections, hexToRgb, useGeolocation } from '../utils';
import { Feature } from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import bbox from '@turf/bbox';
import { Route } from 'gtfs-types';

const DeckGLOverlay = (props: MapboxOverlayProps & { interleaved?: boolean; }) => {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

interface MapComponentProps { 
    mapData?: MapDatum[];
    mapDatum?: MapDatum;
    hoveredRoute?: Route
    selectedRoute?: Route;
}

const MapComponent = ({ mapData, hoveredRoute, selectedRoute, mapDatum }: MapComponentProps) => {
    const geolocation = useGeolocation();
    const mapRef = useRef<MapRef>(null);

    const mapFeatures = useMemo(() => flattenFeatureCollections(mapData ?? []).filter(feature => {
        if (selectedRoute || hoveredRoute) {
            if (
                checkRouteFeature(feature)
                    && 
                (
                    feature.properties.route_id === selectedRoute?.route_id
                        ||
                    feature.properties.route_id === hoveredRoute?.route_id
                )
            ) return true;
            else return false;
        } else return true;
    }), [selectedRoute, hoveredRoute, mapData]);

    const layer = new GeoJsonLayer({
        id: 'geojson-layer',
        data: mapDatum ?? mapFeatures,
        pointType: 'circle',
        getPointRadius: 25,
        pointRadiusMinPixels: 3,
        pointRadiusMaxPixels: 25,
        getFillColor: [94, 94, 94],
        lineWidthScale: 10,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 10,
        getLineColor: (feature: Feature) => hexToRgb(feature.properties?.route_color) ?? [200, 200, 200, feature.geometry.type === 'Point' ? 0 : 255],
    });

    useEffect(() => {
        if (mapRef.current && mapData) {
            const bounds = mapData.map(f => bbox(f));
            const box = Array.from(Array(4).keys()).map(i => (i < 2 ? Math.min : Math.max)(...bounds.map(bound => bound[i]).filter(bound => bound && Number.isFinite(bound)))) as [number, number, number, number];
            mapRef.current.fitBounds(box, {
                padding: 25,
                duration: 5000
            });
        }
    }, [mapData]);

    useEffect(() => {
        if (mapRef.current && mapDatum && selectedRoute) {
            const box = bbox(mapDatum) as [number, number, number, number];
            mapRef.current.fitBounds(box, {
                padding: 25,
                duration: 5000
            });
        }
    }, [mapDatum, selectedRoute])

    if (!geolocation)
        return <p style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}>Loading map...</p>;

    return (
        <Map
            initialViewState={{
                latitude: geolocation.lat,
                longitude: geolocation.lon,
                zoom: 12
            }}
            mapStyle='mapbox://styles/mapbox/dark-v11'
            style={{
                position: 'absolute',
                width: '100vw',
                height: '100vh'
            }}
            ref={mapRef}
        >
            <DeckGLOverlay layers={[layer]} />
            <NavigationControl />
            <FullscreenControl />
            <GeolocateControl />
        </Map>
    );
}

export default MapComponent;