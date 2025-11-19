/**
 * Parser de fórmulas tipo Excel a JavaScript
 * Soporta: IF, SUM, AVERAGE, MAX, MIN, operadores aritméticos, porcentajes, anidamiento
 */

/**
 * Convierte una fórmula tipo Excel a JavaScript ejecutable
 * @param {string} formula - Fórmula en sintaxis tipo Excel
 * @returns {string} - Fórmula convertida a JavaScript
 */
export function parseExcelFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return '0'
  }

  let expr = formula.trim()
  if (!expr) return '0'

  // Paso 1: Normalizar espacios y comas decimales
  expr = expr.replace(/\s+/g, ' ') // Normalizar espacios múltiples
  expr = expr.replace(/,(\d)/g, '.$1') // Comas decimales a puntos

  // Paso 2: Convertir porcentajes (debe ir antes de otras conversiones)
  // Ej: 2% -> (2/100), -5% -> (-5/100)
  expr = expr.replace(/(-?\d+(?:\.\d+)?)\s*%/g, '($1/100)')

  // Paso 3: Convertir funciones tipo Excel a JavaScript
  // IF(condición, valor_si_verdadero, valor_si_falso) -> condición ? valor_si_verdadero : valor_si_falso
  expr = convertIF(expr)

  // Paso 4: Convertir otras funciones (SUM, AVERAGE, MAX, MIN)
  expr = convertMathFunctions(expr)

  // Paso 5: Asegurar que los operadores de comparación sean válidos
  expr = normalizeOperators(expr)

  return expr
}

/**
 * Convierte funciones IF anidadas de Excel a operadores ternarios de JavaScript
 * Procesa desde el IF más interno hacia el más externo
 */
function convertIF(expr) {
  let result = expr
  let maxIterations = 50
  let iteration = 0

  while (result.includes('IF(') && iteration < maxIterations) {
    iteration++

    // Buscar el IF más interno (el que no tiene otros IF dentro)
    // Usamos un patrón que busca IF seguido de paréntesis y procesa los argumentos
    const ifPattern = /IF\s*\(/gi
    let found = false

    // Resetear lastIndex para evitar problemas con regex global
    ifPattern.lastIndex = 0
    
    let match
    while ((match = ifPattern.exec(result)) !== null) {
      const start = match.index
      const afterIf = start + match[0].length

      // Encontrar los límites de los 3 argumentos contando paréntesis
      let depth = 0
      let i = afterIf
      let conditionEnd = -1
      let trueValueEnd = -1
      let falseValueEnd = -1

      for (; i < result.length; i++) {
        const char = result[i]
        if (char === '(') depth++
        if (char === ')') {
          if (depth === 0) {
            falseValueEnd = i
            break
          }
          depth--
        }
        if (char === ',' && depth === 0) {
          if (conditionEnd === -1) {
            conditionEnd = i
          } else if (trueValueEnd === -1) {
            trueValueEnd = i
          }
        }
      }

      if (conditionEnd > -1 && trueValueEnd > -1 && falseValueEnd > -1) {
        const condition = result.substring(afterIf, conditionEnd).trim()
        const trueValue = result.substring(conditionEnd + 1, trueValueEnd).trim()
        const falseValue = result.substring(trueValueEnd + 1, falseValueEnd).trim()

        // Si este IF no contiene otros IF, procesarlo
        if (!condition.toUpperCase().includes('IF(') && 
            !trueValue.toUpperCase().includes('IF(') && 
            !falseValue.toUpperCase().includes('IF(')) {
          const normalizedCond = normalizeOperators(condition)
          const replacement = `(${normalizedCond} ? ${trueValue} : ${falseValue})`
          result = result.substring(0, start) + replacement + result.substring(falseValueEnd + 1)
          found = true
          break
        }
      }
    }

    if (!found) break
  }

  return result
}

/**
 * Convierte funciones matemáticas tipo Excel (SUM, AVERAGE, MAX, MIN)
 */
function convertMathFunctions(expr) {
  let result = expr

  // SUM(val1, val2, ...) -> (val1 + val2 + ...)
  result = result.replace(/SUM\s*\(([^)]+)\)/gi, (match, args) => {
    const values = args.split(',').map((v) => v.trim())
    return `(${values.join(' + ')})`
  })

  // AVERAGE(val1, val2, ...) -> ((val1 + val2 + ...) / cantidad)
  result = result.replace(/AVERAGE\s*\(([^)]+)\)/gi, (match, args) => {
    const values = args.split(',').map((v) => v.trim())
    const sum = values.join(' + ')
    return `((${sum}) / ${values.length})`
  })

  // MAX(val1, val2, ...) -> Math.max(val1, val2, ...)
  result = result.replace(/MAX\s*\(([^)]+)\)/gi, (match, args) => {
    const values = args.split(',').map((v) => v.trim())
    return `Math.max(${values.join(', ')})`
  })

  // MIN(val1, val2, ...) -> Math.min(val1, val2, ...)
  result = result.replace(/MIN\s*\(([^)]+)\)/gi, (match, args) => {
    const values = args.split(',').map((v) => v.trim())
    return `Math.min(${values.join(', ')})`
  })

  return result
}

