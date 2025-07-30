import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { CopilotKit } from '@copilotkit/react-core'

export const metadata: Metadata = {
  title: 'AI Interview Mentor - Your Smart Personalized Mock Interviewer',
  description: 'Advanced AI-powered mock interview platform with personalized feedback and adaptive questioning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
          <Toaster position="top-right" />
        </CopilotKit>
      </body>
    </html>
  )
}