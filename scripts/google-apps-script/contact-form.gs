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
      lead.servicioPrincipal,
      lead.nombre,
      lead.apellido,
      lead.telefono,
      lead.email,
      lead.tipoOrganizacion,
      lead.institucion,
      lead.serviciosInteres.join(', '),
      lead.formatoEvento,
      lead.temaInteres,
      lead.planViaje,
      lead.paqueteMentoria,
      lead.productoConsultoria,
      lead.lugarFecha,
      lead.comoTeEnteraste,
      lead.presupuesto,
      lead.cotizacionResumen,
      lead.cotizacionMonto,
      lead.cotizacionMoneda,
      lead.objetivo,
      lead.contextoProyecto,
      lead.sourceUrl,
      lead.userAgent,
      lead.folio,
      lead.proposalUrl,
      lead.proposalInvestment,
      lead.proposalServiceTitle,
      lead.proposalValidUntil,
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
    servicioPrincipal: text_(payload.servicioPrincipal),
    nombre: text_(payload.nombre),
    apellido: text_(payload.apellido),
    telefono: text_(payload.telefono),
    email: text_(payload.email).toLowerCase(),
    tipoOrganizacion: text_(payload.tipoOrganizacion),
    institucion: text_(payload.institucion),
    serviciosInteres: Array.isArray(payload.serviciosInteres)
      ? payload.serviciosInteres.map(text_).filter(Boolean)
      : [],
    formatoEvento: text_(payload.formatoEvento),
    temaInteres: text_(payload.temaInteres),
    planViaje: text_(payload.planViaje),
    paqueteMentoria: text_(payload.paqueteMentoria),
    productoConsultoria: text_(payload.productoConsultoria),
    lugarFecha: text_(payload.lugarFecha),
    comoTeEnteraste: text_(payload.comoTeEnteraste),
    presupuesto: text_(payload.presupuesto),
    objetivo: text_(payload.objetivo),
    contextoProyecto: text_(payload.contextoProyecto),
    cotizacionResumen: text_(payload.cotizacionResumen),
    cotizacionMonto: text_(payload.cotizacionMonto),
    cotizacionMoneda: text_(payload.cotizacionMoneda),
    folio: text_(payload.folio),
    proposalUrl: text_(payload.proposalUrl),
    proposalInvestment: text_(payload.proposalInvestment),
    proposalServiceTitle: text_(payload.proposalServiceTitle),
    proposalValidUntil: text_(payload.proposalValidUntil),
    sourceUrl: text_(payload.sourceUrl),
    userAgent: text_(payload.userAgent),
  };

  if (!lead.servicioPrincipal || !lead.nombre || !lead.apellido || !lead.telefono || !lead.email || !lead.objetivo) {
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
    subject: `Nueva solicitud y propuesta generada: ${lead.nombre} ${lead.apellido}`,
    htmlBody: `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
        <h2>Nuevo formulario recibido</h2>
        <p><strong>Folio:</strong> ${escape_(lead.folio || '-')}</p>
        <p><strong>Propuesta:</strong> ${escape_(lead.proposalServiceTitle || lead.servicioPrincipal)} · ${escape_(lead.proposalInvestment || '-')}</p>
        ${leadTable_(lead)}
        <p>
          <a href="${escape_(lead.proposalUrl || '')}" style="display:inline-block;background:#111;color:#ffd400;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700;margin-right:8px">
            Abrir propuesta privada
          </a>
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
    subject: 'Tu propuesta privada está lista - Oz Creativo',
    htmlBody: `
      ${clientProposalTemplate_(lead)}
    `,
  });
}

function clientProposalTemplate_(lead) {
  const proposalUrl = lead.proposalUrl || WHATSAPP_URL;
  const folio = lead.folio || 'OZ';
  const serviceTitle = lead.proposalServiceTitle || lead.servicioPrincipal;
  const investment = lead.proposalInvestment || 'Ver detalle en propuesta privada';
  const validUntil = lead.proposalValidUntil ? formatDate_(lead.proposalValidUntil) : 'Vigencia indicada en la propuesta';

  return `
    <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
      Tu propuesta privada de Oz Creativo está lista.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ec;font-family:Arial,'Helvetica Neue',sans-serif">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#111;overflow:hidden;border-radius:16px">
            <tr><td style="height:4px;background:#ffd400;font-size:0">&nbsp;</td></tr>
            <tr>
              <td style="padding:24px 36px 12px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:24px;font-weight:900;color:#fff">OZ <span style="color:#ffd400">CREATIVO</span></td>
                    <td align="right" style="font-size:10px;color:#777;text-transform:uppercase;letter-spacing:2px">Folio ${escape_(folio)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 36px 24px">
                <p style="margin:0 0 10px;font-size:12px;color:#ffd400;text-transform:uppercase;letter-spacing:3px;font-weight:700">Tu propuesta está lista</p>
                <h1 style="margin:0 0 16px;font-size:34px;font-weight:900;color:#fff;line-height:1.15">Hola, ${escape_(lead.nombre)}.</h1>
                <p style="margin:0 0 12px;font-size:15px;color:#aaa;line-height:1.7">Preparamos una propuesta privada para <strong style="color:#fff">${escape_(lead.institucion)}</strong> con overview, alcance, inversión y siguientes pasos.</p>
                <p style="margin:0;font-size:14px;color:#888;line-height:1.7">Haz clic en el botón para revisar el detalle completo. La liga es privada y queda asociada a tu solicitud.</p>
              </td>
            </tr>
            <tr><td style="padding:0 36px"><div style="height:1px;background:#222"></div></td></tr>
            <tr>
              <td style="padding:22px 36px 8px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px">
                  <tr>
                    <td style="padding:14px 16px">
                      <span style="font-size:10px;color:#777;text-transform:uppercase;letter-spacing:1.5px">Servicio</span><br/>
                      <span style="font-size:14px;color:#fff;font-weight:700">${escape_(serviceTitle)}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:right">
                      <span style="font-size:10px;color:#777;text-transform:uppercase;letter-spacing:1.5px">Inversión</span><br/>
                      <span style="font-size:14px;color:#ffd400;font-weight:700">${escape_(investment)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 18px;text-align:center">
                <p style="margin:0;font-size:12px;color:#777">Vigencia: ${escape_(validUntil)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 30px;text-align:center">
                <a href="${escape_(proposalUrl)}" style="display:inline-block;background:#ffd400;color:#111;text-decoration:none;font-size:15px;font-weight:800;padding:16px 34px;border-radius:999px;text-transform:uppercase;letter-spacing:1px">Ver propuesta privada</a>
              </td>
            </tr>
            <tr><td style="padding:0 36px"><div style="height:1px;background:#222"></div></td></tr>
            <tr>
              <td style="padding:20px 36px 24px;text-align:center">
                <p style="margin:0 0 12px;font-size:13px;color:#888">¿Prefieres escribir antes de decidir?</p>
                <a href="${WHATSAPP_URL}" style="font-size:13px;color:#ffd400;text-decoration:underline;font-weight:700">Abrir WhatsApp</a>
              </td>
            </tr>
            <tr>
              <td style="background:#0a0a0a;padding:22px 36px;border-top:1px solid #1a1a1a">
                <span style="font-size:14px;font-weight:900;color:#fff">OZ <span style="color:#ffd400">CREATIVO</span></span><br/>
                <span style="font-size:12px;color:#555;line-height:2">oz@expocuspide.com · ozcreativo.com</span>
              </td>
            </tr>
            <tr><td style="height:4px;background:#ffd400;font-size:0">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function leadTable_(lead) {
  const rows = [
    ['Servicio principal', lead.servicioPrincipal],
    ['Folio', lead.folio],
    ['Propuesta privada', lead.proposalUrl],
    ['Inversion', lead.proposalInvestment],
    ['Nombre', `${lead.nombre} ${lead.apellido}`],
    ['Telefono', lead.telefono],
    ['Email', lead.email],
    ['Organizacion', lead.tipoOrganizacion],
    ['Institucion', lead.institucion],
    ['Servicios', lead.serviciosInteres.join(', ')],
    ['Formato', lead.formatoEvento],
    ['Temario', lead.temaInteres],
    ['Plan de viaje', lead.planViaje],
    ['Paquete de mentoria', lead.paqueteMentoria],
    ['Producto de consultoria', lead.productoConsultoria],
    ['Lugar y fecha', lead.lugarFecha],
    ['Como se entero', lead.comoTeEnteraste],
    ['Objetivo', lead.objetivo],
    ['Contexto', lead.contextoProyecto],
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

function formatDate_(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
