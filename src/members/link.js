/**
 * 자기 폴더 안에서 쓰는 링크 도우미.
 * ------------------------------------------------------------------
 * 라우터에 등록될 때 이름 앞에 slug 가 붙는다('home' → 'inwoo.home').
 * 팀원이 그 규칙을 외울 필요는 없다. 자기 slug 로 한 번 만들어 두고 쓴다.
 *
 *   // routes.js
 *   export const link = memberLink('inwoo')
 *
 *   // 어느 화면에서든
 *   router.push(link('detail', { cityId: 'seoul' }, { from: 'home' }))
 *   <RouterLink :to="link('about')">소개</RouterLink>
 *
 * 등록소(index.js)와 따로 두는 이유는 서로 물고 도는 import 를 피하기 위해서다.
 */
export const memberLink =
  (slug) =>
  (name, params = {}, query = undefined) => ({
    name: `${slug}.${name}`,
    params,
    ...(query ? { query } : {}),
  })
