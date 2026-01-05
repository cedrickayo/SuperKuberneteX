import './globals.css'

export const metadata = {
  title: 'SuperKuberneteX',
  description: 'Multi-instance platform powered by Kubernetes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}

