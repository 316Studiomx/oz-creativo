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
    subject: `Nueva solicitud: ${lead.nombre} ${lead.apellido} - ${lead.proposalServiceTitle || lead.servicioPrincipal}`,
    htmlBody: emailShell_(
      `Nuevo formulario recibido de ${lead.nombre} ${lead.apellido}.`,
      `
        ${emailHero_(
          'Nueva solicitud',
          'Ficha del prospecto',
          `Se generó una propuesta privada para ${escape_(lead.institucion || 'la institución capturada')}. Revisa el resumen, valida el fit y da seguimiento desde WhatsApp.`,
          lead.folio,
        )}
        <tr>
          <td style="padding:0 34px 22px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${summaryMetric_('Servicio', lead.proposalServiceTitle || lead.servicioPrincipal)}
                ${summaryMetric_('Inversión', lead.proposalInvestment || 'Ver propuesta')}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 34px 26px">
            ${leadTable_(lead)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 34px 34px;text-align:center">
            ${emailButton_(lead.proposalUrl || '', 'Abrir propuesta privada', 'dark')}
            <span style="display:inline-block;width:8px"></span>
            ${emailButton_(WHATSAPP_URL, 'Abrir WhatsApp', 'yellow')}
          </td>
        </tr>
      `,
    ),
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

  return emailShell_(
    'Tu propuesta privada de Oz Creativo está lista.',
    `
      ${emailHero_(
        'Propuesta privada',
        'Tu propuesta privada ya está lista',
        `Hola, ${escape_(lead.nombre)}. Preparamos una propuesta privada para ${escape_(lead.institucion)} con overview, alcance, inversión y siguientes pasos.`,
        folio,
      )}
      <tr>
        <td style="padding:0 34px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#151515;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden">
            <tr>
              <td style="padding:20px;border-bottom:1px solid #262626">
                ${emailSectionTitle_('Resumen de solicitud')}
                <p style="margin:8px 0 0;color:#ffffff;font-size:18px;line-height:1.35;font-weight:800">${escape_(serviceTitle)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${summaryMetric_('Inversión', investment)}
                    ${summaryMetric_('Vigencia', validUntil)}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 34px 30px;text-align:center">
          ${emailButton_(proposalUrl, 'Ver propuesta privada', 'yellow')}
        </td>
      </tr>
      <tr>
        <td style="padding:0 34px 30px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a2a">
            <tr>
              <td align="center" style="padding-top:22px">
                <p style="margin:0 0 12px;color:#9b9b9b;font-size:14px;line-height:1.6">¿Prefieres escribir antes de decidir?</p>
                ${emailButton_(WHATSAPP_URL, 'Abrir WhatsApp', 'dark')}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `,
  );
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e4d4">
      <tr>
        <td colspan="2" style="background:#ffd400;padding:16px 18px;color:#111111;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px">
          Resumen de solicitud
        </td>
      </tr>
      ${rows.map(([label, value]) => `
        <tr>
          <td style="border-top:1px solid #eee8d0;background:#faf8ec;color:#5d5540;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;width:190px;padding:12px 14px;vertical-align:top">${escape_(label)}</td>
          <td style="border-top:1px solid #eee8d0;color:#111111;font-size:14px;line-height:1.55;padding:12px 14px;vertical-align:top">${escape_(value || '-')}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function emailShell_(preheader, bodyRows) {
  return `
    <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
      ${escape_(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeee8;font-family:Arial,'Helvetica Neue',sans-serif">
      <tr>
        <td align="center" style="padding:28px 12px">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#0b0b0b;border-radius:24px;overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,.22)">
            <tr><td style="height:5px;background:#ffd400;font-size:0">&nbsp;</td></tr>
            ${bodyRows}
            <tr>
              <td style="background:#050505;padding:24px 34px;border-top:1px solid #222222">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:16px;font-weight:900;color:#ffffff;letter-spacing:.5px">OZ <span style="color:#ffd400">CREATIVO</span></td>
                    <td align="right" style="font-size:12px;color:#777777">ozcreativo.com</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td style="height:5px;background:#ffd400;font-size:0">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function emailHero_(eyebrow, title, body, folio) {
  return `
    <tr>
      <td style="padding:30px 34px 28px;background:linear-gradient(135deg,#111111 0%,#181818 58%,#332b00 100%)">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:.3px">OZ <span style="color:#ffd400">CREATIVO</span></td>
            <td align="right" style="font-size:10px;color:#b7a75b;text-transform:uppercase;letter-spacing:2px">${folio ? `Folio ${escape_(folio)}` : ''}</td>
          </tr>
        </table>
        <p style="margin:34px 0 10px;color:#ffd400;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:3px">${escape_(eyebrow)}</p>
        <h1 style="margin:0;color:#ffffff;font-size:38px;line-height:1.02;font-weight:900;letter-spacing:-.5px">${escape_(title)}</h1>
        <p style="margin:18px 0 0;color:#c9c9c9;font-size:15px;line-height:1.75">${body}</p>
      </td>
    </tr>
  `;
}

function summaryMetric_(label, value) {
  return `
    <td width="50%" style="padding:16px 18px;border-right:1px solid #262626;vertical-align:top">
      <span style="display:block;color:#777777;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.8px">${escape_(label)}</span>
      <span style="display:block;margin-top:7px;color:#ffd400;font-size:15px;font-weight:900;line-height:1.35">${escape_(value || '-')}</span>
    </td>
  `;
}

function emailSectionTitle_(label) {
  return `<span style="display:block;color:#ffd400;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2.2px">${escape_(label)}</span>`;
}

function emailButton_(href, label, variant) {
  const yellow = variant === 'yellow';
  const bg = yellow ? '#ffd400' : '#111111';
  const color = yellow ? '#111111' : '#ffd400';
  const border = yellow ? '#ffd400' : '#333333';
  return `<a href="${escape_(href || '#')}" style="display:inline-block;background:${bg};color:${color};border:1px solid ${border};text-decoration:none;font-size:14px;font-weight:900;padding:15px 26px;border-radius:999px;text-transform:uppercase;letter-spacing:.8px">${escape_(label)}</a>`;
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
