# Ejemplo Completo: Clean Architecture + DDD

Este documento muestra cómo quedaría tu código actual refactorizado con Clean Architecture + DDD.

## 📁 Estructura de Carpetas

```
backend/
├── src/
│   ├── domain/                    # Capa de Dominio (DDD)
│   │   ├── entities/              # Entidades de negocio
│   │   │   └── Contract.js
│   │   ├── valueObjects/          # Objetos de valor
│   │   │   ├── ContractNumber.js
│   │   │   ├── ContractStatus.js
│   │   │   └── Money.js
│   │   ├── repositories/          # Interfaces (contratos)
│   │   │   └── IContractRepository.js
│   │   ├── services/              # Servicios de dominio
│   │   │   └── ContractDomainService.js
│   │   └── errors/                # Errores de dominio
│   │       └── DomainError.js
│   │
│   ├── application/               # Capa de Aplicación
│   │   ├── useCases/              # Casos de uso
│   │   │   ├── contracts/
│   │   │   │   ├── CreateContractUseCase.js
│   │   │   │   ├── GetContractUseCase.js
│   │   │   │   ├── ListContractsUseCase.js
│   │   │   │   └── UpdateContractUseCase.js
│   │   │   └── shared/
│   │   │       └── BaseUseCase.js
│   │   └── dtos/                  # Data Transfer Objects
│   │       └── ContractDTO.js
│   │
│   ├── infrastructure/            # Capa de Infraestructura
│   │   ├── repositories/          # Implementaciones
│   │   │   └── SupabaseContractRepository.js
│   │   ├── database/              # Configuración DB
│   │   │   └── supabase.js
│   │   └── external/              # Servicios externos
│   │       └── openaiService.js
│   │
│   └── presentation/              # Capa de Presentación
│       ├── controllers/           # Controllers HTTP
│       │   └── ContractController.js
│       ├── routes/                # Rutas Express
│       │   └── contractRoutes.js
│       └── middleware/           # Middleware HTTP
│           └── authMiddleware.js
│
└── app.js                         # Entry point
```

## 🎯 Código Completo por Capas

### 1. DOMAIN LAYER (Lógica de Negocio Pura)

#### Domain/Errors/DomainError.js
```javascript
/**
 * Error base del dominio
 */
export class DomainError extends Error {
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}

export class ValidationError extends DomainError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message) {
    super(message, 'BUSINESS_RULE_ERROR')
    this.name = 'BusinessRuleError'
  }
}
```

#### Domain/ValueObjects/ContractNumber.js
```javascript
/**
 * Value Object: Número de Contrato
 * Inmutable, validado
 */
export class ContractNumber {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('El número de contrato es requerido')
    }
    
    if (value.trim().length === 0) {
      throw new ValidationError('El número de contrato no puede estar vacío')
    }
    
    if (value.length > 50) {
      throw new ValidationError('El número de contrato no puede exceder 50 caracteres')
    }
    
    this._value = value.trim()
  }
  
  get value() {
    return this._value
  }
  
  equals(other) {
    return other instanceof ContractNumber && this._value === other._value
  }
  
  toString() {
    return this._value
  }
}
```

#### Domain/ValueObjects/ContractStatus.js
```javascript
/**
 * Value Object: Estado del Contrato
 */
export class ContractStatus {
  static DRAFT = 'Borrador'
  static ACTIVE = 'Activo'
  static COMPLETED = 'Completado'
  static CANCELLED = 'Cancelado'
  
  constructor(value) {
    const validStatuses = [
      ContractStatus.DRAFT,
      ContractStatus.ACTIVE,
      ContractStatus.COMPLETED,
      ContractStatus.CANCELLED
    ]
    
    if (!validStatuses.includes(value)) {
      throw new ValidationError(`Estado inválido: ${value}`)
    }
    
    this._value = value
  }
  
  get value() {
    return this._value
  }
  
  isDraft() {
    return this._value === ContractStatus.DRAFT
  }
  
  isActive() {
    return this._value === ContractStatus.ACTIVE
  }
  
  canActivate() {
    return this.isDraft()
  }
  
  canCancel() {
    return this.isDraft() || this.isActive()
  }
  
  equals(other) {
    return other instanceof ContractStatus && this._value === other._value
  }
  
  toString() {
    return this._value
  }
}
```

