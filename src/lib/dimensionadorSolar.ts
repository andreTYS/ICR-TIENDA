// Motor de dimensionamiento solar — puerto fiel de las fórmulas de
// "Dimensionador_Solar_ICR_Pro.xlsx" (hoja Dimensionamiento) a TypeScript,
// para la calculadora pública de la tienda. Las constantes de abajo son
// exactamente los valores por defecto de la hoja "Parámetros" del Excel.
//
// Simplificaciones deliberadas frente al Excel (pensadas para un visitante
// público, no para el presupuesto interno — ese sigue viviendo en el Excel
// / en Cotizaciones del ERP):
//  - Un solo método de consumo (pago del recibo), no el formulario de
//    equipos por horas.
//  - Cobertura diurna siempre 100% (el Excel permite bajarla; acá no tiene
//    sentido pedirle ese dial a un visitante).
//  - Días de autonomía HÍBRIDO fijos en 1 día y OFF-GRID en 1.5 días
//    (constantes del Excel), no editables — mantiene el formulario corto.
//  - DoD de batería fijo en 0.9 (litio), porque el catálogo real que se
//    sugiere prioriza baterías de litio.

export const HSP_ZONAS: Record<string, number> = {
  Arequipa: 5.5,
  Moquegua: 5.5,
  Tacna: 5,
  Puno: 5,
  Lima: 4,
  Otro: 4.5,
}

export const ZONAS = Object.keys(HSP_ZONAS)

const PR = 0.78 // performance ratio (Parámetros!B6)
const EFICIENCIA_BATERIA = 0.9 // Parámetros!B7
const FACTOR_SEGURIDAD_INVERSOR = 1.25 // Parámetros!B8
const DC_AC_MAXIMO = 1.3 // Parámetros!B10
const FACTOR_REAL_VS_PLACA = 0.8 // Parámetros!B11
const DIAS_MES = 30 // Parámetros!B13
const KWP_REFERENCIA_PERFIL = 24.2 // Parámetros!B14
// Perfil horario de producción (Parámetros!F18:F27), en kW a KWP_REFERENCIA_PERFIL
const PERFIL_HORARIO_KW = [6, 11, 15, 19, 22, 24, 20, 16, 11, 6]
const AUTONOMIA_HIBRIDO_DIAS = 1
const AUTONOMIA_OFFGRID_DIAS = 1.5
const DOD_BATERIA = 0.9

export type TipoSistema = 'ON-GRID' | 'HIBRIDO' | 'OFF-GRID'
export const TIPOS_SISTEMA: TipoSistema[] = ['ON-GRID', 'HIBRIDO', 'OFF-GRID']

export interface InputsCalculadora {
  zona: string
  pagoRecibo: number // S/, con IGV (Datos!B24)
  tarifaSinIgv: number // S/ por kWh (Datos!B27)
  igv: number // Parámetros!B5
  porcentajeConsumoDia: number // 0–1 (Datos!B28)
  potenciaPicoCargas: number // kW (Datos!B29)
  panelWp: number // Wp del panel elegido (Datos!B16 → Catálogo)
}

export interface ResultadoVariante {
  tipo: TipoSistema
  energiaMensualKwh: number
  kwpPaneles: number
  cantidadPaneles: number
  potenciaInversorMinKw: number
  bateriaKwhRequerida: number
  recortePct: number
  generacionUtilKwhMes: number
  coberturaPct: number
  ahorroMensual: number
  ahorroAnual: number
}

// Datos!C5 (rama RECIBO S/): (pago − cargos no energéticos) ÷ (1+IGV) ÷ tarifa.
// Se omiten los "cargos no energéticos" (Datos!B25) para no pedirle ese dato
// a un visitante — el Excel los resta cuando existen; acá quedan en 0.
function energiaMensualKwh(inputs: Pick<InputsCalculadora, 'pagoRecibo' | 'igv' | 'tarifaSinIgv'>): number {
  if (inputs.tarifaSinIgv <= 0) return 0
  return inputs.pagoRecibo / (1 + inputs.igv) / inputs.tarifaSinIgv
}

