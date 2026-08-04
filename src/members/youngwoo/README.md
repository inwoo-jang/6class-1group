# youngwoo

여기가 당신의 작업 폴더입니다. **이 폴더 밖은 건드릴 일이 없습니다.**

## 시작하기

이 폴더에 `index.vue` 를 만들면 그 순간 사이트에 등록됩니다.
(이 파일이 생기기 전까지는 목록에 "준비 중" 으로 남습니다.)

```
src/members/youngwoo/
├── index.vue      ← 이것만 있으면 됩니다
├── views/         ← 화면이 여러 개면
├── components/    ← 재사용 부품
├── data/          ← 상수 · API
└── assets/        ← 이미지
```

화면이 하나면 `index.vue` 에 그대로 넣으시면 됩니다.

## 화면이 여러 개라면

`routes.js` 를 만들고 하위 경로를 적으면 됩니다.
라우트 이름 앞에는 자동으로 `youngwoo.` 가 붙으므로,
다른 팀원과 이름이 겹쳐도 부딪히지 않습니다.

```js
// routes.js
import { memberLink } from '../link'

export const link = memberLink('youngwoo')

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