#### Domain/ValueObjects/Money.js
```javascript
/**
 * Value Object: Dinero
 */
export class Money {
  constructor(amount, currency = 'COP') {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('El monto debe ser un número válido')
    }
    
    if (amount < 0) {
      throw new ValidationError('El monto no puede ser negativo')
    }
    
    this._amount = Math.round(amount * 100) / 100 // 2 decimales
    this._currency = currency
  }
  
  get amount() {
    return this._amount
  }
  
  get currency() {
    return this._currency
  }
  
  add(other) {
    if (!(other instanceof Money)) {
      throw new ValidationError('Solo se pueden sumar objetos Money')
    }
    if (this._currency !== other._currency) {
      throw new ValidationError('No se pueden sumar monedas diferentes')
    }
    return new Money(this._amount + other._amount, this._currency)
  }
  
  subtract(other) {
    if (!(other instanceof Money)) {
      throw new ValidationError('Solo se pueden restar objetos Money')
    }
    if (this._currency !== other._currency) {
      throw new ValidationError('No se pueden restar monedas diferentes')
    }
    return new Money(this._amount - other._amount, this._currency)
  }
  
  equals(other) {
    return other instanceof Money && 
           this._amount === other._amount && 
           this._currency === other._currency
  }
  
  toString() {
    return `${this._currency} ${this._amount.toLocaleString('es-CO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }
}
```

#### Domain/Entities/Contract.js
```javascript
import { ContractNumber } from '../valueObjects/ContractNumber.js'
import { ContractStatus } from '../valueObjects/ContractStatus.js'
import { Money } from '../valueObjects/Money.js'
import { BusinessRuleError, ValidationError } from '../errors/DomainError.js'

/**
 * Entidad de Dominio: Contrato
 * Contiene lógica de negocio
 */
export class Contract {
  constructor({
    id,
    numeroContrato,
    fechaInicio,
    fechaTerminacion,
    fechaLiquidacion,
    clientId,
    valorContrato,
    objetoContrato,
    tipoContratoId,
    estadoContratoId,
    clienteId,
    createdAt,
    updatedAt
  }) {
    // Identificador
    this._id = id
    
    // Value Objects
    this._numeroContrato = numeroContrato instanceof ContractNumber 
      ? numeroContrato 
      : new ContractNumber(numeroContrato)
    
    this._valorContrato = valorContrato instanceof Money
      ? valorContrato
      : new Money(valorContrato)
    
    // Validaciones de negocio
    this._validateBusinessRules({
      fechaInicio,
      fechaTerminacion,
      fechaLiquidacion,
      clientId,
      objetoContrato,
      tipoContratoId,
      estadoContratoId,
      clienteId
    })
    
    // Propiedades simples
    this._fechaInicio = new Date(fechaInicio)
    this._fechaTerminacion = fechaTerminacion ? new Date(fechaTerminacion) : null
    this._fechaLiquidacion = fechaLiquidacion ? new Date(fechaLiquidacion) : null
    this._clientId = clientId
    this._objetoContrato = objetoContrato || ''
    this._tipoContratoId = tipoContratoId
    this._estadoContratoId = estadoContratoId
    this._clienteId = clienteId
    this._createdAt = createdAt ? new Date(createdAt) : new Date()
    this._updatedAt = updatedAt ? new Date(updatedAt) : new Date()
  }
  
  _validateBusinessRules({
    fechaInicio,
    fechaTerminacion,
    fechaLiquidacion,
    clientId,
    objetoContrato,
    tipoContratoId,
    estadoContratoId,
    clienteId
  }) {
    if (!fechaInicio) {
      throw new ValidationError('La fecha de inicio es obligatoria')
    }
    
    if (!clientId) {
      throw new ValidationError('El contratante es obligatorio')
    }
    
    if (!clienteId) {
      throw new ValidationError('El cliente (tenant) es obligatorio')
    }
    
    if (fechaTerminacion && new Date(fechaTerminacion) < new Date(fechaInicio)) {
      throw new BusinessRuleError('La fecha de terminación no puede ser anterior a la fecha de inicio')
    }
    
    if (fechaLiquidacion && fechaTerminacion && new Date(fechaLiquidacion) < new Date(fechaTerminacion)) {
      throw new BusinessRuleError('La fecha de liquidación no puede ser anterior a la fecha de terminación')
    }
  }
  
  // Getters
  get id() { return this._id }
  get numeroContrato() { return this._numeroContrato }
  get fechaInicio() { return this._fechaInicio }
  get fechaTerminacion() { return this._fechaTerminacion }
  get fechaLiquidacion() { return this._fechaLiquidacion }
  get clientId() { return this._clientId }
  get valorContrato() { return this._valorContrato }
  get objetoContrato() { return this._objetoContrato }
  get tipoContratoId() { return this._tipoContratoId }
  get estadoContratoId() { return this._estadoContratoId }
  get clienteId() { return this._clienteId }
  get createdAt() { return this._createdAt }
  get updatedAt() { return this._updatedAt }
  
  // Métodos de dominio (lógica de negocio)
  activate() {
    if (this._estadoContratoId !== 'Borrador') {
      throw new BusinessRuleError('Solo los contratos en borrador pueden activarse')
    }
    
    // Aquí podrías agregar más lógica: notificaciones, eventos, etc.
    this._estadoContratoId = 'Activo'
    this._updatedAt = new Date()
  }
  
  cancel(reason) {
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Se requiere una razón para cancelar el contrato')
    }
    
    if (this._estadoContratoId === 'Completado') {
      throw new BusinessRuleError('No se puede cancelar un contrato completado')
    }
    
    this._estadoContratoId = 'Cancelado'
    this._updatedAt = new Date()
    // Aquí podrías guardar la razón en un campo adicional
  }
  
  complete() {
    if (this._estadoContratoId !== 'Activo') {
      throw new BusinessRuleError('Solo los contratos activos pueden completarse')
    }
    
    this._estadoContratoId = 'Completado'
    this._updatedAt = new Date()
  }
  
  // Factory method
  static create(data) {
    return new Contract({
      ...data,
      estadoContratoId: data.estadoContratoId || 'Borrador'
    })
  }
  
  // Método para reconstruir desde persistencia
  static fromPersistence(data) {
    return new Contract({
      id: data.id,
      numeroContrato: data.numero_contrato,
      fechaInicio: data.fecha_inicio,
      fechaTerminacion: data.fecha_terminacion,
      fechaLiquidacion: data.fecha_liquidacion,
      clientId: data.client_id,
      valorContrato: data.valor_contrato,
      objetoContrato: data.objeto_contrato,
      tipoContratoId: data.tipo_contrato_id,
      estadoContratoId: data.estado_contrato_id,
      clienteId: data.cliente_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    })
  }
}
```

#### Domain/Repositories/IContractRepository.js
```javascript
/**
 * Interface del repositorio de contratos
 * Define el contrato sin implementación
 */
