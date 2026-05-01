import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen bg-orange-50 text-slate-800">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}