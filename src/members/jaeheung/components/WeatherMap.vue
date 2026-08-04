<script setup>
// 실시간 날씨 지도 — Leaflet + OpenStreetMap (API 키 불필요)
// props로 받은 도시 목록을 지도 위 마커로 표시하고, 마커 클릭 시 select-city를 emit한다.
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  cities: { type: Array, required: true },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select-city'])

const mapEl = ref(null)
let map = null
const markers = new Map()

function badgeClass(city) {
  if (city.temp == null) return 'unknown'
  if (city.temp >= 25) return 'hot'
  if (city.temp >= 10) return 'cool'
  return 'cold'
}

function buildIcon(city, isSelected) {
  const cls = ['pin', badgeClass(city), isSelected ? 'selected' : ''].join(' ')
  const label = city.temp == null ? '?' : `${city.temp}°`
  return L.divIcon({
    className: 'weather-pin-wrap',
    html: `<div class="${cls}"><span class="pin-label">${label}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
  })
}

function renderMarkers() {
  if (!map) return

  for (const [id, marker] of markers) {
    if (!props.cities.some((c) => c.id === id)) {
      marker.remove()
      markers.delete(id)
    }
  }

  props.cities.forEach((city) => {
    const isSelected = city.id === props.selectedId
    const icon = buildIcon(city, isSelected)
    const popupHtml = `<strong>${city.name}</strong><br/>${city.status ?? '조회 중...'} · ${city.temp == null ? '-' : city.temp + '°C'}`

    let marker = markers.get(city.id)
    if (marker) {
      marker.setIcon(icon)
      marker.setPopupContent(popupHtml)
    } else {
      marker = L.marker([city.lat, city.lon], { icon }).addTo(map).bindPopup(popupHtml)
      marker.on('click', () => emit('select-city', city.id))
      markers.set(city.id, marker)
    }
  })
}

onMounted(() => {
  map = L.map(mapEl.value, {
    center: [36.2, 127.8],
    zoom: 6.4,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  renderMarkers()
})

onUnmounted(() => {
  map?.remove()
  map = null
})

watch(() => props.cities, renderMarkers, { deep: true })

watch(
  () => props.selectedId,
  (id) => {
    renderMarkers()
    const city = props.cities.find((c) => c.id === id)
    if (city && map) {
      map.panTo([city.lat, city.lon])
      markers.get(id)?.openPopup()
    }
  },
)
</script>

<template>
  <div class="weather-map" ref="mapEl"></div>
</template>

<style scoped>
.weather-map {
  width: 100%;
  height: 320px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

:deep(.weather-pin-wrap) {
  background: transparent;
  border: none;
}

:deep(.pin) {
  width: 40px;
  height: 40px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

:deep(.pin-label) {
  display: inline-block;
  transform: rotate(45deg);
  font-size: 12px;
  font-weight: 700;
}

:deep(.pin.hot) {
  background: #ef5b5b;
}
:deep(.pin.cool) {
  background: var(--magpie-blue);
}
:deep(.pin.cold) {
  background: var(--magpie-violet);
}
:deep(.pin.unknown) {
  background: #9aa5b1;
}

:deep(.pin.selected) {
  outline: 3px solid #ffd166;
  outline-offset: 1px;
}
</style>
