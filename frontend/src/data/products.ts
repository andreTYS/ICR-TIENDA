export type SolucionId = 'respaldo' | 'autoconsumo' | 'offgrid' | 'monitoreo'

export interface Producto {
  id: string
  marca: string
  cat: string
  sku: string
  nombre: string
  spec: string
  precio: number
  stock: string
  b2b: boolean
  desc: string
  specs: [string, string][]
  soluciones: SolucionId[]
  destacado?: boolean
  masVendido?: boolean
  vendidos?: number
}

export const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE')

export const SOLUCIONES: { id: SolucionId; nombre: string; desc: string; meta: string }[] = [
  {
    id: 'respaldo',
    nombre: 'Respaldo energético',
    desc: 'Continuidad de cargas críticas ante falla o inestabilidad de red.',
    meta: 'Baterías · Híbridos · Transferencia',
  },
  {
    id: 'autoconsumo',
    nombre: 'Autoconsumo en red',
    desc: 'Reducción de factura con generación solar conectada y medición bidireccional.',
    meta: 'On-grid · Medidores · Estructura',
  },
  {
    id: 'offgrid',
    nombre: 'Sistemas off-grid y on-grid',
    desc: 'Energía donde la red no llega, y generación conectada donde sí: telecom, agro, obra y zonas aisladas.',
    meta: 'Aislado · Bancos · Controladores',
  },
  {
    id: 'monitoreo',
    nombre: 'Monitoreo y calidad',
    desc: 'Medición, alarmas y control de planta para operar con datos.',
    meta: 'Datahub · Sensores · Analítica',
  },
]