export class IContractRepository {
  /**
   * Guardar contrato (crear o actualizar)
   * @param {Contract} contract
   * @returns {Promise<Contract>}
   */
  async save(contract) {
    throw new Error('Method save() must be implemented')
  }
  
  /**
   * Buscar por ID
   * @param {string} id
   * @param {string} clienteId
   * @returns {Promise<Contract|null>}
   */
  async findById(id, clienteId) {
    throw new Error('Method findById() must be implemented')
  }
  
  /**
   * Listar contratos con filtros
   * @param {Object} params
   * @returns {Promise<{data: Contract[], total: number, page: number, limit: number}>}
   */
  async findAll({ clienteId, filters, page, limit, orderBy, orderDir }) {
    throw new Error('Method findAll() must be implemented')
  }
  
  /**
   * Eliminar contrato
   * @param {string} id
   * @param {string} clienteId
   * @returns {Promise<void>}
   */
  async delete(id, clienteId) {
    throw new Error('Method delete() must be implemented')
  }
}
```

### 2. APPLICATION LAYER (Casos de Uso)

#### Application/DTOs/ContractDTO.js
```javascript
/**
 * Data Transfer Object para Contratos
 * Convierte entre dominio y presentación
 */
export class ContractDTO {
  static fromRequest(body) {
    return {
      numeroContrato: body.numero_contrato,
      fechaInicio: body.fecha_inicio,
      fechaTerminacion: body.fecha_terminacion || null,
      fechaLiquidacion: body.fecha_liquidacion || null,
      clientId: body.client_id,
      valorContrato: parseFloat(body.valor_contrato) || 0,
      objetoContrato: body.objeto_contrato || '',
      tipoContratoId: body.tipo_contrato_id,
      estadoContratoId: body.estado_contrato_id || 'Borrador'
    }
  }
  
