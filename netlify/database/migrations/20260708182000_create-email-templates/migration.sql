CREATE TABLE IF NOT EXISTS email_templates (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  subject_template text NOT NULL,
  headline text NOT NULL,
  body_template text NOT NULL,
  button_label text NOT NULL DEFAULT '',
  footer_note text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_key_idx ON email_templates (key);

INSERT INTO email_templates (
  key,
  label,
  description,
  subject_template,
  headline,
  body_template,
  button_label,
  footer_note
) VALUES
(
  'purchase-confirmation',
  'Confirmación de compra',
  'Correo que recibe el cliente después de pagar el libro.',
  'Confirmamos tu pedido de {{bookTitle}} - {{orderNumber}}',
  'Gracias por comprar {{bookTitle}}.',
  'Hola {{customerName}}, recibimos tu compra.

Tu compra incluye envío gratis dentro de México.

Estamos preparando tu pedido. Recibirás otro correo con tu número de guía cuando sea entregado a paquetería.

Si requieres factura, escríbenos a {{supportEmail}} con tu número de pedido y tus datos fiscales.',
  '',
  '{{bookAuthor}} / {{bookTitle}}'
),
(
  'shipment-tracking',
  'Seguimiento al paquete',
  'Correo que recibe el cliente cuando se genera la guía de paquetería.',
  'Tu pedido de {{bookTitle}} ya va en camino - {{orderNumber}}',
  'Tu pedido ya va en camino.',
  'Hola {{customerName}}, tu libro fue entregado a paquetería.

Te recomendamos estar pendiente de llamadas o mensajes de paquetería para facilitar la entrega.',
  'Rastrear mi pedido',
  '{{bookAuthor}} / {{bookTitle}}'
)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'netlifydb_readonly') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON email_templates TO netlifydb_readonly';
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON SEQUENCE email_templates_id_seq TO netlifydb_readonly';
  END IF;
END
$$;
