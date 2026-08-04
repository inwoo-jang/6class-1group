const initialProducts = [
  { id: 1, name: 'Vue 3 실전 가이드', category: '도서', price: 32000, stock: 8, description: 'Composition API와 컴포넌트 설계를 다루는 실습서' },
  { id: 2, name: '무선 키보드', category: '장비', price: 49000, stock: 5, description: '프런트엔드 개발자를 위한 저소음 무선 키보드' },
  { id: 3, name: '버티컬 마우스', category: '장비', price: 39000, stock: 0, description: '손목 부담을 줄이는 인체공학 마우스' },
  { id: 4, name: 'USB-C 허브', category: '장비', price: 59000, stock: 4, description: 'HDMI와 USB 포트를 지원하는 7-in-1 허브' },
  { id: 5, name: '웹 접근성 체크리스트', category: '도서', price: 18000, stock: 12, description: '실무 UI 접근성 점검 항목을 정리한 핸드북' },
]

let products = []
let nextProductId = 1

export function resetProducts() {
  products = structuredClone(initialProducts)
  nextProductId = Math.max(...products.map(({ id }) => id)) + 1
  return products
}

export const listProducts = () => products
export const getProductCount = () => products.length
export const findProductById = (productId) => products.find(({ id }) => id === productId)

export function createProduct(input) {
  const product = { id: nextProductId++, ...input }
  products.push(product)
  return product
}

export function updateProduct(productId, patch) {
  const product = findProductById(productId)
  if (!product) return undefined
  Object.assign(product, patch)
  return product
}

export function deleteProduct(productId) {
  const index = products.findIndex(({ id }) => id === productId)
  if (index === -1) return undefined
  return products.splice(index, 1)[0]
}

resetProducts()
