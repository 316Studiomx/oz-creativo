import { MAX_BOOK_QUANTITY, MIN_BOOK_QUANTITY } from './constants.mts'

export type BookParcel = {
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

export function calculateBookParcel(quantity: number): BookParcel {
  if (!Number.isInteger(quantity)) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  if (quantity < MIN_BOOK_QUANTITY || quantity > MAX_BOOK_QUANTITY) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  return {
    weightGrams: 300 + Math.max(0, quantity - 1) * 180,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 3 + Math.ceil(Math.max(0, quantity - 1) / 3) * 3,
  }
}
