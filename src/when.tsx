
import { ReactNode } from 'react'

export function defined<T>(value: T | undefined, node: ReactNode): ReactNode {
  return value ? node : null
}
