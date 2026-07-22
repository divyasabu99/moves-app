import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '@/hooks/useColors';
import { Place } from '@/types';

// Approximate centroids for NYC neighborhoods — used when a place has no stored coordinates
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'Lower East Side':       [40.7150, -73.9830],
  'East Village':          [40.7265, -73.9815],
  'West Village':          [40.7341, -74.0060],
  'Greenwich Village':     [40.7338, -74.0020],
  'SoHo':                  [40.7230, -74.0030],
  'NoLita':                [40.7231, -73.9941],
  'Nolita':                [40.7231, -73.9941],
  'Tribeca':               [40.7163, -74.0086],
  'Financial District':    [40.7075, -74.0090],
  'Chinatown':             [40.7158, -73.9970],
  'Little Italy':          [40.7191, -73.9973],
  'Midtown':               [40.7549, -73.9840],
  'Midtown East':          [40.7527, -73.9718],
  'Midtown West':          [40.7580, -73.9855],
  "Hell's Kitchen":        [40.7638, -73.9920],
  'Chelsea':               [40.7465, -74.0014],
  'Flatiron':              [40.7414, -73.9897],
  'NoMad':                 [40.7448, -73.9878],
  'Gramercy':              [40.7382, -73.9844],
  'Murray Hill':           [40.7488, -73.9773],
  'Kips Bay':              [40.7430, -73.9780],
  'Upper East Side':       [40.7736, -73.9566],
  'Upper West Side':       [40.7870, -73.9754],
  'Harlem':                [40.8116, -73.9465],
  'East Harlem':           [40.7957, -73.9389],
  'Washington Heights':    [40.8448, -73.9311],
  'Inwood':                [40.8679, -73.9207],
  'Meatpacking District':  [40.7408, -74.0048],
  'Williamsburg':          [40.7081, -73.9571],
  'Bushwick':              [40.6944, -73.9213],
  'Park Slope':            [40.6681, -73.9800],
  'Prospect Heights':      [40.6762, -73.9673],
  'Crown Heights':         [40.6681, -73.9436],
  'Bed-Stuy':              [40.6872, -73.9418],
  'Bedford-Stuyvesant':    [40.6872, -73.9418],
  'Fort Greene':           [40.6885, -73.9754],
  'Clinton Hill':          [40.6881, -73.9665],
  'Boerum Hill':           [40.6872, -73.9901],
  'Carroll Gardens':       [40.6804, -73.9999],
  'Cobble Hill':           [40.6864, -73.9957],
  'Red Hook':              [40.6743, -74.0082],
  'Gowanus':               [40.6743, -73.9993],
  'DUMBO':                 [40.7033, -73.9890],
  'Brooklyn Heights':      [40.6962, -73.9937],
  'Greenpoint':            [40.7290, -73.9511],
  'Long Island City':      [40.7447, -73.9484],
  'Astoria':               [40.7721, -73.9301],
  'Jackson Heights':       [40.7556, -73.8830],
  'Flushing':              [40.7678, -73.8330],
  'Ridgewood':             [40.7066, -73.9059],
  'Sunnyside':             [40.7451, -73.9200],
  'Sunset Park':           [40.6468, -74.0038],
  'Bay Ridge':             [40.6348, -74.0235],
  'Flatbush':              [40.6501, -73.9496],
  'Prospect Park':         [40.6602, -73.9690],
  'Ditmas Park':           [40.6376, -73.9640],
  'Cypress Hills':         [40.6884, -73.8741],
  'Woodside':              [40.7456, -73.9013],
  'Corona':                [40.7498, -73.8631],
  'Jamaica':               [40.7021, -73.7879],
  'Bayside':               [40.7632, -73.7729],
  'Forest Hills':          [40.7196, -73.8448],
  'Rego Park':             [40.7258, -73.8631],
  'Kew Gardens':           [40.7091, -73.8302],
  'Staten Island':         [40.5795, -74.1502],
  'Stapleton':             [40.6279, -74.0766],
  'St. George':            [40.6437, -74.0739],
};

