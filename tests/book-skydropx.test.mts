import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SKYDROPX_ENDPOINTS,
  buildSkydropxQuotationBody,
  buildSkydropxShipmentBody,
  normalizeSkydropxRate,
  normalizeSkydropxRates,
  normalizeSkydropxShipment,
} from '../netlify/functions/_shared/book/skydropx.mts'
import {
  canCreateShipmentForAdminOrder,
  readAdminShippingAction,
} from '../netlify/functions/book-admin-shipping.mts'

const origin = {
  name: 'Oz Creativo',
  company: 'Oz Creativo',
  phone: '8990000000',
  email: 'pedidos@example.com',
  street: 'Calle Origen',
  exteriorNumber: '100',
  interiorNumber: '',
  neighborhood: 'Centro',
  city: 'Reynosa',
  state: 'Tamaulipas',
  postalCode: '88700',
  country: 'MX',
}

const destination = {
  name: 'Lector Magnifico',
  phone: '8111111111',
  street: 'Calle Destino',
  exteriorNumber: '22',
  interiorNumber: 'B',
  neighborhood: 'Roma Norte',
  city: 'Cuauhtemoc',
  state: 'Ciudad de Mexico',
  postalCode: '06700',
  country: 'MX',
}

test('Skydropx adapter exposes current Pro API endpoint paths', () => {
  assert.equal(SKYDROPX_ENDPOINTS.token, '/api/v1/oauth/token')
  assert.equal(SKYDROPX_ENDPOINTS.quotations, '/api/v1/quotations')
  assert.equal(SKYDROPX_ENDPOINTS.quotationDetail('quote_123'), '/api/v1/quotations/quote_123')
  assert.equal(SKYDROPX_ENDPOINTS.shipments, '/api/v1/shipments/')
  assert.equal(
    SKYDROPX_ENDPOINTS.tracking('TRACK 123', 'DHL'),
    '/api/v1/shipments/tracking?tracking_number=TRACK+123&carrier_name=DHL',
  )
})

test('normalizes flat Skydropx rate fixtures', () => {
  assert.deepEqual(
    normalizeSkydropxRate({
      id: 'rate_1',
      carrier: 'DHL',
      service: 'Express',
      total: '145.50',
      currency: 'MXN',
      days: 2,
    }),
    {
      rateId: 'rate_1',
      carrier: 'DHL',
      service: 'Express',
      totalCents: 14550,
      currency: 'MXN',
      estimatedDays: 2,
    },
  )
})

test('normalizes JSON:API quotation detail rates', () => {
  assert.deepEqual(
    normalizeSkydropxRates({
      data: {
        id: 'quotation_1',
        attributes: {
          rates: [
            {
              id: 'rate_2',
              attributes: {
                carrier_name: 'FedEx',
                service_level_name: 'Express Saver',
                total: '199.00',
                currency: 'MXN',
                estimated_days: 3,
              },
            },
          ],
        },
      },
    }),
    [
      {
        rateId: 'rate_2',
        carrier: 'FedEx',
        service: 'Express Saver',
        totalCents: 19900,
        currency: 'MXN',
        estimatedDays: 3,
      },
    ],
  )
})

test('normalizes flat Skydropx shipment fixtures', () => {
  assert.deepEqual(
    normalizeSkydropxShipment({
      id: 'ship_1',
      carrier_name: 'DHL',
      service: 'Express',
      total: '150.00',
      currency: 'MXN',
      tracking_number: 'TRACK123',
      tracking_url_provider: 'https://tracking.example/TRACK123',
      label_url: 'https://label.example/label.pdf',
    }),
    {
      shipmentId: 'ship_1',
      carrier: 'DHL',
      service: 'Express',
      totalCents: 15000,
      currency: 'MXN',
      trackingNumber: 'TRACK123',
      trackingUrl: 'https://tracking.example/TRACK123',
      labelUrl: 'https://label.example/label.pdf',
    },
  )
})