export const PRODUCTOS: Producto[] = [
  {
    id: 'deye8k',
    marca: 'Deye',
    cat: 'Inversor',
    sku: 'SUN-8K-SG04LP3',
    nombre: 'Inversor híbrido Deye SUN-8K-SG04LP3-EU',
    spec: '8 kW · Trifásico · 2 MPPT',
    precio: 7900,
    stock: 'Disponible',
    b2b: true,
    desc: 'Inversor híbrido trifásico para autoconsumo con respaldo. Gestiona generación solar, banco de baterías y red en un solo equipo, con conmutación automática ante falla de red.',
    specs: [
      ['Potencia nominal', '8 kW'],
      ['Configuración', 'Trifásica 220/380 Vac'],
      ['MPPT', '2 independientes'],
      ['Tensión batería', '48 Vdc'],
      ['Eficiencia máx.', '97,6 %'],
      ['Protección', 'IP65'],
      ['Garantía', '5 años'],
    ],
    soluciones: ['respaldo', 'autoconsumo', 'offgrid'],
    destacado: true,
    masVendido: true,
    vendidos: 214,
  },
  {
    id: 'growatt15k',
    marca: 'Growatt',
    cat: 'Inversor',
    sku: 'MID-15KTL3-X',
    nombre: 'Inversor on-grid Growatt MID 15KTL3-X',
    spec: '15 kW · 2 MPPT · Wifi',
    precio: 8400,
    stock: 'Disponible',
    b2b: true,
    desc: 'Inversor trifásico on-grid de 15 kW para cubiertas industriales y comerciales, con monitoreo remoto integrado y limitación de exportación.',
    specs: [
      ['Potencia nominal', '15 kW'],
      ['MPPT', '2'],
      ['Strings', '4'],
      ['Eficiencia máx.', '98,4 %'],
      ['Monitoreo', 'Wifi / LAN'],
      ['Protección', 'IP66'],
      ['Garantía', '10 años'],
    ],
    soluciones: ['autoconsumo'],
    destacado: true,
    vendidos: 96,
  },
  {
    id: 'hoymiles',
    marca: 'Hoymiles',
    cat: 'Microinversor',
    sku: 'HMS-2000-4T',
    nombre: 'Microinversor Hoymiles HMS-2000-4T',
    spec: '2 kW · 4 módulos · Monofásico',
    precio: 1290,
    stock: 'Disponible',
    b2b: false,
    desc: 'Microinversor de cuatro entradas para instalaciones residenciales y pequeños negocios, con seguimiento por módulo y sin punto único de falla.',
    specs: [
      ['Potencia nominal', '2 kW'],
      ['Entradas', '4 módulos'],
      ['Configuración', 'Monofásica 220 Vac / 60 Hz'],
      ['Monitoreo', 'Por módulo'],
      ['Protección', 'IP67'],
      ['Garantía', '12 años'],
    ],
    soluciones: ['autoconsumo'],
    masVendido: true,
    vendidos: 301,
  },
  {
    id: 'pylontech',
    marca: 'Pylontech',
    cat: 'Batería',
    sku: 'US5000',
    nombre: 'Batería Pylontech US5000 LiFePO4',
    spec: '4,8 kWh · 48 Vdc · Rack',
    precio: 5600,
    stock: 'Disponible',
    b2b: false,
    desc: 'Módulo de almacenamiento LiFePO4 para rack, apilable hasta 15 unidades en paralelo, con BMS integrado y comunicación CAN/RS485.',
    specs: [
      ['Capacidad', '4,8 kWh'],
      ['Tensión', '48 Vdc'],
      ['Química', 'LiFePO4'],
      ['Ciclos', '≥ 6.000 al 80 % DoD'],
      ['Comunicación', 'CAN / RS485'],
      ['Garantía', '10 años'],
    ],
    soluciones: ['respaldo', 'offgrid'],
    destacado: true,
    masVendido: true,
    vendidos: 178,
  },
  {
    id: 'deyebos',
    marca: 'Deye',
    cat: 'Batería',
    sku: 'BOS-G-5KW',
    nombre: 'Batería Deye BOS-G 5 kW alta tensión',
    spec: '5 kWh · Alta tensión · Modular',
    precio: 6200,
    stock: '3 semanas',
    b2b: true,
    desc: 'Módulo de alta tensión para bancos escalables en proyectos comerciales e industriales, compatible con inversores híbridos Deye HV.',
    specs: [
      ['Capacidad', '5 kWh'],
      ['Arquitectura', 'Alta tensión modular'],
      ['Módulos en serie', 'hasta 8'],
      ['Química', 'LiFePO4'],
      ['Garantía', '10 años'],
    ],
    soluciones: ['respaldo', 'offgrid'],
    vendidos: 54,
  },
  {
    id: 'dyness',
    marca: 'Dyness',
    cat: 'Batería',
    sku: 'PBX-15K',
    nombre: 'Banco Dyness PowerBox 15 kWh HV',
    spec: '15 kWh · Alta tensión · Gabinete',
    precio: 16500,
    stock: 'Bajo pedido',
    b2b: true,
    desc: 'Gabinete de almacenamiento de 15 kWh para respaldo de cargas críticas en instituciones, salud y minería del sur del Perú.',
    specs: [
      ['Capacidad', '15 kWh'],
      ['Arquitectura', 'Alta tensión'],
      ['Gabinete', 'Interior / exterior IP55'],
      ['Química', 'LiFePO4'],
      ['Garantía', '10 años'],
    ],
    soluciones: ['respaldo', 'offgrid'],
    vendidos: 21,
  },
  {
    id: 'jinko',
    marca: 'Jinko Solar',
    cat: 'Panel solar',
    sku: 'JKM580N-72HL4',
    nombre: 'Panel Jinko Tiger Neo 580 W bifacial',
    spec: '580 Wp · N-Type · Bifacial',
    precio: 590,
    stock: 'Disponible',
    b2b: false,
    desc: 'Módulo N-Type de 580 Wp con vidrio-vidrio bifacial, alto rendimiento bajo la radiación elevada del sur peruano y degradación anual reducida.',
    specs: [
      ['Potencia', '580 Wp'],
      ['Tecnología', 'N-Type TOPCon'],
      ['Eficiencia', '22,6 %'],
      ['Construcción', 'Vidrio-vidrio bifacial'],
      ['Garantía producto', '25 años'],
      ['Garantía potencia', '30 años'],
    ],
    soluciones: ['autoconsumo', 'offgrid', 'respaldo'],
    destacado: true,
    masVendido: true,
    vendidos: 412,
  },
  {
    id: 'k2rail',
    marca: 'K2 Systems',
    cat: 'Estructura',
    sku: 'K2-RAIL-44',
    nombre: 'Riel de aluminio K2 Systems 4,4 m',
    spec: 'Aluminio 6005A · Cubierta metálica',
    precio: 185,
    stock: 'Disponible',
    b2b: false,
    desc: 'Riel estructural de aluminio para montaje sobre cubierta metálica, calculado para cargas de viento y sismo según E.020 / E.030 del RNE.',
    specs: [
      ['Longitud', '4,4 m'],
      ['Material', 'Aluminio 6005A T6'],
      ['Acabado', 'Anodizado'],
      ['Aplicación', 'Cubierta metálica / teja'],
      ['Garantía', '10 años'],
    ],
    soluciones: ['autoconsumo', 'offgrid'],
    vendidos: 88,
  },
  {
    id: 'smartlogger',
    marca: 'Huawei',
    cat: 'Monitoreo',
    sku: 'SMARTLOGGER-3000A',
    nombre: 'Huawei SmartLogger 3000A control de planta',
    spec: 'Hasta 80 inversores · Modbus',
    precio: 1450,
    stock: 'Disponible',
    b2b: true,
    desc: 'Controlador de planta para monitoreo centralizado, limitación de exportación y reporte de generación en proyectos multi-inversor.',
    specs: [
      ['Equipos', 'hasta 80 inversores'],
      ['Comunicación', 'Modbus RTU / TCP'],
      ['Funciones', 'Export limit, curvas, alarmas'],
      ['Alimentación', '230 Vac'],
      ['Garantía', '2 años'],
    ],
    soluciones: ['monitoreo'],
    destacado: true,
    vendidos: 63,
  },
]

export const CATEGORIAS_COMPONENTE = [
  { nombre: 'Inversor', n: 54 },
  { nombre: 'Batería', n: 16 },
  { nombre: 'Panel solar', n: 7 },
  { nombre: 'Estructura', n: 61 },
  { nombre: 'Accesorios', n: 34 },
]

export const MARCAS = ['DEYE', 'GROWATT', 'HUAWEI', 'JINKO', 'PYLONTECH', 'HOYMILES', 'DYNESS']

export function productoPorId(id: string): Producto | undefined {
  return PRODUCTOS.find((p) => p.id === id)
}