  static toResponse(contract) {
    return {
      id: contract.id,
      numero_contrato: contract.numeroContrato.value,
      fecha_inicio: contract.fechaInicio.toISOString().split('T')[0],
      fecha_terminacion: contract.fechaTerminacion?.toISOString().split('T')[0] || null,
      fecha_liquidacion: contract.fechaLiquidacion?.toISOString().split('T')[0] || null,
      client_id: contract.clientId,
      valor_contrato: contract.valorContrato.amount,
      objeto_contrato: contract.objetoContrato,
      tipo_contrato_id: contract.tipoContratoId,
      estado_contrato_id: contract.estadoContratoId,
      cliente_id: contract.clienteId,
      created_at: contract.createdAt.toISOString(),
      updated_at: contract.updatedAt.toISOString()
    }
  }
  
  static toListResponse(contracts) {
    return contracts.map(contract => this.toResponse(contract))
  }
}
```

#### Application/UseCases/contracts/CreateContractUseCase.js
```javascript
import { Contract } from '../../../domain/entities/Contract.js'
import { ContractDTO } from '../../dtos/ContractDTO.js'
import { ValidationError } from '../../../domain/errors/DomainError.js'

/**
 * Caso de Uso: Crear Contrato
 * Orquesta la creación de un contrato
 */
export class CreateContractUseCase {
  constructor(contractRepository) {
    this.contractRepository = contractRepository
  }
  
  async execute({ contractData, clienteId, userId }) {
    try {
      // 1. Validar datos de entrada
      if (!contractData.numeroContrato) {
        throw new ValidationError('El número de contrato es obligatorio')
      }
      
      if (!contractData.fechaInicio) {
        throw new ValidationError('La fecha de inicio es obligatoria')
      }
      
      if (!contractData.clientId) {
        throw new ValidationError('El contratante es obligatorio')
      }
      
      if (!contractData.valorContrato || contractData.valorContrato <= 0) {
        throw new ValidationError('El valor del contrato es obligatorio y debe ser mayor a 0')
      }
      
      // 2. Crear entidad de dominio
      const contract = Contract.create({
        ...contractData,
        clienteId,
        estadoContratoId: 'Borrador'
      })
      
      // 3. Persistir
      const savedContract = await this.contractRepository.save(contract)
      
      // 4. Retornar DTO
      return ContractDTO.toResponse(savedContract)
    } catch (error) {
      // Re-lanzar errores de dominio
      if (error instanceof ValidationError || error.name === 'ValidationError') {
        throw error
      }
      // Otros errores se convierten en error genérico
      throw new Error(`Error al crear contrato: ${error.message}`)
    }
  }
}
```

#### Application/UseCases/contracts/GetContractUseCase.js
```javascript
import { ContractDTO } from '../../dtos/ContractDTO.js'
import { BusinessRuleError } from '../../../domain/errors/DomainError.js'

export class GetContractUseCase {
  constructor(contractRepository) {
    this.contractRepository = contractRepository
  }
  
  async execute({ contractId, clienteId }) {
    const contract = await this.contractRepository.findById(contractId, clienteId)
    
    if (!contract) {
      throw new BusinessRuleError('Contrato no encontrado')
    }
    
    return ContractDTO.toResponse(contract)
  }
}
```

#### Application/UseCases/contracts/ListContractsUseCase.js
```javascript
import { ContractDTO } from '../../dtos/ContractDTO.js'

export class ListContractsUseCase {
  constructor(contractRepository) {
    this.contractRepository = contractRepository
  }
  
  async execute({ clienteId, filters, page, limit, orderBy, orderDir }) {
    const result = await this.contractRepository.findAll({
      clienteId,
      filters,
      page,
      limit,
      orderBy,
      orderDir
    })
    
    return {
      data: ContractDTO.toListResponse(result.data),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    }
  }
}
```

#### Application/UseCases/contracts/UpdateContractUseCase.js
```javascript
import { ContractDTO } from '../../dtos/ContractDTO.js'
import { BusinessRuleError, ValidationError } from '../../../domain/errors/DomainError.js'

export class UpdateContractUseCase {
  constructor(contractRepository) {
    this.contractRepository = contractRepository
  }
  
