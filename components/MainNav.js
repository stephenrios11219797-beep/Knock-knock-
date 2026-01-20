'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MainNav() {
  const pathname = usePathname()

  const linkClass = (path) =>
    `px-4 py-2 rounded ${
      pathname === path
        ? 'bg-black text-white'
        : 'bg-gray-200 text-black'
    }`

  return (
    <nav className="flex gap-4 p-4 border-b">
      <Link href="/" className={linkClass('/')}>
        Home
      </Link>

      <Link href="/map" className={linkClass('/map')}>
        Map
      </Link>
    </nav>
  )
}
