import React, { ErrorInfo, ReactNode } from 'react'

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