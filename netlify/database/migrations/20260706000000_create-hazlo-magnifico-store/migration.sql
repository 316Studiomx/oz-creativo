DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'checkout_created',
      'payment_pending',
      'paid',
      'label_pending',
      'label_created',
      'fulfillment_in_progress',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'payment_failed',
      'label_error'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type') THEN
    CREATE TYPE coupon_type AS ENUM ('percent', 'fixed');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM ('queued', 'sent', 'failed');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'international_lead_status') THEN
    CREATE TYPE international_lead_status AS ENUM (
      'nuevo',
      'cotizado',
      'esperando_respuesta',
      'convertido',
      'cerrado'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL,
  author text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL,
  pages integer NOT NULL,
  width_cm integer NOT NULL,
  height_cm integer NOT NULL,
  public_weight_grams integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  stock_initial integer NOT NULL,
  stock_available integer NOT NULL,
  stock_sold integer NOT NULL DEFAULT 0,
  stock_reserved integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  public_token text NOT NULL,
  status order_status NOT NULL DEFAULT 'checkout_created',
  payment_status text NOT NULL DEFAULT 'unpaid',
  shipping_status text NOT NULL DEFAULT 'not_started',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  subtotal_cents integer NOT NULL,
  volume_discount_percent integer NOT NULL DEFAULT 0,
  volume_discount_cents integer NOT NULL DEFAULT 0,
  coupon_code text,
  coupon_discount_cents integer NOT NULL DEFAULT 0,
  total_discount_cents integer NOT NULL DEFAULT 0,
  shipping_charged_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  sku text NOT NULL,
  title text NOT NULL,
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL,
  subtotal_cents integer NOT NULL,
  total_cents integer NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id serial PRIMARY KEY,
  order_id integer NOT NULL UNIQUE REFERENCES orders(id),
  name text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  exterior_number text NOT NULL,
  interior_number text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'MX',
  "references" text
);

CREATE TABLE IF NOT EXISTS shipments (
  id serial PRIMARY KEY,
  order_id integer NOT NULL UNIQUE REFERENCES orders(id),
  provider text NOT NULL DEFAULT 'skydropx',
  quotation_id text,
  rate_id text,
  shipment_id text,
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  label_url text,
  real_shipping_cost_cents integer,
  status text NOT NULL DEFAULT 'label_pending',
  error text,
  raw_response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type coupon_type NOT NULL,
  value integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  min_subtotal_cents integer,
  min_quantity integer,
  max_uses_per_email integer,
  stackable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id serial PRIMARY KEY,
  coupon_id integer NOT NULL REFERENCES coupons(id),
  order_id integer NOT NULL REFERENCES orders(id),
  email text NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_rules (
  id serial PRIMARY KEY,
  min_quantity integer NOT NULL,
  max_quantity integer NOT NULL,
  percent integer NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS international_quote_leads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  quantity integer NOT NULL,
  message text,
  status international_lead_status NOT NULL DEFAULT 'nuevo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_events (
  id serial PRIMARY KEY,
  "to" text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL,
  status email_status NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error text,
  related_order_id integer REFERENCES orders(id),
  related_lead_id integer REFERENCES international_quote_leads(id),
  idempotency_key text NOT NULL UNIQUE,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  id serial PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_events (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  type text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  order_id integer REFERENCES orders(id),
  type text NOT NULL,
  quantity integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id serial PRIMARY KEY,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_product_id_idx ON inventory (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_public_token_idx ON orders (public_token);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS shipments_tracking_number_idx ON shipments (tracking_number);
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_order_id_idx ON coupon_redemptions (order_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_id_idx ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx ON coupon_redemptions (email);
CREATE UNIQUE INDEX IF NOT EXISTS discount_rules_quantity_range_idx ON discount_rules (min_quantity, max_quantity);
CREATE INDEX IF NOT EXISTS international_quote_leads_created_at_idx ON international_quote_leads (created_at);
CREATE INDEX IF NOT EXISTS email_events_related_order_id_idx ON email_events (related_order_id);
CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events (order_id);
CREATE INDEX IF NOT EXISTS order_events_created_at_idx ON order_events (created_at);
CREATE INDEX IF NOT EXISTS inventory_movements_product_id_idx ON inventory_movements (product_id);
CREATE INDEX IF NOT EXISTS inventory_movements_order_id_idx ON inventory_movements (order_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions (expires_at);
