# Activacion del formulario Oz Creativo

Sheet destino:
https://docs.google.com/spreadsheets/d/1c-CjznNF0Pg6mWCdX0UwnzrmOpDjsuELshvQFfV6naY/edit

Script listo:
`scripts/google-apps-script/contact-form.gs`

## Pasos

1. Abre la Sheet destino.
2. Ve a Extensiones > Apps Script.
3. Pega el contenido de `scripts/google-apps-script/contact-form.gs`.
4. Deploy > New deployment > Web app.
5. Ejecutar como: Me.
6. Quien tiene acceso: Anyone.
7. Autoriza permisos de Sheets y Mail.
8. Copia la URL del Web app.
9. Configura en Netlify la variable:
   - Key: `GOOGLE_SCRIPT_WEBHOOK_URL`
   - Scope: Functions
   - Value: URL del Web app.
10. Publica de nuevo el sitio.

## Correos

El script manda:
- Correo interno a `oz@expocuspide.com`.
- Correo de agradecimiento al email capturado en el formulario.
- Boton de WhatsApp a `https://wa.me/528181199759`.