function fraccionRecorte(kwpPaneles: number, inversorKw: number): number {
  if (inversorKw <= 0 || kwpPaneles <= 0) return 0
  let perdida = 0
  let total = 0
  for (const kwHora of PERFIL_HORARIO_KW) {
    const fraccion = kwHora / KWP_REFERENCIA_PERFIL
    const generado = fraccion * kwpPaneles * FACTOR_REAL_VS_PLACA
    total += generado
    if (generado > inversorKw) perdida += generado - inversorKw
  }
  return total > 0 ? perdida / total : 0
}

export function calcularVariante(tipo: TipoSistema, inputs: InputsCalculadora): ResultadoVariante {
  const hsp = HSP_ZONAS[inputs.zona] ?? HSP_ZONAS.Otro
  const energiaMensual = energiaMensualKwh(inputs)
  const energiaDiaria = energiaMensual / DIAS_MES
  const energiaDia = energiaDiaria * inputs.porcentajeConsumoDia
  const energiaNoche = energiaDiaria - energiaDia

  const coberturaNocturna = tipo === 'ON-GRID' ? 0 : 1 // HÍBRIDO y OFF-GRID cubren el 100% de la noche
  const energiaDiurnaCubrir = energiaDia
  const energiaNocturnaCubrir = energiaNoche * coberturaNocturna
  const energiaAProducir = energiaDiurnaCubrir + energiaNocturnaCubrir / EFICIENCIA_BATERIA

  const wpRequerido = hsp * PR > 0 ? (energiaAProducir * 1000) / (hsp * PR) : 0
  const cantidadPaneles = inputs.panelWp > 0 ? Math.max(1, Math.ceil(wpRequerido / inputs.panelWp)) : 0
  const kwpPaneles = (cantidadPaneles * inputs.panelWp) / 1000
  const generacionSinRecorte = kwpPaneles * hsp * PR * DIAS_MES

  const potenciaMinPorDcAc = kwpPaneles / DC_AC_MAXIMO
  const potenciaMinPorPico = tipo === 'ON-GRID' ? 0 : inputs.potenciaPicoCargas * FACTOR_SEGURIDAD_INVERSOR
  const potenciaInversorMinKw = Math.max(potenciaMinPorDcAc, potenciaMinPorPico)

  const recortePct = fraccionRecorte(kwpPaneles, potenciaInversorMinKw)
  const generacionUtil = generacionSinRecorte * (1 - recortePct)

  const diasAutonomia = tipo === 'ON-GRID' ? 0 : tipo === 'HIBRIDO' ? AUTONOMIA_HIBRIDO_DIAS : AUTONOMIA_OFFGRID_DIAS
  const bateriaKwhRequerida = tipo === 'ON-GRID' ? 0 : (energiaNocturnaCubrir * diasAutonomia) / DOD_BATERIA

  const energiaCubrirMensual = (energiaDiurnaCubrir + energiaNocturnaCubrir) * DIAS_MES
  const energiaAprovechada = Math.min(generacionUtil, energiaCubrirMensual)
  const coberturaPct = energiaMensual > 0 ? energiaAprovechada / energiaMensual : 0
  const ahorroMensual = energiaAprovechada * inputs.tarifaSinIgv * (1 + inputs.igv)
  const ahorroAnual = ahorroMensual * 12

  return {
    tipo,
    energiaMensualKwh: energiaMensual,
    kwpPaneles,
    cantidadPaneles,
    potenciaInversorMinKw,
    bateriaKwhRequerida,
    recortePct,
    generacionUtilKwhMes: generacionUtil,
    coberturaPct,
    ahorroMensual,
    ahorroAnual,
  }
}

export function calcularTresVariantes(inputs: InputsCalculadora): Record<TipoSistema, ResultadoVariante> {
  return {
    'ON-GRID': calcularVariante('ON-GRID', inputs),
    HIBRIDO: calcularVariante('HIBRIDO', inputs),
    'OFF-GRID': calcularVariante('OFF-GRID', inputs),
  }
}
