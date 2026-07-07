import { eq } from 'drizzle-orm'

import { db } from './index.ts'
import { discountRules, inventory, products } from './schema.ts'
import {
  BOOK_AUTHOR,
  BOOK_INITIAL_STOCK,
  BOOK_PRICE_CENTS,
  BOOK_SKU,
  BOOK_SUBTITLE,
  BOOK_TITLE,
} from '../netlify/functions/_shared/book/constants.mts'

const [product] = await db
  .insert(products)
  .values({
    sku: BOOK_SKU,
    title: BOOK_TITLE,
    subtitle: BOOK_SUBTITLE,
    author: BOOK_AUTHOR,
    description: 'Libro físico de Oz Creativo para emprender tus sueños sin perder el alma.',
    priceCents: BOOK_PRICE_CENTS,
    currency: 'MXN',
    pages: 108,
    widthCm: 14,
    heightCm: 22,
    publicWeightGrams: 180,
    active: true,
  })
  .onConflictDoUpdate({
    target: products.sku,
    set: {
      title: BOOK_TITLE,
      subtitle: BOOK_SUBTITLE,
      author: BOOK_AUTHOR,
      priceCents: BOOK_PRICE_CENTS,
      currency: 'MXN',
      active: true,
      updatedAt: new Date(),
    },
  })
  .returning()

const [existingInventory] = await db
  .select()
  .from(inventory)
  .where(eq(inventory.productId, product.id))
  .limit(1)

if (!existingInventory) {
  await db.insert(inventory).values({
    productId: product.id,
    stockInitial: BOOK_INITIAL_STOCK,
    stockAvailable: BOOK_INITIAL_STOCK,
    stockSold: 0,
    stockReserved: 0,
  })
}

await db.delete(discountRules)
await db.insert(discountRules).values([
  { minQuantity: 5, maxQuantity: 9, percent: 10, active: true },
  { minQuantity: 10, maxQuantity: 10, percent: 20, active: true },
])

console.log('Hazlo Magnifico store seed complete.')
