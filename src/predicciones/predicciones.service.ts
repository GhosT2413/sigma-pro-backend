import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleGenAI, Type } from '@google/genai';
import { Repository } from 'typeorm';
import { PrediccionIa } from './prediccion-ia.entity';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class PrediccionesService {
    private ai: GoogleGenAI;

    constructor(
        @InjectRepository(PrediccionIa)
        private prediccionesRepository: Repository<PrediccionIa>,
        private alertasService: AlertasService,
    ) {
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY, // Nest leerá esto desde .env
        });
    }

    async predecirMantencion(
        kilometrajeActual: number,
        marca: string,
        modelo: string,
        tipoUso: string,
        vehiculoId: number = 1
    ): Promise<PrediccionIa> {
        try {
            const prompt = `
                Eres un asistente experto en mantenimiento preventivo automotriz.

Datos del vehículo:
- Marca: ${marca}
- Modelo: ${modelo}
- Tipo de uso: ${tipoUso}
- Kilometraje actual: ${kilometrajeActual} km

Objetivo:
Estima cuál podría ser la próxima mantención preventiva
prioritaria, utilizando criterios generales de mantenimiento
automotriz.

Reglas:
1. No inventes datos del fabricante.
2. No afirmes que existe una falla sin evidencia.
3. Si faltan datos, indícalo en el diagnóstico.
4. La probabilidad de falla debe ser null si no existen
   datos históricos suficientes para calcularla.
5. Responde únicamente con JSON válido.
6. No incluyas texto fuera del objeto JSON.

Estructura obligatoria:
{
  "componente": "Nombre del componente",
  "diagnostico": "Breve justificación",
  "kilometraje_recomendado": 0,
  "probabilidad_falla": null
}
            `;

            const response = await this.ai.models.generateContent({
                model: 'gemini-3.6-flash', // Esta es la versión actual de Gemini que soporta JSON Schema
                contents: prompt,
                config: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            componente: {
                                type: Type.STRING,
                                description: 'Nombre del componente (ej. Aceite, Frenos)',
                            },
                            diagnostico: {
                                type: Type.STRING,
                                description: 'Breve justificación técnica',
                            },
                            kilometraje_recomendado: {
                                type: Type.INTEGER,
                                description: 'Kilometraje en el que se debe realizar el mantenimiento',
                            },
                            probabilidad_falla: {
                                type: Type.NUMBER,
                                description: 'Probabilidad de falla estimada entre 0.0 y 1.0',
                            },
                        },
                        required: ['componente', 'diagnostico', 'kilometraje_recomendado', 'probabilidad_falla'],
                    },
                },
            });

            const respuestaTexto = response.text;
            if (!respuestaTexto) {
                throw new InternalServerErrorException('No se recibió respuesta válida de Gemini.');
            }

            const dataIA = JSON.parse(respuestaTexto);

            // Guardamos en la base de datos MySQL
            const nuevaPrediccion = this.prediccionesRepository.create({
                vehiculo_id: vehiculoId,
                kilometraje_actual: kilometrajeActual,
                componente: dataIA.componente,
                diagnostico: dataIA.diagnostico,
                kilometraje_recomendado: dataIA.kilometraje_recomendado,
                probabilidad: dataIA.probabilidad_falla,
            });

            const prediccionGuardada = await this.prediccionesRepository.save(nuevaPrediccion);

            // Evaluamos umbrales para generar alertas automáticas (RF-09: Amarillo o Rojo)
            if (dataIA.kilometraje_recomendado) {
                await this.alertasService.evaluarUmbral(
                    vehiculoId,
                    kilometrajeActual,
                    dataIA.kilometraje_recomendado,
                    dataIA.componente
                );
            }

            return prediccionGuardada;
        } catch (error: any) {
            throw new InternalServerErrorException('Error con Gemini o Base de Datos: ' + (error?.message || error));
        }
    }
}
