# SKALA · 6반 1조 — Vue 결과물

여섯 사람이 각자 만든 화면을 한 사이트에 모아 배포합니다.

```
/                          표지 — 여섯 사람의 결과물
/m/<slug>                  한 사람의 결과물
/m/<slug>/...              그 아래는 그 사람이 알아서 씁니다
```

## 내 결과물 넣기

### 1. 내 폴더를 만든다

`src/members/<본인slug>/` 아래에 내 프로젝트를 통째로 넣습니다.
**`index.vue` 하나만 있으면 등록됩니다.** 나머지는 필요한 만큼만 만드세요.

```
src/members/inwoo/
├── index.vue       ← 진입점. 이것만 있으면 등록된다
├── routes.js       ← (선택) 화면이 여러 개일 때만
├── views/          ← 페이지
├── components/     ← 재사용 부품
├── data/           ← 상수 · API · 공유 상태
└── assets/         ← 이미지
```

폴더가 곧 등록이라 어딘가에 "나 냈어요"를 적을 필요가 없습니다.
`src/data/members.js` 에는 이름 · 소개 · 색만 채워 두세요. 순서도 그 파일 순서를 따릅니다.

### 2. 화면이 여러 개면 `routes.js` 를 둔다

화면이 하나면 이 단계는 건너뛰어도 됩니다. `index.vue` 가 곧 그 화면입니다.

여러 개라면 `index.vue` 를 껍데기로 쓰고 그 안에 `<RouterView />` 를 두세요.
어떤 주소가 어떤 화면인지는 `routes.js` 에 적습니다.

```js
// src/members/inwoo/routes.js
import { memberLink } from '../link'

export const link = memberLink('inwoo') // 내 화면에서 쓸 링크 도우미

export default [
  { path: '', name: 'home', component: () => import('./views/DashboardView.vue') },
  { path: 'about', name: 'about', component: () => import('./views/AboutView.vue') },
  { path: 'weather/:cityId', name: 'detail', component: () => import('./views/DetailView.vue') },
  { path: ':pathMatch(.*)*', name: 'missing', component: () => import('./views/NotFoundView.vue') },
]
```

여기 적은 경로는 전부 `/m/inwoo` 아래에 붙습니다 (`/m/inwoo/about`).

**이름은 자동으로 `inwoo.` 가 앞에 붙습니다.** 그래서 여섯 명이 전부 `home` 이라고
지어도 부딪히지 않습니다. 코드에서 부를 때는 규칙을 외우지 말고 `link()` 를 쓰세요.

```js
router.push(link('detail', { cityId: 'seoul' }, { from: 'home' }))
```

```vue
<RouterLink :to="link('about')">소개</RouterLink>
```

## 합칠 때 지켜야 할 두 가지

여섯 명의 CSS 가 한 페이지에서 섞입니다. 아래 둘만 지키면 서로를 깨뜨리지 않습니다.

1. **`<style scoped>`** — 예외 없이 붙입니다.
2. **전역 선택자 금지** — `body`, `*`, `html`, `:root`, `#app` 을 건드리지 않습니다.
   다른 프로젝트의 `App.vue` 를 그대로 가져오면 대개 여기 리셋이 들어 있습니다. 지우고 넣으세요.

색과 글꼴이 필요하면 **내 `index.vue` 의 루트 클래스 한 곳에만** 선언하세요.
CSS 변수는 자식으로 흘러내리므로 하위 컴포넌트는 그것만 보고 그립니다.

```css
/* src/members/inwoo/index.vue */
.inwoo {
  --accent: #16191c;
  --ink: #16191c;
  /* … */
}
```

클래스 이름도 흔한 것(`.card` `.title` `.list`)은 피하는 편이 안전합니다.

### 개인 프로젝트에서 그대로 옮겨 올 때

**화면이 회색으로 주저앉았다면 십중팔구 토큰 이름이 다른 것입니다.**

갤러리의 `assets/main.css` 가 정의하는 이름은 `--card` · `--fg` · `--surface`
정도입니다. 개인 프로젝트에서 쓰던 `--accent` · `--paper` · `--ink` 는 여기
없습니다. 값이 없는 변수는 오류를 내지 않고 조용히 빈 값이 되므로, 빌드는
멀쩡히 통과하고 색만 사라집니다.

고치는 방법은 위와 같습니다 — **내 루트 클래스 한 곳에** 쓰던 토큰을 그대로
옮겨 적습니다. 공용 `assets/main.css` 에 추가하지 마세요. 그 파일은 여섯 명이
함께 쓰는 것이라, 내 색을 넣으면 남의 화면까지 바뀝니다.

어두운 화면도 함께 챙겨야 합니다. 갤러리는 시스템 설정과 우측 상단 토글
두 가지로 전환하므로, 세 경우를 모두 적어 둡니다.

```css
.inwoo { --paper: #f6f4ef; --ink: #16191c; }              /* 기본(밝게) */

@media (prefers-color-scheme: dark) {                      /* 시스템이 어두울 때 */
  .inwoo { --paper: #14181f; --ink: #e8edf4; }
}

:root[data-theme='light'] .inwoo { /* 밝게 */ }            /* 토글이 시스템을 이긴다 */
:root[data-theme='dark'] .inwoo { /* 어둡게 */ }
```

실제 예시는 `src/members/inwoo/index.vue` 의 맨 위 스타일 블록에 있습니다.

## 갤러리 쪽 구조

껍데기는 조용해야 합니다. 결과물이 주인공이라서요.

```
src/
├── assets/main.css        디자인 토큰 — 무채색 · 14px 한 종류 · 16px 라운드
├── components/            SiteHeader · ThemeToggle
├── data/members.js        명단 (순서 = 표지 순서)
├── members/
│   ├── index.js           자동 등록소 — 폴더를 훑어 라우트를 만든다
│   ├── link.js            링크 도우미
│   └── <slug>/            각자의 프로젝트
├── router/index.js        표지 + 사람마다 /m/<slug> 한 그루
└── views/                 IndexView · MemberView · NotFoundView
```

사람이 늘거나 화면이 늘어도 `router/index.js` 는 고치지 않습니다.

## 개발

```bash
npm install
npm run dev
```

### 로그인·기록 기능을 볼 때

장인우 결과물의 **기록** 메뉴는 mock 서버가 필요합니다. 창을 하나 더 열고:

```bash
npm run api        # http://localhost:3001/api
```

시험용 계정 — `student@skala.com` / `1234`

서버를 안 띄워도 홈 · 날씨 · 운세는 그대로 동작합니다.

## 배포

```bash
npm run deploy
```

`gh-pages` 브랜치로 올라갑니다. 저장소 이름이 `6class-1group` 이 아니면
`vite.config.js` 의 `REPO` 한 줄만 고치면 됩니다.

> GitHub Pages 는 밑줄(`_`)로 시작하는 파일을 무시하므로 `.nojekyll` 을 함께 올립니다.
> 없는 주소로 바로 들어와도 열리도록 `index.html` 을 `404.html` 로도 복사합니다.
> 배포 스크립트가 둘 다 처리합니다.
