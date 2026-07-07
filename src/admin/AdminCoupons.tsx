import { type FormEvent, useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, formatDate, formatMoney, readAdminResponse } from './AdminApp'

type Coupon = {
  id: number
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  usageLimit: number | null
  usedCount: number
  minSubtotalCents: number | null
  minQuantity: number | null
  maxUsesPerEmail: number | null
  stackable: boolean
  createdAt: string
}

type CouponsResponse = {
  ok?: boolean
  message?: string
  coupons?: Coupon[]
  coupon?: Coupon
}

type CouponForm = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: string
  active: boolean
  minQuantity: string
  minSubtotalPesos: string
  maxUsesPerEmail: string
  usageLimit: string
  stackable: boolean
}

const emptyForm: CouponForm = {
  id: '',
  code: '',
  type: 'percent',
  value: '',
  active: true,
  minQuantity: '',
  minSubtotalPesos: '',
  maxUsesPerEmail: '',
  usageLimit: '',
  stackable: false,
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState<CouponForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/coupons', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<CouponsResponse>(response)
        if (!active) return

        if (!response.ok || !payload.coupons) {
          setError(payload.message || 'No se pudo cargar cupones.')
          return
        }

        setCoupons(payload.coupons)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar cupones.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const isEditing = Boolean(form.id)
    const payload = buildCouponPayload(form)

    try {
      const response = await fetch('/api/book/admin/coupons', {
        method: isEditing ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result = await readAdminResponse<CouponsResponse>(response)

      if (!response.ok || !result.coupon) {
        setError(result.message || 'No se pudo guardar cupon.')
        return
      }

      setCoupons((items) =>
        isEditing
          ? items.map((coupon) => (coupon.id === result.coupon?.id ? result.coupon : coupon))
          : [result.coupon as Coupon, ...items],
      )
      setForm(emptyForm)
      setMessage(isEditing ? 'Cupón actualizado.' : 'Cupón creado.')
    } catch {
      setError('No se pudo guardar cupon.')
    } finally {
      setSaving(false)
    }
  }

  const editCoupon = (coupon: Coupon) => {
    setForm({
      id: String(coupon.id),
      code: coupon.code,
      type: coupon.type,
      value: coupon.type === 'fixed' ? String(coupon.value / 100) : String(coupon.value),
      active: coupon.active,
      minQuantity: nullableNumberToString(coupon.minQuantity),
      minSubtotalPesos: coupon.minSubtotalCents ? String(coupon.minSubtotalCents / 100) : '',
      maxUsesPerEmail: nullableNumberToString(coupon.maxUsesPerEmail),
      usageLimit: nullableNumberToString(coupon.usageLimit),
      stackable: coupon.stackable,
    })
  }

  if (loading) return <AdminPanelMessage title="Cargando cupones..." />
  if (error && coupons.length === 0) return <AdminPanelMessage title={error} tone="error" />

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <AdminSection title="Cupones">
        {coupons.length === 0 ? (
          <AdminPanelMessage title="Sin cupones creados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-xs uppercase text-muted [letter-spacing:0]">
                <tr className="border-b border-paper/10">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Activo</th>
                  <th className="px-3 py-2">Cantidad mínima</th>
                  <th className="px-3 py-2">Subtotal mínimo</th>
                  <th className="px-3 py-2">Máximo por email</th>
                  <th className="px-3 py-2">Límite de usos</th>
                  <th className="px-3 py-2">Acumulable</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-paper/5">
                    <td className="px-3 py-3 font-semibold">{coupon.code}</td>
                    <td className="px-3 py-3">{coupon.type}</td>
                    <td className="px-3 py-3">
                      {coupon.type === 'percent' ? `${coupon.value}%` : formatMoney(coupon.value)}
                    </td>
                    <td className="px-3 py-3">{coupon.active ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-3">{coupon.minQuantity ?? 'Sin mínimo'}</td>
                    <td className="px-3 py-3">
                      {coupon.minSubtotalCents ? formatMoney(coupon.minSubtotalCents) : 'Sin mínimo'}
                    </td>
                    <td className="px-3 py-3">{coupon.maxUsesPerEmail ?? 'Sin límite'}</td>
                    <td className="px-3 py-3">
                      {coupon.usageLimit ? `${coupon.usedCount}/${coupon.usageLimit}` : 'Sin límite'}
                    </td>
                    <td className="px-3 py-3">{coupon.stackable ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded border border-paper/15 px-3 py-2 text-xs font-semibold hover:border-yellow hover:text-yellow"
                        type="button"
                        onClick={() => editCoupon(coupon)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      <AdminSection title={form.id ? `Editar ${form.code}` : 'Crear cupón'}>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm text-muted">
            Código
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 uppercase text-paper outline-none focus:border-yellow"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Tipo
              <select
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as CouponForm['type'] })}
              >
                <option value="percent">percent</option>
                <option value="fixed">fixed</option>
              </select>
            </label>

            <label className="text-sm text-muted">
              Valor (% o MXN)
              <input
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                type="number"
                min={form.type === 'fixed' ? '0.01' : '1'}
                step={form.type === 'fixed' ? '0.01' : '1'}
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
                required
              />
              <span className="mt-1 block text-xs text-muted">
                Percent usa puntos porcentuales; fixed usa pesos MXN y se guarda en centavos.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Cantidad mínima
              <input
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                type="number"
                min="0"
                step="1"
                value={form.minQuantity}
                onChange={(event) => setForm({ ...form, minQuantity: event.target.value })}
              />
            </label>
            <label className="text-sm text-muted">
              Subtotal mínimo
              <input
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                type="number"
                min="0"
                step="1"
                value={form.minSubtotalPesos}
                onChange={(event) => setForm({ ...form, minSubtotalPesos: event.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Máximo por email
              <input
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                type="number"
                min="1"
                step="1"
                value={form.maxUsesPerEmail}
                onChange={(event) => setForm({ ...form, maxUsesPerEmail: event.target.value })}
              />
            </label>
            <label className="text-sm text-muted">
              Límite de usos
              <input
                className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(event) => setForm({ ...form, usageLimit: event.target.value })}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Activo
          </label>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.stackable}
              onChange={(event) => setForm({ ...form, stackable: event.target.checked })}
            />
            Acumulable
          </label>

          {error ? <AdminPanelMessage title={error} tone="error" /> : null}
          {message ? <AdminPanelMessage title={message} /> : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded bg-yellow px-4 py-3 text-sm font-bold uppercase text-ink hover:bg-yellow-warm disabled:cursor-wait disabled:opacity-70"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Guardando...' : form.id ? 'Actualizar' : 'Crear'}
            </button>
            {form.id ? (
              <button
                className="rounded border border-paper/15 px-4 py-3 text-sm font-semibold text-paper"
                type="button"
                onClick={() => setForm(emptyForm)}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
        <p className="mt-3 text-xs text-muted">Creado: {form.id ? formatDate(coupons.find((c) => String(c.id) === form.id)?.createdAt) : 'Nuevo'}</p>
      </AdminSection>
    </div>
  )
}

function buildCouponPayload(form: CouponForm) {
  const minSubtotalCents = form.minSubtotalPesos
    ? Math.round(Number(form.minSubtotalPesos) * 100)
    : null

  return {
    id: form.id ? Number(form.id) : undefined,
    code: form.code,
    type: form.type,
    value: Number(form.value),
    active: form.active,
    minQuantity: form.minQuantity ? Number(form.minQuantity) : null,
    minSubtotalCents,
    maxUsesPerEmail: form.maxUsesPerEmail ? Number(form.maxUsesPerEmail) : null,
    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    stackable: form.stackable,
  }
}

function nullableNumberToString(value: number | null): string {
  return typeof value === 'number' ? String(value) : ''
}