/**
 * Normaliza operadores de comparación y aritméticos
 */
function normalizeOperators(expr) {
  let result = expr

  // Asegurar espacios alrededor de operadores de comparación
  result = result.replace(/([^<>=!])([<>=!]+)([^<>=!=])/g, '$1 $2 $3')
  result = result.replace(/([^<>=!])([<>=!]+)([^<>=!=])/g, '$1 $2 $3') // Segunda pasada

  // Normalizar operadores específicos
  result = result.replace(/\s*==\s*/g, ' === ')
  result = result.replace(/\s*!=\s*/g, ' !== ')
  result = result.replace(/\s*<=\s*/g, ' <= ')
  result = result.replace(/\s*>=\s*/g, ' >= ')
  result = result.replace(/\s*<\s*/g, ' < ')
  result = result.replace(/\s*>\s*/g, ' > ')

  // Limpiar espacios múltiples
  result = result.replace(/\s+/g, ' ')

  return result.trim()
}

/**
 * Detecta y corrige errores de escritura en nombres de funciones
 * @param {string} texto - Texto que puede contener un nombre de función
 * @returns {string} - Nombre de función corregido o el texto original
 */
function corregirNombreFuncion(texto) {
  const funcionesSoportadas = ['IF', 'SUM', 'AVERAGE', 'MAX', 'MIN']
  const textoUpper = texto.toUpperCase()

  // Si ya es una función válida, retornarla
  if (funcionesSoportadas.includes(textoUpper)) {
    return textoUpper
  }

  // Casos especiales: detectar funciones incompletas o muy mal escritas
  // "I" o variaciones de "IF"
  if (textoUpper === 'I' || (textoUpper.startsWith('I') && textoUpper.length <= 3)) {
    // Si es exactamente "I" o empieza con "I" y tiene máximo 3 caracteres, probablemente es "IF"
    return 'IF'
  }

  // "S" o "SU" probablemente es "SUM"
  if (textoUpper === 'S' || textoUpper === 'SU' || (textoUpper.startsWith('S') && textoUpper.length <= 4)) {
    return 'SUM'
  }

  // "A" o "AV" probablemente es "AVERAGE"
  if (textoUpper === 'A' || textoUpper === 'AV' || (textoUpper.startsWith('AV') && textoUpper.length <= 8)) {
    return 'AVERAGE'
  }

  // "M" probablemente es "MAX" o "MIN" - verificar contexto
  if (textoUpper === 'M' || textoUpper.length <= 4) {
    if (textoUpper.startsWith('MA')) {
      return 'MAX'
    }
    if (textoUpper.startsWith('MI')) {
      return 'MIN'
    }
    // Si solo es "M", asumir "MAX" (más común)
    if (textoUpper === 'M') {
      return 'MAX'
    }
  }

  // Buscar la función más similar usando distancia de Levenshtein
  let mejorCoincidencia = null
  let menorDistancia = Infinity

  for (const funcion of funcionesSoportadas) {
    // Calcular distancia de similitud
    const distancia = calcularSimilitud(textoUpper, funcion)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      mejorCoincidencia = funcion
    }
  }

  // Si la similitud es alta (más del 50% para funciones cortas, 60% para largas), corregir
  const longitudMax = Math.max(textoUpper.length, mejorCoincidencia.length)
  const similitud = longitudMax > 0 ? 1 - menorDistancia / longitudMax : 0

  // Para funciones muy cortas (1-2 caracteres), usar umbral más bajo
  const umbral = textoUpper.length <= 2 ? 0.3 : 0.6

  if (similitud >= umbral) {
    return mejorCoincidencia
  }

  return texto // No corregir si no hay suficiente similitud
}

