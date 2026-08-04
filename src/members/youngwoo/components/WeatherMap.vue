<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { convertTemp } from '../utils/temperature'
import { useDisplayTemp } from '../composables/useDisplayTemp'

const props = defineProps({
  cities: {
    type: Array,
    default: () => [],
  },
  // 지도 확대/축소 범위 계산 전용 — 검색으로 걸러지지 않은 해당 지역 전체 도시 목록.
  // cities는 필터링될 때마다 바뀌므로, 그걸로 fitBounds를 하면 검색할 때마다 지도가
  // 확 확대/축소된다. 마커 표시(cities)와 지도 범위(allCities)를 분리해서 이를 막는다.
  allCities: {
    type: Array,
    default: () => [],
  },
  focusedCityId: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: 'domestic',
  },
  // 캐시가 아직 안 지난 현재 위치. 있으면 geolocation을 다시 안 묻고 마커만 복원한다.
  currentLocation: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select-city', 'locate', 'view-detail'])

const { unit } = useDisplayTemp()

const mapContainer = ref(null)
let map = null
const markers = new Map()
let currentLocationMarker = null
// 전체 도시가 한눈에 보이는 기준 줌. 카드 클릭 시 이 값을 기준으로 상대적으로만 확대한다.
let baseZoom = 6

const isLocating = ref(false)
const locateError = ref('')

function createWeatherIcon(city, temp) {
  const isWarm = city.temp >= 25
  // 국내 도시는 이름이 대부분 2글자라, 그 경우에만 카드를 더 좁게 줄인다.
  const isShort = props.region === 'domestic' && city.name.length <= 2
  const width = isShort ? 26 : 34
  const height = isShort ? 42 : 46
  return L.divIcon({
    className: 'youngwoo-mini-marker-wrap',
    html: `
      <div class="youngwoo-mini-marker ${isWarm ? 'is-warm' : 'is-cool'} ${isShort ? 'is-short' : ''}">
        <span class="youngwoo-mini-marker__name">${city.name}</span>
        <i class="youngwoo-mini-marker__icon fa-solid ${city.icon?.replace('fa-solid ', '') ?? 'fa-cloud'}"></i>
        <span class="youngwoo-mini-marker__temp">${temp}</span>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -height / 2],
  })
}

// 현재 위치 마커는 검색 필터로 갈아엎히는 markers Map과 별도로 관리되므로
// (drawMarkers가 markers를 통째로 지우기 때문) 포커스 표시도 따로 처리한다.
function getMarkerById(cityId) {
  if (cityId === 'current-location') return currentLocationMarker
  return markers.get(cityId)
}

function applyFocusHighlight() {
  markers.forEach((marker, cityId) => {
    const el = marker.getElement()?.querySelector('.youngwoo-mini-marker')
    el?.classList.toggle('is-focused', cityId === props.focusedCityId)
  })

  const currentEl = currentLocationMarker
    ?.getElement()
    ?.querySelector('.youngwoo-current-location-marker')
  currentEl?.classList.toggle('is-focused', props.focusedCityId === 'current-location')
}

function drawMarkers() {
  if (!map) return

  markers.forEach((marker) => marker.remove())
  markers.clear()

  props.cities.forEach((city) => {
    if (city.lat == null || city.lon == null) return
    const temp = convertTemp(city.temp, unit.value)
    const marker = L.marker([city.lat, city.lon], { icon: createWeatherIcon(city, temp) }).addTo(
      map,
    )
    // 마커 자체에 이미 이름·아이콘·온도가 다 보이므로, 팝업은 상세보기로 가는
    // 버튼 하나만 제공한다 (같은 정보를 또 보여주지 않는다).
    marker.bindPopup(
      `
      <button type="button" class="youngwoo-popup__detail-btn" data-city-id="${city.id}">
        <i class="fa-solid fa-circle-info"></i> 상세보기
      </button>
    `,
      { closeButton: false },
    )
    marker.on('click', () => emit('select-city', city.id))
    markers.set(city.id, marker)
  })

  applyFocusHighlight()
}

function fitToBounds() {
  if (!map || props.allCities.length === 0) return

  const bounds = L.latLngBounds(props.allCities.map((city) => [city.lat, city.lon]))
  const padding = [30, 30]
  baseZoom = map.getBoundsZoom(bounds, false, padding)
  // 국내는 도시들이 다 보이는 줌보다 더 축소하지 못하게 막고, 해외는 지구 전체를 볼 수 있게 자유롭게 둔다.
  map.setMinZoom(props.region === 'domestic' ? baseZoom : 1)
  map.fitBounds(bounds, { padding })
}

// 우리가 허용한 범위(setMinZoom) 안에서 전체 도시가 다시 보이도록 되돌린다.
function resetView() {
  fitToBounds()
}

// 마커 하나에 포커스할 때 쓰는 줌 — 현재 위치든 일반 도시 마커든 동일하게 적용해서
// 지역(국내/해외)마다 확대 정도가 어긋나지 않게 한다.
function getFocusZoom() {
  // 국내는 기준 줌(전체보기 줌) 대비 살짝만 확대한다.
  if (props.region === 'domestic') return Math.min(baseZoom + 2, 10)
  // 해외는 기준 줌 자체가 지구 전체가 보이는 수준으로 낮아서, 거기서 조금은 확대하되
  // 너무 바짝 확대되지는 않게 최소 줌만 보장한다.
  return Math.max(baseZoom + 1, 5)
}

function showCurrentLocationMarker(lat, lon, { fly = true } = {}) {
  if (!map) return

  if (fly) map.flyTo([lat, lon], getFocusZoom(), { duration: 0.8 })

  currentLocationMarker?.remove()
  currentLocationMarker = L.marker([lat, lon], {
    // 다른 도시 마커랑 겹칠 때 항상 뒤로 가도록 z-index를 낮게 고정한다.
    // (Leaflet 기본값은 화면상 y좌표가 클수록 위로 오는데, 그러면 겹칠 때마다 순서가 뒤바뀐다.)
    zIndexOffset: -1000,
    icon: L.divIcon({
      className: 'youngwoo-mini-marker-wrap',
      html: '<div class="youngwoo-current-location-marker"><i class="fa-solid fa-location-crosshairs"></i></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  }).addTo(map)
  applyFocusHighlight()
}

function locateMe() {
  if (!navigator.geolocation) {
    locateError.value = '이 브라우저는 위치 정보를 지원하지 않습니다.'
    return
  }

  isLocating.value = true
  locateError.value = ''

  navigator.geolocation.getCurrentPosition(
    (position) => {
      isLocating.value = false
      const { latitude, longitude } = position.coords
      showCurrentLocationMarker(latitude, longitude)
      emit('locate', { lat: latitude, lon: longitude })
    },
    () => {
      isLocating.value = false
      locateError.value = '위치 정보를 가져오지 못했습니다.'
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

onMounted(() => {
  map = L.map(mapContainer.value, { scrollWheelZoom: false }).setView([36.5, 127.8], 6)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  // 팝업은 Leaflet이 열 때마다 새로 그리므로, 버튼에 매번 리스너를 다는 대신
  // 지도 컨테이너 하나에 위임해서 한 번만 건다.
  mapContainer.value.addEventListener('click', (e) => {
    const btn = e.target.closest('.youngwoo-popup__detail-btn')
    if (btn) emit('view-detail', btn.dataset.cityId)
  })

  drawMarkers()
  fitToBounds()
  // 캐시가 있으면(재진입) geolocation을 다시 안 묻고 마커만 조용히 복원하고,
  // 없으면(첫 진입) 실제로 위치 권한을 물어서 새로 찾는다.
  if (props.currentLocation) {
    showCurrentLocationMarker(props.currentLocation.lat, props.currentLocation.lon, {
      fly: false,
    })
  } else {
    locateMe()
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// 검색/필터로 cities가 바뀌어도 마커만 다시 그리고, 지도 확대/축소는 건드리지 않는다.
watch(() => props.cities, drawMarkers)
watch(unit, drawMarkers)
// allCities는 지역(region) 전환이나 최초 로딩 때만 바뀌므로, 이때만 지도 범위를 다시 맞춘다.
watch(() => props.allCities, fitToBounds)

watch(
  () => props.focusedCityId,
  (cityId) => {
    applyFocusHighlight()
    if (!map || !cityId) return
    const marker = getMarkerById(cityId)
    if (!marker) return

    map.flyTo(marker.getLatLng(), getFocusZoom(), { duration: 0.8 })
    marker.openPopup()
  },
)
</script>

<template>
  <div class="weather-map-container">
    <div class="weather-map-toolbar">
      <button type="button" class="weather-map-toolbar__btn" @click="resetView">
        <i class="fa-solid fa-expand"></i> 전체보기
      </button>
      <button
        type="button"
        class="weather-map-toolbar__btn"
        :disabled="isLocating"
        @click="locateMe"
      >
        <i
          class="fa-solid"
          :class="isLocating ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'"
        ></i>
        현위치
      </button>
    </div>
    <p v-if="locateError" class="weather-map-toolbar__error">{{ locateError }}</p>
    <div ref="mapContainer" class="weather-map"></div>
  </div>
</template>

<style scoped>
.weather-map-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
}

.weather-map-toolbar {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.weather-map-toolbar__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-small);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-map-toolbar__btn:hover:not(:disabled) {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}

.weather-map-toolbar__btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.weather-map-toolbar__error {
  margin: 0;
  font-size: 11px;
  color: var(--color-error);
}

.weather-map {
  width: 100%;
  min-height: 300px;
  flex: 1;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}
</style>

<!-- Leaflet이 divIcon HTML을 직접 DOM에 꽂아 넣어서(Vue 렌더 트리 밖) scoped 스타일이 안 먹는다. -->
<style>
.youngwoo-mini-marker-wrap {
  background: transparent;
  border: none;
}

/* 지도 타일 자체가 항상 밝은 색(OpenStreetMap)이라, 마커 칩이 갤러리의 다크모드를
   따라가면 밝은 지도 위에 검게 붕 떠 보인다. 그래서 카드 배경/글자/테두리는 테마
   변수(var(--color-card-background) 등) 대신 고정된 밝은 값으로 못박아 둔다.
   포인트 색(강조/온도색/그림자)은 원래도 테마 무관하게 고정이라 그대로 var() 유지. */
.youngwoo-mini-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 34px;
  padding: 2px 1px;
  border-radius: var(--border-radius-small);
  background: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  line-height: 1.1;
}

.youngwoo-mini-marker__name {
  font-size: 8px;
  font-weight: 700;
  color: #232323;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.youngwoo-mini-marker__icon {
  font-size: 11px;
  color: var(--color-primary-darker);
}

.youngwoo-mini-marker__temp {
  font-size: 9px;
  font-weight: 800;
}

.youngwoo-mini-marker.is-short {
  width: 26px;
  padding: 2px 0;
}

.youngwoo-mini-marker.is-short .youngwoo-mini-marker__name {
  font-size: 7px;
}

.youngwoo-mini-marker.is-short .youngwoo-mini-marker__icon {
  font-size: 10px;
}

.youngwoo-mini-marker.is-short .youngwoo-mini-marker__temp {
  font-size: 8px;
}

.youngwoo-mini-marker.is-warm .youngwoo-mini-marker__temp {
  color: var(--color-warm);
}

.youngwoo-mini-marker.is-cool .youngwoo-mini-marker__temp {
  color: var(--color-info);
}

.youngwoo-mini-marker.is-focused {
  border-color: var(--color-primary-darker);
  border-width: 2px;
  box-shadow:
    0 0 0 2px var(--color-primary-opacity-30),
    var(--shadow-hover);
}

.youngwoo-current-location-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: var(--color-primary-darker);
  color: #ffffff;
  font-size: 13px;
  box-shadow: var(--shadow-hover);
}

.youngwoo-current-location-marker.is-focused {
  box-shadow:
    0 0 0 3px var(--color-primary-opacity-30),
    var(--shadow-hover);
}

.leaflet-popup-content-wrapper {
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow-hover);
}

.leaflet-popup-content {
  margin: 4px 6px;
}

.youngwoo-popup__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: var(--border-radius-small);
  background: transparent;
  color: #666666;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.youngwoo-popup__detail-btn:hover {
  background: var(--color-primary-opacity-10);
  color: var(--color-primary-darker);
}
</style>
