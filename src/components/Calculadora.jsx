import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'
import './Calculadora.css'

function Calculadora({ user, userInfo, loadingUserInfo }) {
  const [numero1, setNumero1] = useState('')
  const [numero2, setNumero2] = useState('')
  const [numero3, setNumero3] = useState('')
  const [operacion, setOperacion] = useState('suma')
  const [resultado, setResultado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState(null)

  const operaciones = {
    suma: (a, b, c) => a + b + c,
    resta: (a, b, c) => a - b - c,
    multiplicacion: (a, b, c) => a * b * c,
    division: (a, b, c) => {
      if (b === 0 || c === 0) return 'Error: División por cero'
      return (a / b) / c
    },
    promedio: (a, b, c) => (a + b + c) / 3,
    maximo: (a, b, c) => Math.max(a, b, c),
    minimo: (a, b, c) => Math.min(a, b, c),
  }

  const calcular = async () => {
    if (loadingUserInfo) {
      setMensajeGuardado('Cargando información del usuario, intenta nuevamente en unos segundos')
      return
    }

    if (!userInfo?.clienteId) {
      setMensajeGuardado('No se encontró la entidad del usuario. Verifica la configuración en la tabla usuarios.')
      return
    }

    const n1 = parseFloat(numero1)
    const n2 = parseFloat(numero2)
    const n3 = parseFloat(numero3)

    if (isNaN(n1) || isNaN(n2) || isNaN(n3)) {
      setResultado('Por favor, ingresa números válidos')
      return
    }

    const calcularOperacion = operaciones[operacion]
    const resultadoCalculado = calcularOperacion(n1, n2, n3)
    
    // Formatear el resultado
    let resultadoFormateado
    if (typeof resultadoCalculado === 'number') {
      resultadoFormateado = resultadoCalculado.toFixed(2)
    } else {
      resultadoFormateado = resultadoCalculado.toString()
    }
    
    setResultado(resultadoFormateado)
    
    // Guardar en Supabase
    await guardarCalculo(n1, n2, n3, operacion, resultadoFormateado)
  }

  const guardarCalculo = async (n1, n2, n3, operacion, resultado) => {
    setGuardando(true)
    setMensajeGuardado(null)

    try {
      if (!userInfo?.clienteId) {
        throw new Error('El usuario no tiene cliente asignado')
      }

      const { data, error } = await supabase
        .from('calculos')
        .insert([
          {
            numero1: n1,
            numero2: n2,
            numero3: n3,
            operacion: operacion,
            resultado: resultado.toString(),
            user_id: user.id,
            cliente_id: userInfo.clienteId
          }
        ])
        .select()

      if (error) {
        console.error('Error al guardar:', error)
        setMensajeGuardado('Error al guardar el cálculo')
      } else {
        setMensajeGuardado('✓ Cálculo guardado exitosamente')
        setTimeout(() => setMensajeGuardado(null), 3000)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      setMensajeGuardado('Error al guardar el cálculo')
    } finally {
      setGuardando(false)
    }
  }

  const limpiar = () => {
    setNumero1('')
    setNumero2('')
    setNumero3('')
    setOperacion('suma')
    setResultado(null)
  }

  return (
    <div className="calculadora-wrapper">
      <div className="calculadora-container">
        <h2>Realiza tus Cálculos</h2>

        {loadingUserInfo && (
          <div className="mensaje info">
            Cargando información de tu entidad...
          </div>
        )}

        {!loadingUserInfo && !userInfo?.clienteId && (
          <div className="mensaje error">
            No se pudo identificar tu entidad. Contacta al administrador.
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="numero1">Primer Número:</label>
          <input
            id="numero1"
            type="number"
            value={numero1}
            onChange={(e) => setNumero1(e.target.value)}
            placeholder="Ingresa el primer número"
          />
        </div>

        <div className="form-group">
          <label htmlFor="numero2">Segundo Número:</label>
          <input
            id="numero2"
            type="number"
            value={numero2}
            onChange={(e) => setNumero2(e.target.value)}
            placeholder="Ingresa el segundo número"
          />
        </div>

        <div className="form-group">
          <label htmlFor="numero3">Tercer Número:</label>
          <input
            id="numero3"
            type="number"
            value={numero3}
            onChange={(e) => setNumero3(e.target.value)}
            placeholder="Ingresa el tercer número"
          />
        </div>

        <div className="form-group">
          <label htmlFor="operacion">Operación:</label>
          <select
            id="operacion"
            value={operacion}
            onChange={(e) => setOperacion(e.target.value)}
          >
            <option value="suma">Suma (+)</option>
            <option value="resta">Resta (-)</option>
            <option value="multiplicacion">Multiplicación (×)</option>
            <option value="division">División (÷)</option>
            <option value="promedio">Promedio</option>
            <option value="maximo">Máximo</option>
            <option value="minimo">Mínimo</option>
          </select>
        </div>

        <div className="buttons">
          <button 
            onClick={calcular} 
            className="btn-calculate"
            disabled={guardando || loadingUserInfo || !userInfo?.clienteId}
          >
            {guardando ? 'Guardando...' : 'Calcular'}
          </button>
          <button onClick={limpiar} className="btn-clear">
            Limpiar
          </button>
        </div>

        {mensajeGuardado && (
          <div className={`mensaje ${mensajeGuardado.includes('Error') ? 'error' : 'exito'}`}>
            {mensajeGuardado}
          </div>
        )}

        {resultado !== null && (
          <div className="result">
            <h2>Resultado:</h2>
            <p className="result-value">{resultado}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Calculadora
