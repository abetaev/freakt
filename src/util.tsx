import React, { ErrorInfo, ReactNode, Children } from 'react'

export class WithFallback
  extends React.Component<{
    children: ReactNode,
    fallback: ({ error }: { error: Error }) => ReactNode
  }, { error: Error }> {

  render() {
    if (this.state) {
      return this.props.fallback({ error: this.state.error })
    }
    return this.props.children
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log(errorInfo)
    this.setState({ error })
  }

}

type Pipeline<T> =
  { [K in keyof T]: Pipeline<T[K]> }
  & { VALUE: () => T }
export function ppln<T extends {}>(value: T): Pipeline<T> {
  function bound(value: any): boolean {
    return ["string", "number", "boolean", "undefined", "null", "function"]
      .includes(typeof value)
  }
  return new Proxy<T>(
    bound(value) ? {} as T : value,
    {
      get: (_, field: keyof T) => {
        if (field === "VALUE") {
          return () => value
        }
        if (value && value[field]) {
          return ppln(value[field])
        }
        return ppln(undefined)
      }
    }
  ) as unknown as Pipeline<T>
}