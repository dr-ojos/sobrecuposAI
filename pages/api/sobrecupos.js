// pages/api/sobrecupos.js
/**
 * Endpoint para gestionar Sobrecupos en Airtable.
 * Acepta ambos formatos:
 *  (A) nuevo  → { medico, especialidad, clinica, direccion, fecha, hora }
 *  (B) legacy → { MedicoNombre, Especialidad, Clinica, Fecha, Hora }
 */

import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Cambia la env var si tu tabla tiene otro nombre
const tableName = process.env.AIRTABLE_SOBRECUPOS_TABLE || 'Sobrecupostest';

export default async function handler(req, res) {
  switch (req.method) {
    /* ------------------------------------------------------------------ */
    /* GET → lista todos los sobrecupos                                   */
    /* ------------------------------------------------------------------ */
    case 'GET':
      try {
        const records = await base(tableName).select({}).all();
        return res.status(200).json(records);
      } catch (err) {
        console.error('[Sobrecupos] GET error:', err);
        return res.status(500).json({ error: 'Airtable GET error' });
      }

    /* ------------------------------------------------------------------ */
    /* POST → crea un nuevo sobrecupo                                     */
    /* ------------------------------------------------------------------ */
    case 'POST':
      try {
        const body = req.body || {};

        /* 1️⃣ Normalizamos campos si vienen en formato legacy */
        if (body.MedicoNombre) {
          body.medico       = body.MedicoNombre;      // texto plano o ID
          body.especialidad = body.Especialidad;
          body.clinica      = body.Clinica;
          body.fecha        = body.Fecha;
          body.hora         = body.Hora;
          body.direccion    = body.Direccion || '';
        }

        /* 2️⃣ Validación mínima */
        if (!body.medico || !body.fecha || !body.hora) {
          return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        /* 3️⃣ Mapeo a columnas de Airtable */
        const airtableFields = {
          Medico:       body.medico,        // o referencia si usas linked records
          Especialidad: body.especialidad || '',
          Clínica:      body.clinica || '',
          Dirección:    body.direccion || '',
          Fecha:        body.fecha,
          Hora:         body.hora,
          Estado:       'Disponible'
        };

        /* 4️⃣ Creación del registro */
        const record = await base(tableName).create(airtableFields);
        return res.status(200).json({ id: record.id, fields: record.fields });

      } catch (err) {
        console.error('[Sobrecupos] POST error:', err);
        return res.status(500).json({ error: 'Airtable POST error' });
      }

    /* ------------------------------------------------------------------ */
    /* DELETE → elimina sobrecupo por id                                  */
    /* ------------------------------------------------------------------ */
    case 'DELETE':
      try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });

        await base(tableName).destroy(id);
        return res.status(200).json({ deleted: true });
      } catch (err) {
        console.error('[Sobrecupos] DELETE error:', err);
        return res.status(500).json({ error: 'Airtable DELETE error' });
      }

    /* ------------------------------------------------------------------ */
    /* Métodos no permitidos                                              */
    /* ------------------------------------------------------------------ */
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Método ${req.method} no permitido`);
  }
}