function getCoords(place: Place): [number, number] | null {
  if (place.lat !== undefined && place.lng !== undefined) {
    return [place.lat, place.lng];
  }
  return NEIGHBORHOOD_COORDS[place.neighborhood] ?? null;
}

function buildMapHtml(places: Place[]): string {
  const markers = places
    .map(p => {
      const coords = getCoords(p);
      if (!coords) return null;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        neighborhood: p.neighborhood,
        priceLevel: p.priceLevel,
        lat: coords[0],
        lng: coords[1],
        approx: !p.lat && !p.lng,
      };
    })
    .filter(Boolean);

  const markersJson = JSON.stringify(markers);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0F0F0F}
    .leaflet-popup-content-wrapper{
      background:#1C1C1E;color:#FAFAFA;
      border-radius:12px;border:1px solid rgba(255,255,255,0.1);
      box-shadow:0 4px 24px rgba(0,0,0,0.6)
    }
    .leaflet-popup-tip-container{display:none}
    .leaflet-popup-close-button{color:#8E8E93!important;font-size:16px!important;padding:8px 10px!important}
    .leaflet-popup-content{margin:12px 14px!important;min-width:140px}
    .popup-name{font-family:sans-serif;font-weight:700;font-size:13px;color:#FAFAFA;margin-bottom:4px}
    .popup-meta{font-family:sans-serif;font-size:11px;color:#8E8E93;line-height:1.4}
    .popup-price{color:#FF3B5C;font-weight:700}
    .popup-approx{display:block;font-size:10px;color:#555;margin-top:3px}
    .leaflet-control-zoom a{background:#1C1C1E!important;color:#FAFAFA!important;border-color:#3A3A3C!important}
    .leaflet-control-zoom a:hover{background:#2C2C2E!important}
    .leaflet-control-attribution{background:rgba(15,15,15,0.7)!important;color:#555!important}
    .leaflet-control-attribution a{color:#777!important}
  </style>
</head>
<body>
<div id="map"></div>
<script>
var markers = ${markersJson};
var budgetLabel = {1:'$',2:'$$',3:'$$$',4:'$$$$'};
var catLabel = {
  restaurant:'Restaurant',bar:'Bar',cafe:'Cafe',
  museum:'Museum',activity:'Activity',park:'Park',shop:'Shop'
};

var map = L.map('map',{
  center:[40.7306,-73.9352],
  zoom:12,
  zoomControl:true,
  attributionControl:true,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains:'abcd',
  maxZoom:19
}).addTo(map);

var latlngs = [];
markers.forEach(function(p){
  var icon = L.divIcon({
    html:'<div style="width:14px;height:14px;background:#FF3B5C;border-radius:50%;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 0 3px rgba(255,59,92,0.25),0 2px 8px rgba(0,0,0,0.5);"></div>',
    iconSize:[14,14],iconAnchor:[7,7],className:''
  });
  var popup = '<div class="popup-name">'+p.name+'</div>'
    +'<div class="popup-meta">'
    +'<span>'+p.neighborhood+'&nbsp;&middot;&nbsp;'+(catLabel[p.category]||p.category)+'&nbsp;&middot;&nbsp;</span>'
    +'<span class="popup-price">'+(budgetLabel[p.priceLevel]||'')+'</span>'
    +(p.approx?'<span class="popup-approx">Approximate location</span>':'')
    +'</div>';
  L.marker([p.lat,p.lng],{icon:icon}).addTo(map).bindPopup(popup);
  latlngs.push([p.lat,p.lng]);
});

if(latlngs.length>1){
  map.fitBounds(L.latLngBounds(latlngs),{padding:[40,40],maxZoom:14});
} else if(latlngs.length===1){
  map.setView(latlngs[0],14);
}
</script>
</body>
</html>`;
}

interface PlacesMapViewProps {
  places: Place[];
}

export function PlacesMapView({ places }: PlacesMapViewProps) {
  const colors = useColors();
  const html = useMemo(() => buildMapHtml(places), [places]);

  if (places.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          No places to show on map.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={styles.map}
      scrollEnabled={false}
      bounces={false}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      // On web, react-native-webview renders an iframe — no extra config needed
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
