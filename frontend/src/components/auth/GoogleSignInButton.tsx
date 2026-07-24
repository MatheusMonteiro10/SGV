import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

// Carrega o script do GSI sob demanda, uma única vez mesmo que o componente
// monte em mais de uma página (login e cadastro compartilham a mesma promise).
let gsiScriptPromise: Promise<void> | null = null

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gsiScriptPromise) return gsiScriptPromise

  gsiScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar o script do Google'))
    document.head.appendChild(script)
  })

  return gsiScriptPromise
}

export function GoogleSignInButton({ onCredential, text = 'continue_with' }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) {
      setErro('Login com Google indisponível no momento.')
      return
    }

    let cancelado = false

    loadGsiScript()
      .then(() => {
        if (cancelado || !containerRef.current || !window.google) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
          cancel_on_tap_outside: true,
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          width: 320,
        })
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar o login com Google.')
      })

    return () => {
      cancelado = true
    }
  }, [onCredential, text])

  if (erro) {
    return <p className="text-center text-xs text-ink-soft">{erro}</p>
  }

  return <div ref={containerRef} className="flex justify-center" />
}