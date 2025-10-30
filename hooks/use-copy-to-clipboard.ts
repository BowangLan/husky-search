import { useState } from "react"
import { toast } from "sonner"

export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const copyToClipboard = async (
    value: string | number,
    id: string | number,
    options?: {
      successMessage?: string
      errorMessage?: string
      timeout?: number
    }
  ) => {
    const {
      successMessage = `Copied ${String(value)}`,
      errorMessage = "Unable to copy. Clipboard may be blocked.",
      timeout = 1500,
    } = options || {}

    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedId(id)
      toast.success(successMessage)
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr))
      }, timeout)
    } catch (err) {
      toast.error(errorMessage)
    }
  }

  const isCopied = (id: string | number) => copiedId === id

  const resetCopied = () => setCopiedId(null)

  return {
    copiedId,
    copyToClipboard,
    isCopied,
    resetCopied,
  }
}
