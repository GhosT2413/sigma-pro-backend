import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrediccionIa } from './prediccion-ia.entity';
import { AlertasService } from '../alertas/alertas.service';

@Injectable()
export class PrediccionesService {
    private readonly apiUrl = 'https://api.mammouth.ai/v1/chat/completions';
    private readonly apiKey = 'sk-ABEoBVMX9TKmKRX1NzpbhQ';
    private readonly model = 'gpt-4.1';

    constructor(
        @InjectRepository(PrediccionIa)
        private prediccionesRepository: Repository<PrediccionIa>,
        private alertasService: AlertasService,
    ) {}

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
            `.trim();

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.2,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new InternalServerErrorException(`Error en API mammouth.ai: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            const respuestaTexto = responseData.choices?.[0]?.message?.content;

            if (!respuestaTexto) {
                throw new InternalServerErrorException('No se recibió respuesta válida de la API.');
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
            throw new InternalServerErrorException('Error con API mammouth.ai o Base de Datos: ' + (error?.message || error));
        }
    }
}
