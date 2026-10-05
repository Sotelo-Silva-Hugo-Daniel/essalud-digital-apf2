import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
export function Logo() { return <span className="brand"><span className="brand-mark">+</span><span>EsSalud</span><em>Digital</em></span> }
export function AppHeader() { const navigate = useNavigate(); const { user, logout } = useAuth(); return <header className="app-header"><Link to="/inicio" aria-label="Ir al inicio"><Logo /></Link><div className="header-actions"><span>Hola, {user?.name}</span><button type="button">Ayuda</button><button onClick={() => { logout(); navigate('/login') }}>Salir</button></div></header> }
export function BackLink({ to = '/inicio', children = 'Volver' }) { return <Link className="back-link" to={to}>← {children}</Link> }
export function Progress({ step }) { return <div className="progress" aria-label={`Paso ${step} de 5`}><div className="progress-meta"><b>PASO {step} DE 5</b><span>{step * 20}% completado</span></div><div className="progress-bars">{[1,2,3,4,5].map(item => <i className={item <= step ? 'done' : ''} key={item} />)}</div></div> }