  async execute({ contractId, contractData, clienteId }) {
    // 1. Obtener contrato existente
    const existingContract = await this.contractRepository.findById(contractId, clienteId)
    
    if (!existingContract) {
      throw new BusinessRuleError('Contrato no encontrado')
    }
    
    // 2. Actualizar propiedades
    // (En una implementación real, usarías un método update() en la entidad)
    const updatedContract = Contract.fromPersistence({
      ...existingContract,
      ...contractData,
      id: contractId,
      clienteId
    })
    
    // 3. Persistir
    const savedContract = await this.contractRepository.save(updatedContract)
    
    // 4. Retornar DTO
    return ContractDTO.toResponse(savedContract)
  }
}
```

### 3. INFRASTRUCTURE LAYER (Implementaciones)

#### Infrastructure/Repositories/SupabaseContractRepository.js
```javascript
import { IContractRepository } from '../../domain/repositories/IContractRepository.js'
import { Contract } from '../../domain/entities/Contract.js'
import { supabaseAdmin } from '../database/supabase.js'

/**
 * Implementación del repositorio usando Supabase
 */
export class SupabaseContractRepository extends IContractRepository {
  async save(contract) {
    const persistenceData = this._toPersistence(contract)
    
    if (contract.id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('contracts')
        .update(persistenceData)
        .eq('id', contract.id)
        .eq('cliente_id', contract.clienteId)
        .select()
        .single()
      
      if (error) throw new Error(`Error al actualizar contrato: ${error.message}`)
      return Contract.fromPersistence(data)
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('contracts')
        .insert([persistenceData])
        .select()
        .single()
      
      if (error) throw new Error(`Error al crear contrato: ${error.message}`)
      return Contract.fromPersistence(data)
    }
  }
  
