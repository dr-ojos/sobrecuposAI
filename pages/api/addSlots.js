// pages/api/addSlots.js
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // 1) Determinar tabla de Sobrecupos (nombre o ID)
  const slotsTable = process.env.AIRTABLE_TABLE_NAME || process.env.AIRTABLE_TABLE_ID;
  if (!slotsTable) {
    return res
      .status(500)
      .json({ error: 'No AIRTABLE_TABLE_NAME ni AIRTABLE_TABLE_ID configurados' });
  }

  // 2) Leer payload
  const { specialty, doctorId, clinic, address, date, times } = req.body;
  // times viene como CSV: "09:00,10:00,…"
  const hourList = times
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  if (hourList.length === 0) {
    return res.status(400).json({ error: 'No hay horas para procesar' });
  }

  try {
    // 3) Construir fórmula para evitar duplicados:
    //    - que el campo link “Médico” contenga doctorId
    //    - que la Fecha coincida
    //    - y la Hora esté en nuestra lista
    const orHours = hourList
      .map(h => `{Hora}="${h}"`)
      .join(',');
    const filterFormula = `AND(
      FIND("${doctorId}", ARRAYJOIN({Médico}))>0,
      DATETIME_FORMAT({Fecha}, 'YYYY-MM-DD')="${date}",
      OR(${orHours})
    )`;

    // 4) Consultar Airtable qué horas ya existen
    const existing = [];
    await base(slotsTable)
      .select({
        filterByFormula: filterFormula,
        fields: ['Hora']
      })
      .eachPage((records, fetchNext) => {
        records.forEach(r => existing.push(r.fields.Hora));
        fetchNext();
      });

    // 5) Quedarnos sólo con las horas nuevas
    const toCreate = hourList.filter(h => !existing.includes(h));
    if (toCreate.length === 0) {
      return res.status(200).json({ created: 0, skipped: existing });
    }

    // 6) Crear en batches de 10 registros
    let createdCount = 0;
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10).map(hour => ({
        fields: {
          Especialidad: specialty,
          // Campo Link to Doctors: le pasamos un array con el ID
          Médico:      [doctorId],
          Clínica:     clinic,
          Dirección:   address,
          Fecha:       date,
          Hora:        hour,
          Disponible:  'si'
        }
      }));
      const resp = await base(slotsTable).create(batch);
      createdCount += resp.length;
    }

    // 7) Responder al cliente
    return res.status(200).json({
      created: createdCount,
      skipped: existing
    });

  } catch (err) {
    console.error('Error en addSlots:', err);
    return res.status(500).json({ error: err.message });
  }
}