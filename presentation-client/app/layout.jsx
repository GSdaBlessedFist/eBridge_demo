import localFont from 'next/font/local'
import '@/global.css'

const audioWideFont = localFont({
  src: '../public/fonts/Audiowide-Regular.ttf', // Path to your .ttf file
  variable: '--font-audiowide',  // This matches the variable in Tailwind config
})

export const metadata = {
  title: 'Next.js + Three.js',
  description: 'A minimal starter for Nextjs + React-three-fiber and Threejs.',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={`${audioWideFont.variable} antialiased`}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}
