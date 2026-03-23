export const metadata = {
  title: 'LightNovelVoice',
  description: 'AI-powered full-cast audiobook from any text',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0d1117; }
          textarea:focus, input:focus { border-color: #3a5068 !important; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #0d1117; }
          ::-webkit-scrollbar-thumb { background: #2a3445; border-radius: 2px; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}