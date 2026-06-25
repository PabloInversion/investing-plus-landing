// Funcion serverless (Vercel) que recibe el lead del formulario de captura
// y lo envia a Systeme.io via su API REST. La API key nunca se expone al
// navegador: vive solo como variable de entorno en Vercel.

// Etiqueta "Lead-Landing" en Systeme.io: permite armar una campana de email
// dirigida solo a quienes entraron por el formulario de la landing.
const TAG_ID = 2068772;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const apiKey = process.env.SYSTEME_API_KEY;
  if (!apiKey) {
    console.error('SYSTEME_API_KEY no esta configurada en Vercel.');
    return res.status(500).json({ ok: false, error: 'missing_api_key' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { nombre = '', email = '', telefono = '', pais = '' } = body || {};

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const partes = nombre.trim().split(/\s+/);
  const firstName = partes.shift() || '';
  const lastName = partes.join(' ');

  const fieldsFull = [
    { slug: 'first_name', value: firstName },
    { slug: 'surname', value: lastName },
    { slug: 'phone_number', value: telefono },
    { slug: 'country', value: pais },
  ].filter((f) => f.value);

  const headers = { 'Content-Type': 'application/json', 'X-API-Key': apiKey };

  async function crearContacto(fields) {
    const r = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, fields }),
    });
    const data = await r.json().catch(() => ({}));
    return { r, data };
  }

  async function buscarContactoPorEmail() {
    const r = await fetch(
      `https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`,
      { headers }
    );
    const data = await r.json().catch(() => ({}));
    return data?.items?.[0]?.id || null;
  }

  async function etiquetar(contactId) {
    if (!contactId) return;
    try {
      await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tagId: TAG_ID }),
      });
    } catch (err) {
      console.error('No se pudo etiquetar el contacto:', err);
    }
  }

  const esDuplicado = (data) =>
    Array.isArray(data?.violations) &&
    data.violations.some(
      (v) => v.propertyPath === 'email' && /ya se ha utilizado|already.*used/i.test(v.message || '')
    );

  try {
    let { r, data } = await crearContacto(fieldsFull);

    // Si algun slug de campo personalizado no existe en la cuenta,
    // reintentamos solo con nombre/apellido (campos estandar de Systeme.io).
    if (!r.ok && r.status === 422 && !esDuplicado(data)) {
      ({ r, data } = await crearContacto(
        [
          { slug: 'first_name', value: firstName },
          { slug: 'surname', value: lastName },
        ].filter((f) => f.value)
      ));
    }

    // Ultimo respaldo: si incluso asi sigue rechazando, creamos el contacto
    // solo con el correo para no perder el lead.
    if (!r.ok && r.status === 422 && !esDuplicado(data)) {
      ({ r, data } = await crearContacto([]));
    }

    if (r.ok) {
      await etiquetar(data?.id);
      return res.status(200).json({ ok: true });
    }

    // El contacto ya existia: lo etiquetamos igual y seguimos.
    if (esDuplicado(data)) {
      const id = await buscarContactoPorEmail();
      await etiquetar(id);
      return res.status(200).json({ ok: true, alreadyExists: true });
    }

    console.error('Systeme.io rechazo la solicitud:', r.status, data);
    return res.status(400).json({ ok: false, error: 'systeme_rejected', detail: data?.detail });
  } catch (err) {
    console.error('Error conectando con Systeme.io:', err);
    return res.status(500).json({ ok: false, error: 'unexpected_error' });
  }
};
