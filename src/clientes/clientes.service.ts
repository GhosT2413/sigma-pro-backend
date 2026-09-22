import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { formatearRutBackend, limpiarRut } from './validators/rut.validator';

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
    ) { }

    private formatearRutParaGuardar(rut?: string): string | undefined {
        if (!rut) return undefined;
        return formatearRutBackend(rut);
    }

    private limpiarRutParaBuscar(rut?: string): string | undefined {
        if (!rut) return undefined;
        return limpiarRut(rut);
    }

    async crearCliente(dto: CreateClienteDto): Promise<{ mensaje: string; cliente: Cliente }> {
        const rutFormateado = this.formatearRutParaGuardar(dto.rut);
        const rutLimpio = this.limpiarRutParaBuscar(dto.rut);

        if (rutLimpio) {
            const existeRut = await this.clientesRepository.findOne({ where: { rut: rutFormateado } });
            if (existeRut) throw new BadRequestException('El RUT ingresado ya existe.');
        }

        const nuevoCliente = this.clientesRepository.create({
            ...dto,
            rut: rutFormateado,
        });
        const clienteGuardado = await this.clientesRepository.save(nuevoCliente);
        return { mensaje: 'El cliente fue creado exitosamente.', cliente: clienteGuardado };
    }

    async obtenerTodos(): Promise<Cliente[]> {
        return await this.clientesRepository.find({
            order: { id: 'DESC' },
        });
    }

    async obtenerPorId(id: number): Promise<Cliente> {
        const cliente = await this.clientesRepository.findOne({ where: { id } });
        if (!cliente) {
            throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
        }
        return cliente;
    }

    async actualizar(id: number, dto: UpdateClienteDto): Promise<{ mensaje: string; cliente: Cliente }> {
        const cliente = await this.obtenerPorId(id);

        const rutFormateado = this.formatearRutParaGuardar(dto.rut);
        const rutLimpio = this.limpiarRutParaBuscar(dto.rut);

        if (rutLimpio && rutFormateado !== cliente.rut) {
            const existeRut = await this.clientesRepository.findOne({ where: { rut: rutFormateado } });
            if (existeRut && existeRut.id !== id) {
                throw new BadRequestException('El RUT ingresado ya existe.');
            }
        }

        this.clientesRepository.merge(cliente, {
            ...dto,
            rut: rutFormateado ?? cliente.rut,
        });
        const clienteActualizado = await this.clientesRepository.save(cliente);
        return { mensaje: 'El cliente fue actualizado exitosamente.', cliente: clienteActualizado };
    }

    async eliminar(id: number): Promise<{ mensaje: string }> {
        const cliente = await this.obtenerPorId(id);
        await this.clientesRepository.remove(cliente);
        return { mensaje: `Cliente con ID ${id} eliminado correctamente.` };
    }
}