test('normalizes JSON:API shipment packages and attributes', () => {
  assert.deepEqual(
    normalizeSkydropxShipment({
      data: {
        id: 'shipment_9',
        attributes: {
          carrier_name: 'Estafeta',
          service_level_name: 'Terrestre',
          master_tracking_number: 'MASTER999',
          total: '122.25',
          currency: 'MXN',
        },
      },
      included: [
        {
          type: 'packages',
          attributes: {
            tracking_number: 'PKG999',
            tracking_url_provider: 'https://tracking.example/PKG999',
            label_url: 'https://label.example/PKG999.pdf',
          },
        },
      ],
    }),
    {
      shipmentId: 'shipment_9',
      carrier: 'Estafeta',
      service: 'Terrestre',
      totalCents: 12225,
      currency: 'MXN',
      trackingNumber: 'PKG999',
      trackingUrl: 'https://tracking.example/PKG999',
      labelUrl: 'https://label.example/PKG999.pdf',
    },
  )
})

test('builds Skydropx quotation body using kg parcel weight and required address levels', () => {
  assert.deepEqual(
    buildSkydropxQuotationBody({
      origin,
      destination,
      parcel: {
        lengthCm: 24,
        widthCm: 17,
        heightCm: 6,
        weightGrams: 480,
      },
    }),
    {
      quotation: {
        address_from: {
          name: 'Oz Creativo',
          company: 'Oz Creativo',
          phone: '8990000000',
          email: 'pedidos@example.com',
          street1: 'Calle Origen',
          street2: '100',
          country_code: 'MX',
          postal_code: '88700',
          area_level1: 'Tamaulipas',
          area_level2: 'Reynosa',
          area_level3: 'Centro',
        },
        address_to: {
          name: 'Lector Magnifico',
          phone: '8111111111',
          street1: 'Calle Destino',
          street2: '22 Int. B',
          country_code: 'MX',
          postal_code: '06700',
          area_level1: 'Ciudad de Mexico',
          area_level2: 'Cuauhtemoc',
          area_level3: 'Roma Norte',
        },
        parcels: [
          {
            length: 24,
            width: 17,
            height: 6,
            weight: 0.48,
          },
        ],
      },
    },
  )
})

test('builds shipment body with selected rate and package options', () => {
  assert.deepEqual(
    buildSkydropxShipmentBody({
      rateId: 'rate_1',
      origin,
      destination,
      parcel: {
        lengthCm: 24,
        widthCm: 17,
        heightCm: 3,
        weightGrams: 300,
      },
      declaredValueCents: 49900,
      consignmentNote: 'Hazlo Magnifico',
      packageType: 'box',
    }),
    {
      shipment: {
        rate_id: 'rate_1',
        unique_shipment: true,
        address_from: buildSkydropxQuotationBody({
          origin,
          destination,
          parcel: { lengthCm: 1, widthCm: 1, heightCm: 1, weightGrams: 1 },
        }).quotation.address_from,
        address_to: buildSkydropxQuotationBody({
          origin,
          destination,
          parcel: { lengthCm: 1, widthCm: 1, heightCm: 1, weightGrams: 1 },
        }).quotation.address_to,
        packages: [
          {
            package_number: '1',
            package_protected: false,
            declared_value: 499,
            length: 24,
            width: 17,
            height: 3,
            weight: 0.3,
            consignment_note: 'Hazlo Magnifico',
            package_type: 'box',
          },
        ],
      },
    },
  )
})

test('admin shipping route parser recognizes quote and create actions', () => {
  assert.deepEqual(
    readAdminShippingAction('/api/book/admin/orders/42/quote-shipping'),
    { kind: 'quote', orderId: 42 },
  )
  assert.deepEqual(
    readAdminShippingAction('/api/book/admin/orders/42/create-shipment'),
    { kind: 'create', orderId: 42 },
  )
  assert.deepEqual(readAdminShippingAction('/api/book/admin/orders/nope/create-shipment'), {
    kind: 'invalid',
  })
})

test('admin shipment creation is only allowed for paid eligible orders', () => {
  assert.equal(
    canCreateShipmentForAdminOrder({
      paymentStatus: 'paid',
      shippingStatus: 'label_pending',
      shipmentStatus: null,
      trackingNumber: null,
    }),
    true,
  )
  assert.equal(
    canCreateShipmentForAdminOrder({
      paymentStatus: 'paid',
      shippingStatus: 'label_created',
      shipmentStatus: 'label_created',
      trackingNumber: 'TRACK123',
    }),
    false,
  )
  assert.equal(
    canCreateShipmentForAdminOrder({
      paymentStatus: 'unpaid',
      shippingStatus: 'label_pending',
      shipmentStatus: null,
      trackingNumber: null,
    }),
    false,
  )
})