  async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Error al buscar contrato: ${error.message}`)
    }
    
    return data ? Contract.fromPersistence(data) : null
  }
  
  async findAll({ clienteId, filters = {}, page = 1, limit = 10, orderBy = 'created_at', orderDir = 'desc' }) {
    let query = supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact' })
      .eq('cliente_id', clienteId)
    
    // Aplicar filtros
    if (filters.numero_contrato) {
      query = query.ilike('numero_contrato', `%${filters.numero_contrato}%`)
    }
    
    if (filters.fecha_inicio_desde) {
      query = query.gte('fecha_inicio', filters.fecha_inicio_desde)
    }
    
    if (filters.fecha_inicio_hasta) {
      query = query.lte('fecha_inicio', filters.fecha_inicio_hasta)
    }
    
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    
    // Ordenamiento
    query = query.order(orderBy, { ascending: orderDir === 'asc' })
    
    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) throw new Error(`Error al listar contratos: ${error.message}`)
    
    return {
      data: (data || []).map(item => Contract.fromPersistence(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
  
  async delete(id, clienteId) {
    const { error } = await supabaseAdmin
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)
    
    if (error) throw new Error(`Error al eliminar contrato: ${error.message}`)
  }
  
  _toPersistence(contract) {
    return {
      id: contract.id,
      numero_contrato: contract.numeroContrato.value,
      fecha_inicio: contract.fechaInicio.toISOString().split('T')[0],
      fecha_terminacion: contract.fechaTerminacion?.toISOString().split('T')[0] || null,
      fecha_liquidacion: contract.fechaLiquidacion?.toISOString().split('T')[0] || null,
      client_id: contract.clientId,
      valor_contrato: contract.valorContrato.amount,
      objeto_contrato: contract.objetoContrato,
      tipo_contrato_id: contract.tipoContratoId,
      estado_contrato_id: contract.estadoContratoId,
      cliente_id: contract.clienteId,
      updated_at: new Date().toISOString()
    }
  }
}
```

### 4. PRESENTATION LAYER (HTTP/Express)

#### Presentation/Controllers/ContractController.js
```javascript
import { CreateContractUseCase } from '../../application/useCases/contracts/CreateContractUseCase.js'
import { GetContractUseCase } from '../../application/useCases/contracts/GetContractUseCase.js'
import { ListContractsUseCase } from '../../application/useCases/contracts/ListContractsUseCase.js'
import { UpdateContractUseCase } from '../../application/useCases/contracts/UpdateContractUseCase.js'
import { ContractDTO } from '../../application/dtos/ContractDTO.js'
import { ValidationError, BusinessRuleError } from '../../domain/errors/DomainError.js'

/**
 * Controller HTTP para Contratos
 * Solo maneja HTTP, delega lógica a Use Cases
 */
export class ContractController {
  constructor(dependencies) {
    this.createUseCase = dependencies.createContractUseCase
    this.getUseCase = dependencies.getContractUseCase
    this.listUseCase = dependencies.listContractsUseCase
    this.updateUseCase = dependencies.updateContractUseCase
  }
  
  async create(req, res, next) {
    try {
      const { clienteId, id: userId } = req.user
      const contractData = ContractDTO.fromRequest(req.body)
      
      const result = await this.createUseCase.execute({
        contractData,
        clienteId,
        userId
      })
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Contrato creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
  
  async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      
      const result = await this.getUseCase.execute({
        contractId: id,
        clienteId
      })
      
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
  
  async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 10,
        numero_contrato,
        fecha_inicio_desde,
        fecha_inicio_hasta,
        client_id,
        tipo_contrato_id,
        estado_contrato_id,
        orderBy = 'created_at',
        orderDir = 'desc'
      } = req.query
      
      const filters = {
        numero_contrato,
        fecha_inicio_desde,
        fecha_inicio_hasta,
        client_id,
        tipo_contrato_id,
        estado_contrato_id
      }
      
      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key]
      })
      
      const result = await this.listUseCase.execute({
        clienteId,
        filters,
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDir
      })
      
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      })
    } catch (error) {
      next(error)
    }
  }
  
  async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const contractData = ContractDTO.fromRequest(req.body)
      
      const result = await this.updateUseCase.execute({
        contractId: id,
        contractData,
        clienteId
      })
      
      res.json({
        success: true,
        data: result,
        message: 'Contrato actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
```

#### Presentation/Routes/contractRoutes.js
```javascript
import express from 'express'
import { ContractController } from '../controllers/ContractController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Inyección de dependencias (en producción usar un container)
import { SupabaseContractRepository } from '../../infrastructure/repositories/SupabaseContractRepository.js'
import { CreateContractUseCase } from '../../application/useCases/contracts/CreateContractUseCase.js'
import { GetContractUseCase } from '../../application/useCases/contracts/GetContractUseCase.js'
import { ListContractsUseCase } from '../../application/useCases/contracts/ListContractsUseCase.js'
import { UpdateContractUseCase } from '../../application/useCases/contracts/UpdateContractUseCase.js'

// Crear instancias
const contractRepository = new SupabaseContractRepository()
const createUseCase = new CreateContractUseCase(contractRepository)
const getUseCase = new GetContractUseCase(contractRepository)
const listUseCase = new ListContractsUseCase(contractRepository)
const updateUseCase = new UpdateContractUseCase(contractRepository)

const contractController = new ContractController({
  createContractUseCase: createUseCase,
  getContractUseCase: getUseCase,
  listContractsUseCase: listUseCase,
  updateContractUseCase: updateUseCase
})

// Rutas
router.get('/', authMiddleware, (req, res, next) => 
  contractController.list(req, res, next)
)

router.get('/:id', authMiddleware, (req, res, next) => 
  contractController.getById(req, res, next)
)

router.post('/', authMiddleware, (req, res, next) => 
  contractController.create(req, res, next)
)

router.put('/:id', authMiddleware, (req, res, next) => 
  contractController.update(req, res, next)
)

export default router
```

#### Presentation/Middleware/errorHandler.js (Mejorado)
```javascript
import { ValidationError, BusinessRuleError } from '../../domain/errors/DomainError.js'

export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error)
  
  // Errores de dominio
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    })
  }
  
  if (error instanceof BusinessRuleError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUSINESS_RULE_ERROR',
        message: error.message
      }
    })
  }
  
  // Errores de infraestructura
  if (error.message?.includes('Error al')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    })
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  })
}
```

## 🎯 Ventajas de esta Arquitectura

### ✅ **Testabilidad**
```javascript
// Test de Use Case (sin base de datos)
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn()
}

const useCase = new CreateContractUseCase(mockRepository)
// Test fácil y rápido
```

### ✅ **Independencia de Framework**
- Puedes cambiar Express por Fastify, NestJS, etc.
- La lógica de negocio no cambia

### ✅ **Reutilización**
- Los Use Cases pueden usarse desde CLI, GraphQL, gRPC, etc.

### ✅ **Mantenibilidad**
- Cada capa tiene responsabilidad única
- Fácil de entender y modificar

## 🚀 ¿Quieres que lo implemente?

Puedo:
1. ✅ **Crear la estructura completa** en tu proyecto
2. ✅ **Migrar un módulo** (ej: Contratos) como ejemplo
3. ✅ **Crear solo la base** para que migres gradualmente

¿Qué prefieres?


