import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import MainNav from '../components/MainNav'

export const metadata = {
  title: 'Knock Knock',
  description: 'Field sales mapping and tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MainNav />
        {children}
      </body>
    </html>
  )
}
