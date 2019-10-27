import React, { ReactNode } from 'react';

export type ContinuationChildren<T> = (value: T) => ReactNode

export interface ContinuationProps<T> {
  children: ContinuationChildren<T>
}

type Observer<T> = (value: T) => void

export interface State<T> {
  Fragment: React.ElementType<ContinuationProps<T>>
  set: (value: T | Promise<T>) => void
  update: () => void
  listen: (observer: Observer<T>) => void
}

type VersionState = { version: number }

export function define<T>(initialValue?: T | Promise<T>): State<T> {

  let value: T = undefined
  let version: number = 0

  const components: React.Component<ContinuationProps<T>, VersionState>[] = []
  const listeners: Observer<T>[] = []

  const update = () => {
    components.forEach(component => component.setState({ version }))
    listeners.forEach(observe => observe(value))
  }

  const set = async (newValue: T | Promise<T>) => {
    value = await newValue
    version++
    update()
  }

  set(initialValue)

  return {
    Fragment: class extends React.Component<ContinuationProps<T>, VersionState> {
      constructor(props: ContinuationProps<T>) { super(props); }
      componentDidMount = () => { this.setState({ version }); components.push(this) }
      componentWillUnmount = () => components.splice(components.indexOf(this), 1)
      render = () => this.props.children(value)
    },
    set,
    update,
    listen: observer => listeners.push(observer)
  }

}

export function compose<T>(states: { [K in keyof T]: State<T[K]> }): State<T> {

  const compositeValue: T = Object.assign({}) // to avoid TS type complaint

  const state = define()
  const observers: Observer<T>[] = []

  Object.keys(states)
    .forEach(key => states[key].listen(
      (value: any) => {
        compositeValue[key] = value
        observers.forEach(observe => observe(compositeValue))
        state.update()
      }
    ))


  return {
    Fragment: ({ children }: ContinuationProps<T>) => (
      <state.Fragment>
        {() => children(compositeValue)}
      </state.Fragment>
    ),
    set: async (value: T | Promise<T>) => {
      Object.assign(compositeValue, await value)
      Object.keys(compositeValue)
        .forEach(key => states[key].set(compositeValue[key]))
      state.update()
    },
    update: () => state.update(),
    listen: (observer: Observer<T>) => observers.push(observer)
  }
}