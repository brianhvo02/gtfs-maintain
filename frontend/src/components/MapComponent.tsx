import 'mapbox-gl/dist/mapbox-gl.css';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox/typed';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import Map, { useControl, NavigationControl, FullscreenControl, GeolocateControl, MapRef } from 'react-map-gl';
import { hexToRgb, useGeolocation } from '../utils';
import { Feature } from 'geojson';
import { useEffect, useRef } from 'react';
import bbox from '@turf/bbox';

const DeckGLOverlay = (props: MapboxOverlayProps & { interleaved?: boolean; }) => {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

const MapComponent = ({ mapData }: { mapData?: Feature[] }) => {
    const geolocation = useGeolocation();
    const mapRef = useRef<MapRef>(null);

    const layer = new GeoJsonLayer({
        id: 'geojson-layer',
        data: mapData,
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
            console.log(bounds)
            const box = Array.from(Array(4).keys()).map(i => (i < 2 ? Math.min : Math.max)(...bounds.map(bound => bound[i]).filter(bound => bound && Number.isFinite(bound)))) as [number, number, number, number];
            console.log(box)
            mapRef.current.fitBounds(box, {
                padding: 25,
                duration: 5000
            });
        }
    }, [mapData]);

    if (!geolocation)
        return <p>Loading...</p>;

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