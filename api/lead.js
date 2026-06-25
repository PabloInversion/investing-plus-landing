// Funcion serverless (Vercel) que recibe el lead del formulario de captura
// y lo envia a Systeme.io via su API REST. La API key nunca se expone al
// navegador: vive solo como variable de entorno en Vercel.

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

  async function crearContacto(fields) {
    const r = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ email, fields }),
    });
    const data = await r.json().catch(() => ({}));
    return { r, data };
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
      ({ r, data } = await crearContacto([
        { slug: 'first_name', value: firstName },
        { slug: 'surname', value: lastName },
      ]));
    }

    if (r.ok) {
      return res.status(200).json({ ok: true });
    }

    // El contacto ya existia: el dato sigue capturado en Systeme.io.
    if (esDuplicado(data)) {
      return res.status(200).json({ ok: true, alreadyExists: true });
    }

    console.error('Systeme.io rechazo la solicitud:', r.status, data);
    return res.status(400).json({ ok: false, error: 'systeme_rejected', detail: data?.detail });
  } catch (err) {
    console.error('Error conectando con Systeme.io:', err);
    return res.status(500).json({ ok: false, error: 'unexpected_error' });
  }
};
