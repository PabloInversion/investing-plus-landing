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
    return fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ email, fields }),
    });
  }

  try {
    let r = await crearContacto(fieldsFull);

    // Si algun slug de campo personalizado no existe en la cuenta,
    // reintentamos solo con nombre/apellido (campos estandar de Systeme.io).
    if (!r.ok && r.status === 422) {
      r = await crearContacto([
        { slug: 'first_name', value: firstName },
        { slug: 'surname', value: lastName },
      ]);
    }

    // 422 tambien puede significar "el contacto ya existe" — lo tratamos
    // como exito porque el dato ya esta capturado en Systeme.io.
    if (!r.ok && r.status !== 422) {
      const errText = await r.text();
      console.error('Systeme.io error:', r.status, errText);
      return res.status(502).json({ ok: false, error: 'systeme_error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error conectando con Systeme.io:', err);
    return res.status(500).json({ ok: false, error: 'unexpected_error' });
  }
};
