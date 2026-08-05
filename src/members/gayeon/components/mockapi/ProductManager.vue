<script setup>
import { onMounted, reactive, ref, watch } from 'vue'

import { productApi } from '@/members/gayeon/api/productApi.js'

const props = defineProps({
  // App.vue에서 데이터 초기화가 일어나면 값이 증가합니다.
  refreshKey: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['notify', 'changed'])

const products = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const editingId = ref(null)

const filters = reactive({
  q: '',
  category: '전체',
  available: false,
})

const emptyProductForm = () => ({
  name: '',
  category: '장비',
  price: 0,
  stock: 0,
  description: '',
})

const form = reactive(emptyProductForm())

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price)
}

async function loadProducts() {
  isLoading.value = true
  try {
    products.value = await productApi.getAll({
      q: filters.q || undefined,
      category: filters.category,
      available: filters.available || undefined,
    })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isLoading.value = false
  }
}

function clearForm() {
  editingId.value = null
  Object.assign(form, emptyProductForm())
}

function startEdit(product) {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description,
  })

  // 작은 화면에서도 수정 폼을 바로 찾도록 부드럽게 이동합니다.
  document.querySelector('#product-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitProduct() {
  isSaving.value = true
  try {
    if (editingId.value) {
      await productApi.update(editingId.value, { ...form })
      emit('notify', { type: 'success', message: '상품이 수정되었습니다.' })
    } else {
      await productApi.create({ ...form })
      emit('notify', { type: 'success', message: '새 상품이 등록되었습니다.' })
    }

    clearForm()
    await loadProducts()
    emit('changed')
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isSaving.value = false
  }
}

async function removeProduct(product) {
  const accepted = window.confirm(`“${product.name}” 상품을 삭제할까요?`)
  if (!accepted) return

  try {
    await productApi.remove(product.id)
    if (editingId.value === product.id) clearForm()
    await loadProducts()
    emit('changed')
    emit('notify', { type: 'success', message: '상품이 삭제되었습니다.' })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  }
}

function resetFilters() {
  Object.assign(filters, { q: '', category: '전체', available: false })
  loadProducts()
}

onMounted(loadProducts)
watch(() => props.refreshKey, loadProducts)
</script>

<template>
  <section class="manager-grid">
    <article id="product-form" class="panel panel--form">
      <div class="panel__heading">
        <div>
          <span class="method-badge" :class="editingId ? 'method-badge--patch' : 'method-badge--post'">
            {{ editingId ? 'PATCH' : 'POST' }}
          </span>
          <h2>{{ editingId ? '상품 수정' : '상품 등록' }}</h2>
        </div>
        <button v-if="editingId" class="text-button" type="button" @click="clearForm">
          수정 취소
        </button>
      </div>

      <form class="data-form" @submit.prevent="submitProduct">
        <label class="field">
          <span>상품명 <b>*</b></span>
          <input v-model.trim="form.name" required maxlength="80" placeholder="예: 노트북 거치대" />
        </label>

        <div class="field-row">
          <label class="field">
            <span>카테고리</span>
            <select v-model="form.category">
              <option>장비</option>
              <option>도서</option>
              <option>강의</option>
              <option>기타</option>
            </select>
          </label>
          <label class="field">
            <span>재고</span>
            <input v-model.number="form.stock" type="number" min="0" step="1" required />
          </label>
        </div>

        <label class="field">
          <span>가격</span>
          <input v-model.number="form.price" type="number" min="0" step="100" required />
        </label>

        <label class="field">
          <span>상품 설명</span>
          <textarea
            v-model.trim="form.description"
            rows="4"
            maxlength="300"
            placeholder="상품의 특징을 입력하세요."
          ></textarea>
        </label>

        <button class="button button--primary button--wide" :disabled="isSaving">
          {{ isSaving ? '저장 중…' : editingId ? '수정 내용 저장' : '새 상품 등록' }}
        </button>
      </form>
    </article>

    <article class="panel panel--content">
      <div class="panel__heading panel__heading--list">
        <div>
          <span class="method-badge method-badge--get">GET</span>
          <h2>상품 목록</h2>
        </div>
        <span class="count-pill">{{ products.length }}개</span>
      </div>

      <form class="filter-bar" @submit.prevent="loadProducts">
        <label class="search-field">
          <span class="sr-only">상품 검색어</span>
          <input v-model.trim="filters.q" placeholder="상품명·설명 검색" />
        </label>
        <select v-model="filters.category" aria-label="카테고리 선택">
          <option>전체</option>
          <option>장비</option>
          <option>도서</option>
          <option>강의</option>
          <option>기타</option>
        </select>
        <label class="check-field">
          <input v-model="filters.available" type="checkbox" />
          재고 있음
        </label>
        <button class="button button--primary" type="submit">조회</button>
        <button class="button button--ghost" type="button" @click="resetFilters">초기화</button>
      </form>

      <div v-if="isLoading" class="empty-state">
        <span class="spinner"></span>
        상품을 불러오는 중입니다.
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        조건에 맞는 상품이 없습니다.
      </div>

      <div v-else class="product-list">
        <article v-for="product in products" :key="product.id" class="product-card">
          <div class="product-card__top">
            <div>
              <span class="category-tag">{{ product.category }}</span>
              <h3>{{ product.name }}</h3>
            </div>
            <strong>{{ formatPrice(product.price) }}</strong>
          </div>
          <p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p>
          <div class="product-card__bottom">
            <span class="stock" :class="{ 'stock--empty': product.stock === 0 }">
              {{ product.stock === 0 ? '품절' : `재고 ${product.stock}개` }}
            </span>
            <div class="card-actions">
              <button class="button button--ghost button--small" @click="startEdit(product)">수정</button>
              <button class="button button--danger-soft button--small" @click="removeProduct(product)">
                삭제
              </button>
            </div>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>

