# SKALA — Vue Team Gallery

여섯 사람이 각자 만든 화면을 한 사이트에 모아 배포합니다.

## 결과물 넣는 방법

1. **폴더를 만든다** — `src/members/<본인slug>/index.vue`
2. **명단에 한 줄 적는다** — `src/data/members.js` 에서 본인 항목의 이름 · 소개 · 기술을 채우고 `ready: true`
3. 끝. 목록과 주소(`/m/<slug>`)는 자동으로 만들어집니다.

부품이 여러 개면 같은 폴더 안에 두면 됩니다.

```
src/members/inwoo/
├── index.vue        ← 이것만 있으면 등록된다
├── WeatherCard.vue
└── data.js
```

## 합칠 때 지켜야 할 두 가지

여섯 명의 CSS가 한 페이지에서 섞입니다. 아래 둘만 지키면 서로를 깨뜨리지 않습니다.

1. **`<style scoped>`** — 예외 없이 붙입니다.
2. **전역 선택자 금지** — `body`, `*`, `html`, `#app` 을 건드리지 않습니다.
   다른 프로젝트의 `App.vue` 를 그대로 가져오면 대개 여기 리셋이 들어 있습니다. 지우고 넣으세요.

클래스 이름도 흔한 것(`.card` `.title` `.list`)은 피하는 편이 안전합니다.
scoped 가 막아 주지만, 남의 컴포넌트를 `:deep()` 으로 건드릴 일이 생기면 부딪힙니다.

## 개발

```bash
npm install
npm run dev
```

## 배포

```bash
npm run deploy
```

`gh-pages` 브랜치로 올라갑니다. 저장소 이름이 `6class-1group` 이 아니면
`vite.config.js` 의 `REPO` 한 줄만 고치면 됩니다.

> GitHub Pages 는 밑줄(`_`)로 시작하는 파일을 무시하므로 `.nojekyll` 을 함께 올립니다.
> 없는 주소로 바로 들어와도 열리도록 `index.html` 을 `404.html` 로도 복사합니다.
> 배포 스크립트가 둘 다 처리합니다.