/**
 * Calcula la similitud entre dos cadenas (distancia de Levenshtein simplificada)
 * @param {string} str1 - Primera cadena
 * @param {string} str2 - Segunda cadena
 * @returns {number} - Distancia (menor = más similar)
 */
function calcularSimilitud(str1, str2) {
  const len1 = str1.length
  const len2 = str2.length

  // Si una cadena es mucho más larga, no es similar
  if (Math.abs(len1 - len2) > 2) {
    return Math.max(len1, len2)
  }

  // Matriz de distancia
  const matrix = []
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  // Calcular distancia
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1, // inserción
          matrix[i - 1][j] + 1, // eliminación
        )
      }
    }
  }

  return matrix[len2][len1]
}

/**
 * Intenta corregir automáticamente una fórmula
 * @param {string} formula - Fórmula original
 * @returns {string} - Fórmula corregida
 */
function corregirFormula(formula) {
  let corregida = formula.trim()

  // PASO 1: Corregir errores de escritura en nombres de funciones
  // Buscar patrones que parezcan funciones (palabra seguida de paréntesis)
  // Usar un patrón más flexible que capture funciones de 1 o más caracteres
  const patronFuncion = /([A-Za-z]{1,20})\s*\(/g
  const funcionesSoportadas = ['IF', 'SUM', 'AVERAGE', 'MAX', 'MIN']
  
  corregida = corregida.replace(patronFuncion, (match, nombreFuncion, offset) => {
    // Verificar que no sea parte de una variable (debe estar al inicio o después de un operador/espacio)
    const antes = offset > 0 ? corregida[offset - 1] : ''
    const esInicioOOperador = offset === 0 || /[\s(,=<>!+\-*\/]/.test(antes)
    
    if (!esInicioOOperador) {
      return match // No es una función, es parte de una variable
    }
    
    const nombreUpper = nombreFuncion.toUpperCase()
    
    // Si ya es una función válida, mantenerla
    if (funcionesSoportadas.includes(nombreUpper)) {
      return nombreUpper + '('
    }
    
    // Buscar la función más similar
    const funcionCorregida = corregirNombreFuncion(nombreFuncion)
    if (funcionCorregida !== nombreFuncion && funcionCorregida !== nombreUpper) {
      return funcionCorregida + '('
    }
    
    return match // No cambiar si no hay coincidencia clara
  })

  // PASO 2: Corregir paréntesis desbalanceados
  const openParens = (corregida.match(/\(/g) || []).length
  const closeParens = (corregida.match(/\)/g) || []).length
  const diferencia = openParens - closeParens

  if (diferencia > 0) {
    // Faltan paréntesis de cierre, agregarlos al final
    corregida += ')'.repeat(diferencia)
  } else if (diferencia < 0) {
    // Hay paréntesis de cierre de más, intentar remover los últimos
    let removidos = 0
    while (removidos < Math.abs(diferencia) && corregida.endsWith(')')) {
      corregida = corregida.slice(0, -1)
      removidos++
    }
  }

  // PASO 3: Asegurar espacios alrededor de operadores de comparación
  corregida = corregida.replace(/([^<>=!])([<>=!]+)([^<>=!=])/g, '$1 $2 $3')
  corregida = corregida.replace(/([^<>=!])([<>=!]+)([^<>=!=])/g, '$1 $2 $3') // Segunda pasada

  // PASO 4: Normalizar espacios múltiples
  corregida = corregida.replace(/\s+/g, ' ').trim()

  return corregida
}

/**
 * Analiza un error y proporciona sugerencias de corrección
 * @param {Error} error - Error capturado
 * @param {string} formula - Fórmula original
 * @param {object} context - Contexto con variables disponibles
 * @returns {object} - Objeto con mensaje y fórmula corregida
 */
function getErrorSuggestion(error, formula, context = {}) {
  const errorMsg = error.message.toLowerCase()
  const suggestions = []

  // Verificar paréntesis balanceados
  const openParens = (formula.match(/\(/g) || []).length
  const closeParens = (formula.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    suggestions.push(
      `Paréntesis desbalanceados: tienes ${openParens} aperturas y ${closeParens} cierres. Asegúrate de cerrar todos los paréntesis.`,
    )
  }

  // Verificar funciones no reconocidas
  const unsupportedFunctions = formula.match(/\b(ABS|ROUND|CEILING|FLOOR|POWER|SQRT|LOG|LN|EXP|MOD|RAND|RANDBETWEEN|COUNT|COUNTA|COUNTIF|SUMIF|VLOOKUP|HLOOKUP|INDEX|MATCH|CONCATENATE|LEFT|RIGHT|MID|LEN|UPPER|LOWER|TRIM|SUBSTITUTE|REPLACE|FIND|SEARCH|DATE|TIME|NOW|TODAY|YEAR|MONTH|DAY|HOUR|MINUTE|SECOND|WEEKDAY|WEEKNUM|DAYS|NETWORKDAYS|EDATE|EOMONTH|DATEDIF|TEXT|VALUE|NUMBERVALUE|ISNUMBER|ISTEXT|ISBLANK|ISERROR|IFERROR|AND|OR|NOT|TRUE|FALSE)\s*\(/gi)
  if (unsupportedFunctions) {
    const funcs = [...new Set(unsupportedFunctions.map((f) => f.replace(/\s*\(/gi, '')))]
    suggestions.push(
      `Funciones no soportadas detectadas: ${funcs.join(', ')}. Solo se soportan: IF, SUM, AVERAGE, MAX, MIN.`,
    )
  }

  // Verificar sintaxis de IF
  if (formula.toUpperCase().includes('IF(')) {
    const ifCount = (formula.match(/IF\s*\(/gi) || []).length
    const commaCount = (formula.match(/,/g) || []).length
    if (ifCount > 0 && commaCount < ifCount * 2) {
      suggestions.push(
        `La función IF requiere 3 argumentos separados por comas: IF(condición, valor_si_verdadero, valor_si_falso). Verifica que todas las funciones IF tengan sus 3 argumentos.`,
      )
    }
  }

  // Verificar variables no definidas - puede ser error de escritura en función
  if (errorMsg.includes('is not defined') || errorMsg.includes('undefined')) {
    const varMatch = errorMsg.match(/(\w+)\s+is not defined/i)
    if (varMatch) {
      const varName = varMatch[1]
      const funcionesSoportadas = ['IF', 'SUM', 'AVERAGE', 'MAX', 'MIN']
      const varNameUpper = varName.toUpperCase()
      
      // Verificar si es un error de escritura en una función
      // Primero intentar corregir directamente
      const funcionCorregida = corregirNombreFuncion(varName)
      const esFuncionMalEscrita = funcionCorregida !== varName && funcionCorregida !== varName.toUpperCase()
      
      if (esFuncionMalEscrita) {
        suggestions.push(
          `Error de escritura detectado: "${varName}" parece ser un error de escritura de la función "${funcionCorregida}". Las funciones deben escribirse en mayúsculas: IF, SUM, AVERAGE, MAX, MIN.`,
        )
      } else {
        // Es una variable, no una función
        const availableVars = Object.keys(context).length > 0 
          ? Object.keys(context).join(', ')
          : 'ninguna variable disponible'
        suggestions.push(
          `Variable "${varName}" no está definida. Variables disponibles: ${availableVars}. Verifica que escribiste correctamente el nombre de la variable.`,
        )
      }
    }
  }

  // Verificar sintaxis general
  if (errorMsg.includes('unexpected') || errorMsg.includes('syntax')) {
    suggestions.push(
      `Error de sintaxis detectado. Verifica: 1) Todos los paréntesis están cerrados, 2) Las comas separan correctamente los argumentos, 3) Los operadores tienen espacios adecuados (ej: precio_venta > 200), 4) Los porcentajes usan el símbolo % (ej: 2%).`,
    )
  }

  // Verificar operadores
  if (errorMsg.includes('operator') || errorMsg.includes('operador')) {
    suggestions.push(
      `Error con operadores. Usa: > (mayor que), < (menor que), >= (mayor o igual), <= (menor o igual), == (igual), != (diferente), + (suma), - (resta), * (multiplicación), / (división).`,
    )
  }

  // Generar fórmula corregida
  const formulaCorregida = corregirFormula(formula)

  // Mensaje base
  let message = `Error al evaluar la fórmula: ${error.message}`
  if (suggestions.length > 0) {
    message += '\n\nSugerencias de corrección:\n' + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
  } else {
    message +=
      '\n\nSugerencias generales:\n1. Verifica que la sintaxis sea tipo Excel (IF, SUM, AVERAGE, MAX, MIN)\n2. Asegúrate de que todos los paréntesis estén balanceados\n3. Usa comas para separar argumentos de funciones\n4. Los porcentajes deben usar el símbolo % (ej: 2%)\n5. Verifica que los nombres de variables coincidan exactamente con los disponibles'
  }

  // Agregar fórmula corregida al final (siempre que haya una corrección)
  if (formulaCorregida) {
    message += `\n\n##Fórmula corregida: ${formulaCorregida}`
  }

  return { message, formulaCorregida }
}

/**
 * Evalúa una fórmula tipo Excel con un contexto de variables
 * @param {string} formula - Fórmula en sintaxis tipo Excel
 * @param {object} context - Objeto con las variables disponibles
 * @returns {number} - Resultado numérico
 * @throws {Error} - Error con sugerencias de corrección
 */
export function evaluateExcelFormula(formula, context = {}) {
  try {
    if (!formula || typeof formula !== 'string') {
      throw new Error('La fórmula debe ser un texto válido')
    }

    const trimmedFormula = formula.trim()
    if (!trimmedFormula) {
      throw new Error('La fórmula no puede estar vacía')
    }

    // Intentar corregir errores de escritura antes de parsear
    let formulaACorregir = trimmedFormula
    const formulaCorregidaPrevia = corregirFormula(trimmedFormula)
    
    // Si la fórmula fue corregida, usar la versión corregida
    if (formulaCorregidaPrevia !== trimmedFormula) {
      formulaACorregir = formulaCorregidaPrevia
    }

    // Convertir fórmula Excel a JavaScript
    const jsExpression = parseExcelFormula(formulaACorregir)

    // Validar que la expresión convertida no esté vacía
    if (!jsExpression || jsExpression.trim() === '0') {
      throw new Error('La fórmula no pudo ser convertida correctamente')
    }

    // Crear función que evalúa la expresión con el contexto
    const fn = new Function(
      'ctx',
      `
      with(ctx) {
        return ${jsExpression};
      }
    `,
    )

    const result = fn(context)

    // Asegurar que el resultado sea numérico
    const num = Number(result)
    if (Number.isNaN(num)) {
      throw new Error('El resultado no es numérico')
    }

    return num
  } catch (error) {
    // Proporcionar sugerencias de corrección (pasar el contexto)
    const { message, formulaCorregida } = getErrorSuggestion(error, formula, context)
    const errorConCorreccion = new Error(message)
    // Agregar la fórmula corregida como propiedad del error para acceso fácil
    errorConCorreccion.formulaCorregida = formulaCorregida
    throw errorConCorreccion
  }
}

