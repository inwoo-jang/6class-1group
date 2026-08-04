# dongyeol

## 담당·수정 경계

이 폴더는 **동열 담당 영역**입니다.

- `src/members/dongyeol/**` 수정이 필요하면 먼저 동열과 협의해 주세요.
- 팀원이 사용하는 AI 코딩 도구도 명시적인 동열 작업 요청 없이는 이 영역을 수정하면 안 됩니다. 자세한 규칙은 같은 폴더의 `AGENTS.md`에 있습니다.
- 다른 팀원의 리팩터링·CSS 정리·공용 설정 변경에 이 폴더를 포함하지 않습니다.
- 동열 API의 서버 구현은 `mock-api/dongyeol/**`, 공용 연결부는 `mock-api/server.js`와 `vite.config.js`에 있습니다. 해당 경로를 바꾸려면 이 폴더와 함께 확인해 주세요.
- 실제 API 키나 `.env.local`은 커밋하지 않습니다.

이 영역의 진입점은 `index.vue`, 하위 라우트는 `routes.js`입니다.

---

여기가 당신의 작업 폴더입니다. **이 폴더 밖은 건드릴 일이 없습니다.**

## 시작하기

이 폴더에 `index.vue` 를 만들면 그 순간 사이트에 등록됩니다.
(이 파일이 생기기 전까지는 목록에 "준비 중" 으로 남습니다.)

```
src/members/dongyeol/
├── index.vue      ← 이것만 있으면 됩니다
├── views/         ← 화면이 여러 개면
├── components/    ← 재사용 부품
├── data/          ← 상수 · API
└── assets/        ← 이미지
```

화면이 하나면 `index.vue` 에 그대로 넣으시면 됩니다.

## 화면이 여러 개라면

`routes.js` 를 만들고 하위 경로를 적으면 됩니다.
라우트 이름 앞에는 자동으로 `dongyeol.` 가 붙으므로,
다른 팀원과 이름이 겹쳐도 부딪히지 않습니다.

```js
// routes.js
import { memberLink } from '../link'

export const link = memberLink('dongyeol')

export default [
  { path: '', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: 'detail/:id', name: 'detail', component: () => import('./views/DetailView.vue') },
]
```

이때 `index.vue` 는 껍데기가 되고, 그 안의 `<RouterView />` 자리에 하위 화면이 들어옵니다.
자세한 예시는 `src/members/inwoo/` 를 참고하세요.

## 꼭 지켜야 할 두 가지

여섯 명의 CSS가 한 페이지에서 섞입니다. 안 지키면 **남의 화면까지 깨집니다.**

1. `<style>` 에 반드시 **`scoped`**
2. `body`, `*`, `html`, `#app` **전역 선택자 금지**
   → 다른 프로젝트의 `App.vue` 를 그대로 가져오면 대개 여기 리셋이 들어 있습니다. 지우고 넣으세요.

## 마지막으로

`src/data/members.js` 에서 **본인 줄만** 채워 주세요 (이름 · title · role · stack · accent).
남의 줄은 건드리지 마세요.
