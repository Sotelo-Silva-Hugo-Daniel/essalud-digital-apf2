export const specialties = ['Medicina General', 'Medicina Familiar']
export const doctors = [
  { id: 'carlos-perez', name: 'Dr. Carlos Pérez', specialty: 'Medicina General', rating: '4.9', opinions: 124, available: 'Mañana disponible', initials: 'CP', tone: 'blue' },
  { id: 'ana-torres', name: 'Dra. Ana Torres', specialty: 'Medicina General', rating: '4.8', opinions: 98, available: '16 de julio', initials: 'AT', tone: 'peach' },
  { id: 'carmen-flores', name: 'Dra. Carmen Flores', specialty: 'Medicina Familiar', rating: '4.9', opinions: 83, available: 'Hoy disponible', initials: 'CF', tone: 'mint' },
]
export const dates = [{ id: '13', weekday: 'Dom', day: '13' }, { id: '14', weekday: 'Lun', day: '14' }, { id: '15', weekday: 'Mar', day: '15' }, { id: '16', weekday: 'Mié', day: '16' }, { id: '17', weekday: 'Jue', day: '17' }, { id: '18', weekday: 'Vie', day: '18' }, { id: '19', weekday: 'Sáb', day: '19' }]
export const times = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM']
export const formatDate = date => date ? `Martes ${date.day} de julio de 2025` : ''
