import { ref } from 'vue'

/**
 * 배경이 따라갈 날씨.
 *
 * 날씨 목록에서 고른 도시, 상세 화면의 도시가 각각 이 값을 바꾸고
 * 껍데기(final/index.vue)의 배경이 그 값을 본다.
 *
 * 형제 화면끼리 값을 주고받아야 하는데 공통 부모를 거치기 번거로워서
 * 파일 하나에 담아 공유한다. 이런 상황이 잦아지면 Pinia(CH06)로 옮긴다.
 */
export const backdropStatus = ref('')
