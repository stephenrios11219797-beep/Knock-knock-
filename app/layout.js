import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'

export const metadata = {
  title: 'Knock Knock',
  description: 'Field sales mapping and tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
