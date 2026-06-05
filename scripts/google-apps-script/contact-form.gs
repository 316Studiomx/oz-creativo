const SHEET_ID = '1c-CjznNF0Pg6mWCdX0UwnzrmOpDjsuELshvQFfV6naY';
const SHEET_NAME = 'Leads';
const OWNER_EMAIL = 'oz@expocuspide.com';
const WHATSAPP_URL = 'https://wa.me/528181199759?text=Hola%20Oz%2C%20acabo%20de%20llenar%20el%20formulario%20en%20ozcreativo.com%20y%20me%20gustar%C3%ADa%20dar%20seguimiento.';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const lead = normalizeLead_(payload);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      lead.submittedAt,
      lead.nombre,
      lead.apellido,
      lead.telefono,
      lead.email,
      lead.tipoOrganizacion,
      lead.institucion,
      lead.serviciosInteres.join(', '),
      lead.lugarFecha,
      lead.comoTeEnteraste,
      lead.presupuesto,
      lead.objetivo,
      lead.sourceUrl,
      lead.userAgent,
      'Nuevo',
      '',
      'Si',
      'Si',
    ]);

    lock.releaseLock();
    sendInternalEmail_(lead);
    sendClientEmail_(lead);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, message: error.message || 'No se pudo procesar la solicitud.' });
  }
}

function normalizeLead_(payload) {
  const lead = {
    submittedAt: text_(payload.submittedAt) || new Date().toISOString(),
    nombre: text_(payload.nombre),
    apellido: text_(payload.apellido),
    telefono: text_(payload.telefono),
    email: text_(payload.email).toLowerCase(),
    tipoOrganizacion: text_(payload.tipoOrganizacion),
    institucion: text_(payload.institucion),
    serviciosInteres: Array.isArray(payload.serviciosInteres)
      ? payload.serviciosInteres.map(text_).filter(Boolean)
      : [],
    lugarFecha: text_(payload.lugarFecha),
    comoTeEnteraste: text_(payload.comoTeEnteraste),
    presupuesto: text_(payload.presupuesto),
    objetivo: text_(payload.objetivo),
    sourceUrl: text_(payload.sourceUrl),
    userAgent: text_(payload.userAgent),
  };

  if (!lead.nombre || !lead.apellido || !lead.telefono || !lead.email || !lead.objetivo) {
    throw new Error('Faltan campos obligatorios.');
  }
  if (lead.serviciosInteres.length === 0) {
    throw new Error('No se selecciono servicio de interes.');
  }
  return lead;
}

function sendInternalEmail_(lead) {
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: `Nuevo lead desde ozcreativo.com: ${lead.nombre} ${lead.apellido}`,
    htmlBody: `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
        <h2>Nuevo formulario recibido</h2>
        ${leadTable_(lead)}
        <p>
          <a href="${WHATSAPP_URL}" style="display:inline-block;background:#ffd400;color:#0a0a0a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">
            Abrir WhatsApp
          </a>
        </p>
      </div>
    `,
  });
}

function sendClientEmail_(lead) {
  MailApp.sendEmail({
    to: lead.email,
    subject: 'Recibí tu solicitud - Oz Creativo',
    htmlBody: `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
        <h2>Gracias por tu interés, ${escape_(lead.nombre)}.</h2>
        <p>Recibí tu información y revisaré el contexto para responderte con el siguiente paso.</p>
        <p>Estos son los datos que enviaste:</p>
        ${leadTable_(lead)}
        <p>
          <a href="${WHATSAPP_URL}" style="display:inline-block;background:#ffd400;color:#0a0a0a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">
            Dar seguimiento por WhatsApp
          </a>
        </p>
      </div>
    `,
  });
}

function leadTable_(lead) {
  const rows = [
    ['Nombre', `${lead.nombre} ${lead.apellido}`],
    ['Telefono', lead.telefono],
    ['Email', lead.email],
    ['Organizacion', lead.tipoOrganizacion],
    ['Institucion', lead.institucion],
    ['Servicios', lead.serviciosInteres.join(', ')],
    ['Lugar y fecha', lead.lugarFecha],
    ['Como se entero', lead.comoTeEnteraste],
    ['Presupuesto', lead.presupuesto],
    ['Objetivo', lead.objetivo],
  ];

  return `
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="border:1px solid #ddd;background:#f7f7f7;font-weight:700;width:210px">${escape_(label)}</td>
          <td style="border:1px solid #ddd">${escape_(value || '-')}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function text_(value) {
  return typeof value === 'string' ? value.trim().slice(0, 2500) : '';
}

function escape_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
